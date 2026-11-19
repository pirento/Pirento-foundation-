// Razorpay: REST calls, checkout and webhook signature checks, and monthly plans.
import crypto from 'node:crypto';
import { Setting } from './models.js';
import { httpError } from './otp.js';

const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;
export const rzpOn = () => Boolean(keyId() && keySecret());
export const rzpKeyId = keyId;

/** Calls the Razorpay REST API. Throws a friendly 502 if Razorpay refuses. */
export async function rzp(method, path, body) {
  if (!rzpOn())
    throw httpError(
      503,
      'Online payments are not switched on yet. Please write to us for bank transfer details.',
    );
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId()}:${keySecret()}`).toString('base64'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    console.error('Razorpay', method, path, r.status, await r.text());
    throw httpError(502, 'Could not reach the payment provider. Please try again.');
  }
  return r.json();
}

const equal = (a, b) =>
  typeof a === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Checkout signature for one-time orders: HMAC(order_id|payment_id). */
export const validOrderSignature = (orderId, paymentId, sig, secret = keySecret()) =>
  Boolean(secret) && equal(sig, hmac(secret, `${orderId}|${paymentId}`));
/** Checkout signature for subscriptions: HMAC(payment_id|subscription_id). */
export const validSubscriptionSignature = (paymentId, subId, sig, secret = keySecret()) =>
  Boolean(secret) && equal(sig, hmac(secret, `${paymentId}|${subId}`));
/** Webhook signature: HMAC(raw body) with the webhook secret. */
export const validWebhook = (raw, sig, secret = process.env.RAZORPAY_WEBHOOK_SECRET) =>
  Boolean(secret && raw) && equal(sig, hmac(secret, raw));

export const createOrder = (amountRupees, receipt, notes) =>
  rzp('POST', '/orders', { amount: amountRupees * 100, currency: 'INR', receipt: String(receipt), notes });

/** Razorpay needs a plan per monthly amount; plans are created once and remembered. */
export async function monthlyPlan(amountRupees) {
  const key = `rzp-plan-${amountRupees}`;
  const saved = await Setting.findById(key).lean();
  if (saved?.data?.id) return saved.data.id;
  const plan = await rzp('POST', '/plans', {
    period: 'monthly',
    interval: 1,
    item: {
      name: `Pirento Foundation monthly gift ₹${amountRupees}`,
      amount: amountRupees * 100,
      currency: 'INR',
    },
  });
  await Setting.findByIdAndUpdate(key, { data: { id: plan.id } }, { upsert: true });
  return plan.id;
}
