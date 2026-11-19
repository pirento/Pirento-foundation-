// End-to-end API test for giving and membership: guest donations, 80G receipts, monthly gifts,
// membership, Bharat ID, profile, admin settings and website updates. Razorpay and Bharat ID are stubbed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { ensureAdmin } from '../auth.js';
import { amountInWords } from '../pdf.js';
import { Donation, User, Subscription } from '../models.js';
import { sendAccountSetup } from '../accounts.js';

let mongo, server, base;
const SECRET = 'rzp_secret';
const hmac = (s, d) => crypto.createHmac('sha256', s).update(d).digest('hex');

// Stand-ins for Razorpay and Bharat ID: intercept their hosts, pass everything else through.
const realFetch = globalThis.fetch;
let orderSeq = 0;
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (b) =>
    new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  if (u.startsWith('https://api.razorpay.com/v1/orders'))
    return json({ id: `order_${++orderSeq}`, amount: JSON.parse(opts.body).amount });
  if (u.startsWith('https://api.razorpay.com/v1/plans')) return json({ id: 'plan_1' });
  if (u.endsWith('/cancel')) return json({ status: 'cancelled' });
  if (u.startsWith('https://api.razorpay.com/v1/subscriptions')) return json({ id: `sub_${++orderSeq}` });
  if (u === 'https://bharatid.test/.well-known/openid-configuration')
    return json({
      authorization_endpoint: 'https://bharatid.test/authorize',
      token_endpoint: 'https://bharatid.test/token',
      userinfo_endpoint: 'https://bharatid.test/userinfo',
    });
  if (u === 'https://bharatid.test/token')
    return json({ access_token: String(new URLSearchParams(opts.body).get('code')) });
  if (u === 'https://bharatid.test/userinfo') {
    const who = opts.headers.Authorization.split(' ')[1];
    return json(
      who === 'meera'
        ? {
            sub: 'b-1',
            name: 'Meera',
            email: 'meera@test.in',
            email_verified: true,
            bharat_id: '4821930576',
            bharat_id_status: 'profile_submitted',
          }
        : {
            sub: 'b-2',
            name: 'Tara',
            email: 'tara@test.in',
            email_verified: true,
            bharat_id: '7710042219',
            bharat_id_status: 'created',
          },
    );
  }
  return realFetch(url, opts);
};

before(async () => {
  Object.assign(process.env, {
    DEV_SHOW_CODES: '1',
    JWT_SECRET: 'z'.repeat(40),
    ADMIN_EMAIL: 'admin@test.in',
    ADMIN_PASSWORD: 'admin-pass-1',
    SITE_URL: 'http://pf.test',
    RAZORPAY_KEY_ID: 'rzp_test',
    RAZORPAY_KEY_SECRET: SECRET,
    RAZORPAY_WEBHOOK_SECRET: 'wh',
    BHARATID_ISSUER: 'https://bharatid.test',
    BHARATID_CLIENT_ID: 'pf',
    BHARATID_CLIENT_SECRET: 's',
  });
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await ensureAdmin();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

async function call(method, path, body, cookie) {
  const r = await realFetch(base + path, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  });
  const type = r.headers.get('content-type') ?? '';
  const cookies = r.headers.getSetCookie().map((c) => c.split(';')[0]);
  return {
    status: r.status,
    location: r.headers.get('location'),
    cookies,
    cookie: cookies.find((c) => c.startsWith('pf_token=')),
    body: type.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()),
  };
}
const hook = (evt) =>
  realFetch(base + '/donations/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': hmac('wh', evt) },
    body: evt,
  });

test('amount in words (Indian numbering)', () => {
  assert.equal(amountInWords(1000), 'Rupees One Thousand Only');
  assert.equal(amountInWords(250075), 'Rupees Two Lakh Fifty Thousand Seventy Five Only');
  assert.equal(
    amountInWords(12345678),
    'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only',
  );
});

