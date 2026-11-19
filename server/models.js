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
    amount: { type: Number, required: true, min: 1 }, // whole rupees
    programme: { type: String, enum: PROGRAMMES, default: 'general' },
    method: { type: String, enum: ['online', 'bank', 'upi', 'cash', 'cheque'], default: 'online' },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
    orderId: { type: String, index: true },
    paymentId: String,
    reference: String,
    receiptNo: { type: String, unique: true, sparse: true },
    paidAt: Date,
  },
  { timestamps: true },
);

const certificateSchema = new Schema(
  {
    certNo: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['donation', 'volunteer', 'participation', 'appreciation'], required: true },
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

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const User = model('User', userSchema);
export const Donation = model('Donation', donationSchema);
export const Certificate = model('Certificate', certificateSchema);
export const Counter = model('Counter', counterSchema);
export const Otp = model('Otp', otpSchema);
export const Message = model('Message', messageSchema);

export async function nextReceiptNo(date = new Date()) {
  // Indian financial year runs April–March, so receipts restart each FY.
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const fy = `${y}-${String(y + 1).slice(2)}`;
  const c = await Counter.findOneAndUpdate({ _id: `receipt-${fy}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return `PF/${fy}/${String(c.seq).padStart(5, '0')}`;
}
