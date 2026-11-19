import PDFDocument from 'pdfkit';

const C = { paper: '#f1f3f0', ink: '#0f2620', muted: '#56665f', rule: '#cbd6cf', accent: '#f2b33d', stone: '#e2e8e3' };
const LEGAL =
  'Pirento Foundation is a proposed Section 8 company sponsored by Venturecore Solutions Private Limited ' +
  '(CIN U63121UP2023PTC188021). Registration is pending. This document is not a tax-exemption (80G) receipt.';

const inr = (n) => `INR ${Number(n).toLocaleString('en-IN')}`;
const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

/** Streams an A4-landscape certificate PDF into `out` (an HTTP response or any writable). */
export function renderCertificate(cert, donation, verifyUrl, out) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: cert.title, Author: 'Pirento Foundation' } });
  doc.pipe(out);
  const W = doc.page.width;
  const H = doc.page.height;

  doc.rect(0, 0, W, H).fill(C.paper);
  // Faint 36pt grid, echoing the site's hero grid.
  doc.save().lineWidth(0.4).strokeColor(C.rule).opacity(0.5);
  for (let x = 36; x < W; x += 36) doc.moveTo(x, 0).lineTo(x, H);
  for (let y = 36; y < H; y += 36) doc.moveTo(0, y).lineTo(W, y);
  doc.stroke().restore();
  doc.roundedRect(24, 24, W - 48, H - 48, 16).lineWidth(1).stroke(C.ink);
  doc.rect(0, 0, 14, H).fill(C.ink);

  // Brand mark: accent square with ink ring + wordmark.
  doc.roundedRect(64, 60, 12, 12, 3).fillAndStroke(C.accent, C.ink);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(13).text('PIRENTO FOUNDATION', 86, 60, { characterSpacing: 1 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text('People. Planet. Possibility.', 86, 76);
  doc.fillColor(C.muted).fontSize(9).text(`No. ${cert.certNo}`, W - 300, 62, { width: 236, align: 'right' });

  doc.fillColor(C.muted).fontSize(10).text(cert.kind.toUpperCase() + '  ·  CERTIFICATE', 64, 140, { characterSpacing: 2 });
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(donation ? 30 : 36).text(cert.title, 64, 160, { width: donation ? W - 400 : W - 128 });

  const y0 = doc.y + 18;
  doc.fillColor(C.muted).font('Helvetica').fontSize(12).text('Presented to', 64, y0);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(30).text(cert.recipientName, 64, y0 + 18, { width: W - 128 });
  const ny = doc.y + 4;
  doc.rect(64, ny, Math.min(doc.widthOfString(cert.recipientName), W - 128), 3).fill(C.accent);

  let body = cert.body || '';
  if (donation)
    body ||= `With gratitude for your contribution of ${inr(donation.amount)} towards ${programmeName(donation.programme)}.`;
  doc.fillColor(C.muted).font('Helvetica').fontSize(12.5).text(body, 64, ny + 20, { width: 520, lineGap: 4 });

  if (donation) {
    const rows = [
      ['Receipt no.', donation.receiptNo],
      ['Amount', inr(donation.amount)],
      ['Mode', donation.method === 'online' ? `Online · ${donation.paymentId ?? ''}` : donation.method.toUpperCase()],
      ['Date', date(donation.paidAt ?? donation.createdAt)],
    ];
    if (donation.pan) rows.push(['Donor PAN', donation.pan]);
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
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10).text('Authorised signatory', 64, fy + 8);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text('Pirento Foundation', 64, fy + 22);
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10).text(`Issued ${date(cert.createdAt)}`, 300, fy + 8);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`Verify at ${verifyUrl}`, 300, fy + 22, { width: W - 364, link: verifyUrl });
  doc.fillColor(C.muted).fontSize(7.5).text(LEGAL, 64, H - 78, { width: W - 128, lineGap: 2 });

  doc.end();
}

export const PROGRAMME_NAMES = {
  general: 'where it is needed most',
  green: 'Pirento Green (environment)',
  food: 'Food security and emergency relief',
  education: 'Pirento Education',
  health: 'Health, livelihood and community welfare',
};
const programmeName = (p) => PROGRAMME_NAMES[p] ?? p;
