// One-time codes: creating, hashing, checking and delivering them by email or SMS.
import crypto from 'node:crypto';
import { Otp } from './models.js';
import { sendMail, templates, canEmail } from './mail.js';

export { canEmail };

export const httpError = (status, message) => Object.assign(new Error(message), { status, expose: true });

const isEmail = (s) =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) && s.length <= 254;

// shortcut: Indian mobile numbers only; widen when phone login is needed for other countries.
export function normPhone(p) {
  const d = String(p ?? '').replace(/[\s()-]/g, '');
  const m = d.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return m ? `+91${m[1]}` : null;
}

/** Normalises an email or phone for the given channel, or throws a 400. */
export function normTarget(channel, target) {
  if (channel === 'email') {
    if (!isEmail(target)) throw httpError(400, 'Please enter a valid email address.');
    return target.trim().toLowerCase();
  }
  if (channel === 'phone') {
    const p = normPhone(target);
    if (!p) throw httpError(400, 'Please enter a valid 10-digit Indian mobile number.');
    return p;
  }
  throw httpError(400, 'Choose email or mobile.');
}

const hash = (target, code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${target}:${code}`).digest('hex');
const TTL = 10 * 60 * 1000;

export async function createOtp(channel, target, purpose) {
  if (await Otp.exists({ target, purpose, createdAt: { $gt: new Date(Date.now() - 30_000) } }))
    throw httpError(429, 'Please wait 30 seconds before asking for a new code.');
  await Otp.deleteMany({ target, purpose });
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await Otp.create({
    channel,
    target,
    purpose,
    codeHash: hash(target, code),
    expiresAt: new Date(Date.now() + TTL),
  });
  return code;
}

/** Checks a code; returns the OTP document. Wrong codes count, 5 strikes burn the code. */
export async function checkOtp(target, purpose, code) {
  const otp = await Otp.findOne({ target, purpose, verified: false });
  if (!otp || otp.expiresAt < new Date())
    throw httpError(400, 'This code has expired. Please ask for a new one.');
  const given = Buffer.from(hash(target, String(code ?? '')));
  if (!crypto.timingSafeEqual(given, Buffer.from(otp.codeHash))) {
    otp.attempts += 1;
    if (otp.attempts >= 5) {
      await otp.deleteOne();
      throw httpError(400, 'Too many wrong tries. Please ask for a new code.');
    }
    await otp.save();
    throw httpError(400, 'That code is not right. Please check and try again.');
  }
  return otp;
}

// SMS via Twilio's REST API. For Indian numbers, a DLT-registered sender and template are required by TRAI.
async function sendSms(to, code) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
    },
    body: new URLSearchParams({
      To: to,
      From: process.env.TWILIO_FROM,
      Body: `${code} is your Pirento Foundation code. Valid for 10 minutes. Do not share it.`,
    }),
  });
  if (!r.ok) {
    console.error('SMS failed', r.status, await r.text());
    throw httpError(502, 'Could not send the SMS. Please try email instead.');
  }
}

export const canSms = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
// Test codes are shown on screen only when explicitly enabled, and never in production.
export const devCodes = () => process.env.DEV_SHOW_CODES === '1' && process.env.NODE_ENV !== 'production';

/** Sends the code. Outside production with no provider set, returns the code so it can be shown on screen. */
export async function deliver(channel, target, code, purpose = 'login') {
  if (channel === 'email' && canEmail()) return sendMail({ to: target, ...templates.otp(code, purpose) });
  if (channel === 'phone' && canSms()) return sendSms(target, code);
  if (!devCodes())
    throw httpError(
      503,
      channel === 'email'
        ? 'Email codes are not set up yet.'
        : 'SMS codes are not set up yet. Please use email.',
    );
  console.log(`[dev] ${channel} code for ${target}: ${code}`);
  return code;
}
