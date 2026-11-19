// Admin API (/api/admin/*): stats, donations, refunds, CSV, members, monthly donors, certificates,
// contact messages, users and website updates. Every route requires an admin session.
import { Router } from 'express';
import {
  Donation,
  Certificate,
  User,
  Message,
  Membership,
  Subscription,
  Post,
  PROGRAMMES,
} from './models.js';
import { requireAdmin, isEmail, publicUser } from './auth.js';
import { checkDonor, markPaid, sendReceipt, donorInput } from './donations.js';
import { activateMembership, currentMembership } from './membership.js';
import { getSettings } from './settings.js';
import { httpError } from './otp.js';
import { issueCertificate } from './certificates.js';
import { notify, templates } from './mail.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const [totals, byProgramme, users, certificates] = await Promise.all([
    Donation.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          raised: { $sum: '$amount' },
          count: { $sum: 1 },
          donors: { $addToSet: '$email' },
        },
      },
    ]),
    Donation.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$programme', raised: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments(),
    Certificate.countDocuments({ revoked: false }),
  ]);
  const now = new Date();
  const [newMessages, members, monthly] = await Promise.all([
    Message.countDocuments({ status: 'new' }),
    Membership.distinct('user', { status: 'active', $or: [{ validTo: null }, { validTo: { $gt: now } }] }),
    Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
  ]);
  const t = totals[0] ?? { raised: 0, count: 0, donors: [] };
  res.json({
    raised: t.raised,
    donations: t.count,
    donors: t.donors.length,
    users,
    certificates,
    byProgramme,
    newMessages,
    members: members.length,
    monthlyDonors: monthly[0]?.n ?? 0,
    monthlyAmount: monthly[0]?.amount ?? 0,
  });
});

router.get('/donations', async (req, res) => {
  const filter = ['created', 'paid', 'failed', 'refunded'].includes(req.query.status)
    ? { status: req.query.status }
    : {};
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { receiptNo: rx }, { paymentId: rx }];
  }
  res.json({ donations: await Donation.find(filter).sort({ createdAt: -1 }).limit(500).lean() });
});

// Records an offline gift (bank transfer, UPI, cash, cheque) and issues its acknowledgement.
router.post('/donations', async (req, res) => {
  const input = donorInput(req.body);
  const err = checkDonor(input);
  if (err) return res.status(400).json({ error: err });
  const method = req.body?.method;
  if (!['bank', 'upi', 'cash', 'cheque'].includes(method))
    return res.status(400).json({ error: 'Choose a payment mode.' });
  const user = await User.findOne({ email: input.email.toLowerCase() });
  const donation = new Donation({
    ...input,
    user: user?._id,
    reference: req.body?.reference?.trim() || undefined,
  });
  const cert = await markPaid(donation, { method });
  res.status(201).json({ donation, certNo: cert.certNo });
});

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

