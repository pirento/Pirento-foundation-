import PDFDocument from 'pdfkit';

const C = { paper: '#fff0d5', ink: '#072f52', muted: '#3f5a74', rule: '#e5cfa6', accent: '#f5e500', stone: '#f8e2b8', brand: '#07518a', white: '#fffdf8' };

export const PROGRAMME_NAMES = {
  general: 'where it is needed most',
  green: 'Pirento Green (environment)',
  food: 'Food security and emergency relief',
  education: 'Pirento Education',
  health: 'Health, livelihood and community welfare',
};
const programmeName = (p) => PROGRAMME_NAMES[p] ?? p;
const inr = (n) => `INR ${Number(n).toLocaleString('en-IN')}`;
const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

/* ---------- amount in words (Indian system) ---------- */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const three = (n) => [n >= 100 && `${ONES[Math.floor(n / 100)]} Hundred`, n % 100 && two(n % 100)].filter(Boolean).join(' ');
export function amountInWords(n) {
  n = Math.floor(Number(n));
  if (!n) return 'Rupees Zero Only';
  const parts = [];
  for (const [size, name] of [[1e7, 'Crore'], [1e5, 'Lakh'], [1e3, 'Thousand']]) {
    if (n >= size) {
      parts.push(`${three(Math.floor(n / size))} ${name}`);
      n %= size;
    }
  }
  if (n) parts.push(three(n));
  return `Rupees ${parts.join(' ')} Only`;
}

/** One-line legal footer built from the admin's settings; only numbers that were filled in are shown. */
export function legalLine(s) {
  const regs = [
    s.cin && `CIN ${s.cin}`,
    s.pan && `PAN ${s.pan}`,
    s.reg12A && `12A ${s.reg12A}`,
    s.reg80G && `80G ${s.reg80G}`,
    s.csr1 && `CSR-1 ${s.csr1}`,
    s.fcra && `FCRA ${s.fcra}`,
  ].filter(Boolean);
  return `${s.legalName} is a ${s.legalForm}, sponsored by ${s.sponsor} (CIN ${s.sponsorCin}).${regs.length ? ' ' + regs.join(' · ') + '.' : ''} ${s.address}.`;
}

function frame(doc) {
  const W = doc.page.width;
  const H = doc.page.height;
  doc.rect(0, 0, W, H).fill(C.paper);
  doc.save().lineWidth(0.4).strokeColor(C.rule).opacity(0.5);
  for (let x = 36; x < W; x += 36) doc.moveTo(x, 0).lineTo(x, H);
  for (let y = 36; y < H; y += 36) doc.moveTo(0, y).lineTo(W, y);
  doc.stroke().restore();
  doc.roundedRect(24, 24, W - 48, H - 48, 16).lineWidth(1).stroke(C.ink);
  doc.rect(0, 0, 14, H).fill(C.brand);
  doc.roundedRect(64, 60, 12, 12, 3).fillAndStroke(C.accent, C.ink);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(13).text('PIRENTO FOUNDATION', 86, 60, { characterSpacing: 1 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text('People. Planet. Possibility.', 86, 76);
  return { W, H };
}

/** A4-landscape certificate (donation, membership, volunteer, …). */
export function renderCertificate(cert, { donation, membership, user, settings, verifyUrl }, out) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: cert.title, Author: 'Pirento Foundation' } });
  doc.pipe(out);
  const { W, H } = frame(doc);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`No. ${cert.certNo}`, W - 300, 62, { width: 236, align: 'right' });

  const side = donation || membership;
  doc.fillColor(C.muted).fontSize(10).text(cert.kind.toUpperCase() + '  ·  CERTIFICATE', 64, 140, { characterSpacing: 2 });
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(side ? 30 : 36).text(cert.title, 64, 160, { width: side ? W - 400 : W - 128 });

  const y0 = doc.y + 18;
  doc.fillColor(C.muted).font('Helvetica').fontSize(12).text('Presented to', 64, y0);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(30).text(cert.recipientName, 64, y0 + 18, { width: side ? W - 400 : W - 128 });
  const ny = doc.y + 4;
  doc.rect(64, ny, Math.min(doc.widthOfString(cert.recipientName), W - 400), 3).fill(C.accent);

  let body = cert.body || '';
  if (donation) body ||= `With gratitude for your contribution of ${inr(donation.amount)} towards ${programmeName(donation.programme)}.`;
  if (membership)
    body ||= 'is a member of Pirento Foundation and stands with our work for people, planet and possibility. This is a supporter membership; it does not confer shares or voting rights in the company.';
  doc.fillColor(C.muted).font('Helvetica').fontSize(12.5).text(body, 64, ny + 20, { width: side ? W - 420 : W - 128, lineGap: 4 });

  let rows = [];
  if (donation)
    rows = [
      ['Receipt no.', donation.receiptNo],
      ['Amount', inr(donation.amount)],
      ['Mode', donation.method === 'online' ? `Online · ${donation.paymentId ?? ''}` : donation.method.toUpperCase()],
      ['Date', date(donation.paidAt ?? donation.createdAt)],
    ];
  if (membership)
    rows = [
      ['Member no.', membership.memberNo],
      ['Member since', date(membership.validFrom)],
      ['Valid until', membership.validTo ? date(membership.validTo) : 'Lifetime'],
      ...(user?.bharatId?.number ? [['Bharat ID by Pirento', user.bharatId.number]] : []),
    ];
  if (rows.length) {
    let ry = 150;
    doc.roundedRect(W - 290, ry - 14, 226, rows.length * 32 + 20, 10).fill(C.stone);
    for (const [k, v] of rows) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text(k.toUpperCase(), W - 274, ry, { characterSpacing: 1 });
      doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(11).text(String(v ?? '-'), W - 274, ry + 11, { width: 196 });
      ry += 32;
    }
  }

  const fy = H - 150;
  doc.moveTo(64, fy).lineTo(244, fy).lineWidth(0.8).stroke(C.ink);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10).text(settings.signatoryName || settings.signatoryTitle, 64, fy + 8);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(settings.signatoryName ? `${settings.signatoryTitle}, Pirento Foundation` : 'Pirento Foundation', 64, fy + 22);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10).text(`Issued ${date(cert.createdAt)}`, 300, fy + 8);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`Verify at ${verifyUrl}`, 300, fy + 22, { width: W - 364, link: verifyUrl });
  doc.fillColor(C.muted).fontSize(7.5).text(legalLine(settings), 64, H - 80, { width: W - 128, lineGap: 2 });
  doc.end();
}

