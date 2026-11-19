import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from './models.js';
import { setSession } from './auth.js';
import { notify, templates, siteUrl } from './mail.js';

/**
 * "Sign in with Bharat ID by Pirento" and "Link my Bharat ID", over standard OpenID Connect
 * (authorization code + PKCE). Bharat ID is a private Pirento account ID, not a government ID.
 *
 * Contract with the Bharat ID service (env BHARATID_ISSUER / _CLIENT_ID / _CLIENT_SECRET):
 *  - discovery at {issuer}/.well-known/openid-configuration
 *  - userinfo returns: sub, name, email, email_verified, phone_number,
 *    bharat_id (10-digit number), bharat_id_status (created | contact_confirmed | profile_submitted |
 *    pirento_reviewed | provider_verified | restricted | closed)
 */
export const bharatIdOn = () => Boolean(process.env.BHARATID_ISSUER && process.env.BHARATID_CLIENT_ID && process.env.BHARATID_CLIENT_SECRET);
export const COMPLETE = ['contact_confirmed', 'profile_submitted', 'pirento_reviewed', 'provider_verified'];

const COOKIE = 'pf_oidc';
const redirectUri = () => `${siteUrl()}/api/auth/bharatid/callback`;
let discovery;
async function config() {
  if (!discovery) {
    const r = await fetch(`${process.env.BHARATID_ISSUER.replace(/\/$/, '')}/.well-known/openid-configuration`);
    if (!r.ok) throw new Error(`Bharat ID discovery failed (${r.status})`);
    discovery = await r.json();
  }
  return discovery;
}
export const resetBharatIdDiscovery = () => (discovery = undefined);

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : null);
const fail = (res, mode, message) => res.redirect(`${mode === 'link' ? '/dashboard/bharat-id' : '/login'}?error=${encodeURIComponent(message)}`);

/** Maps userinfo claims onto the stored Bharat ID record. */
export const fromClaims = (c) => ({
  sub: String(c.sub),
  number: c.bharat_id ? String(c.bharat_id) : undefined,
  status: c.bharat_id_status || 'created',
  name: c.name,
  email: c.email_verified ? c.email?.toLowerCase() : undefined,
  phone: c.phone_number,
  checkedAt: new Date(),
});

const router = Router();

router.get('/start', async (req, res) => {
  const mode = req.query.mode === 'link' ? 'link' : 'login';
  if (!bharatIdOn()) return fail(res, mode, 'Bharat ID sign-in is not available yet.');
  if (mode === 'link' && !req.user) return res.redirect('/login?next=/dashboard/bharat-id');
  const state = crypto.randomBytes(16).toString('base64url');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const cookie = jwt.sign({ state, verifier, mode, next: safeNext(req.query.next), uid: req.user?._id && String(req.user._id) }, process.env.JWT_SECRET, { expiresIn: '10m' });
  res.cookie(COOKIE, cookie, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 });
  let cfg;
  try {
    cfg = await config();
  } catch (e) {
    console.error('Bharat ID', e.message);
    return fail(res, mode, 'Bharat ID is not reachable right now. Please try again later.');
  }
  const url = new URL(cfg.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.BHARATID_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: 'openid profile email phone bharat_id',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  res.redirect(url.toString());
});

router.get('/callback', async (req, res) => {
  let flow;
  try {
    flow = jwt.verify(req.cookies?.[COOKIE] ?? '', process.env.JWT_SECRET);
  } catch {
    return fail(res, 'login', 'Your Bharat ID sign-in expired. Please try again.');
  }
  res.clearCookie(COOKIE);
  const { mode } = flow;
  if (req.query.error || req.query.state !== flow.state || typeof req.query.code !== 'string') return fail(res, mode, 'Bharat ID sign-in was cancelled.');

  let claims;
  try {
    const cfg = await config();
    const t = await fetch(cfg.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: redirectUri(),
        client_id: process.env.BHARATID_CLIENT_ID,
        client_secret: process.env.BHARATID_CLIENT_SECRET,
        code_verifier: flow.verifier,
      }),
    });
    if (!t.ok) throw new Error(`token ${t.status}`);
    const { access_token } = await t.json();
    const u = await fetch(cfg.userinfo_endpoint, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!u.ok) throw new Error(`userinfo ${u.status}`);
    claims = await u.json();
  } catch (e) {
    console.error('Bharat ID', e.message);
    return fail(res, mode, 'Could not reach Bharat ID. Please try again.');
  }
  if (!claims?.sub) return fail(res, mode, 'Bharat ID did not return an account.');
  const record = fromClaims(claims);
  const owner = await User.findOne({ 'bharatId.sub': record.sub });

  if (mode === 'link') {
    const user = req.user && String(req.user._id) === flow.uid ? req.user : null;
    if (!user) return fail(res, 'login', 'Please sign in again to link your Bharat ID.');
    if (owner && String(owner._id) !== String(user._id)) return fail(res, mode, 'This Bharat ID is already linked to another Pirento Foundation account.');
    user.bharatId = { ...record, linkedAt: user.bharatId?.linkedAt ?? new Date() };
    await user.save();
    return res.redirect(`${flow.next || '/dashboard/bharat-id'}?bharatid=linked`);
  }

  let user = owner;
  if (!user && record.email) {
    user = await User.findOne({ email: record.email });
    if (user) user.emailVerified = true;
  }
  let created = false;
  if (!user) {
    if (!record.email) return fail(res, mode, 'Your Bharat ID has no confirmed email yet. Confirm it on Bharat ID, then try again.');
    user = new User({ name: record.name || record.email.split('@')[0], email: record.email, emailVerified: true });
    created = true;
  }
  if (user.role === 'admin') return fail(res, mode, 'Admin accounts sign in at /admin/login.');
  user.bharatId = { ...record, linkedAt: user.bharatId?.linkedAt ?? new Date() };
  await user.save();
  if (created) notify({ to: user.email, ...templates.welcome(user) });
  setSession(res, user, false);
  res.redirect(flow.next || '/dashboard');
});

export default router;
