import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router';
import { LayoutDashboard, IndianRupee, Award, Inbox, Users as UsersIcon, LogOut, ExternalLink, Plus, Download, Mail, ShieldCheck, BadgeCheck, Repeat, Newspaper, Settings as SettingsIcon, FileText, Undo2 } from 'lucide-react';
import { Button, Field, Notice } from '../components/ui.jsx';
import { api, fmtDate, inr, pdfUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { donateOptions } from '../data/site.js';
import { useSettings } from '../lib/settings.jsx';
import { BHARAT_STATUS, bharatState } from '../components/BharatId.jsx';
import { CertRow } from './Dashboard.jsx';

const programmeLabel = (k) => donateOptions.find((o) => o.key === k)?.label ?? k;

function useLoad(path) {
  const [data, setData] = useState(null);
  const reload = useCallback(() => api(path).then(setData, (e) => setData({ error: e.message })), [path]);
  useEffect(() => void reload(), [reload]);
  return [data, reload];
}

function useTitle(t) {
  useEffect(() => void (document.title = `${t} · Admin · Pirento Foundation`), [t]);
}

const H = ({ children, sub }) => (
  <div className="mb-10">
    <h1 className="poster text-[clamp(2.6rem,5vw,4.5rem)]">{children}</h1>
    {sub && <p className="mt-2 max-w-xl text-muted">{sub}</p>}
  </div>
);

/* ---------- panels ---------- */

function Overview() {
  useTitle('Overview');
  const [s] = useLoad('/admin/stats');
  const st = useSettings();
  if (!s) return <p className="text-muted">Loading…</p>;
  if (s.error) return <Notice kind="error">{s.error}</Notice>;
  return (
    <>
      <H sub="Donations, members and messages at a glance.">Overview</H>
      {!st.reg80G && (
        <div className="mb-8"><Notice kind="error">80G and registration numbers are not entered yet, so receipts carry no 80G particulars. <Link to="/admin/settings" className="underline">Open Settings</Link>.</Notice></div>
      )}
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {[['Raised (paid)', inr(s.raised)], ['Donations', s.donations], ['Unique donors', s.donors], ['Members', s.members], ['Monthly donors', `${s.monthlyDonors} · ${inr(s.monthlyAmount)}/mo`], ['Accounts', s.users], ['Valid certificates', s.certificates], ['New messages', s.newMessages]].map(([k, v]) => (
          <div key={k} className="bg-paper p-6"><dt className="eyebrow">{k}</dt><dd className="big-num mt-3">{v}</dd></div>
        ))}
      </dl>
      <h2 className="mt-14 text-2xl">By programme</h2>
      <ul className="mt-4 border-t border-rule">
        {donateOptions.map((o) => {
          const row = s.byProgramme.find((b) => b._id === o.key);
          const pct = s.raised ? Math.round(((row?.raised ?? 0) / s.raised) * 100) : 0;
          return (
            <li key={o.key} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-b border-rule py-4 sm:grid-cols-[14rem_1fr_9rem]">
              <span>{o.label}</span>
              <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-stone sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right tabular-nums">{inr(row?.raised)} <span className="text-xs text-muted">({row?.count ?? 0})</span></span>
            </li>
          );
        })}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/admin/donations" variant="outline" icon={Plus}>Record offline donation</Button>
        <Button to="/admin/certificates" variant="outline" icon={Award}>Issue certificate</Button>
      </div>
    </>
  );
}

function OfflineDonation({ onDone }) {
  const empty = { name: '', email: '', phone: '', pan: '', address: '', amount: '', programme: 'general', method: 'bank', reference: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/donations', { method: 'POST', body: { ...f, amount: Number(f.amount) } });
      setMsg({ ok: `Recorded ${r.donation.receiptNo}. Certificate ${r.certNo} issued and receipt emailed.`, certNo: r.certNo });
      setF(empty);
      onDone();
    } catch (err) {
      setMsg({ error: err.message });
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
      <h2 className="text-2xl">Record an offline donation</h2>
      <p className="text-sm text-muted">Bank transfer, UPI, cash or cheque. Receipt number, certificate and email go out automatically.</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
      <Field label="Address (for 80G receipt)" name="address" value={f.address} onChange={set('address')} />
      {msg?.error && <Notice kind="error">{msg.error}</Notice>}
      {msg?.ok && <Notice>{msg.ok} <a className="underline" href={pdfUrl(msg.certNo)} target="_blank" rel="noopener noreferrer">View PDF (opens in a new tab)</a></Notice>}
      <Button type="submit" variant="accent" icon={Plus}>Record donation</Button>
    </form>
  );
}

function Donations() {
  useTitle('Donations');
  const [status, setStatus] = useState('paid');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [d, reload] = useLoad(`/admin/donations?status=${status}&q=${encodeURIComponent(query)}`);
  const [sent, setSent] = useState('');
  const refund = async (x) => {
    if (!confirm(`Record ${x.receiptNo} (${inr(x.amount)}) as refunded? First issue the refund in the Razorpay dashboard. The certificate will be revoked.`)) return;
    await api(`/admin/donations/${x._id}`, { method: 'PATCH', body: { status: 'refunded' } });
    reload();
  };
  const resend = async (id) => {
    await api(`/admin/donations/${id}/resend`, { method: 'POST' });
    setSent(id);
  };
  return (
    <>
      <H sub="Online payments arrive here on their own. Record cash, cheque and bank gifts below.">Donations</H>
      <div className="space-y-12">
        <OfflineDonation onDone={reload} />
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[['paid', 'Paid'], ['created', 'Started, not paid'], ['failed', 'Failed'], ['refunded', 'Refunded'], ['', 'All']].map(([v, l]) => (
                <button key={l} onClick={() => setStatus(v)} aria-pressed={status === v} className={`rounded-full border px-4 py-1.5 text-sm ${status === v ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}>{l}</button>
              ))}
            </div>
            <form onSubmit={(e) => (e.preventDefault(), setQuery(q))} className="flex gap-2">
              <label htmlFor="dq" className="sr-only">Search donations</label>
              <input id="dq" className="input !py-1.5" placeholder="Name, email, receipt, payment ID" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="rounded-full border border-rule px-4 text-sm hover:border-ink">Search</button>
            </form>
            <a href="/api/admin/donations.csv" className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink">
              <Download aria-hidden className="size-4" /> Export paid (CSV)
            </a>
          </div>
          {d?.error && <Notice kind="error">{d.error}</Notice>}
          <div className="mt-6 overflow-x-auto rounded-[18px] border border-rule">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-rule text-muted">
                <tr>{['Date', 'Donor', 'Amount', 'Programme', 'Mode', 'Receipt / status', ''].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {d?.donations?.map((x) => (
                  <tr key={x._id} className="border-b border-rule last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(x.paidAt ?? x.createdAt)}</td>
                    <td className="px-4 py-3">{x.user ? <Link to={`/admin/users/${x.user}`} className="underline-offset-2 hover:underline">{x.name}</Link> : x.name}<br /><span className="text-xs text-muted">{x.email}{x.pan && ` · ${x.pan}`}</span>{x.subscription && <span className="ml-1 text-xs text-muted">· monthly</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{inr(x.amount)}</td>
                    <td className="px-4 py-3">{programmeLabel(x.programme)}</td>
                    <td className="px-4 py-3 capitalize">{x.method}{x.paymentId && <><br /><span className="font-mono text-xs text-muted">{x.paymentId}</span></>}{x.reference && <><br /><span className="text-xs text-muted">{x.reference}</span></>}</td>
                    <td className="px-4 py-3">{x.receiptNo ?? <span className="capitalize text-muted">{x.status}</span>}</td>
                    <td className="px-4 py-3 text-right">
                      {x.status === 'paid' && (
                        <span className="flex flex-wrap justify-end gap-1.5">
                          <a href={`/api/donations/${x._id}/receipt`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"><FileText aria-hidden className="size-3.5" /> Receipt</a>
                          <button onClick={() => resend(x._id)} disabled={sent === x._id} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink disabled:text-muted">
                            <Mail aria-hidden className="size-3.5" /> {sent === x._id ? 'Sent' : 'Resend'}
                          </button>
                          <button onClick={() => refund(x)} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"><Undo2 aria-hidden className="size-3.5" /> Refunded</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {d?.donations?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Nothing here yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Certificates() {
  useTitle('Certificates');
  const [d, reload] = useLoad('/admin/certificates');
  const titles = { volunteer: 'Certificate of Volunteering', participation: 'Certificate of Participation', appreciation: 'Certificate of Appreciation' };
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
      <H sub="Donation certificates are issued automatically. Issue the others here.">Certificates</H>
      <div className="space-y-12">
        <form onSubmit={issue} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Issue a certificate</h2>
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
            <Field label="Recipient email" name="email" type="email" value={f.email} onChange={set('email')} hint="We email the certificate and show it in their account." />
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
    </>
  );
}

function Messages({ onChange }) {
  useTitle('Messages');
  const [d, reload] = useLoad('/admin/messages');
  const mark = async (m) => {
    await api(`/admin/messages/${m._id}`, { method: 'PATCH', body: { status: m.status === 'new' ? 'done' : 'new' } });
    reload();
    onChange();
  };
  return (
    <>
      <H sub="Messages from the contact form. A copy also goes to the support inbox.">Messages</H>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      {d?.messages?.length === 0 && <p className="text-muted">No messages yet.</p>}
      <ul className="space-y-4">
        {d?.messages?.map((m) => (
          <li key={m._id} className={`rounded-[18px] border p-6 ${m.status === 'new' ? 'border-ink' : 'border-rule opacity-75'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {m.status === 'new' && <span className="mr-2 inline-block size-2 rounded-full bg-accent ring-1 ring-ink" aria-label="New" />}
                  {m.name} <span className="font-normal text-muted">· {m.topic}</span>
                </p>
                <p className="text-sm text-muted">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.topic)}`} className="underline underline-offset-2">{m.email}</a>
                  {m.phone && <> · <a href={`tel:${m.phone}`}>{m.phone}</a></>} · {fmtDate(m.createdAt)} · Ref {m._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button onClick={() => mark(m)} className="rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink">{m.status === 'new' ? 'Mark done' : 'Mark new'}</button>
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function Users() {
  useTitle('Users');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [d] = useLoad(`/admin/users?q=${encodeURIComponent(query)}`);
  return (
    <>
      <H sub="Everyone with an account. Open a person to see all their gifts, membership and Bharat ID.">Users</H>
      <form onSubmit={(e) => (e.preventDefault(), setQuery(q))} className="mb-6 flex max-w-md gap-2">
        <label htmlFor="uq" className="sr-only">Search users</label>
        <input id="uq" className="input !py-2" placeholder="Name, email, mobile, Bharat ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="rounded-full border border-rule px-4 text-sm hover:border-ink">Search</button>
      </form>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>{['Name', 'Email', 'Mobile', 'Sign-in', 'Bharat ID', 'Joined'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {d?.users?.map((u) => (
              <tr key={u.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3"><Link to={`/admin/users/${u.id}`} className="underline-offset-2 hover:underline">{u.name}</Link>{u.role === 'admin' && <span className="ml-1 text-xs text-muted">(admin)</span>}</td>
                <td className="px-4 py-3">{u.email} {u.emailVerified && <span className="text-xs text-muted">✓</span>}</td>
                <td className="px-4 py-3">{u.phone || '–'} {u.phoneVerified && <span className="text-xs text-muted">✓</span>}</td>
                <td className="px-4 py-3">{[u.google && 'Google', u.bharatId && 'Bharat ID', u.hasPassword && 'Password'].filter(Boolean).join(', ') || 'Code'}</td>
                <td className="px-4 py-3">{u.bharatId ? <>{u.bharatId.number}<br /><span className="text-xs text-muted">{bharatState(u.bharatId)}</span></> : '–'}</td>
                <td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


function UserDetail() {
  const { id } = useParams();
  const [d] = useLoad(`/admin/users/${id}`);
  useTitle(d?.user?.name ?? 'User');
  if (!d) return <p className="text-muted">Loading…</p>;
  if (d.error) return <Notice kind="error">{d.error}</Notice>;
  const u = d.user;
  const total = d.donations.filter((x) => x.status === 'paid').reduce((a, x) => a + x.amount, 0);
  return (
    <>
      <p className="mb-4"><Link to="/admin/users" className="text-sm text-muted underline underline-offset-4">← All users</Link></p>
      <H sub={`${u.email}${u.phone ? ` · ${u.phone}` : ''} · joined ${fmtDate(u.createdAt)}`}>{u.name}</H>
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {[['Given', inr(total)], ['Donations', d.donations.length], ['Membership', d.memberships.find((m) => m.status === 'active')?.memberNo ?? '–'], ['Bharat ID', u.bharatId ? `${u.bharatId.number ?? '—'} · ${bharatState(u.bharatId)}` : 'Not linked']].map(([k, v]) => (
          <div key={k} className="bg-paper p-6"><dt className="eyebrow">{k}</dt><dd className="mt-3 text-xl">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-10 grid gap-10 xl:grid-cols-2">
        <div>
          <h2 className="text-2xl">Profile</h2>
          <dl className="mt-4 divide-y divide-rule border-y border-rule text-sm">
            {[['Email', `${u.email} ${u.emailVerified ? '✓' : '(unconfirmed)'}`], ['Mobile', u.phone ? `${u.phone} ${u.phoneVerified ? '✓' : '(unconfirmed)'}` : '–'], ['PAN', u.pan], ['Address', u.address], ['Sign-in', [u.hasPassword && 'password', u.google && 'Google', u.bharatId && 'Bharat ID'].filter(Boolean).join(', ') || 'codes only'], ['Bharat ID status', u.bharatId ? BHARAT_STATUS[u.bharatId.status]?.label ?? u.bharatId.status : '–']].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5"><dt className="text-muted">{k}</dt><dd>{v || '–'}</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-2xl">Membership & monthly</h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule text-sm">
            {d.memberships.map((m) => <li key={m._id} className="flex justify-between py-2.5"><span>{m.memberNo} · {m.receiptNo}</span><span className="capitalize text-muted">{m.status} · to {m.validTo ? fmtDate(m.validTo) : 'lifetime'}</span></li>)}
            {d.subscriptions.map((x) => <li key={x._id} className="flex justify-between py-2.5"><span>{inr(x.amount)}/month · {x.charges} paid</span><span className="capitalize text-muted">{x.status}</span></li>)}
            {!d.memberships.length && !d.subscriptions.length && <li className="py-2.5 text-muted">None</li>}
          </ul>
        </div>
      </div>
      <h2 className="mt-12 text-2xl">Donations</h2>
      <ul className="mt-4 divide-y divide-rule border-y border-rule text-sm">
        {d.donations.map((x) => (
          <li key={x._id} className="flex flex-wrap justify-between gap-3 py-2.5">
            <span>{fmtDate(x.paidAt ?? x.createdAt)} · {inr(x.amount)} · {programmeLabel(x.programme)}{x.subscription && ' · monthly'}</span>
            <span className="text-muted">{x.receiptNo ?? x.status}{x.status === 'paid' && <> · <a href={`/api/donations/${x._id}/receipt`} target="_blank" rel="noopener noreferrer" className="underline">receipt</a></>}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-2xl">Certificates</h2>
      <ul className="mt-4 border-t border-rule">{d.certificates.map((c) => <CertRow key={c._id} c={c} />)}</ul>
    </>
  );
}

function Members() {
  useTitle('Members');
  const [d, reload] = useLoad('/admin/members');
  const [f, setF] = useState({ email: '', method: 'upi', reference: '' });
  const [msg, setMsg] = useState(null);
  const add = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/admin/members', { method: 'POST', body: f });
      setMsg({ ok: `Member ${r.membership.memberNo} added; certificate and email sent.` });
      setF({ email: '', method: 'upi', reference: '' });
      reload();
    } catch (err) {
      setMsg({ error: err.message });
    }
  };
  const cancel = async (m) => {
    if (!confirm(`Cancel membership ${m.memberNo}? Its certificate will be revoked.`)) return;
    await api(`/admin/members/${m._id}`, { method: 'PATCH', body: { status: 'cancelled' } });
    reload();
  };
  const active = d?.members?.filter((m) => m.status === 'active') ?? [];
  return (
    <>
      <H sub="Supporter members, their validity and Bharat ID status. Online joins appear here automatically.">Members</H>
      <form onSubmit={add} className="mb-12 space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
        <h2 className="text-2xl">Add an offline member</h2>
        <p className="text-sm text-muted">For a fee paid by UPI, bank, cash or cheque. The person must already have an account.</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Account email" name="memail" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field label="Mode" id="mmethod" required>
            <select id="mmethod" className="input" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
              {[['upi', 'UPI'], ['bank', 'Bank transfer'], ['cash', 'Cash'], ['cheque', 'Cheque']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Reference / UTR" name="mref" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
        </div>
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <Button type="submit" variant="accent" icon={Plus}>Add member</Button>
      </form>
      <p className="mb-4 text-sm text-muted">{active.length} active · Bharat ID complete for {active.filter((m) => bharatState(m.user?.bharatId) === 'complete').length}</p>
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>{['Member', 'Person', 'Valid', 'Bharat ID', 'Fee', ''].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {d?.members?.map((m) => (
              <tr key={m._id} className={`border-b border-rule last:border-0 ${m.status !== 'active' ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3 font-mono">{m.memberNo}<br /><span className="font-sans text-xs capitalize text-muted">{m.status}</span></td>
                <td className="px-4 py-3">{m.user ? <Link to={`/admin/users/${m.user._id}`} className="hover:underline">{m.user.name}</Link> : '–'}<br /><span className="text-xs text-muted">{m.user?.email}</span></td>
                <td className="px-4 py-3">{fmtDate(m.validFrom)} – {m.validTo ? fmtDate(m.validTo) : 'lifetime'}</td>
                <td className="px-4 py-3">{m.user?.bharatId ? <>{m.user.bharatId.number}<br /><span className="text-xs text-muted">{bharatState(m.user.bharatId)}</span></> : <span className="text-muted">Pending</span>}</td>
                <td className="px-4 py-3">{inr(m.fee)} <span className="text-xs text-muted">{m.method}</span><br /><span className="text-xs text-muted">{m.receiptNo}</span></td>
                <td className="px-4 py-3 text-right">
                  {m.status === 'active' && (
                    <span className="flex justify-end gap-1.5">
                      <a href={`/api/membership/${m._id}/receipt`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink">Receipt</a>
                      <button onClick={() => cancel(m)} className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink">Cancel</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {d?.members?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No members yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MonthlyDonors() {
  useTitle('Monthly donors');
  const [d] = useLoad('/admin/subscriptions');
  return (
    <>
      <H sub="Razorpay subscriptions. Every charge also appears under Donations with its own receipt.">Monthly donors</H>
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>{['Donor', 'Amount', 'Programme', 'Payments', 'Status', 'Since'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {d?.subscriptions?.map((x) => (
              <tr key={x._id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">{x.user ? <Link to={`/admin/users/${x.user}`} className="hover:underline">{x.name}</Link> : x.name}<br /><span className="text-xs text-muted">{x.email}</span></td>
                <td className="px-4 py-3 tabular-nums">{inr(x.amount)}/mo</td>
                <td className="px-4 py-3">{programmeLabel(x.programme)}</td>
                <td className="px-4 py-3">{x.charges}{x.lastChargedAt && <span className="text-xs text-muted"> · last {fmtDate(x.lastChargedAt)}</span>}</td>
                <td className="px-4 py-3 capitalize">{x.status}</td>
                <td className="px-4 py-3">{fmtDate(x.createdAt)}</td>
              </tr>
            ))}
            {d?.subscriptions?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No monthly donors yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Posts() {
  useTitle('Website updates');
  const [d, reload] = useLoad('/admin/posts');
  const empty = { title: '', summary: '', body: '', programme: '', link: '', published: true };
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(editing ? `/admin/posts/${editing}` : '/admin/posts', { method: editing ? 'PUT' : 'POST', body: f });
      setMsg({ ok: editing ? 'Update saved.' : f.published ? 'Published on the website.' : 'Saved as draft.' });
      setF(empty);
      setEditing(null);
      reload();
    } catch (err) {
      setMsg({ error: err.message });
    }
  };
  const remove = async (p) => {
    if (!confirm(`Delete “${p.title}”?`)) return;
    await api(`/admin/posts/${p._id}`, { method: 'DELETE' });
    reload();
  };
  return (
    <>
      <H sub="Post news from the field. Published updates appear on the home page and at /updates.">Website updates</H>
      <form onSubmit={save} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
        <h2 className="text-2xl">{editing ? 'Edit update' : 'New update'}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" name="ptitle" required maxLength={140} value={f.title} onChange={set('title')} />
          <Field label="Programme" id="pprog">
            <select id="pprog" className="input" value={f.programme} onChange={set('programme')}>
              <option value="">None</option>
              {donateOptions.filter((o) => o.key !== 'general').map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Summary" name="psum" maxLength={300} value={f.summary} onChange={set('summary')} hint="One or two lines for the card." />
        <Field label="Story" id="pbody">
          <textarea id="pbody" rows={8} maxLength={20000} className="input" value={f.body} onChange={set('body')} placeholder="Leave a blank line between paragraphs." />
        </Field>
        <Field label="Link" name="plink" type="url" value={f.link} onChange={set('link')} hint="Optional, e.g. a photo album or news article (https://…)." />
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.published} onChange={set('published')} className="size-4" /> Publish on the website</label>
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="accent" icon={Plus}>{editing ? 'Save' : 'Add update'}</Button>
          {editing && <Button variant="outline" icon={null} onClick={() => (setEditing(null), setF(empty))}>Cancel</Button>}
        </div>
      </form>
      <ul className="mt-10 border-t border-rule">
        {d?.posts?.map((p) => (
          <li key={p._id} className="flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{p.title} {!p.published && <span className="text-xs text-muted">(draft)</span>}</p>
              <p className="text-sm text-muted">{fmtDate(p.publishedAt ?? p.createdAt)} · /updates/{p.slug}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => (setEditing(p._id), setF({ title: p.title, summary: p.summary ?? '', body: p.body ?? '', programme: p.programme ?? '', link: p.link ?? '', published: p.published }), scrollTo(0, 0))} className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink">Edit</button>
              <button onClick={() => remove(p)} className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

const SETTING_GROUPS = [
  ['Registrations (shown on receipts, certificates and the website)', [
    ['cin', 'Foundation CIN (Section 8)'], ['pan', 'Foundation PAN'], ['reg12A', '12A registration no.'], ['reg80G', '80G URN'], ['reg80GValidity', '80G validity (e.g. AY 2026-27 to AY 2030-31)'],
    ['csr1', 'CSR-1 registration no.'], ['fcra', 'FCRA registration no.'], ['darpan', 'NGO Darpan ID'],
  ]],
  ['Organisation', [['legalName', 'Legal name'], ['address', 'Registered address'], ['phone', 'Phone'], ['email', 'Email'], ['signatoryName', 'Signatory name'], ['signatoryTitle', 'Signatory title']]],
  ['Payments', [['bankDetails', 'Bank details for Indian donors'], ['fcraBankDetails', 'FCRA bank account (foreign contributions)']]],
  ['Membership', [['membershipFee', 'Membership fee (₹)'], ['membershipMonths', 'Validity in months (0 = lifetime)']]],
  ['Pirento ecosystem links', [['pirentoUrl', 'pirento.com'], ['bharatIdUrl', 'Bharat ID by Pirento (where members create their ID)'], ['pirentoOneUrl', 'Pirento One (partner sign-up)']]],
];

function SettingsPanel() {
  useTitle('Settings');
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
      <H sub="Type registration numbers exactly as printed on your certificates. Empty fields are simply not shown.">Settings</H>
      <form onSubmit={save} className="space-y-10">
        {SETTING_GROUPS.map(([title, fields]) => (
          <fieldset key={title} className="rounded-[22px] border border-rule p-6 md:p-8">
            <legend className="px-2 text-lg font-medium">{title}</legend>
            <div className="mt-2 grid gap-5 sm:grid-cols-2">
              {fields.map(([k, label]) =>
                ['bankDetails', 'fcraBankDetails', 'address'].includes(k) ? (
                  <Field key={k} label={label} id={k}>
                    <textarea id={k} rows={3} className="input" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                  </Field>
                ) : (
                  <Field key={k} label={label} name={k} inputMode={typeof f[k] === 'number' ? 'numeric' : undefined} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                ),
              )}
            </div>
          </fieldset>
        ))}
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <Button type="submit" variant="accent" icon={SettingsIcon}>Save settings</Button>
      </form>
    </>
  );
}

/* ---------- shell ---------- */

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/donations', label: 'Donations', icon: IndianRupee },
  { to: '/admin/monthly', label: 'Monthly donors', icon: Repeat },
  { to: '/admin/members', label: 'Members', icon: BadgeCheck },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'newMessages' },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/posts', label: 'Website updates', icon: Newspaper },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export function AdminShell() {
  const { user, logout } = useAuth();
  const [stats, reloadStats] = useLoad('/admin/stats');
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
      <aside className="inverse flex flex-col bg-inverse p-5 text-on-inverse lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:p-7">
        <div className="flex items-center justify-between gap-4">
          <Link to="/admin" className="inline-flex items-center gap-2.5 whitespace-nowrap font-display text-[0.95rem] font-semibold uppercase tracking-[0.04em]">
            <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-on-inverse" /> Pirento
          </Link>
          <span className="rounded-full border border-inverse-rule px-2.5 py-0.5 text-xs text-inverse-muted">Admin desk</span>
        </div>
        <nav aria-label="Admin" className="-mx-1 mt-6 flex gap-1 overflow-x-auto pb-1 lg:mt-12 lg:flex-col lg:overflow-visible">
          {links.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-on-inverse text-inverse' : 'text-inverse-muted hover:text-on-inverse'}`}>
              <Icon aria-hidden className="size-4" /> {label}
              {badge && stats?.[badge] > 0 && <span className="ml-auto rounded-full bg-accent px-2 text-xs font-medium text-on-accent">{stats[badge]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-3 border-t border-inverse-rule pt-6 text-sm lg:block">
          <p className="truncate text-inverse-muted" title={user.email}>{user.email}</p>
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-inverse-muted hover:text-on-inverse">
            <ExternalLink aria-hidden className="size-4" /> View site <span className="sr-only">(opens in a new tab)</span>
          </a>
          <button onClick={logout} className="flex items-center gap-2 text-inverse-muted hover:text-on-inverse"><LogOut aria-hidden className="size-4" /> Log out</button>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mb-8 flex justify-end gap-3 lg:hidden">
          <a href="/" className="text-sm text-muted underline underline-offset-4">View site</a>
          <button onClick={logout} className="text-sm text-muted underline underline-offset-4">Log out</button>
        </div>
        <div className="mx-auto max-w-[1180px]">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="donations" element={<Donations />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="messages" element={<Messages onChange={reloadStats} />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="members" element={<Members />} />
            <Route path="monthly" element={<MonthlyDonors />} />
            <Route path="posts" element={<Posts />} />
            <Route path="settings" element={<SettingsPanel />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ---------- admin login (password → email code) ---------- */

export function AdminLogin() {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  const [f, setF] = useState({ email: '', password: '' });
  const [step, setStep] = useState(null); // { target, devCode }
  const [code, setCode] = useState('');
  const [state, setState] = useState({ busy: false, error: '' });
  useTitle('Sign in');
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  const run = async (fn) => {
    setState({ busy: true, error: '' });
    try {
      await fn();
      setState({ busy: false, error: '' });
    } catch (e) {
      setState({ busy: false, error: e.message });
    }
  };
  const first = (e) => (e.preventDefault(), run(async () => setStep(await api('/auth/admin/login', { method: 'POST', body: f }))));
  const second = (c) => run(() => signIn('/auth/admin/verify', { email: f.email, code: c }));

  return (
    <main className="grid min-h-screen place-items-center bg-inverse px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-paper p-7 md:p-10">
        <Link to="/" className="inline-flex items-center gap-2.5 font-display text-[0.95rem] font-semibold uppercase tracking-[0.04em]">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" /> Pirento Foundation
        </Link>
        <p className="eyebrow mt-10">Admin desk · Step {step ? 2 : 1} of 2</p>
        <h1 className="poster mt-3 text-[clamp(2.6rem,8vw,3.75rem)]">{step ? 'Check your email.' : 'Admin sign-in.'}</h1>
        {user && <Notice>You are signed in as a donor ({user.email}). Admin access needs an admin account.</Notice>}
        {params.get('reset') && !step && <div className="mt-6"><Notice>Password updated. Sign in below to finish.</Notice></div>}

        {!step ? (
          <form onSubmit={first} className="mt-8 space-y-5">
            <Field label="Admin email" name="email" type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Field label="Password" name="password" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" variant="accent" disabled={state.busy} className="w-full">{state.busy ? 'Checking…' : 'Continue'}</Button>
          </form>
        ) : (
          <form onSubmit={(e) => (e.preventDefault(), second(code))} className="mt-8 space-y-5">
            <p className="text-sm text-muted">We sent a 6-digit code to <strong className="font-medium text-ink">{step.target}</strong>. It expires in 10 minutes.</p>
            <div>
              <label htmlFor="admin-code" className="mb-2 block text-sm font-medium">6-digit code</label>
              <input
                id="admin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(d);
                  if (d.length === 6) second(d);
                }}
                className="input text-center font-mono text-2xl tracking-[0.6em]"
              />
              {step.devCode && <p className="mt-2 rounded-[10px] bg-stone px-3 py-2 text-xs">Test mode, no email provider set: code <strong className="font-mono">{step.devCode}</strong></p>}
            </div>
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" variant="accent" disabled={state.busy || code.length !== 6} className="w-full" icon={ShieldCheck}>{state.busy ? 'Verifying…' : 'Sign in'}</Button>
            <button type="button" onClick={() => (setStep(null), setCode(''))} className="text-sm text-muted underline underline-offset-4">Start again</button>
          </form>
        )}
        <p className="mt-10 text-xs leading-relaxed text-muted">Restricted area. Sign-ins are rate-limited; admin sessions expire after 12 hours.</p>
      </div>
    </main>
  );
}