/**
 * A4-portrait receipt. kind 'donation' carries the section 80G(5) particulars when the 80G number and PAN are set;
 * kind 'membership' is a plain fee receipt (membership fees are not 80G-eligible).
 */
export function renderReceipt(kind, r, settings, out) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Receipt ${r.receiptNo}`, Author: 'Pirento Foundation' } });
  doc.pipe(out);
  const { W } = frame(doc);
  const is80G = kind === 'donation' && Boolean(settings.reg80G && settings.pan);
  const title = kind === 'membership' ? 'Membership Fee Receipt' : is80G ? 'Donation Receipt under Section 80G' : 'Donation Receipt';
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(24).text(title, 64, 120, { width: W - 128 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(9.5).text(`Receipt no. ${r.receiptNo}   ·   Date ${date(r.paidAt ?? r.validFrom ?? r.createdAt)}`, 64, doc.y + 6);

  const box = (label, rows, y) => {
    doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text(label.toUpperCase(), 64, y, { characterSpacing: 1.5 });
    y += 16;
    const vw = W - 315;
    doc.font('Helvetica-Bold').fontSize(9.5);
    // Each row grows to fit its value (long addresses wrap instead of being cut).
    const heights = rows.map(([, v]) => Math.max(14, doc.heightOfString(String(v || '—'), { width: vw })) + 8);
    const h = heights.reduce((a, b) => a + b, 0) + 12;
    doc.roundedRect(64, y, W - 128, h, 10).fill(C.white);
    doc.roundedRect(64, y, W - 128, h, 10).lineWidth(0.6).stroke(C.rule);
    let yy = y + 10;
    rows.forEach(([k, v], i) => {
      doc.fillColor(C.muted).font('Helvetica').fontSize(9.5).text(k, 80, yy, { width: 150 });
      doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(9.5).text(String(v || '—'), 235, yy, { width: vw });
      yy += heights[i];
    });
    return y + h + 16;
  };

  let y = doc.y + 24;
  y = box('Received by', [
    ['Name', settings.legalName],
    ['Address', settings.address],
    ['PAN', settings.pan],
    ...(kind === 'donation'
      ? [
          ['80G registration', settings.reg80G ? `${settings.reg80G}${settings.reg80GValidity ? ` (valid ${settings.reg80GValidity})` : ''}` : 'Not configured'],
          ['12A registration', settings.reg12A],
        ]
      : [['CIN', settings.cin]]),
  ], y);
  y = box(kind === 'membership' ? 'Member' : 'Donor', [
    ['Name', r.name],
    ['Address', r.address],
    ['PAN', r.pan],
    ['Email', r.email],
    ...(kind === 'membership' ? [['Member no.', r.memberNo]] : []),
  ], y);
  y = box('Payment', [
    ['Amount', inr(r.amount)],
    ['In words', amountInWords(r.amount)],
    ['Mode', r.method === 'online' ? `Online (Razorpay) · ${r.paymentId ?? ''}` : String(r.method || '').toUpperCase()],
    ...(r.reference ? [['Reference', r.reference]] : []),
    kind === 'donation' ? ['Purpose', `Donation · ${programmeName(r.programme)}`] : ['Purpose', `Membership fee${r.validTo ? `, valid until ${date(r.validTo)}` : ' (lifetime)'}`],
  ], y);

  const notes =
    kind === 'membership'
      ? ['This is a receipt for a supporter membership fee. It is not a donation receipt and is not eligible for deduction under section 80G.']
      : is80G
        ? [
            'This donation is eligible for deduction under section 80G of the Income-tax Act, 1961, subject to the conditions and limits of that section.',
            'Cash donations above INR 2,000 are not eligible for deduction. A donor PAN is needed for the donation to be reported to the Income Tax Department.',
            'The Foundation reports donations in Form 10BD; the certificate in Form 10BE issued after that filing is the document to use when claiming the deduction.',
          ]
        : ['80G registration details have not been entered by the Foundation yet, so this receipt does not carry 80G particulars.'];
  doc.fillColor(C.muted).font('Helvetica').fontSize(8.5);
  doc.y = y;
  for (const n of notes) doc.text(`•  ${n}`, 64, doc.y + 3, { width: W - 128, lineGap: 2 });

  const sy = Math.max(doc.y + 36, 690);
  doc.moveTo(64, sy).lineTo(244, sy).lineWidth(0.8).stroke(C.ink);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10).text(settings.signatoryName || settings.signatoryTitle, 64, sy + 8);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`${settings.signatoryName ? settings.signatoryTitle + ', ' : ''}${settings.legalName}`, 64, sy + 22);
  doc.fillColor(C.muted).fontSize(8).text('This is a computer-generated receipt.', 300, sy + 22, { width: W - 364, align: 'right' });
  doc.fillColor(C.muted).fontSize(7.5).text(legalLine(settings), 64, 776, { width: W - 128, lineGap: 2 });
  doc.end();
}
