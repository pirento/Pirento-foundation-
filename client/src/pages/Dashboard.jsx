import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router';
import { Download, LogOut, LayoutDashboard, IndianRupee, Repeat, BadgeCheck, Fingerprint, Award, UserRound, FileText, Check, ExternalLink } from 'lucide-react';
import { Button, Field, Notice, Tag } from '../components/ui.jsx';
import { BharatIdCard, BHARAT_STATUS, bharatState } from '../components/BharatId.jsx';
import { api, fmtDate, inr, pdfUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useSettings } from '../lib/settings.jsx';
import { donateOptions } from '../data/site.js';
import { useJoin } from './Membership.jsx';

const programmeLabel = (k) => donateOptions.find((o) => o.key === k)?.label ?? k;

function useLoad(path) {
  const [data, setData] = useState(null);
  const reload = useCallback(() => api(path).then(setData, (e) => setData({ error: e.message })), [path]);
  useEffect(() => void reload(), [reload]);
  return [data, reload];
}
const useTitle = (t) => useEffect(() => void (document.title = `${t} · My account · Pirento Foundation`), [t]);

const H = ({ children, sub, eyebrow }) => (
  <div className="mb-10">
    {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
    <h1 className="poster text-[clamp(2.6rem,5vw,4.5rem)]">{children}</h1>
    {sub && <p className="mt-2 max-w-xl text-muted">{sub}</p>}
  </div>
);

const pill = 'inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink';

export function CertRow({ c, children }) {
  return (
    <li className="flex flex-col gap-4 border-b border-rule py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid h-14 w-[4.5rem] shrink-0 place-items-center rounded-[10px] border border-rule bg-stone">
          <span className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
        </span>
        <div>
          <p className="font-medium">{c.title}{c.revoked && <span className="ml-2 text-xs text-muted">(revoked)</span>}</p>
          <p className="text-sm text-muted">{c.recipientName} · {fmtDate(c.createdAt)} · <span className="font-mono text-xs">{c.certNo}</span></p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!c.revoked && (
          <a href={pdfUrl(c.certNo)} target="_blank" rel="noopener noreferrer" className={pill}>
            <Download aria-hidden className="size-4" /> View certificate <span className="sr-only">(PDF, opens in a new tab)</span>
          </a>
        )}
        {children}
      </div>
    </li>
  );
}

/* ---------- pages ---------- */

