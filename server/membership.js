import { Router } from 'express';
import { Membership, User, nextMemberNo, nextMembershipReceiptNo } from './models.js';
import { requireUser } from './auth.js';
import { issueCertificate } from './certificates.js';
import { getSettings } from './settings.js';
import { notify, templates, siteUrl } from './mail.js';
import { renderReceipt } from './pdf.js';
import { rzpOn, rzpKeyId, createOrder, validOrderSignature } from './razorpay.js';

const router = Router();

/** The membership that currently counts (active and not expired), if any. */
export async function currentMembership(userId) {
  const now = new Date();
  return Membership.findOne({ user: userId, status: 'active', $or: [{ validTo: null }, { validTo: { $gt: now } }] }).sort({ validTo: -1 });
}

/** Activates a paid membership: member number (kept on renewal), validity, receipt, certificate, email. */
export async function activateMembership(m, extra) {
  const settings = await getSettings();
  const claimed = m.isNew ? m : await Membership.findOneAndUpdate({ _id: m._id, status: 'created' }, { status: 'active' }, { returnDocument: 'after' });
  if (!claimed) return null;
  const user = await User.findById(claimed.user);
  const prev = await Membership.findOne({ user: user._id, memberNo: { $exists: true }, _id: { $ne: claimed._id } }).sort({ createdAt: -1 });
  const running = await currentMembership(user._id);
  // Renewing early extends from the current end date instead of losing the remaining days.
  const from = running?.validTo && running._id.toString() !== claimed._id.toString() ? running.validTo : new Date();
  const months = settings.membershipMonths;
  const validTo = months ? new Date(new Date(from).setMonth(from.getMonth() + months)) : null;
  Object.assign(claimed, extra, {
    status: 'active',
    memberNo: prev?.memberNo ?? (await nextMemberNo()),
    validFrom: from,
    validTo,
    receiptNo: await nextMembershipReceiptNo(),
  });
  const cert = await issueCertificate({ kind: 'membership', recipientName: user.name, email: user.email, user: user._id, title: 'Certificate of Membership' });
  claimed.certNo = cert.certNo;
  await claimed.save();
  notify({ to: user.email, ...templates.membership(claimed, user, `${siteUrl()}/api/certificates/${cert.certNo}/pdf`, !user.bharatId?.number) });
  return claimed;
}

router.get('/config', async (_req, res) => {
  const s = await getSettings();
  res.json({ fee: s.membershipFee, months: s.membershipMonths, online: rzpOn() });
});

router.get('/mine', requireUser, async (req, res) => {
  const [current, history] = await Promise.all([currentMembership(req.user._id), Membership.find({ user: req.user._id, status: { $ne: 'created' } }).sort({ createdAt: -1 }).lean()]);
  res.json({ current, history });
});

router.post('/order', requireUser, async (req, res) => {
  if (req.user.role === 'admin') return res.status(400).json({ error: 'Admin accounts cannot hold a membership. Use a personal account.' });
  const running = await currentMembership(req.user._id);
  if (running && running.validTo === null) return res.status(409).json({ error: 'You already have a lifetime membership.' });
  if (running && running.validTo - Date.now() > 30 * 86400_000)
    return res.status(409).json({ error: 'Your membership is active. You can renew in the last 30 days before it ends.' });
  const { membershipFee } = await getSettings();
  const m = await Membership.create({ user: req.user._id, fee: membershipFee });
  const order = await createOrder(membershipFee, m._id, { type: 'membership' });
  m.orderId = order.id;
  await m.save();
  res.json({ id: m._id, orderId: order.id, amount: order.amount, keyId: rzpKeyId(), prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone } });
});

router.post('/verify', requireUser, async (req, res) => {
  const { id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
  const m = /^[0-9a-f]{24}$/.test(String(id)) ? await Membership.findOne({ _id: id, user: req.user._id }) : null;
  if (!m || m.orderId !== razorpay_order_id || !validOrderSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: 'Payment could not be verified. If money was debited, please contact us with your payment ID.' });
  if (m.status === 'created') await activateMembership(m, { paymentId: razorpay_payment_id, method: 'online' });
  res.json({ membership: await Membership.findById(m._id) });
});

router.get('/:id/receipt', requireUser, async (req, res) => {
  const m = /^[0-9a-f]{24}$/.test(req.params.id) ? await Membership.findOne({ _id: req.params.id, status: { $ne: 'created' } }) : null;
  if (!m || (String(m.user) !== String(req.user._id) && req.user.role !== 'admin')) return res.status(404).json({ error: 'Receipt not found.' });
  const u = await User.findById(m.user);
  res.type('application/pdf').set('Content-Disposition', `inline; filename="${m.receiptNo.replace(/\//g, '-')}.pdf"`);
  renderReceipt('membership', { ...m.toObject(), amount: m.fee, name: u.name, email: u.email, pan: u.pan, address: u.address, paidAt: m.validFrom }, await getSettings(), res);
});

export default router;
