// Accounts created on the donor's behalf (donations without login) and their set-password links.
import crypto from 'node:crypto';
import { User } from './models.js';
import { normPhone } from './otp.js';
import { notify, templates, siteUrl } from './mail.js';

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const SETUP_DAYS = 7;

/**
 * Donations without login: find the account for this email, or create one.
 * An existing account is never modified from unauthenticated input; the donation is only linked to it.
 */
export async function findOrCreateDonor({ name, email, phone, address, pan }) {
  email = email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) return { user: existing, created: false };
  const p = normPhone(phone);
  const user = await User.create({
    name,
    email,
    phone: p && !(await User.exists({ phone: p })) ? p : undefined,
    address: address || undefined,
    pan: pan || undefined,
  });
  await sendAccountSetup(user);
  return { user, created: true };
}

/** Emails a one-time link (valid 7 days) to set the password. Passwords are never sent by email. */
export async function sendAccountSetup(user) {
  const token = crypto.randomBytes(32).toString('base64url');
  user.setupTokenHash = sha(token);
  user.setupTokenExpires = new Date(Date.now() + SETUP_DAYS * 86400_000);
  await user.save();
  notify({
    to: user.email,
    ...templates.accountSetup(user, `${siteUrl()}/set-password?token=${token}`, SETUP_DAYS),
  });
  return token;
}

export async function userForSetupToken(token) {
  if (typeof token !== 'string' || token.length < 20) return null;
  return User.findOne({ setupTokenHash: sha(token), setupTokenExpires: { $gt: new Date() } });
}