test('guest donation, 80G receipt, monthly giving, membership, Bharat ID, settings, updates', async () => {
  const admin = await (async () => {
    const s1 = await call('POST', '/auth/admin/login', { email: 'admin@test.in', password: 'admin-pass-1' });
    return (await call('POST', '/auth/admin/verify', { email: 'admin@test.in', code: s1.body.devCode }))
      .cookie;
  })();

  // Settings: registration numbers are entered by the admin.
  assert.equal((await call('PUT', '/settings', { reg80G: 'X' })).status, 401);
  assert.equal((await call('PUT', '/settings', { pirentoOneUrl: 'http://insecure' }, admin)).status, 400);
  const st = await call(
    'PUT',
    '/settings',
    { pan: 'AAJCP1234K', reg80G: 'AAJCP1234KF20261', reg12A: 'AAJCP1234KE20261', membershipFee: 1000 },
    admin,
  );
  assert.equal(st.body.settings.reg80G, 'AAJCP1234KF20261');

  // One-time donation without logging in creates an account and emails a set-password link.
  const o = await call('POST', '/donations/order', {
    name: 'Kavya Rao',
    email: 'kavya@test.in',
    amount: 5000,
    pan: 'abcde1234f',
    address: '12 MG Road, Lucknow',
  });
  assert.equal(o.status, 200);
  const v = await call('POST', '/donations/verify', {
    donationId: o.body.donationId,
    razorpay_order_id: o.body.orderId,
    razorpay_payment_id: 'pay_a',
    razorpay_signature: hmac(SECRET, `${o.body.orderId}|pay_a`),
  });
  assert.equal(v.status, 200);
  assert.equal(v.cookie, undefined, 'a guest donor is not signed in automatically');
  const kavya = await User.findOne({ email: 'kavya@test.in' });
  assert.ok(
    kavya && !kavya.passwordHash && kavya.setupTokenHash,
    'account created with a pending set-password link',
  );

  // 80G receipt: open with the emailed key, closed without it.
  const receiptPath =
    new URL(v.body.receiptUrl).pathname.replace('/api', '') + new URL(v.body.receiptUrl).search;
  const pdf = await call('GET', receiptPath);
  assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
  assert.equal((await call('GET', receiptPath.replace(/key=\w+/, 'key=' + '0'.repeat(24)))).status, 404);

  // Set password from the link (fresh token: the original is only in the email).
  const token = await sendAccountSetup(kavya);
  assert.equal(
    (await call('POST', '/auth/password/set', { token: 'nope'.repeat(8), password: 'password123' })).status,
    400,
  );
  const setp = await call('POST', '/auth/password/set', { token, password: 'password123' });
  assert.equal(setp.status, 200);
  assert.equal(
    (await call('POST', '/auth/password/set', { token, password: 'password123' })).status,
    400,
    'link is single-use',
  );
  const k = setp.cookie;
  const mine = await call('GET', '/donations/mine', null, k);
  assert.equal(mine.body.donations.length, 1);
  assert.equal(
    (await call('GET', mine.body.donations[0].receiptUrl.replace('/api', ''), null, k)).status,
    200,
  );

  // Monthly gift: checkout signature, then a second charge by webhook (no second certificate).
  assert.equal(
    (await call('POST', '/donations/subscribe', { name: 'Kavya Rao', email: 'kavya@test.in', amount: 50 }, k))
      .status,
    400,
    'monthly minimum',
  );
  const s = await call(
    'POST',
    '/donations/subscribe',
    { name: 'Kavya Rao', email: 'kavya@test.in', amount: 500, programme: 'education' },
    k,
  );
  const sv = await call('POST', '/donations/subscribe/verify', {
    id: s.body.id,
    razorpay_payment_id: 'pay_m1',
    razorpay_subscription_id: s.body.subscriptionId,
    razorpay_signature: hmac(SECRET, `pay_m1|${s.body.subscriptionId}`),
  });
  assert.equal(sv.status, 200);
  assert.ok(sv.body.certNo);
  const charged = JSON.stringify({
    event: 'subscription.charged',
    payload: {
      subscription: { entity: { id: s.body.subscriptionId } },
      payment: { entity: { id: 'pay_m2', amount: 50000, created_at: Date.now() / 1000 } },
    },
  });
  assert.equal((await hook(charged)).status, 200);
  assert.equal((await hook(charged)).status, 200, 'redelivery is harmless');
  const sub = await Subscription.findById(s.body.id);
  assert.equal(sub.charges, 2);
  assert.equal(await Donation.countDocuments({ subscription: sub._id, status: 'paid' }), 2);
  const cancel = await call('POST', `/donations/subscriptions/${s.body.id}/cancel`, null, k);
  assert.equal(cancel.body.subscription.status, 'cancelled');

  // Membership needs an account; then member number, certificate, receipt.
  assert.equal((await call('POST', '/membership/order')).status, 401);
  const mo = await call('POST', '/membership/order', null, k);
  assert.equal(mo.body.amount, 100000);
  const mv = await call(
    'POST',
    '/membership/verify',
    {
      id: mo.body.id,
      razorpay_order_id: mo.body.orderId,
      razorpay_payment_id: 'pay_mem',
      razorpay_signature: hmac(SECRET, `${mo.body.orderId}|pay_mem`),
    },
    k,
  );
  assert.equal(mv.body.membership.status, 'active');
  assert.match(mv.body.membership.memberNo, /^PFMEM-\d{6}$/);
  assert.equal(
    (await call('POST', '/membership/order', null, k)).status,
    409,
    'cannot buy twice while active',
  );
  assert.equal(
    (await call('GET', `/membership/${mv.body.membership._id}/receipt`, null, k)).body
      .subarray(0, 4)
      .toString(),
    '%PDF',
  );
  let summary = (await call('GET', '/me/summary', null, k)).body;
  assert.equal(summary.bharat, 'not_linked');
  assert.ok(summary.checklist.some((c) => c.key === 'bharat' && !c.done));

  // Link Bharat ID (OpenID Connect): start → provider → callback.
  const start = await call('GET', '/auth/bharatid/start?mode=link', null, k);
  assert.equal(start.status, 302);
  assert.equal(new URL(start.location).searchParams.get('code_challenge_method'), 'S256');
  const oidc = start.cookies.find((c) => c.startsWith('pf_oidc='));
  assert.equal(
    (
      await call('GET', `/auth/bharatid/callback?code=meera&state=wrong`, null, `${k}; ${oidc}`)
    ).location.includes('error'),
    true,
  );
  const start2 = await call('GET', '/auth/bharatid/start?mode=link', null, k);
  const cb = await call(
    'GET',
    `/auth/bharatid/callback?code=meera&state=${new URL(start2.location).searchParams.get('state')}`,
    null,
    `${k}; ${start2.cookies[0]}`,
  );
  assert.match(cb.location, /bharatid=linked/);
  summary = (await call('GET', '/me/summary', null, k)).body;
  assert.equal(summary.bharat, 'complete');
  assert.equal(summary.user.bharatId.number, '4821930576');

  // Sign in with Bharat ID creates a new account for an unknown person.
  const ls = await call('GET', '/auth/bharatid/start?mode=login');
  const lc = await call(
    'GET',
    `/auth/bharatid/callback?code=tara&state=${new URL(ls.location).searchParams.get('state')}`,
    null,
    ls.cookies[0],
  );
  assert.equal(lc.location, '/dashboard');
  assert.ok(lc.cookie);
  const tara = (await call('GET', '/me/summary', null, lc.cookie)).body;
  assert.equal(tara.user.email, 'tara@test.in');
  assert.equal(tara.bharat, 'pending', "linked, but status 'created' is not complete yet");
  assert.equal(tara.user.bharatId.status, 'created');

  // Profile: PAN validation, phone change resets verification.
  assert.equal((await call('PUT', '/me/profile', { pan: 'BAD' }, k)).status, 400);
  assert.equal(
    (await call('PUT', '/me/profile', { phone: '9876501234', address: 'New address' }, k)).body.user
      .phoneVerified,
    false,
  );

  // Admin: refund revokes certificate; stats; members; updates on the website.
  const d = await Donation.findOne({ paymentId: 'pay_a' });
  assert.equal((await call('PATCH', `/admin/donations/${d._id}`, { status: 'refunded' }, admin)).status, 200);
  const stats = (await call('GET', '/admin/stats', null, admin)).body;
  assert.equal(stats.members, 1);
  assert.equal(
    (await call('GET', '/admin/members', null, admin)).body.members[0].user.bharatId.number,
    '4821930576',
  );
  assert.equal((await call('GET', `/admin/users/${kavya._id}`, null, admin)).body.donations.length, 3);
  const post = await call(
    'POST',
    '/admin/posts',
    { title: 'First saplings planted', summary: 'Pilot site 01', published: true },
    admin,
  );
  assert.equal(post.status, 201);
  assert.equal((await call('GET', '/posts')).body.posts[0].slug, 'first-saplings-planted');
  assert.equal(
    (await call('POST', '/admin/posts', { title: 'x', link: 'javascript:alert(1)' }, admin)).status,
    400,
  );

  // Security: with no provider and no explicit opt-in, codes are never returned to the browser.
  process.env.DEV_SHOW_CODES = '0';
  const blocked = await call('POST', '/auth/otp/send', {
    channel: 'email',
    target: 'new@test.in',
    purpose: 'register',
  });
  assert.equal(blocked.status, 503);
  assert.equal(blocked.body.devCode, undefined);
  process.env.DEV_SHOW_CODES = '1';
});
