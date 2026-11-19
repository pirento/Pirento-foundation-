import { Router } from 'express';
import { Donation, Certificate, User } from './models.js';
import { requireAdmin, isEmail, publicUser } from './auth.js';
import { checkDonor, markPaid } from './donations.js';
import { issueCertificate } from './certificates.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const [totals, byProgramme, users, certificates] = await Promise.all([
    Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, raised: { $sum: '$amount' }, count: { $sum: 1 }, donors: { $addToSet: '$email' } } }]),
    Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$programme', raised: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    User.countDocuments(),
    Certificate.countDocuments({ revoked: false }),
  ]);
  const t = totals[0] ?? { raised: 0, count: 0, donors: [] };
  res.json({ raised: t.raised, donations: t.count, donors: t.donors.length, users, certificates, byProgramme });
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
