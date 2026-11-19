import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { Donation, Certificate, Subscription, Membership, PROGRAMMES, nextReceiptNo } from './models.js';
import { isEmail, requireUser } from './auth.js';
import { certFromDonation, mineFilter } from './certificates.js';
import { notify, templates, siteUrl } from './mail.js';
import { PROGRAMME_NAMES, renderReceipt } from './pdf.js';
import { getSettings } from './settings.js';
import { findOrCreateDonor } from './accounts.js';
import { rzp, rzpOn, rzpKeyId, createOrder, monthlyPlan, validOrderSignature, validSubscriptionSignature, validWebhook } from './razorpay.js';
import { activateMembership } from './membership.js';

const router = Router();
export const MIN_AMOUNT = 10;
export const MAX_AMOUNT = 500000;
export const MIN_MONTHLY = 100;

/** Validates donor input from any source (public form or admin). Returns an error string or null. */
export function checkDonor({ name, email, amount, programme, pan, address }) {
  if (!name?.trim() || name.length > 120) return 'Please enter your name.';
  if (!isEmail(email)) return 'Please enter a valid email.';
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT)
    return `Amount must be a whole number between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}.`;
  if (programme && !PROGRAMMES.includes(programme)) return 'Unknown programme.';
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) return 'PAN format looks wrong (e.g. ABCDE1234F).';
  if (address && address.length > 300) return 'Address is too long.';
  return null;
}
export const donorInput = (b = {}) => ({
  name: b.name?.trim(),
  email: b.email?.trim(),
  phone: b.phone?.trim() || undefined,
  pan: b.pan?.trim().toUpperCase() || undefined,
  address: b.address?.trim() || undefined,
  amount: Number(b.amount),
  programme: b.programme || 'general',
});

export const receiptUrl = (d) => `${siteUrl()}/api/donations/${d._id}/receipt?key=${d.receiptKey}`;
export const sendReceipt = (d, certNo) =>
  notify({ to: d.email, ...templates.receipt(d, certNo, PROGRAMME_NAMES[d.programme] ?? d.programme, receiptUrl(d)) });

/**
 * Marks a donation paid: receipt number, account (created if needed), certificate, email.
 * Returns the certificate, or null if another request already did it.
 */
export async function markPaid(donation, extra, { certificate = true } = {}) {
  const update = { ...extra, status: 'paid', paidAt: extra.paidAt ?? new Date(), receiptKey: crypto.randomBytes(12).toString('hex') };
  if (donation.isNew) {
    Object.assign(donation, update, { receiptNo: await nextReceiptNo() });
    await donation.save();
  } else {
    // Atomic claim so two parallel confirmations cannot both issue a receipt.
    const claimed = await Donation.findOneAndUpdate({ _id: donation._id, status: { $ne: 'paid' } }, update, { returnDocument: 'after' });
    if (!claimed) return null;
    claimed.receiptNo = await nextReceiptNo();
    await claimed.save();
    Object.assign(donation, claimed.toObject());
  }
  if (!donation.user) {
    const { user } = await findOrCreateDonor(donation);
    donation.user = user._id;
    await Donation.updateOne({ _id: donation._id }, { user: user._id });
  }
  const cert = certificate ? await certFromDonation(donation) : null;
  sendReceipt(donation, cert?.certNo);
  return cert;
}

router.get('/config', (_req, res) => {
  res.json({ online: rzpOn(), keyId: rzpKeyId() ?? null, min: MIN_AMOUNT, max: MAX_AMOUNT, minMonthly: MIN_MONTHLY });
});

const payLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30 });

/* ---------- one-time ---------- */

router.post('/order', payLimiter, async (req, res) => {
  const input = donorInput(req.body);
  const err = checkDonor(input);
  if (err) return res.status(400).json({ error: err });
  const donation = await Donation.create({ ...input, user: req.user?._id });
  try {
    const order = await createOrder(input.amount, donation._id, { type: 'donation', programme: input.programme });
    donation.orderId = order.id;
    await donation.save();
    res.json({ donationId: donation._id, orderId: order.id, amount: order.amount, currency: 'INR', keyId: rzpKeyId() });
  } catch (e) {
    donation.status = 'failed';
    await donation.save();
    throw e;
  }
});

