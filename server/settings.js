// Organisation settings (/api/settings) that the admin edits: registration numbers, signatory,
// bank details, membership fee and ecosystem links.
import { Router } from 'express';
import { Setting } from './models.js';
import { requireAdmin } from './auth.js';

/**
 * Organisation details the admin edits in the panel. Registration numbers start empty on purpose:
 * they must be typed in from the actual certificates, never guessed.
 */
export const DEFAULTS = {
  legalName: 'Pirento Foundation',
  legalForm: 'Section 8 company under the Companies Act, 2013',
  sponsor: 'Venturecore Solutions Private Limited',
  sponsorCin: 'U63121UP2023PTC188021',
  cin: '',
  pan: '',
  address: 'C/o Sanjay Kumar, Village Mudila, Post Sihari Sardaha, Bhanpur, Basti, Uttar Pradesh 272190',
  reg12A: '',
  reg80G: '', // 80G URN, e.g. as printed on Form 10AC
  reg80GValidity: '', // e.g. "AY 2026-27 to AY 2030-31"
  csr1: '',
  fcra: '',
  darpan: '',
  phone: '+91 9988556861',
  email: 'support@pirentofoundation.org',
  signatoryName: '',
  signatoryTitle: 'Authorised Signatory',
  bankDetails: '',
  fcraBankDetails: '',
  membershipFee: 1000,
  membershipMonths: 12, // 0 = lifetime
  pirentoUrl: 'https://pirento.com',
  pirentoOneUrl: 'https://pirento.com',
  bharatIdUrl: 'https://pirento.com',
};

const NUMBERS = ['membershipFee', 'membershipMonths'];
let cache;

export async function getSettings() {
  if (!cache) {
    const doc = await Setting.findById('site').lean();
    cache = { ...DEFAULTS, ...(doc?.data ?? {}) };
  }
  return cache;
}
export const clearSettingsCache = () => (cache = undefined);

/** Validates and saves the fields the admin sent. Returns an error string or the new settings. */
export async function saveSettings(input) {
  const data = {};
  for (const [k, def] of Object.entries(DEFAULTS)) {
    if (!(k in input)) continue;
    if (NUMBERS.includes(k)) {
      const n = Number(input[k]);
      if (!Number.isInteger(n) || n < 0 || n > 1_000_000) return `${k} must be a whole number.`;
      data[k] = n;
    } else {
      const v = String(input[k] ?? '').trim();
      if (v.length > 600) return `${k} is too long.`;
      if (k.endsWith('Url') && v && !/^https:\/\/[^\s]+$/.test(v)) return `${k} must start with https://`;
      data[k] = v;
    }
    if (typeof def === 'number' && k === 'membershipFee' && data[k] < 1)
      return 'Membership fee must be at least ₹1.';
  }
  const current = await getSettings();
  const merged = { ...current, ...data };
  await Setting.findByIdAndUpdate('site', { data: merged }, { upsert: true });
  cache = merged;
  return merged;
}

export const has80G = (s) => Boolean(s.reg80G && s.pan);

const router = Router();
router.get('/', async (_req, res) => res.json({ settings: await getSettings() }));
router.put('/', requireAdmin, async (req, res) => {
  const r = await saveSettings(req.body ?? {});
  if (typeof r === 'string') return res.status(400).json({ error: r });
  res.json({ settings: r });
});
export default router;
