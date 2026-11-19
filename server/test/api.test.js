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
  Object.assign(process.env, { JWT_SECRET: 'x'.repeat(40), ADMIN_EMAIL: 'admin@test.in', ADMIN_PASSWORD: 'admin-pass-1', RAZORPAY_KEY_ID: 'rzp_test', RAZORPAY_KEY_SECRET: SECRET });
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
  return { status: r.status, cookie: r.headers.get('set-cookie')?.split(';')[0], body: type.includes('json') ? await r.json() : await r.arrayBuffer() };
}

test('auth, donations, certificates and admin end to end', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Asha', email: 'asha@test.in', password: 'password1' });
  assert.equal(reg.status, 201);
  assert.equal((await call('POST', '/auth/register', { name: 'A', email: 'asha@test.in', password: 'password1' })).status, 409);
  assert.equal((await call('POST', '/auth/login', { email: 'asha@test.in', password: 'wrong-pass' })).status, 401);
  const user = reg.cookie;
  assert.equal((await call('GET', '/auth/me', null, user)).body.user.role, 'user');
  assert.equal((await call('GET', '/admin/stats', null, user)).status, 403);

  // Online payment: simulate a Razorpay order + signed callback.
  const d = await Donation.create({ user: reg.body.user.id, name: 'Asha', email: 'asha@test.in', amount: 500, programme: 'green', orderId: 'order_1' });
  const bad = await call('POST', '/donations/verify', { donationId: d.id, razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'f'.repeat(64) });
  assert.equal(bad.status, 400);
  const sig = crypto.createHmac('sha256', SECRET).update('order_1|pay_1').digest('hex');
  const ok = await call('POST', '/donations/verify', { donationId: d.id, razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sig });
  assert.equal(ok.status, 200);
  assert.match(ok.body.receiptNo, /^PF\/\d{4}-\d{2}\/00001$/);
  const again = await call('POST', '/donations/verify', { donationId: d.id, razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sig });
  assert.equal(again.body.certNo, ok.body.certNo, 'verifying twice must not issue a second certificate');

  const mine = await call('GET', '/donations/mine', null, user);
  assert.equal(mine.body.donations[0].certNo, ok.body.certNo);
  const pdf = await call('GET', `/certificates/${ok.body.certNo}/pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(pdf.body).subarray(0, 4).toString(), '%PDF');

  // Admin: offline donation, issue + revoke a certificate.
  const admin = (await call('POST', '/auth/login', { email: 'admin@test.in', password: 'admin-pass-1' })).cookie;
  assert.equal((await call('POST', '/admin/donations', { name: 'Ravi', email: 'ravi@test.in', amount: 5, method: 'cash' }, admin)).status, 400);
  const off = await call('POST', '/admin/donations', { name: 'Ravi', email: 'ravi@test.in', amount: 2000, method: 'bank', programme: 'food' }, admin);
  assert.equal(off.status, 201);
  const vol = await call('POST', '/admin/certificates', { kind: 'volunteer', recipientName: 'Asha', email: 'asha@test.in', title: 'Volunteer Certificate' }, admin);
  assert.equal(vol.status, 201);
  assert.equal((await call('GET', '/certificates/mine', null, user)).body.certificates.length, 2);
  const stats = (await call('GET', '/admin/stats', null, admin)).body;
  assert.deepEqual([stats.raised, stats.donations, stats.donors, stats.certificates], [2500, 2, 2, 3]);

  await call('PATCH', `/admin/certificates/${vol.body.certificate._id}`, { revoked: true }, admin);
  assert.equal((await call('GET', `/certificates/verify/${vol.body.certificate.certNo}`)).body.certificate.revoked, true);
  assert.equal((await call('GET', `/certificates/${vol.body.certificate.certNo}/pdf`)).status, 410);
  assert.equal((await call('GET', '/certificates/verify/PFC-0000000000000000')).status, 404);
});
