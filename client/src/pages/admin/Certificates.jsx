// Admin: issue volunteer/participation/appreciation certificates and revoke or restore any certificate.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CertRow } from '../../components/CertRow.jsx';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Certificates() {
  useTitle('Certificates', 'Admin');
  const [d, reload] = useLoad('/admin/certificates');
  const titles = {
    volunteer: 'Certificate of Volunteering',
    participation: 'Certificate of Participation',
    appreciation: 'Certificate of Appreciation',
  };
  const empty = { kind: 'volunteer', recipientName: '', email: '', title: titles.volunteer, body: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function issue(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/certificates', { method: 'POST', body: f });
      setMsg({ ok: `Issued ${r.certificate.certNo}${r.certificate.email ? ' and emailed it' : ''}.` });
      setF(empty);
      reload();
    } catch (err) {
      setMsg({ error: err.message });
    }
  }
  async function toggle(c) {
    if (!c.revoked && !confirm(`Revoke ${c.certNo}? Anyone verifying it will see it as revoked.`)) return;
    await api(`/admin/certificates/${c._id}`, { method: 'PATCH', body: { revoked: !c.revoked } });
    reload();
  }

  return (
    <>
      <PageTitle sub="Donation certificates are issued automatically. Issue the others here.">
        Certificates
      </PageTitle>
      <div className="space-y-12">
        <form onSubmit={issue} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Issue a certificate</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type" id="kind" required>
              <select
                id="kind"
                className="input"
                value={f.kind}
                onChange={(e) => setF((x) => ({ ...x, kind: e.target.value, title: titles[e.target.value] }))}
              >
                <option value="volunteer">Volunteer</option>
                <option value="participation">Participation</option>
                <option value="appreciation">Appreciation</option>
              </select>
            </Field>
            <Field label="Title" name="title" required value={f.title} onChange={set('title')} />
            <Field
              label="Recipient name"
              name="recipientName"
              required
              value={f.recipientName}
              onChange={set('recipientName')}
            />
            <Field
              label="Recipient email"
              name="email"
              type="email"
              value={f.email}
              onChange={set('email')}
              hint="We email the certificate and show it in their account."
            />
          </div>
          <Field label="Citation" id="body">
            <textarea
              id="body"
              rows={3}
              maxLength={600}
              className="input"
              value={f.body}
              onChange={set('body')}
              placeholder="e.g. For volunteering at the Pirento Green pilot plantation, Basti, July 2026."
            />
          </Field>
          {msg?.error && <Notice kind="error">{msg.error}</Notice>}
          {msg?.ok && <Notice>{msg.ok}</Notice>}
          <Button type="submit" variant="accent" icon={Plus}>
            Issue certificate
          </Button>
        </form>
        <div>
          <h2 className="text-2xl">All certificates</h2>
          {d?.error && <Notice kind="error">{d.error}</Notice>}
          <ul className="mt-4 border-t border-rule">
            {d?.certificates?.map((c) => (
              <CertRow key={c._id} c={c}>
                <button
                  onClick={() => toggle(c)}
                  className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink"
                >
                  {c.revoked ? 'Restore' : 'Revoke'}
                </button>
              </CertRow>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
