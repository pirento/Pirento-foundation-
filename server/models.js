import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const PROGRAMMES = ['general', 'green', 'food', 'education', 'health'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true }, // E.164, e.g. +919876543210
    passwordHash: String, // empty for Google-only accounts
    googleId: { type: String, unique: true, sparse: true },
    address: { type: String, trim: true, maxlength: 300 },
    pan: { type: String, trim: true, uppercase: true, maxlength: 10 },
    // One-time "set your password" link for accounts created during a donation.
    setupTokenHash: String,
    setupTokenExpires: Date,
    // Bharat ID by Pirento (private Pirento account ID, not a government ID), linked via OpenID Connect.
    bharatId: {
      sub: { type: String },
      number: String,
      status: String,
      name: String,
      email: String,
      phone: String,
      linkedAt: Date,
      checkedAt: Date,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
);

const donationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 20 },
    pan: { type: String, trim: true, uppercase: true, maxlength: 10 },
    address: { type: String, trim: true, maxlength: 300 },
    amount: { type: Number, required: true, min: 1 }, // whole rupees
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    receiptKey: String, // unguessable key so guest donors can open their 80G receipt from email
    programme: { type: String, enum: PROGRAMMES, default: 'general' },
    method: { type: String, enum: ['online', 'bank', 'upi', 'cash', 'cheque'], default: 'online' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created', index: true },
    orderId: { type: String, index: true },
    paymentId: { type: String, unique: true, sparse: true },
    reference: String,
    receiptNo: { type: String, unique: true, sparse: true },
    paidAt: Date,
  },
  { timestamps: true },
);

const certificateSchema = new Schema(
  {
    certNo: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['donation', 'membership', 'volunteer', 'participation', 'appreciation'], required: true },
    recipientName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 600 },
    donation: { type: Schema.Types.ObjectId, ref: 'Donation' },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const otpSchema = new Schema(
  {
    channel: { type: String, enum: ['email', 'phone'], required: true },
    target: { type: String, required: true, index: true },
    purpose: { type: String, enum: ['login', 'register', 'reset', 'admin'], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB TTL deletes it after this time
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 20 },
    topic: { type: String, required: true, maxlength: 60 },
    message: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: ['new', 'done'], default: 'new', index: true },
  },
  { timestamps: true },
);

const subscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    pan: String,
    address: String,
    amount: { type: Number, required: true }, // rupees per month
    programme: { type: String, enum: PROGRAMMES, default: 'general' },
    rzpId: { type: String, unique: true, sparse: true },
    planId: String,
    status: { type: String, enum: ['created', 'active', 'halted', 'cancelled', 'completed'], default: 'created', index: true },
    charges: { type: Number, default: 0 },
    lastChargedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

const membershipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberNo: { type: String, unique: true, sparse: true },
    fee: { type: Number, required: true },
    status: { type: String, enum: ['created', 'active', 'cancelled'], default: 'created', index: true },
    validFrom: Date,
    validTo: Date, // empty = lifetime
    method: { type: String, default: 'online' },
    orderId: { type: String, index: true },
    paymentId: { type: String, unique: true, sparse: true },
    reference: String,
    receiptNo: String,
    certNo: String,
  },
  { timestamps: true },
);

const postSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, maxlength: 300 },
    body: { type: String, maxlength: 20000 },
    programme: { type: String, enum: [...PROGRAMMES, ''], default: '' },
    link: String,
    published: { type: Boolean, default: false, index: true },
    publishedAt: Date,
  },
  { timestamps: true },
);

const settingSchema = new Schema({ _id: String, data: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true });

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const User = model('User', userSchema);
export const Donation = model('Donation', donationSchema);
export const Certificate = model('Certificate', certificateSchema);
export const Counter = model('Counter', counterSchema);
export const Otp = model('Otp', otpSchema);
export const Message = model('Message', messageSchema);
export const Subscription = model('Subscription', subscriptionSchema);
export const Membership = model('Membership', membershipSchema);
export const Post = model('Post', postSchema);
export const Setting = model('Setting', settingSchema);

export const financialYear = (date = new Date()) => {
  // Indian financial year runs April–March.
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
};

async function next(series, prefix, date) {
  const fy = financialYear(date);
  const c = await Counter.findOneAndUpdate({ _id: `${series}-${fy}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return `${prefix}/${fy}/${String(c.seq).padStart(5, '0')}`;
}
/** Donation receipts restart each financial year: PF/2026-27/00001. */
export const nextReceiptNo = (date = new Date()) => next('receipt', 'PF', date);
/** Membership fee receipts use their own series so they are never mistaken for 80G donation receipts. */
export const nextMembershipReceiptNo = (date = new Date()) => next('mreceipt', 'PFM', date);
export async function nextMemberNo() {
  const c = await Counter.findOneAndUpdate({ _id: 'member' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return `PFMEM-${String(c.seq).padStart(6, '0')}`;
}
