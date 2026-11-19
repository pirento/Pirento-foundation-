import nodemailer from 'nodemailer';

export const SUPPORT_EMAIL = () => process.env.SUPPORT_EMAIL || 'support@pirentofoundation.org';
export const siteUrl = () => (process.env.SITE_URL || 'https://pirentofoundation.org').replace(/\/$/, '');
export const canEmail = () => Boolean(process.env.SMTP_HOST);

let transport;
/** Sends one email. Without SMTP (development) it only logs the subject. Throws on SMTP errors. */
export async function sendMail({ to, subject, html, text, replyTo }) {
  if (!canEmail()) {
    console.log(`[mail:dev] to=${to} subject="${subject}"`);
    return false;
  }
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: process.env.MAIL_FROM || `Pirento Foundation <${SUPPORT_EMAIL()}>`, to, subject, html, text, replyTo: replyTo || SUPPORT_EMAIL() });
  return true;
}

/** Fire-and-forget: a failed notification must never fail the payment or form that triggered it. */
export const notify = (mail) => sendMail(mail).catch((e) => console.error('Email failed:', mail.subject, e.message));

/* ---------- HTML templates (table layout + inline styles, so Gmail/Outlook render them) ---------- */

const C = { blue: '#07518A', creme: '#FFF0D5', yellow: '#F5E500', ink: '#072F52', muted: '#3F5A74', rule: '#E5CFA6', white: '#FFFDF8' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function layout({ preheader, title, body, cta }) {
  const font = "font-family:Arial,Helvetica,sans-serif;";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.creme};${font}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.creme};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td style="background:${C.blue};border-radius:20px 20px 0 0;padding:28px 32px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="width:12px;height:12px;background:${C.yellow};border:1px solid ${C.creme};border-radius:3px"></td>
      <td style="padding-left:10px;${font}font-size:14px;font-weight:bold;letter-spacing:1px;color:${C.creme}">PIRENTO FOUNDATION</td>
    </tr></table>
    <h1 style="margin:22px 0 0;${font}font-size:28px;line-height:1.15;color:${C.creme};font-weight:bold">${title}</h1>
  </td></tr>
  <tr><td style="background:${C.white};padding:28px 32px;${font}font-size:16px;line-height:1.6;color:${C.ink};border-left:1px solid ${C.rule};border-right:1px solid ${C.rule}">
    ${body}
    ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:${C.yellow};border-radius:999px"><a href="${esc(cta.href)}" style="display:inline-block;padding:14px 26px;${font}font-size:15px;font-weight:bold;color:${C.ink};text-decoration:none">${esc(cta.label)} &rarr;</a></td></tr></table>` : ''}
  </td></tr>
  <tr><td style="background:${C.white};border:1px solid ${C.rule};border-top:none;border-radius:0 0 20px 20px;padding:20px 32px;${font}font-size:12px;line-height:1.6;color:${C.muted}">
    People. Planet. Possibility.<br>
    Questions? Write to <a href="mailto:${SUPPORT_EMAIL()}" style="color:${C.blue}">${SUPPORT_EMAIL()}</a> · <a href="${siteUrl()}" style="color:${C.blue}">${siteUrl().replace(/^https?:\/\//, '')}</a><br>
    Pirento Foundation is a proposed Section 8 company sponsored by Venturecore Solutions Private Limited (CIN U63121UP2023PTC188021). Registration is pending; donations are not yet eligible for 80G tax exemption.
  </td></tr>
</table></td></tr></table></body></html>`;
}

const p = (t) => `<p style="margin:0 0 14px">${t}</p>`;
const rows = (pairs) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;background:${C.creme};border-radius:14px">${pairs
    .map(([k, v]) => `<tr><td style="padding:10px 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};width:40%">${esc(k)}</td><td style="padding:10px 16px;font-size:15px;font-weight:bold;color:${C.ink}">${esc(v)}</td></tr>`)
    .join('')}</table>`;

const PURPOSE = { login: 'sign in', register: 'verify your email', reset: 'reset your password', admin: 'finish signing in to the admin desk' };

export const templates = {
  otp: (code, purpose) => ({
    subject: `${code} is your Pirento Foundation code`,
    text: `Your code to ${PURPOSE[purpose]} is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
    html: layout({
      preheader: `Your code is ${code}`,
      title: 'Your verification code',
      body:
        p(`Use this code to ${PURPOSE[purpose]}:`) +
        `<p style="margin:6px 0 18px;font-size:36px;font-weight:bold;letter-spacing:10px;color:${C.blue};font-family:'Courier New',monospace">${esc(code)}</p>` +
        p(`It expires in 10 minutes. We will never ask you for this code. If you did not request it, you can ignore this email.`),
    }),
  }),

  welcome: (user) => ({
    subject: 'Welcome to Pirento Foundation',
    text: `Hi ${user.name}, your account is ready. Your donation receipts and certificates will appear in your dashboard: ${siteUrl()}/dashboard`,
    html: layout({
      preheader: 'Your account is ready.',
      title: `Welcome, ${esc(user.name.split(' ')[0])}.`,
      body: p('Your account is ready. Every receipt and certificate we issue to you will be kept in your dashboard, ready to download any time.') + p('Thank you for standing with people, planet and possibility.'),
      cta: { label: 'Open my dashboard', href: `${siteUrl()}/dashboard` },
    }),
  }),

  receipt: (d, certNo, programme) => ({
    subject: `Receipt ${d.receiptNo}: thank you for your gift of ${inr(d.amount)}`,
    text: `Thank you, ${d.name}. We received ${inr(d.amount)} for ${programme}. Receipt ${d.receiptNo}. Certificate: ${siteUrl()}/api/certificates/${certNo}/pdf`,
    html: layout({
      preheader: `We received ${inr(d.amount)}. Receipt ${d.receiptNo}.`,
      title: `Thank you, ${esc(d.name.split(' ')[0])}.`,
      body:
        p(`We have received your donation. Here are the details for your records:`) +
        rows([
          ['Receipt no.', d.receiptNo],
          ['Amount', inr(d.amount)],
          ['For', programme],
          ['Mode', d.method === 'online' ? `Online (${d.paymentId ?? ''})` : d.method.toUpperCase()],
          ['Date', new Date(d.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
          ...(d.pan ? [['PAN', d.pan]] : []),
        ]) +
        p(`<span style="font-size:13px;color:${C.muted}">Certificate no. ${esc(certNo)}. Anyone can verify it at ${siteUrl()}/verify. This acknowledgement is not an 80G tax-exemption receipt.</span>`),
      cta: { label: 'Download certificate (PDF)', href: `${siteUrl()}/api/certificates/${certNo}/pdf` },
    }),
  }),

  certificate: (c) => ({
    subject: `Your certificate: ${c.title}`,
    text: `Hi ${c.recipientName}, Pirento Foundation has issued you a certificate: ${c.title}. Download: ${siteUrl()}/api/certificates/${c.certNo}/pdf`,
    html: layout({
      preheader: c.title,
      title: 'A certificate for you',
      body:
        p(`Hi ${esc(c.recipientName)}, thank you. We have issued you a certificate:`) +
        rows([['Title', c.title], ['Certificate no.', c.certNo]]) +
        p(`<span style="font-size:13px;color:${C.muted}">Anyone can check it is genuine at ${siteUrl()}/verify/${esc(c.certNo)}.</span>`),
      cta: { label: 'Download certificate (PDF)', href: `${siteUrl()}/api/certificates/${c.certNo}/pdf` },
    }),
  }),

  contactAck: (m) => ({
    subject: 'We received your message',
    text: `Hi ${m.name}, thank you for writing to Pirento Foundation about "${m.topic}". We usually reply within 3 working days.`,
    html: layout({
      preheader: 'We usually reply within 3 working days.',
      title: 'Message received.',
      body: p(`Hi ${esc(m.name)}, thank you for writing to us about <strong>${esc(m.topic)}</strong>. A member of our team will reply within 3 working days.`) + p(`<span style="font-size:13px;color:${C.muted}">Reference: ${esc(String(m._id).slice(-8).toUpperCase())}</span>`),
    }),
  }),

  contactAdmin: (m) => ({
    subject: `[Website] ${m.topic}: ${m.name}`,
    text: `${m.name} <${m.email}>${m.phone ? `, ${m.phone}` : ''}\nTopic: ${m.topic}\n\n${m.message}`,
    html: layout({
      preheader: `${m.name} wrote about ${m.topic}`,
      title: 'New website message',
      body: rows([['From', m.name], ['Email', m.email], ...(m.phone ? [['Phone', m.phone]] : []), ['Topic', m.topic]]) + `<p style="margin:14px 0 0;white-space:pre-wrap">${esc(m.message)}</p>`,
      cta: { label: 'Open admin inbox', href: `${siteUrl()}/admin/messages` },
    }),
  }),
};