router.get('/donations.csv', async (_req, res) => {
  const list = await Donation.find({ status: 'paid' }).sort({ paidAt: 1 }).lean();
  const head = [
    'Receipt no',
    'Date',
    'Name',
    'Email',
    'Phone',
    'PAN',
    'Address',
    'Amount (INR)',
    'Programme',
    'Mode',
    'Monthly',
    'Payment ID',
    'Reference',
  ];
  const lines = list.map((d) =>
    [
      d.receiptNo,
      d.paidAt?.toISOString().slice(0, 10),
      d.name,
      d.email,
      d.phone,
      d.pan,
      d.address,
      d.amount,
      d.programme,
      d.method,
      d.subscription ? 'yes' : '',
      d.paymentId,
      d.reference,
    ]
      .map(csvCell)
      .join(','),
  );
  res
    .type('text/csv')
    .set(
      'Content-Disposition',
      `attachment; filename="pirento-donations-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
  res.send([head.join(','), ...lines].join('\n'));
});

router.post('/donations/:id/resend', async (req, res) => {
  const d = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Donation.findOne({ _id: req.params.id, status: 'paid' })
    : null;
  const cert = d && (await Certificate.findOne({ donation: d._id }));
  if (!cert) return res.status(404).json({ error: 'Paid donation not found.' });
  sendReceipt(d, cert.certNo);
  res.json({ ok: true });
});

router.get('/messages', async (_req, res) => {
  res.json({ messages: await Message.find().sort({ createdAt: -1 }).limit(500).lean() });
});

router.patch('/messages/:id', async (req, res) => {
  const status = req.body?.status === 'done' ? 'done' : 'new';
  const m = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Message.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' })
    : null;
  if (!m) return res.status(404).json({ error: 'Not found.' });
  res.json({ message: m });
});

// Refund: the money goes back through Razorpay's dashboard; this records it and revokes the certificate.
router.patch('/donations/:id', async (req, res) => {
  if (req.body?.status !== 'refunded') throw httpError(400, 'Only refunds can be recorded here.');
  const d = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Donation.findOneAndUpdate(
        { _id: req.params.id, status: 'paid' },
        { status: 'refunded' },
        { returnDocument: 'after' },
      )
    : null;
  if (!d) return res.status(404).json({ error: 'Paid donation not found.' });
  await Certificate.updateMany({ donation: d._id }, { revoked: true });
  res.json({ donation: d });
});

router.get('/subscriptions', async (_req, res) => {
  res.json({
    subscriptions: await Subscription.find({ status: { $ne: 'created' } })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  });
});

/* ---------- members ---------- */

router.get('/members', async (_req, res) => {
  const list = await Membership.find({ status: { $ne: 'created' } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .populate('user', 'name email phone bharatId')
    .lean();
  res.json({
    members: list.map((m) => ({
      ...m,
      user: m.user && {
        ...m.user,
        bharatId: m.user.bharatId?.sub
          ? { number: m.user.bharatId.number, status: m.user.bharatId.status }
          : null,
      },
    })),
  });
});

// Offline membership (fee paid by cash, UPI or bank). The person needs an account first.
router.post('/members', async (req, res) => {
  const { email, method, reference } = req.body ?? {};
  const user =
    typeof email === 'string'
      ? await User.findOne({ email: email.toLowerCase().trim(), role: 'user' })
      : null;
  if (!user) throw httpError(404, 'No donor account with this email. Ask them to create one first.');
  if (!['bank', 'upi', 'cash', 'cheque'].includes(method)) throw httpError(400, 'Choose a payment mode.');
  const running = await currentMembership(user._id);
  if (running && (running.validTo === null || running.validTo - Date.now() > 30 * 86400_000))
    throw httpError(409, 'This person already has an active membership.');
  const { membershipFee } = await getSettings();
  const m = new Membership({
    user: user._id,
    fee: membershipFee,
    method,
    reference: reference?.trim() || undefined,
  });
  res.status(201).json({ membership: await activateMembership(m, {}) });
});

router.patch('/members/:id', async (req, res) => {
  const m = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Membership.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { returnDocument: 'after' })
    : null;
  if (!m) return res.status(404).json({ error: 'Not found.' });
  if (m.certNo) await Certificate.updateOne({ certNo: m.certNo }, { revoked: true });
  res.json({ membership: m });
});

/* ---------- website updates (news from the field) ---------- */

const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'update';
function postInput(b = {}) {
  const title = String(b.title ?? '').trim();
  if (!title || title.length > 140) throw httpError(400, 'Title is required (up to 140 characters).');
  if (b.link && !/^https:\/\/\S+$/.test(b.link)) throw httpError(400, 'Link must start with https://');
  if (b.programme && !PROGRAMMES.includes(b.programme)) throw httpError(400, 'Unknown programme.');
  return {
    title,
    summary: String(b.summary ?? '').slice(0, 300),
    body: String(b.body ?? '').slice(0, 20000),
    programme: b.programme || '',
    link: b.link || undefined,
    published: Boolean(b.published),
  };
}

router.get('/posts', async (_req, res) =>
  res.json({ posts: await Post.find().sort({ createdAt: -1 }).lean() }),
);
router.post('/posts', async (req, res) => {
  const data = postInput(req.body);
  let slug = slugify(data.title);
  if (await Post.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
  res.status(201).json({
    post: await Post.create({ ...data, slug, publishedAt: data.published ? new Date() : undefined }),
  });
});
router.put('/posts/:id', async (req, res) => {
  const post = /^[0-9a-f]{24}$/.test(req.params.id) ? await Post.findById(req.params.id) : null;
  if (!post) return res.status(404).json({ error: 'Not found.' });
  const data = postInput(req.body);
  if (data.published && !post.published) post.publishedAt = new Date();
  Object.assign(post, data);
  await post.save();
  res.json({ post });
});
router.delete('/posts/:id', async (req, res) => {
  await Post.deleteOne({ _id: /^[0-9a-f]{24}$/.test(req.params.id) ? req.params.id : null });
  res.json({ ok: true });
});

/* ---------- people ---------- */

router.get('/users/:id', async (req, res) => {
  const user = /^[0-9a-f]{24}$/.test(req.params.id) ? await User.findById(req.params.id) : null;
  if (!user) return res.status(404).json({ error: 'Not found.' });
  const or = [{ user: user._id }, { email: user.email }];
  const [donations, memberships, subscriptions, certificates] = await Promise.all([
    Donation.find({ $or: or, status: { $ne: 'created' } })
      .sort({ createdAt: -1 })
      .lean(),
    Membership.find({ user: user._id, status: { $ne: 'created' } })
      .sort({ createdAt: -1 })
      .lean(),
    Subscription.find({ $or: or, status: { $ne: 'created' } }).lean(),
    Certificate.find({ $or: or }).sort({ createdAt: -1 }).lean(),
  ]);
  res.json({
    user: { ...publicUser(user), createdAt: user.createdAt },
    donations,
    memberships,
    subscriptions,
    certificates,
  });
});

router.get('/users', async (_req, res) => {
  const q = typeof _req.query.q === 'string' ? _req.query.q.trim().slice(0, 60) : '';
  const rx = q && new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find(
    rx ? { $or: [{ name: rx }, { email: rx }, { phone: rx }, { 'bharatId.number': rx }] } : {},
  )
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ users: users.map((u) => ({ ...publicUser(u), createdAt: u.createdAt })) });
});

router.get('/certificates', async (_req, res) => {
  res.json({ certificates: await Certificate.find().sort({ createdAt: -1 }).limit(500).lean() });
});

router.post('/certificates', async (req, res) => {
  const { kind, recipientName, email, title, body } = req.body ?? {};
  if (!['volunteer', 'participation', 'appreciation'].includes(kind))
    return res.status(400).json({ error: 'Choose a certificate type.' });
  if (!recipientName?.trim() || !title?.trim())
    return res.status(400).json({ error: 'Recipient name and title are required.' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'Email looks wrong.' });
  const cert = await issueCertificate({
    kind,
    recipientName,
    email: email || undefined,
    title,
    body,
    issuedBy: req.user._id,
  });
  if (cert.email) notify({ to: cert.email, ...templates.certificate(cert) });
  res.status(201).json({ certificate: cert });
});

router.patch('/certificates/:id', async (req, res) => {
  const cert = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Certificate.findByIdAndUpdate(
        req.params.id,
        { revoked: Boolean(req.body?.revoked) },
        { returnDocument: 'after' },
      )
    : null;
  if (!cert) return res.status(404).json({ error: 'Not found.' });
  res.json({ certificate: cert });
});

export default router;
