import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from './models.js';

const COOKIE = 'pf_token';
const secret = () => process.env.JWT_SECRET;
const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

export const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });

function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, secret(), { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 3600 * 1000,
  });
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

export const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in.' }));
export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(req.user ? 403 : 401).json({ error: 'Admin access only.' });

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/register', limiter, async (req, res) => {
  const { name, email, password, phone } = req.body ?? {};
  if (!name?.trim() || !isEmail(email)) return res.status(400).json({ error: 'Name and a valid email are required.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 128)
    return res.status(400).json({ error: 'Password must be 8 to 128 characters.' });
  if (await User.exists({ email: email.toLowerCase() }))
    return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12) });
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = isEmail(email) ? await User.findOne({ email: email.toLowerCase() }) : null;
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  setSession(res, user);
  res.json({ user: publicUser(user) });
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
  if (!pw || pw.length < 8) return console.warn('ADMIN_PASSWORD (8+ chars) is needed to create the admin account.');
  await User.create({ name: 'Admin', email, role: 'admin', passwordHash: await bcrypt.hash(pw, 12) });
  console.log(`Admin account created for ${email}`);
}

export { isEmail };
