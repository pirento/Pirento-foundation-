import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { Donation, Certificate, PROGRAMMES, nextReceiptNo } from './models.js';
import { isEmail, requireUser } from './auth.js';
import { certFromDonation, mineFilter } from './certificates.js';

const router = Router();
const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;
export const MIN_AMOUNT = 10;
export const MAX_AMOUNT = 500000;

/** Validates donor input from any source (public form or admin). Returns an error string or null. */
export function checkDonor({ name, email, amount, programme, pan }) {
  if (!name?.trim()) return 'Please enter your name.';
  if (!isEmail(email)) return 'Please enter a valid email.';
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT)
    return `Amount must be a whole number between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}.`;
  if (programme && !PROGRAMMES.includes(programme)) return 'Unknown programme.';
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) return 'PAN format looks wrong (e.g. ABCDE1234F).';
  return null;
}

/** Marks a donation paid and issues its certificate. Returns null if another request already did it. */
export async function markPaid(donation, extra) {
  const update = { ...extra, status: 'paid', paidAt: new Date() };
  if (donation.isNew) {
    Object.assign(donation, update, { receiptNo: await nextReceiptNo() });
    await donation.save();
  } else {
    // Atomic claim so two parallel /verify calls cannot both issue a receipt.
    const claimed = await Donation.findOneAndUpdate({ _id: donation._id, status: { $ne: 'paid' } }, update, { returnDocument: 'after' });
    if (!claimed) return null;
    claimed.receiptNo = await nextReceiptNo();
    await claimed.save();
    Object.assign(donation, claimed.toObject());
  }
  return certFromDonation(donation);
}

router.get('/config', (_req, res) => res.json({ online: Boolean(keyId() && keySecret()), keyId: keyId() ?? null, min: MIN_AMOUNT, max: MAX_AMOUNT }));

router.post('/order', rateLimit({ windowMs: 10 * 60 * 1000, limit: 30 }), async (req, res) => {
  if (!keyId() || !keySecret())
    return res.status(503).json({ error: 'Online donations are not switched on yet. Please write to us for bank transfer details.' });
  const b = req.body ?? {};
  const input = { ...b, amount: Number(b.amount), programme: b.programme || 'general', pan: b.pan || undefined };
  const err = checkDonor(input);
  if (err) return res.status(400).json({ error: err });

  const donation = await Donation.create({
    user: req.user?._id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    pan: input.pan,
    amount: input.amount,
    programme: input.programme,
  });
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId()}:${keySecret()}`).toString('base64'),
    },
    body: JSON.stringify({ amount: input.amount * 100, currency: 'INR', receipt: String(donation._id), notes: { programme: input.programme } }),
  });
  if (!r.ok) {
    donation.status = 'failed';
    await donation.save();
    console.error('Razorpay order failed', r.status, await r.text());
    return res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
  const order = await r.json();
  donation.orderId = order.id;
  await donation.save();
  res.json({ donationId: donation._id, orderId: order.id, amount: order.amount, currency: 'INR', keyId: keyId() });
});

export function validSignature(orderId, paymentId, signature, secret = keySecret()) {
  if (typeof signature !== 'string' || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

router.post('/verify', async (req, res) => {
  const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
  const donation = /^[0-9a-f]{24}$/.test(String(donationId)) ? await Donation.findById(donationId) : null;
  if (!donation || donation.orderId !== razorpay_order_id || !validSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: 'Payment could not be verified. If money was debited, please contact us with your payment ID.' });

  if (donation.status !== 'paid') await markPaid(donation, { paymentId: razorpay_payment_id, method: 'online' });
  // Re-read so a request that lost the race still returns the winner's receipt and certificate.
  const [fresh, cert] = await Promise.all([Donation.findById(donation._id), Certificate.findOne({ donation: donation._id })]);
  res.json({ receiptNo: fresh.receiptNo, amount: fresh.amount, certNo: cert?.certNo });
});

router.get('/mine', requireUser, async (req, res) => {
  const donations = await Donation.find({ status: 'paid', $or: mineFilter(req.user) }).sort({ createdAt: -1 }).lean();
  const certs = await Certificate.find({ donation: { $in: donations.map((d) => d._id) } }, 'donation certNo').lean();
  const byDonation = Object.fromEntries(certs.map((c) => [String(c.donation), c.certNo]));
  res.json({ donations: donations.map((d) => ({ ...d, certNo: byDonation[String(d._id)] })) });
});

export default router;
