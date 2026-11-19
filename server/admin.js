import { Router } from 'express';
import { Donation, Certificate, User, Message } from './models.js';
import { requireAdmin, isEmail, publicUser } from './auth.js';
import { checkDonor, markPaid, sendReceipt } from './donations.js';
import { issueCertificate } from './certificates.js';
import { notify, templates } from './mail.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const [totals, byProgramme, users, certificates] = await Promise.all([
    Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, raised: { $sum: '$amount' }, count: { $sum: 1 }, donors: { $addToSet: '$email' } } }]),
    Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$programme', raised: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    User.countDocuments(),
    Certificate.countDocuments({ revoked: false }),
  ]);
  const newMessages = await Message.countDocuments({ status: 'new' });
  const t = totals[0] ?? { raised: 0, count: 0, donors: [] };
  res.json({ raised: t.raised, donations: t.count, donors: t.donors.length, users, certificates, byProgramme, newMessages });
});

router.get('/donations', async (req, res) => {
  const filter = ['created', 'paid', 'failed'].includes(req.query.status) ? { status: req.query.status } : {};
  res.json({ donations: await Donation.find(filter).sort({ createdAt: -1 }).limit(500).lean() });
});

// Records an offline gift (bank transfer, UPI, cash, cheque) and issues its acknowledgement.
router.post('/donations', async (req, res) => {
  const b = req.body ?? {};
  const input = { ...b, amount: Number(b.amount), programme: b.programme || 'general', pan: b.pan || undefined };
  const err = checkDonor(input);
  if (err) return res.status(400).json({ error: err });
  if (!['bank', 'upi', 'cash', 'cheque'].includes(input.method)) return res.status(400).json({ error: 'Choose a payment mode.' });
  const user = await User.findOne({ email: input.email.toLowerCase() });
  const donation = new Donation({
    user: user?._id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    pan: input.pan,
    amount: input.amount,
    programme: input.programme,
    reference: input.reference,
  });
  const cert = await markPaid(donation, { method: input.method });
  res.status(201).json({ donation, certNo: cert.certNo });
});

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

router.get('/donations.csv', async (_req, res) => {
  const list = await Donation.find({ status: 'paid' }).sort({ paidAt: 1 }).lean();
  const head = ['Receipt no', 'Date', 'Name', 'Email', 'Phone', 'PAN', 'Amount (INR)', 'Programme', 'Mode', 'Payment ID', 'Reference'];
  const lines = list.map((d) => [d.receiptNo, d.paidAt?.toISOString().slice(0, 10), d.name, d.email, d.phone, d.pan, d.amount, d.programme, d.method, d.paymentId, d.reference].map(csvCell).join(','));
  res.type('text/csv').set('Content-Disposition', `attachment; filename="pirento-donations-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send([head.join(','), ...lines].join('\n'));
});

router.post('/donations/:id/resend', async (req, res) => {
  const d = /^[0-9a-f]{24}$/.test(req.params.id) ? await Donation.findOne({ _id: req.params.id, status: 'paid' }) : null;
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
  const m = /^[0-9a-f]{24}$/.test(req.params.id) ? await Message.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' }) : null;
  if (!m) return res.status(404).json({ error: 'Not found.' });
  res.json({ message: m });
});

router.get('/users', async (_req, res) => {
  res.json({ users: (await User.find().sort({ createdAt: -1 }).limit(500)).map((u) => ({ ...publicUser(u), createdAt: u.createdAt })) });
});

router.get('/certificates', async (_req, res) => {
  res.json({ certificates: await Certificate.find().sort({ createdAt: -1 }).limit(500).lean() });
});

router.post('/certificates', async (req, res) => {
  const { kind, recipientName, email, title, body } = req.body ?? {};
  if (!['volunteer', 'participation', 'appreciation'].includes(kind)) return res.status(400).json({ error: 'Choose a certificate type.' });
  if (!recipientName?.trim() || !title?.trim()) return res.status(400).json({ error: 'Recipient name and title are required.' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'Email looks wrong.' });
  const cert = await issueCertificate({ kind, recipientName, email: email || undefined, title, body, issuedBy: req.user._id });
  if (cert.email) notify({ to: cert.email, ...templates.certificate(cert) });
  res.status(201).json({ certificate: cert });
});

router.patch('/certificates/:id', async (req, res) => {
  const cert = /^[0-9a-f]{24}$/.test(req.params.id)
    ? await Certificate.findByIdAndUpdate(req.params.id, { revoked: Boolean(req.body?.revoked) }, { returnDocument: 'after' })
    : null;
  if (!cert) return res.status(404).json({ error: 'Not found.' });
  res.json({ certificate: cert });
});

export default router;