router.post('/verify', async (req, res) => {
  const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
  const donation = /^[0-9a-f]{24}$/.test(String(donationId)) ? await Donation.findById(donationId) : null;
  if (!donation || donation.orderId !== razorpay_order_id || !validOrderSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: 'Payment could not be verified. If money was debited, please contact us with your payment ID.' });
  if (donation.status !== 'paid') await markPaid(donation, { paymentId: razorpay_payment_id, method: 'online' });
  // Re-read so a request that lost the race still returns the winner's receipt and certificate.
  const [fresh, cert] = await Promise.all([Donation.findById(donation._id), Certificate.findOne({ donation: donation._id })]);
  res.json({ receiptNo: fresh.receiptNo, amount: fresh.amount, certNo: cert?.certNo, receiptUrl: receiptUrl(fresh) });
});

/* ---------- monthly (Razorpay Subscriptions) ---------- */

router.post('/subscribe', payLimiter, async (req, res) => {
  const input = donorInput(req.body);
  const err = checkDonor(input) || (input.amount < MIN_MONTHLY ? `Monthly gifts start at ₹${MIN_MONTHLY}.` : null);
  if (err) return res.status(400).json({ error: err });
  const planId = await monthlyPlan(input.amount);
  const sub = await Subscription.create({ ...input, user: req.user?._id, planId });
  const r = await rzp('POST', '/subscriptions', { plan_id: planId, total_count: 120, customer_notify: 1, notes: { subId: String(sub._id), programme: input.programme } });
  sub.rzpId = r.id;
  await sub.save();
  res.json({ id: sub._id, subscriptionId: r.id, keyId: rzpKeyId(), amount: input.amount });
});

/** Records one monthly charge as a donation. Safe to call twice for the same payment. */
export async function recordCharge(sub, paymentId, paidAt = new Date()) {
  const existing = await Donation.findOne({ paymentId });
  if (existing) return existing;
  const first = sub.charges === 0;
  const d = new Donation({
    user: sub.user,
    name: sub.name,
    email: sub.email,
    phone: sub.phone,
    pan: sub.pan,
    address: sub.address,
    amount: sub.amount,
    programme: sub.programme,
    subscription: sub._id,
  });
  try {
    await markPaid(d, { paymentId, method: 'online', paidAt }, { certificate: first });
  } catch (e) {
    if (e.code === 11000) return Donation.findOne({ paymentId }); // a parallel call won
    throw e;
  }
  await Subscription.updateOne({ _id: sub._id }, { $inc: { charges: 1 }, lastChargedAt: paidAt, user: sub.user ?? d.user, status: 'active' });
  if (first) notify({ to: sub.email, ...templates.subscriptionStarted(sub) });
  return d;
}

router.post('/subscribe/verify', async (req, res) => {
  const { id, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body ?? {};
  const sub = /^[0-9a-f]{24}$/.test(String(id)) ? await Subscription.findById(id) : null;
  if (!sub || sub.rzpId !== razorpay_subscription_id || !validSubscriptionSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature))
    return res.status(400).json({ error: 'Payment could not be verified. If money was debited, please contact us with your payment ID.' });
  const d = await recordCharge(sub, razorpay_payment_id);
  const cert = await Certificate.findOne({ donation: d._id });
  res.json({ receiptNo: d.receiptNo, amount: d.amount, certNo: cert?.certNo, receiptUrl: receiptUrl(d), monthly: true });
});

router.get('/subscriptions/mine', requireUser, async (req, res) => {
  res.json({ subscriptions: await Subscription.find({ $or: mineFilter(req.user), status: { $ne: 'created' } }).sort({ createdAt: -1 }).lean() });
});

