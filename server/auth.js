// Sign-in and sessions (/api/auth/*): OTP by email or mobile, password, Google, password reset,
// set-password links, and the two-step admin login. Sessions are a JWT in an httpOnly cookie.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, Otp } from './models.js';
import {
  httpError,
  normTarget,
  normPhone,
  createOtp,
  checkOtp,
  deliver,
  canEmail,
  canSms,
  devCodes,
} from './otp.js';
import { notify, templates } from './mail.js';
import { userForSetupToken } from './accounts.js';
import { bharatIdOn } from './bharatid.js';

const COOKIE = 'pf_token';
const secret = () => process.env.JWT_SECRET;
const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  emailVerified: u.emailVerified,
  phoneVerified: u.phoneVerified,
  hasPassword: Boolean(u.passwordHash),
  google: Boolean(u.googleId),
  address: u.address,
  pan: u.pan,
  bharatId: u.bharatId?.sub
    ? {
        number: u.bharatId.number,
        status: u.bharatId.status,
        name: u.bharatId.name,
        email: u.bharatId.email,
        phone: u.bharatId.phone,
        linkedAt: u.bharatId.linkedAt,
        checkedAt: u.bharatId.checkedAt,
      }
    : null,
  createdAt: u.createdAt,
});

export function setSession(res, user, respond = true) {
  const hours = user.role === 'admin' ? 12 : 7 * 24; // admin sessions are short
  const token = jwt.sign({ sub: String(user._id), role: user.role }, secret(), { expiresIn: `${hours}h` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: hours * 3600 * 1000,
  });
  if (respond) return res.json({ user: publicUser(user) });
}

// Attaches req.user when a valid session cookie exists; never rejects.
export async function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { sub } = jwt.verify(token, secret());
      req.user = await User.findById(sub);
    } catch {
      /* expired or tampered token: treat as logged out */
    }
  }
  next();
}

export const requireUser = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Please log in.' });
export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin'
    ? next()
    : res.status(req.user ? 403 : 401).json({ error: 'Admin access only.' });

const checkPassword = (pw) => {
  if (typeof pw !== 'string' || pw.length < 8 || pw.length > 128)
    throw httpError(400, 'Password must be 8 to 128 characters.');
};
// Admins must use the two-step admin login, never the public sign-in routes.
const notAdmin = (user) => {
  if (user?.role === 'admin') throw httpError(403, 'Admin accounts sign in at /admin/login.');
};
const findByTarget = (channel, target) =>
  User.findOne(channel === 'email' ? { email: target } : { phone: target });

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many codes requested. Please try again in 15 minutes.' },
});

router.get('/config', (_req, res) =>
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    bharatId: bharatIdOn(),
    email: canEmail() || devCodes(),
    sms: canSms() || devCodes(),
    devCodes: devCodes(),
  }),
);

/** Step 1 of any code flow: purpose = login | register | reset. */
router.post('/otp/send', sendLimiter, async (req, res) => {
  const { channel, purpose } = req.body ?? {};
  if (!['login', 'register', 'reset'].includes(purpose)) throw httpError(400, 'Unknown request.');
  const target = normTarget(channel, req.body.target);
  const exists = await findByTarget(channel, target);
  const label = channel === 'email' ? 'email' : 'mobile number';
  if (purpose === 'register' && exists)
    throw httpError(409, `An account with this ${label} already exists. Please sign in.`);
  if (purpose !== 'register' && !exists)
    throw httpError(404, `No account uses this ${label}. Create an account first.`);
  if (purpose === 'login') notAdmin(exists);
  const code = await deliver(channel, target, await createOtp(channel, target, purpose), purpose);
  res.json({ sent: true, target, ...(typeof code === 'string' && { devCode: code }) });
});

/** Sign in with a code sent to email or mobile. */
router.post('/otp/login', limiter, async (req, res) => {
  const { channel, code } = req.body ?? {};
  const target = normTarget(channel, req.body.target);
  const otp = await checkOtp(target, 'login', code);
  await otp.deleteOne();
  const user = await findByTarget(channel, target);
  if (!user) throw httpError(404, 'Account not found.');
  notAdmin(user);
  user[channel === 'email' ? 'emailVerified' : 'phoneVerified'] = true;
  await user.save();
  setSession(res, user);
});

/** Registration: mark an email or mobile as verified before the account is created. */
router.post('/otp/verify', limiter, async (req, res) => {
  const { channel, code } = req.body ?? {};
  const target = normTarget(channel, req.body.target);
  const otp = await checkOtp(target, 'register', code);
  otp.verified = true;
  otp.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // time to finish the form
  await otp.save();
  res.json({ verified: true, target });
});