function Overview({ summary }) {
  useTitle('Overview');
  if (!summary) return <p className="text-muted">Loading…</p>;
  const { user, totals, membership, checklist, bharat } = summary;
  const todo = checklist.filter((c) => !c.done);
  const links = { email: '/dashboard/profile', password: '/dashboard/profile', pan: '/dashboard/profile', bharat: '/dashboard/bharat-id' };
  return (
    <>
      <H eyebrow={membership ? `Pirento Foundation member · ${membership.memberNo}` : 'My account'}>Namaste, {user.name.split(' ')[0]}.</H>
      {membership && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[18px] border-2 border-ink bg-stone p-5">
          <BadgeCheck aria-hidden className="size-6" />
          <p className="font-medium">A Pirento Foundation Member</p>
          <span className="text-sm text-muted">· {membership.validTo ? `valid until ${fmtDate(membership.validTo)}` : 'lifetime'} · Bharat ID {bharat === 'complete' ? 'complete' : bharat === 'pending' ? 'pending' : 'not linked'}</span>
        </div>
      )}
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {[['Total given', inr(totals.given)], [`This year (FY ${totals.fy})`, inr(totals.thisFy)], ['Monthly gift', totals.monthly ? `${inr(totals.monthly)}/mo` : '–'], ['Certificates', totals.certificates]].map(([k, v]) => (
          <div key={k} className="bg-paper p-6"><dt className="eyebrow">{k}</dt><dd className="big-num mt-3">{v}</dd></div>
        ))}
      </dl>
      {todo.length > 0 && (
        <div className="mt-10 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Finish setting up</h2>
          <ul className="mt-4 divide-y divide-rule">
            {checklist.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-4 py-3">
                <span className={`flex items-center gap-3 ${c.done ? 'text-muted line-through' : ''}`}>
                  <span className={`grid size-6 place-items-center rounded-full border ${c.done ? 'border-accent bg-accent text-on-accent' : 'border-rule'}`}>{c.done && <Check aria-hidden className="size-3.5" />}</span>
                  {c.label}
                </span>
                {!c.done && <Link to={links[c.key]} className="text-sm underline underline-offset-4">{c.key === 'bharat' ? 'Pending · complete now' : 'Do it'}</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/donate" variant="accent">Donate</Button>
        {!membership && <Button to="/dashboard/membership" variant="outline">Become a member</Button>}
        <Button to="/donate?monthly=1" variant="outline" icon={Repeat}>Give monthly</Button>
      </div>
    </>
  );
}

function Donations() {
  useTitle('Donations');
  const [d] = useLoad('/donations/mine');
  return (
    <>
      <H sub="Every gift with its 80G receipt and certificate. Form 10BE for your tax claim follows after we file Form 10BD.">Donations</H>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      {d?.donations?.length === 0 && <p className="text-muted">No donations yet. <Link to="/donate" className="text-ink underline underline-offset-4">Make your first one</Link>.</p>}
      <ul className="border-t border-rule">
        {d?.donations?.map((x) => (
          <li key={x._id} className="flex flex-col gap-4 border-b border-rule py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="big-num !text-2xl">{inr(x.amount)} {x.status === 'refunded' && <span className="align-middle text-sm font-normal text-muted">(refunded)</span>}</p>
              <p className="mt-1 text-sm text-muted">{fmtDate(x.paidAt)} · {x.receiptNo} · {programmeLabel(x.programme)}{x.subscription && ' · monthly'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {x.receiptUrl && <a href={x.receiptUrl} target="_blank" rel="noopener noreferrer" className={pill}><FileText aria-hidden className="size-4" /> 80G receipt <span className="sr-only">(PDF, opens in a new tab)</span></a>}
              {x.certNo && x.status === 'paid' && <a href={pdfUrl(x.certNo)} target="_blank" rel="noopener noreferrer" className={pill}><Download aria-hidden className="size-4" /> Certificate <span className="sr-only">(PDF, opens in a new tab)</span></a>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Monthly() {
  useTitle('Monthly giving');
  const [d, reload] = useLoad('/donations/subscriptions/mine');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const cancel = async (s) => {
    if (!confirm(`Stop your monthly gift of ${inr(s.amount)}? No further charges will be made.`)) return;
    setBusy(s._id);
    try {
      await api(`/donations/subscriptions/${s._id}/cancel`, { method: 'POST' });
      reload();
    } catch (e) {
      setError(e.message);
    }
    setBusy('');
  };
  const active = d?.subscriptions?.filter((s) => ['active', 'halted'].includes(s.status)) ?? [];
  return (
    <>
      <H sub="Monthly gifts through Razorpay. A receipt arrives after every payment; stop any time.">Monthly giving</H>
      {error && <Notice kind="error">{error}</Notice>}
      {d && active.length === 0 && (
        <div className="rounded-[22px] border border-rule p-8">
          <p className="text-lg">You have no monthly gift running.</p>
          <p className="mt-2 text-muted">Steady monthly support lets us plan plantations, kits and scholarships ahead.</p>
          <div className="mt-6"><Button to="/donate?monthly=1" variant="accent" icon={Repeat}>Start a monthly gift</Button></div>
        </div>
      )}
      <ul className="mt-6 space-y-4">
        {d?.subscriptions?.map((s) => (
          <li key={s._id} className={`flex flex-col gap-4 rounded-[18px] border p-6 sm:flex-row sm:items-center sm:justify-between ${s.status === 'active' ? 'border-ink' : 'border-rule'}`}>
            <div>
              <p className="big-num !text-2xl">{inr(s.amount)}<span className="text-base text-muted"> / month</span></p>
              <p className="mt-1 text-sm text-muted">{programmeLabel(s.programme)} · {s.charges} payment{s.charges === 1 ? '' : 's'}{s.lastChargedAt && ` · last ${fmtDate(s.lastChargedAt)}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="capitalize">{s.status === 'halted' ? 'Paused by bank' : s.status}</Tag>
              {['active', 'halted'].includes(s.status) && (
                <button onClick={() => cancel(s)} disabled={busy === s._id} className={pill}>{busy === s._id ? 'Stopping…' : 'Stop monthly gift'}</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function MembershipPage({ summary, refresh }) {
  useTitle('Membership');
  const st = useSettings();
  const [params] = useSearchParams();
  const [d, reload] = useLoad('/membership/mine');
  const { join, busy, error } = useJoin();
  useEffect(() => void (params.get('joined') && (reload(), refresh())), [params, reload, refresh]);
  const m = d?.current;
  const renewable = m?.validTo && new Date(m.validTo) - Date.now() < 30 * 86400_000;
  return (
    <>
      <H sub="Your supporter membership of Pirento Foundation.">Membership</H>
      {params.get('joined') && <div className="mb-8"><Notice>Welcome! Your membership is active. Your certificate and fee receipt are below and in your email.</Notice></div>}
      {error && <div className="mb-6"><Notice kind="error">{error}</Notice></div>}
      {d && !m && (
        <div className="rounded-[22px] border border-rule p-8">
          <p className="text-lg">You are not a member yet.</p>
          <p className="mt-2 max-w-lg text-muted">Membership is {inr(st.membershipFee ?? 1000)} for {st.membershipMonths ? `${st.membershipMonths} months` : 'life'}, with a numbered certificate, member card and your Bharat ID by Pirento.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={join} variant="accent" disabled={busy}>{busy ? 'Opening payment…' : `Join for ${inr(st.membershipFee ?? 1000)}`}</Button>
            <Button to="/membership" variant="outline">What members get</Button>
          </div>
        </div>
      )}
      {m && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[22px] border-2 border-ink bg-stone p-7">
            <div className="flex items-center gap-3"><BadgeCheck aria-hidden className="size-6" /><p className="text-xl font-medium">A Pirento Foundation Member</p></div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted">Member no.</dt><dd className="font-mono text-base">{m.memberNo}</dd></div>
              <div><dt className="text-muted">Valid until</dt><dd className="text-base">{m.validTo ? fmtDate(m.validTo) : 'Lifetime'}</dd></div>
              <div><dt className="text-muted">Member since</dt><dd className="text-base">{fmtDate(m.validFrom)}</dd></div>
              <div><dt className="text-muted">Fee receipt</dt><dd className="text-base">{m.receiptNo}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={pdfUrl(m.certNo)} target="_blank" rel="noopener noreferrer" className={pill}><Download aria-hidden className="size-4" /> Certificate <span className="sr-only">(PDF, opens in a new tab)</span></a>
              <a href={`/api/membership/${m._id}/receipt`} target="_blank" rel="noopener noreferrer" className={pill}><FileText aria-hidden className="size-4" /> Fee receipt <span className="sr-only">(PDF, opens in a new tab)</span></a>
              {renewable && <Button onClick={join} variant="accent" disabled={busy}>Renew</Button>}
            </div>
          </div>
          <div>
            <BharatIdCard b={summary?.user.bharatId} name={summary?.user.name} />
            {bharatState(summary?.user.bharatId) !== 'complete' && (
              <p className="mt-4 text-sm">
                <strong className="font-medium">Bharat ID: pending.</strong> <Link to="/dashboard/bharat-id" className="underline underline-offset-4">Complete it now</Link>
              </p>
            )}
          </div>
        </div>
      )}
      {d?.history?.length > 1 && (
        <div className="mt-12">
          <h2 className="text-2xl">History</h2>
          <ul className="mt-4 border-t border-rule">
            {d.history.map((h) => (
              <li key={h._id} className="flex justify-between border-b border-rule py-3 text-sm">
                <span>{h.receiptNo} · {inr(h.fee)}</span><span className="text-muted capitalize">{h.status} · {fmtDate(h.validFrom)} – {h.validTo ? fmtDate(h.validTo) : 'lifetime'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function BharatIdPage({ summary, refresh }) {
  useTitle('Bharat ID');
  const st = useSettings();
  const { setUser } = useAuth();
  const [params] = useSearchParams();
  const b = summary?.user.bharatId;
  const state = bharatState(b);
  const unlink = async () => {
    if (!confirm('Unlink your Bharat ID from this account?')) return;
    setUser((await api('/me/bharatid/unlink', { method: 'POST' })).user);
    refresh();
  };
  return (
    <>
      <H sub="Your private Pirento account ID. It is not Aadhaar or any government ID, and not proof of citizenship or residence.">Bharat ID by Pirento</H>
      {params.get('error') && <div className="mb-6"><Notice kind="error">{params.get('error')}</Notice></div>}
      {params.get('bharatid') === 'linked' && <div className="mb-6"><Notice>Bharat ID linked. Status: {BHARAT_STATUS[b?.status]?.label ?? b?.status}.</Notice></div>}
      <div className="grid gap-8 xl:grid-cols-2">
        <BharatIdCard b={b} name={summary?.user.name} />
        <div className="rounded-[22px] border border-rule p-7">
          <p className="eyebrow">Status</p>
          <p className="mt-2 text-2xl">{state === 'complete' ? 'Complete' : state === 'pending' ? 'Pending' : 'Not linked'}</p>
          <p className="mt-2 text-muted">
            {state === 'not_linked' && 'Create your Bharat ID on Bharat ID by Pirento, then link it here. The full process happens on Bharat ID.'}
            {state === 'pending' && 'Your Bharat ID is linked but not complete yet. Finish the steps on Bharat ID by Pirento, then refresh the status here.'}
            {state === 'complete' && 'Your Bharat ID is linked and complete. Its details show below and on your membership card.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {state !== 'complete' && st.bharatIdUrl && (
              <Button href={st.bharatIdUrl} target="_blank" rel="noopener noreferrer" variant="outline" icon={ExternalLink}>Open Bharat ID by Pirento <span className="sr-only">(opens in a new tab)</span></Button>
            )}
            <Button href={`/api/auth/bharatid/start?mode=link&next=/dashboard/bharat-id`} variant="accent" icon={Fingerprint}>{b ? 'Refresh status' : 'Link my Bharat ID'}</Button>
          </div>
        </div>
      </div>
      {b && (
        <div className="mt-10 rounded-[22px] border border-rule p-7">
          <h2 className="text-2xl">Details shared from Bharat ID</h2>
          <p className="mt-1 text-sm text-muted">Shared with your consent when you linked it. Information is shown exactly as Bharat ID reports it.</p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[['Bharat ID number', b.number], ['Status', BHARAT_STATUS[b.status]?.label ?? b.status], ['Name', b.name], ['Email', b.email], ['Mobile', b.phone], ['Linked on', b.linkedAt && fmtDate(b.linkedAt)], ['Last checked', b.checkedAt && fmtDate(b.checkedAt)]].map(([k, v]) => (
              <div key={k} className="border-b border-rule pb-3"><dt className="text-sm text-muted">{k}</dt><dd className="mt-1">{v || '—'}</dd></div>
            ))}
          </dl>
          <button onClick={unlink} className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink">Unlink Bharat ID</button>
        </div>
      )}
    </>
  );
}

function Certificates() {
  useTitle('Certificates');
  const [d] = useLoad('/certificates/mine');
  return (
    <>
      <H sub="Donation, membership and volunteer certificates. Anyone can check them on the Verify page.">Certificates</H>
      {d?.certificates?.length === 0 && <p className="text-muted">Certificates appear here after a donation, when you join, or when we issue one to you.</p>}
      <ul className="border-t border-rule">{d?.certificates?.map((c) => <CertRow key={c._id} c={c} />)}</ul>
    </>
  );
}

function Profile({ refresh }) {
  useTitle('Profile');
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, phone: user.phone ?? '', pan: user.pan ?? '', address: user.address ?? '' });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [msg, setMsg] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      setUser((await api('/me/profile', { method: 'PUT', body: f })).user);
      setMsg({ profile: 'Saved.' });
      refresh();
    } catch (err) {
      setMsg({ profileError: err.message });
    }
  };
  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api('/me/password', { method: 'POST', body: pw });
      setPw({ current: '', password: '' });
      setMsg({ pw: 'Password updated.' });
      refresh();
    } catch (err) {
      setMsg({ pwError: err.message });
    }
  };
  return (
    <>
      <H sub="PAN and address are printed on your 80G receipts.">Profile</H>
      <div className="grid gap-8 xl:grid-cols-2">
        <form onSubmit={save} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Your details</h2>
          <Field label="Full name" name="name" required value={f.name} onChange={set('name')} hint="As on your PAN." />
          <div>
            <Field label="Email" name="email" value={user.email} disabled readOnly hint={user.emailVerified ? 'Confirmed.' : 'Not confirmed yet: sign in with an email code to confirm it.'} />
          </div>
          <Field label="Mobile" name="phone" type="tel" value={f.phone} onChange={set('phone')} hint={user.phone ? (user.phoneVerified ? 'Confirmed.' : 'Not confirmed: sign in once with a mobile code to confirm it.') : undefined} />
          <Field label="PAN" name="pan" maxLength={10} value={f.pan} onChange={set('pan')} />
          <Field label="Address" id="address">
            <textarea id="address" rows={3} maxLength={300} className="input" value={f.address} onChange={set('address')} />
          </Field>
          {msg.profileError && <Notice kind="error">{msg.profileError}</Notice>}
          {msg.profile && <Notice>{msg.profile}</Notice>}
          <Button type="submit" variant="accent">Save details</Button>
        </form>
        <form onSubmit={changePw} className="space-y-5 self-start rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">{user.hasPassword ? 'Change password' : 'Set a password'}</h2>
          {user.hasPassword && <Field label="Current password" name="current" type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />}
          <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} hint="At least 8 characters." />
          {msg.pwError && <Notice kind="error">{msg.pwError}</Notice>}
          {msg.pw && <Notice>{msg.pw}</Notice>}
          <Button type="submit" variant="outline">{user.hasPassword ? 'Change password' : 'Set password'}</Button>
          <p className="text-sm text-muted">Signed in with: {[user.hasPassword && 'password', user.google && 'Google', user.bharatId && 'Bharat ID', 'email/mobile code'].filter(Boolean).join(', ')}.</p>
        </form>
      </div>
    </>
  );
}

/* ---------- shell ---------- */

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/donations', label: 'Donations', icon: IndianRupee },
  { to: '/dashboard/monthly', label: 'Monthly giving', icon: Repeat },
  { to: '/dashboard/membership', label: 'Membership', icon: BadgeCheck },
  { to: '/dashboard/bharat-id', label: 'Bharat ID', icon: Fingerprint, badge: true },
  { to: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, refresh] = useLoad('/me/summary');
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  const pending = summary?.membership && summary.bharat !== 'complete';
  return (
    <main id="main" className="container-x pb-24 pt-[96px]">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <p className="eyebrow">My account</p>
            <p className="mt-2 truncate font-medium" title={user.email}>{user.name}</p>
            {summary?.membership && <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-on-accent"><BadgeCheck aria-hidden className="size-3.5" /> Member</p>}
          </div>
          <nav aria-label="My account" className="-mx-1 flex gap-1 overflow-x-auto pb-2 lg:mt-8 lg:flex-col lg:overflow-visible">
            {links.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
                <Icon aria-hidden className="size-4" /> {label}
                {badge && pending && <span className="ml-auto rounded-full bg-accent px-2 text-[0.65rem] font-medium uppercase text-on-accent">Pending</span>}
              </NavLink>
            ))}
            <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted hover:text-ink lg:mt-6">
              <LogOut aria-hidden className="size-4" /> Log out
            </button>
          </nav>
        </aside>
        <div className="mt-8 min-w-0 lg:mt-0">
          <Routes>
            <Route index element={<Overview summary={summary} />} />
            <Route path="donations" element={<Donations />} />
            <Route path="monthly" element={<Monthly />} />
            <Route path="membership" element={<MembershipPage summary={summary} refresh={refresh} />} />
            <Route path="bharat-id" element={<BharatIdPage summary={summary} refresh={refresh} />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="profile" element={<Profile refresh={refresh} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}