router.post('/subscriptions/:id/cancel', requireUser, async (req, res) => {
  const sub = /^[0-9a-f]{24}$/.test(req.params.id) ? await Subscription.findOne({ _id: req.params.id, $or: mineFilter(req.user) }) : null;
  if (!sub) return res.status(404).json({ error: 'Monthly gift not found.' });
  if (['cancelled', 'completed'].includes(sub.status)) return res.json({ subscription: sub });
  await rzp('POST', `/subscriptions/${sub.rzpId}/cancel`, { cancel_at_cycle_end: 0 });
  Object.assign(sub, { status: 'cancelled', cancelledAt: new Date() });
  await sub.save();
  notify({ to: sub.email, ...templates.subscriptionCancelled(sub) });
  res.json({ subscription: sub });
});

/* ---------- webhook ---------- */

/**
 * Razorpay webhook (Dashboard → Settings → Webhooks). Events: payment.captured, payment.failed,
 * subscription.charged, subscription.activated, subscription.halted, subscription.cancelled, subscription.completed.
 */
router.post('/webhook', async (req, res) => {
  if (!validWebhook(req.rawBody, req.get('x-razorpay-signature'))) return res.status(400).json({ error: 'Bad signature.' });
  const { event, payload } = req.body ?? {};
  const payment = payload?.payment?.entity;
  const subEntity = payload?.subscription?.entity;

  if (event === 'subscription.charged' && subEntity && payment) {
    const sub = await Subscription.findOne({ rzpId: subEntity.id });
    if (sub && payment.amount === sub.amount * 100) await recordCharge(sub, payment.id, new Date(payment.created_at * 1000));
  } else if (event?.startsWith('subscription.') && subEntity) {
    const status = { 'subscription.activated': 'active', 'subscription.halted': 'halted', 'subscription.cancelled': 'cancelled', 'subscription.completed': 'completed' }[event];
    if (status) await Subscription.updateOne({ rzpId: subEntity.id }, { status, ...(status === 'cancelled' && { cancelledAt: new Date() }) });
  } else if (payment?.order_id) {
    const donation = await Donation.findOne({ orderId: payment.order_id });
    if (donation && donation.status !== 'paid') {
      if (event === 'payment.captured' && payment.amount === donation.amount * 100) await markPaid(donation, { paymentId: payment.id, method: 'online' });
      else if (event === 'payment.failed') await Donation.updateOne({ _id: donation._id, status: 'created' }, { status: 'failed' });
    }
    const membership = donation ? null : await Membership.findOne({ orderId: payment.order_id });
    if (membership?.status === 'created' && event === 'payment.captured' && payment.amount === membership.fee * 100)
      await activateMembership(membership, { paymentId: payment.id, method: 'online' });
  }
  res.json({ ok: true }); // 200 for every valid event so Razorpay stops retrying
});

/* ---------- donor views ---------- */

router.get('/mine', requireUser, async (req, res) => {
  const donations = await Donation.find({ status: { $in: ['paid', 'refunded'] }, $or: mineFilter(req.user) }).sort({ createdAt: -1 }).lean();
  const certs = await Certificate.find({ donation: { $in: donations.map((d) => d._id) } }, 'donation certNo').lean();
  const byDonation = Object.fromEntries(certs.map((c) => [String(c.donation), c.certNo]));
  res.json({
    donations: donations.map(({ receiptKey, ...d }) => ({
      ...d,
      certNo: byDonation[String(d._id)],
      receiptUrl: d.status === 'paid' ? `/api/donations/${d._id}/receipt?key=${receiptKey}` : null,
    })),
  });
});

/** Receipt PDF (80G particulars when configured). Open to the donor (key from their email, or their account) and admins. */
router.get('/:id/receipt', async (req, res) => {
  const d = /^[0-9a-f]{24}$/.test(req.params.id) ? await Donation.findOne({ _id: req.params.id, status: 'paid' }) : null;
  const owner = d && req.user && (String(d.user) === String(req.user._id) || (req.user.emailVerified && req.user.email === d.email));
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  const keyOk = d?.receiptKey && key.length === d.receiptKey.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(d.receiptKey));
  if (!d || !(keyOk || owner || req.user?.role === 'admin')) return res.status(404).json({ error: 'Receipt not found.' });
  res.type('application/pdf').set('Content-Disposition', `inline; filename="${d.receiptNo.replace(/\//g, '-')}.pdf"`);
  renderReceipt('donation', d, await getSettings(), res);
});

export default router;
