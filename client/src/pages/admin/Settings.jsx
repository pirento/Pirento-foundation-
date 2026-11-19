// Admin: organisation details used on receipts, certificates and the website.

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useSettings } from '../../lib/settings.jsx';

const SETTING_GROUPS = [
  [
    'Registrations (shown on receipts, certificates and the website)',
    [
      ['cin', 'Foundation CIN (Section 8)'],
      ['pan', 'Foundation PAN'],
      ['reg12A', '12A registration no.'],
      ['reg80G', '80G URN'],
      ['reg80GValidity', '80G validity (e.g. AY 2026-27 to AY 2030-31)'],
      ['csr1', 'CSR-1 registration no.'],
      ['fcra', 'FCRA registration no.'],
      ['darpan', 'NGO Darpan ID'],
    ],
  ],
  [
    'Organisation',
    [
      ['legalName', 'Legal name'],
      ['address', 'Registered address'],
      ['phone', 'Phone'],
      ['email', 'Email'],
      ['signatoryName', 'Signatory name'],
      ['signatoryTitle', 'Signatory title'],
    ],
  ],
  [
    'Payments',
    [
      ['bankDetails', 'Bank details for Indian donors'],
      ['fcraBankDetails', 'FCRA bank account (foreign contributions)'],
    ],
  ],
  [
    'Membership',
    [
      ['membershipFee', 'Membership fee (₹)'],
      ['membershipMonths', 'Validity in months (0 = lifetime)'],
    ],
  ],
  [
    'Pirento ecosystem links',
    [
      ['pirentoUrl', 'pirento.com'],
      ['bharatIdUrl', 'Bharat ID by Pirento (where members create their ID)'],
      ['pirentoOneUrl', 'Pirento One (partner sign-up)'],
    ],
  ],
];

export default function SettingsPanel() {
  useTitle('Settings', 'Admin');
  const current = useSettings();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState(null);
  useEffect(() => void (current.legalName && !f && setF(current)), [current, f]);
  if (!f) return <p className="text-muted">Loading…</p>;
  const save = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/settings', { method: 'PUT', body: f });
      current.setSettings(r.settings);
      setMsg({ ok: 'Saved. Receipts, certificates and the website now use these details.' });
    } catch (err) {
      setMsg({ error: err.message });
    }
  };
  return (
    <>
      <PageTitle sub="Type registration numbers exactly as printed on your certificates. Empty fields are simply not shown.">
        Settings
      </PageTitle>
      <form onSubmit={save} className="space-y-10">
        {SETTING_GROUPS.map(([title, fields]) => (
          <fieldset key={title} className="rounded-[22px] border border-rule p-6 md:p-8">
            <legend className="px-2 text-lg font-medium">{title}</legend>
            <div className="mt-2 grid gap-5 sm:grid-cols-2">
              {fields.map(([k, label]) =>
                ['bankDetails', 'fcraBankDetails', 'address'].includes(k) ? (
                  <Field key={k} label={label} id={k}>
                    <textarea
                      id={k}
                      rows={3}
                      className="input"
                      value={f[k] ?? ''}
                      onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    />
                  </Field>
                ) : (
                  <Field
                    key={k}
                    label={label}
                    name={k}
                    inputMode={typeof f[k] === 'number' ? 'numeric' : undefined}
                    value={f[k] ?? ''}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  />
                ),
              )}
            </div>
          </fieldset>
        ))}
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <Button type="submit" variant="accent" icon={SettingsIcon}>
          Save settings
        </Button>
      </form>
    </>
  );
}

/* ---------- shell ---------- */
