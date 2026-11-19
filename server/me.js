import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Donation, Certificate, Subscription } from './models.js';
import { requireUser, publicUser } from './auth.js';
import { httpError, normPhone } from './otp.js';
import { mineFilter } from './certificates.js';
import { currentMembership } from './membership.js';
import { COMPLETE } from './bharatid.js';
import { financialYear } from './models.js';

const router = Router();
router.use(requireUser);

/** Everything the dashboard home needs in one call, including the to-do checklist. */
router.get('/summary', async (req, res) => {
  const u = req.user;
  const mine = mineFilter(u);
  const [donations, certificates, subscriptions, membership] = await Promise.all([
    Donation.find({ status: 'paid', $or: mine }, 'amount paidAt').lean(),
    Certificate.countDocuments({ $or: mine, revoked: false }),
    Subscription.find({ $or: mine, status: { $in: ['active', 'halted'] } }, 'amount status').lean(),
    currentMembership(u._id),
  ]);
  const fy = financialYear();
  const thisFy = donations.filter((d) => financialYear(new Date(d.paidAt)) === fy).reduce((s, d) => s + d.amount, 0);
  const bharat = u.bharatId?.sub ? (COMPLETE.includes(u.bharatId.status) ? 'complete' : 'pending') : 'not_linked';
  res.json({
    user: publicUser(u),
    totals: { given: donations.reduce((s, d) => s + d.amount, 0), count: donations.length, thisFy, fy, certificates, monthly: subscriptions.reduce((s, x) => s + x.amount, 0) },
    membership,
    bharat,
    checklist: [
      { key: 'email', done: u.emailVerified, label: 'Confirm your email' },
      { key: 'password', done: Boolean(u.passwordHash || u.googleId || u.bharatId?.sub), label: 'Set a password' },
      { key: 'pan', done: Boolean(u.pan && u.address), label: 'Add PAN and address for 80G receipts' },
      ...(membership ? [{ key: 'bharat', done: bharat === 'complete', label: 'Complete your Bharat ID by Pirento' }] : []),
    ],
  });
});

router.put('/profile', async (req, res) => {
  const u = req.user;
  const { name, address, pan, phone } = req.body ?? {};
  if (name !== undefined) {
    if (!String(name).trim() || name.length > 120) throw httpError(400, 'Please enter your name.');
    u.name = String(name).trim();
  }
  if (address !== undefined) {
    if (address.length > 300) throw httpError(400, 'Address is too long.');
    u.address = address.trim() || undefined;
  }
  if (pan !== undefined) {
    const p = String(pan).trim().toUpperCase();
    if (p && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) throw httpError(400, 'PAN format looks wrong (e.g. ABCDE1234F).');
    u.pan = p || undefined;
  }
  if (phone !== undefined) {
    const p = phone ? normPhone(phone) : undefined;
    if (phone && !p) throw httpError(400, 'Please enter a valid 10-digit Indian mobile number.');
    if (p !== u.phone) {
      if (p && (await User.exists({ phone: p, _id: { $ne: u._id } }))) throw httpError(409, 'Another account uses this mobile number.');
      u.phone = p;
      u.phoneVerified = false; // a changed number must be confirmed again by code
    }
  }
  await u.save();
  res.json({ user: publicUser(u) });
});

router.post('/password', async (req, res) => {
  const { current, password } = req.body ?? {};
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw httpError(400, 'Password must be 8 to 128 characters.');
  if (req.user.passwordHash && !(await bcrypt.compare(String(current ?? ''), req.user.passwordHash))) throw httpError(400, 'Your current password is not right.');
  req.user.passwordHash = await bcrypt.hash(password, 12);
  await req.user.save();
  res.json({ ok: true });
});

router.post('/bharatid/unlink', async (req, res) => {
  req.user.bharatId = undefined;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

export default router;
