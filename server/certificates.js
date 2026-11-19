import { Router } from 'express';
import crypto from 'node:crypto';
import { Certificate, Donation, User } from './models.js';
import { renderCertificate } from './pdf.js';
import { requireUser } from './auth.js';
import { siteUrl } from './mail.js';

// 16 hex chars = 64 bits: the number doubles as an unguessable link to the PDF.
export const newCertNo = () => `PFC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;


export async function issueCertificate(fields) {
  if (!fields.user && fields.email) fields.user = (await User.findOne({ email: fields.email.toLowerCase() }))?._id;
  return Certificate.create({ certNo: newCertNo(), ...fields });
}

export const certFromDonation = (d) =>
  issueCertificate({
    kind: 'donation',
    recipientName: d.name,
    email: d.email,
    user: d.user,
    title: 'Donation Acknowledgement',
    donation: d._id,
  });

/** Records belong to a user by id, or by email once that email is verified (covers gifts made before signing up). */
export const mineFilter = (u) => [{ user: u._id }, ...(u.emailVerified ? [{ email: u.email }] : [])];

const router = Router();
const validNo = (no) => /^PFC-[0-9A-F]{16}$/.test(no);

router.get('/mine', requireUser, async (req, res) => {
  res.json({ certificates: await Certificate.find({ $or: mineFilter(req.user) }).sort({ createdAt: -1 }).lean() });
});

router.get('/verify/:certNo', async (req, res) => {
  const c = validNo(req.params.certNo) ? await Certificate.findOne({ certNo: req.params.certNo }).lean() : null;
  if (!c) return res.status(404).json({ error: 'No certificate found with this number.' });
  res.json({
    certificate: { certNo: c.certNo, kind: c.kind, title: c.title, recipientName: c.recipientName, issuedAt: c.createdAt, revoked: c.revoked },
  });
});

router.get('/:certNo/pdf', async (req, res) => {
  const c = validNo(req.params.certNo) ? await Certificate.findOne({ certNo: req.params.certNo }) : null;
  if (!c) return res.status(404).json({ error: 'Certificate not found.' });
  if (c.revoked) return res.status(410).json({ error: 'This certificate has been revoked.' });
  const donation = c.donation ? await Donation.findById(c.donation) : null;
  res.type('application/pdf').set('Content-Disposition', `inline; filename="${c.certNo}.pdf"`);
  renderCertificate(c, donation, `${siteUrl()}/verify/${c.certNo}`, res);
});

export default router;