router.post('/register', limiter, async (req, res) => {
  const { name, password, agree } = req.body ?? {};
  if (!name?.trim()) throw httpError(400, 'Please enter your full name.');
  const email = normTarget('email', req.body.email);
  const phone = req.body.phone ? normTarget('phone', req.body.phone) : undefined;
  checkPassword(password);
  if (!agree) throw httpError(400, 'Please accept the terms and privacy policy.');
  const proofs = await Otp.find({
    purpose: 'register',
    verified: true,
    target: { $in: [email, phone].filter(Boolean) },
  });
  if (!proofs.some((o) => o.target === email))
    throw httpError(400, 'Please verify your email address first.');
  if (phone && !proofs.some((o) => o.target === phone))
    throw httpError(400, 'Please verify your mobile number first.');
  if (await User.exists({ $or: [{ email }, ...(phone ? [{ phone }] : [])] }))
    throw httpError(409, 'An account with this email or mobile already exists.');
  const user = await User.create({
    name,
    email,
    phone,
    emailVerified: true,
    phoneVerified: Boolean(phone),
    passwordHash: await bcrypt.hash(password, 12),
  });
  await Otp.deleteMany({ _id: { $in: proofs.map((o) => o._id) } });
  notify({ to: user.email, ...templates.welcome(user) });
  res.status(201);
  setSession(res, user);
});

/** Password sign-in with email or mobile. */
router.post('/login', limiter, async (req, res) => {
  const { id, password } = req.body ?? {};
  const phone = normPhone(id);
  const user = phone
    ? await User.findOne({ phone })
    : isEmail(id)
      ? await User.findOne({ email: id.toLowerCase().trim() })
      : null;
  notAdmin(user);
  if (user && !user.passwordHash)
    throw httpError(
      400,
      'This account has no password yet. Sign in with Google or a code, or set one with “Forgot password”.',
    );
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash)))
    throw httpError(401, 'Email/mobile or password is incorrect.');
  setSession(res, user);
});

router.post('/password/reset', limiter, async (req, res) => {
  const { channel, code, password } = req.body ?? {};
  const target = normTarget(channel, req.body.target);
  checkPassword(password);
  const otp = await checkOtp(target, 'reset', code);
  const user = await findByTarget(channel, target);
  if (!user) throw httpError(404, 'Account not found.');
  user.passwordHash = await bcrypt.hash(password, 12);
  user[channel === 'email' ? 'emailVerified' : 'phoneVerified'] = true;
  await user.save();
  await otp.deleteOne();
  // An admin still has to pass the two-step admin login after a reset.
  if (user.role === 'admin') return res.json({ user: null, admin: true });
  setSession(res, user);
});

/** Set a password from the one-time link emailed when an account was created during a donation. */
router.post('/password/set', limiter, async (req, res) => {
  const { token, password } = req.body ?? {};
  checkPassword(password);
  const user = await userForSetupToken(token);
  if (!user)
    throw httpError(
      400,
      'This link has expired or was already used. Use “Forgot password” to get a new code.',
    );
  notAdmin(user);
  Object.assign(user, {
    passwordHash: await bcrypt.hash(password, 12),
    emailVerified: true,
    setupTokenHash: undefined,
    setupTokenExpires: undefined,
  });
  await user.save();
  setSession(res, user);
});

/** Google Identity Services: the browser sends Google's signed ID token; Google confirms it. */
router.post('/google', limiter, async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw httpError(503, 'Google sign-in is not set up yet.');
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || credential.length > 4096)
    throw httpError(400, 'Missing Google credential.');
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const t = r.ok ? await r.json() : null;
  const valid =
    t &&
    t.aud === clientId &&
    ['accounts.google.com', 'https://accounts.google.com'].includes(t.iss) &&
    t.email_verified === 'true' &&
    Number(t.exp) * 1000 > Date.now();
  if (!valid) throw httpError(401, 'Google sign-in failed. Please try again.');
  const email = t.email.toLowerCase();
  let user = await User.findOne({ googleId: t.sub });
  if (!user) {
    user = await User.findOne({ email });
    const created = !user;
    if (user) Object.assign(user, { googleId: t.sub, emailVerified: true });
    else
      user = new User({ name: t.name || email.split('@')[0], email, googleId: t.sub, emailVerified: true });
    notAdmin(user); // before saving: an admin's Google id must not be linked
    await user.save();
    if (created) notify({ to: user.email, ...templates.welcome(user) });
  }
  notAdmin(user);
  setSession(res, user);
});

/* ---------- admin: password, then a code sent to the admin's email ---------- */

router.post('/admin/login', limiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = isEmail(email)
    ? await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' })
    : null;
  if (
    !user?.passwordHash ||
    typeof password !== 'string' ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    throw httpError(401, 'Email or password is incorrect.');
  const code = await deliver('email', user.email, await createOtp('email', user.email, 'admin'), 'admin');
  res.json({ otpSent: true, target: user.email, ...(typeof code === 'string' && { devCode: code }) });
});

router.post('/admin/verify', limiter, async (req, res) => {
  const email = normTarget('email', req.body?.email);
  const otp = await checkOtp(email, 'admin', req.body?.code);
  await otp.deleteOne();
  const user = await User.findOne({ email, role: 'admin' });
  if (!user) throw httpError(403, 'Admin access only.');
  setSession(res, user);
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

router.get('/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));

export default router;

// Creates or promotes the admin named in ADMIN_EMAIL on startup.
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!email) return;
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') await User.updateOne({ _id: existing._id }, { role: 'admin' });
    return;
  }
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8)
    return console.warn('ADMIN_PASSWORD (8+ chars) is needed to create the admin account.');
  await User.create({
    name: 'Admin',
    email,
    role: 'admin',
    emailVerified: true,
    passwordHash: await bcrypt.hash(pw, 12),
  });
  console.log(`Admin account created for ${email}`);
}

export { isEmail };
