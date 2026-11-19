// End-to-end API test: sign-up and sign-in by code, admin two-step login, payments, webhook,
// CSV, contact form and certificates. Runs against an in-memory MongoDB.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { ensureAdmin } from '../auth.js';
import { Donation } from '../models.js';

let mongo, server, base;
const SECRET = 'rzp_test_secret';

before(async () => {
  Object.assign(process.env, {
    DEV_SHOW_CODES: '1',
    JWT_SECRET: 'x'.repeat(40),
    ADMIN_EMAIL: 'admin@test.in',
    ADMIN_PASSWORD: 'admin-pass-1',
    RAZORPAY_KEY_ID: 'rzp_test',
    RAZORPAY_KEY_SECRET: SECRET,
    RAZORPAY_WEBHOOK_SECRET: 'whsec',
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
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  });
  const type = r.headers.get('content-type') ?? '';
  return {
    status: r.status,
    cookie: r.headers.get('set-cookie')?.split(';')[0],
    body: type.includes('json') ? await r.json() : await r.arrayBuffer(),
  };
}

test('auth, donations, certificates and admin end to end', async () => {
  // Register: email + mobile must both be verified by OTP first.
  const form = {
    name: 'Asha',
    email: 'asha@test.in',
    phone: '98765 43210',
    password: 'password1',
    agree: true,
  };
  assert.equal((await call('POST', '/auth/register', form)).status, 400, 'unverified email must be refused');
  for (const [channel, target] of [
    ['email', form.email],
    ['phone', form.phone],
  ]) {
    const sent = await call('POST', '/auth/otp/send', { channel, target, purpose: 'register' });
    assert.equal(sent.status, 200);
    assert.match(sent.body.devCode, /^\d{6}$/);
    const wrong = sent.body.devCode === '000000' ? '111111' : '000000';
    assert.equal((await call('POST', '/auth/otp/verify', { channel, target, code: wrong })).status, 400);
    assert.equal(
      (await call('POST', '/auth/otp/verify', { channel, target, code: sent.body.devCode })).status,
      200,
    );
  }
  const reg = await call('POST', '/auth/register', form);
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.phone, '+919876543210');
  assert.equal(
    (await call('POST', '/auth/otp/send', { channel: 'email', target: form.email, purpose: 'register' }))
      .status,
    409,
  );
  assert.equal(
    (await call('POST', '/auth/login', { id: 'asha@test.in', password: 'wrong-pass' })).status,
    401,
  );
  assert.equal((await call('POST', '/auth/login', { id: '9876543210', password: 'password1' })).status, 200);

  // Sign in with a mobile code; unknown numbers are told to register.
  assert.equal(
    (await call('POST', '/auth/otp/send', { channel: 'phone', target: '9123456789', purpose: 'login' }))
      .status,
    404,
  );
  const lc = await call('POST', '/auth/otp/send', {
    channel: 'phone',
    target: '+91 98765 43210',
    purpose: 'login',
  });
  assert.equal(
    (await call('POST', '/auth/otp/send', { channel: 'phone', target: '9876543210', purpose: 'login' }))
      .status,
    429,
    '30s cooldown',
  );
  const otpLogin = await call('POST', '/auth/otp/login', {
    channel: 'phone',
    target: '9876543210',
    code: lc.body.devCode,
  });
  assert.equal(otpLogin.status, 200);
  assert.equal(
    (await call('POST', '/auth/otp/login', { channel: 'phone', target: '9876543210', code: lc.body.devCode }))
      .status,
    400,
    'codes are single-use',
  );

  // Forgot password via email code.
  const rc = await call('POST', '/auth/otp/send', { channel: 'email', target: form.email, purpose: 'reset' });
  assert.equal(
    (
      await call('POST', '/auth/password/reset', {
        channel: 'email',
        target: form.email,
        code: rc.body.devCode,
        password: 'newpassword1',
      })
    ).status,
    200,
  );
  assert.equal((await call('POST', '/auth/login', { id: form.email, password: 'newpassword1' })).status, 200);
  assert.equal(
    (await call('POST', '/auth/google', { credential: 'x' })).status,
    503,
    'Google is off without a client id',
  );
  const user = reg.cookie;
  assert.equal((await call('GET', '/auth/me', null, user)).body.user.role, 'user');
  assert.equal((await call('GET', '/admin/stats', null, user)).status, 403);

  // Online payment: simulate a Razorpay order + signed callback.
  const d = await Donation.create({
    user: reg.body.user.id,
    name: 'Asha',
    email: 'asha@test.in',
    amount: 500,
    programme: 'green',
    orderId: 'order_1',
  });
  const bad = await call('POST', '/donations/verify', {
    donationId: d.id,
    razorpay_order_id: 'order_1',
    razorpay_payment_id: 'pay_1',
    razorpay_signature: 'f'.repeat(64),
  });
  assert.equal(bad.status, 400);
  const sig = crypto.createHmac('sha256', SECRET).update('order_1|pay_1').digest('hex');
  const ok = await call('POST', '/donations/verify', {
    donationId: d.id,
    razorpay_order_id: 'order_1',
    razorpay_payment_id: 'pay_1',
    razorpay_signature: sig,
  });
  assert.equal(ok.status, 200);
  assert.match(ok.body.receiptNo, /^PF\/\d{4}-\d{2}\/00001$/);
  const again = await call('POST', '/donations/verify', {
    donationId: d.id,
    razorpay_order_id: 'order_1',
    razorpay_payment_id: 'pay_1',
    razorpay_signature: sig,
  });
  assert.equal(again.body.certNo, ok.body.certNo, 'verifying twice must not issue a second certificate');

  const mine = await call('GET', '/donations/mine', null, user);
  assert.equal(mine.body.donations[0].certNo, ok.body.certNo);
  const pdf = await call('GET', `/certificates/${ok.body.certNo}/pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(pdf.body).subarray(0, 4).toString(), '%PDF');

  // Admin: offline donation, issue + revoke a certificate.
  // Admin: public sign-in refused; two-step admin login (password, then email code).
  assert.equal(
    (await call('POST', '/auth/login', { id: 'admin@test.in', password: 'admin-pass-1' })).status,
    403,
  );
  assert.equal(
    (await call('POST', '/auth/admin/login', { email: 'admin@test.in', password: 'nope-nope' })).status,
    401,
  );
  assert.equal(
    (await call('POST', '/auth/admin/login', { email: 'asha@test.in', password: 'newpassword1' })).status,
    401,
    'non-admins cannot use it',
  );
  const step1 = await call('POST', '/auth/admin/login', { email: 'admin@test.in', password: 'admin-pass-1' });
  assert.equal(step1.status, 200);
  assert.equal(step1.cookie, undefined, 'no session before the code');
  const step2 = await call('POST', '/auth/admin/verify', {
    email: 'admin@test.in',
    code: step1.body.devCode,
  });
  assert.equal(step2.status, 200);
  const admin = step2.cookie;
  assert.equal(
    (
      await call(
        'POST',
        '/admin/donations',
        { name: 'Ravi', email: 'ravi@test.in', amount: 5, method: 'cash' },
        admin,
      )
    ).status,
    400,
  );
  const off = await call(
    'POST',
    '/admin/donations',
    { name: 'Ravi', email: 'ravi@test.in', amount: 2000, method: 'bank', programme: 'food' },
    admin,
  );
  assert.equal(off.status, 201);
  const vol = await call(
    'POST',
    '/admin/certificates',
    { kind: 'volunteer', recipientName: 'Asha', email: 'asha@test.in', title: 'Volunteer Certificate' },
    admin,
  );
  assert.equal(vol.status, 201);
  assert.equal((await call('GET', '/certificates/mine', null, user)).body.certificates.length, 2);
  const stats = (await call('GET', '/admin/stats', null, admin)).body;
  assert.deepEqual([stats.raised, stats.donations, stats.donors, stats.certificates], [2500, 2, 2, 3]);

  // Webhook: a payment whose browser closed before /verify.
  const d2 = await Donation.create({
    name: 'Kiran',
    email: 'kiran@test.in',
    amount: 750,
    orderId: 'order_2',
  });
  const evt = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_2', order_id: 'order_2', amount: 75000 } } },
  });
  const hook = (sig) =>
    fetch(base + '/donations/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': sig },
      body: evt,
    });
  assert.equal((await hook('0'.repeat(64))).status, 400);
  assert.equal((await hook(crypto.createHmac('sha256', 'whsec').update(evt).digest('hex'))).status, 200);
  const paid2 = await Donation.findById(d2.id);
  assert.equal(paid2.status, 'paid');
  assert.equal(paid2.paymentId, 'pay_2');

  const csv = await call('GET', '/admin/donations.csv', null, admin);
  assert.equal(Buffer.from(csv.body).toString().split('\n').length, 4, 'header + 3 paid donations');

  // Contact form goes to the admin inbox.
  assert.equal(
    (await call('POST', '/contact', { name: 'X', email: 'x@test.in', topic: 'Other', message: 'short' }))
      .status,
    400,
  );
  assert.equal(
    (
      await call('POST', '/contact', {
        name: 'Neha',
        email: 'neha@test.in',
        topic: 'Volunteering',
        message: 'I would like to help at the plantation.',
      })
    ).status,
    201,
  );
  const inbox = await call('GET', '/admin/messages', null, admin);
  assert.equal(inbox.body.messages[0].topic, 'Volunteering');
  assert.equal((await call('GET', '/admin/stats', null, admin)).body.newMessages, 1);

  await call('PATCH', `/admin/certificates/${vol.body.certificate._id}`, { revoked: true }, admin);
  assert.equal(
    (await call('GET', `/certificates/verify/${vol.body.certificate.certNo}`)).body.certificate.revoked,
    true,
  );
  assert.equal((await call('GET', `/certificates/${vol.body.certificate.certNo}/pdf`)).status, 410);
  assert.equal((await call('GET', '/certificates/verify/PFC-0000000000000000')).status, 404);
});
