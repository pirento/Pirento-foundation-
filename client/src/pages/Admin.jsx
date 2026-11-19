import { useCallback, useEffect, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Field, Label, Notice } from '../components/ui.jsx';
import { api, fmtDate, inr, pdfUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { donateOptions } from '../data/site.js';
import { CertRow } from './Dashboard.jsx';

const tabs = ['Overview', 'Donations', 'Certificates', 'Users'];
const programmeLabel = (k) => donateOptions.find((o) => o.key === k)?.label ?? k;

function useLoad(path) {
  const [data, setData] = useState(null);
  const reload = useCallback(() => api(path).then(setData, (e) => setData({ error: e.message })), [path]);
  useEffect(() => void reload(), [reload]);
  return [data, reload];
}

function Overview() {
  const [s] = useLoad('/admin/stats');
  if (!s) return <p className="text-muted">Loading…</p>;
  if (s.error) return <Notice kind="error">{s.error}</Notice>;
  return (
    <>
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {[['Raised (paid)', inr(s.raised)], ['Donations', s.donations], ['Unique donors', s.donors], ['Valid certificates', s.certificates]].map(([k, v]) => (
          <div key={k} className="bg-paper p-7"><dt className="eyebrow">{k}</dt><dd className="big-num mt-3">{v}</dd></div>
        ))}
      </dl>
      <h2 className="mt-14 text-2xl">By programme</h2>
      <ul className="mt-4 border-t border-rule">
        {donateOptions.map((o) => {
          const row = s.byProgramme.find((b) => b._id === o.key);
          const pct = s.raised ? Math.round(((row?.raised ?? 0) / s.raised) * 100) : 0;
          return (
            <li key={o.key} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-b border-rule py-4 sm:grid-cols-[14rem_1fr_8rem]">
              <span>{o.label}</span>
              <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-stone sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right tabular-nums">{inr(row?.raised)} <span className="text-xs text-muted">({row?.count ?? 0})</span></span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function OfflineDonation({ onDone }) {
  const empty = { name: '', email: '', phone: '', pan: '', amount: '', programme: 'general', method: 'bank', reference: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/donations', { method: 'POST', body: { ...f, amount: Number(f.amount) } });
      setMsg({ ok: `Recorded ${r.donation.receiptNo}. Certificate ${r.certNo} issued.`, certNo: r.certNo });
      setF(empty);
      onDone();
    } catch (err) {
      setMsg({ error: err.message });
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
      <h2 className="text-2xl">Record an offline donation</h2>
      <p className="text-sm text-muted">For bank transfer, UPI, cash or cheque. A receipt number and certificate are generated automatically.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Donor name" name="name" required value={f.name} onChange={set('name')} />
        <Field label="Email" name="email" type="email" required value={f.email} onChange={set('email')} />
        <Field label="Amount (₹)" name="amount" inputMode="numeric" required value={f.amount} onChange={set('amount')} />
        <Field label="Mode" id="method" required>
          <select id="method" className="input" value={f.method} onChange={set('method')}>
            {[['bank', 'Bank transfer'], ['upi', 'UPI'], ['cash', 'Cash'], ['cheque', 'Cheque']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Programme" id="programme" required>
          <select id="programme" className="input" value={f.programme} onChange={set('programme')}>
            {donateOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Reference / UTR" name="reference" value={f.reference} onChange={set('reference')} />
        <Field label="Phone" name="phone" value={f.phone} onChange={set('phone')} />
        <Field label="PAN" name="pan" maxLength={10} value={f.pan} onChange={set('pan')} />
      </div>
      {msg?.error && <Notice kind="error">{msg.error}</Notice>}
      {msg?.ok && <Notice>{msg.ok} <a className="underline" href={pdfUrl(msg.certNo)} target="_blank" rel="noopener noreferrer">View PDF (opens in a new tab)</a></Notice>}
      <Button type="submit" variant="accent" icon={Plus}>Record donation</Button>
    </form>
  );
}

function Donations() {
  const [status, setStatus] = useState('paid');
  const [d, reload] = useLoad(`/admin/donations${status ? `?status=${status}` : ''}`);
  return (
    <div className="space-y-12">
      <OfflineDonation onDone={reload} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {[['paid', 'Paid'], ['created', 'Started, not paid'], ['failed', 'Failed'], ['', 'All']].map(([v, l]) => (
            <button key={l} onClick={() => setStatus(v)} aria-pressed={status === v} className={`rounded-full border px-4 py-1.5 text-sm ${status === v ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}>{l}</button>
          ))}
        </div>
        {d?.error && <Notice kind="error">{d.error}</Notice>}
        <div className="mt-6 overflow-x-auto rounded-[18px] border border-rule">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-rule text-muted">
              <tr>{['Date', 'Donor', 'Amount', 'Programme', 'Mode', 'Receipt / status'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {d?.donations?.map((x) => (
                <tr key={x._id} className="border-b border-rule last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(x.paidAt ?? x.createdAt)}</td>
                  <td className="px-4 py-3">{x.name}<br /><span className="text-xs text-muted">{x.email}{x.pan && ` · ${x.pan}`}</span></td>
                  <td className="px-4 py-3 tabular-nums">{inr(x.amount)}</td>
                  <td className="px-4 py-3">{programmeLabel(x.programme)}</td>
                  <td className="px-4 py-3 capitalize">{x.method}{x.paymentId && <><br /><span className="font-mono text-xs text-muted">{x.paymentId}</span></>}{x.reference && <><br /><span className="text-xs text-muted">{x.reference}</span></>}</td>
                  <td className="px-4 py-3">{x.receiptNo ?? <span className="capitalize text-muted">{x.status}</span>}</td>
                </tr>
              ))}
              {d?.donations?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Nothing here yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Certificates() {
  const [d, reload] = useLoad('/admin/certificates');
  const empty = { kind: 'volunteer', recipientName: '', email: '', title: 'Certificate of Volunteering', body: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const titles = { volunteer: 'Certificate of Volunteering', participation: 'Certificate of Participation', appreciation: 'Certificate of Appreciation' };

  async function issue(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/certificates', { method: 'POST', body: f });
      setMsg({ ok: `Issued ${r.certificate.certNo}.` });
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
    <div className="space-y-12">
      <form onSubmit={issue} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
        <h2 className="text-2xl">Issue a certificate</h2>
        <p className="text-sm text-muted">For volunteers, event participants and supporters. Donation certificates are issued automatically.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type" id="kind" required>
            <select id="kind" className="input" value={f.kind} onChange={(e) => setF((x) => ({ ...x, kind: e.target.value, title: titles[e.target.value] }))}>
              <option value="volunteer">Volunteer</option>
              <option value="participation">Participation</option>
              <option value="appreciation">Appreciation</option>
            </select>
          </Field>
          <Field label="Title" name="title" required value={f.title} onChange={set('title')} />
          <Field label="Recipient name" name="recipientName" required value={f.recipientName} onChange={set('recipientName')} />
          <Field label="Recipient email" name="email" type="email" value={f.email} onChange={set('email')} hint="If they have an account, it shows in their dashboard." />
        </div>
        <Field label="Citation" id="body">
          <textarea id="body" rows={3} maxLength={600} className="input" value={f.body} onChange={set('body')} placeholder="e.g. For volunteering at the Pirento Green pilot plantation, Basti, July 2026." />
        </Field>
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <Button type="submit" variant="accent" icon={Plus}>Issue certificate</Button>
      </form>
      <div>
        <h2 className="text-2xl">All certificates</h2>
        {d?.error && <Notice kind="error">{d.error}</Notice>}
        <ul className="mt-4 border-t border-rule">
          {d?.certificates?.map((c) => (
            <CertRow key={c._id} c={c}>
              <button onClick={() => toggle(c)} className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink">{c.revoked ? 'Restore' : 'Revoke'}</button>
            </CertRow>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Users() {
  const [d] = useLoad('/admin/users');
  if (d?.error) return <Notice kind="error">{d.error}</Notice>;
  return (
    <div className="overflow-x-auto rounded-[18px] border border-rule">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-rule text-muted">
          <tr>{['Name', 'Email', 'Phone', 'Role', 'Joined'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {d?.users?.map((u) => (
            <tr key={u.id} className="border-b border-rule last:border-0">
              <td className="px-4 py-3">{u.name}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{u.phone || '–'}</td>
              <td className="px-4 py-3 capitalize">{u.role}</td>
              <td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('Overview');
  const Panel = { Overview, Donations, Certificates, Users }[tab];
  return (
    <Page title="Admin">
      <section className="pb-28 pt-36 md:pt-44">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Label n="00">Admin</Label>
              <h1 data-hero className="h-hero mt-6"><span className="line"><span>Foundation desk.</span></span></h1>
            </div>
            <Button onClick={logout} variant="outline" icon={LogOut}>Log out</Button>
          </div>
          <div role="tablist" aria-label="Admin sections" className="mt-12 flex flex-wrap gap-1 rounded-full border border-rule p-1 sm:inline-flex">
            {tabs.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm transition-colors ${tab === t ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>{t}</button>
            ))}
          </div>
          <div role="tabpanel" className="mt-12"><Panel /></div>
        </div>
      </section>
    </Page>
  );
}
