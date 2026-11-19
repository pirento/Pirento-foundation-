import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Download, LogOut } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Label, Tag } from '../components/ui.jsx';
import { api, fmtDate, inr, pdfUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { donateOptions } from '../data/site.js';

const programmeLabel = (k) => donateOptions.find((o) => o.key === k)?.label ?? k;

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
          <a href={pdfUrl(c.certNo)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink">
            <Download aria-hidden className="size-4" /> View certificate <span className="sr-only">(PDF, opens in a new tab)</span>
          </a>
        )}
        {children}
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([api('/donations/mine'), api('/certificates/mine')]).then(([d, c]) => setData({ donations: d.donations, certificates: c.certificates }), () => setData({ donations: [], certificates: [], error: true }));
  }, []);
  const total = data?.donations.reduce((s, d) => s + d.amount, 0) ?? 0;

  return (
    <Page title="My account">
      <section className="pb-28 pt-36 md:pt-44">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p data-hero-after className="eyebrow">My account</p>
              <h1 data-hero className="h-hero mt-6"><span className="line"><span>Namaste, {user.name.split(' ')[0]}.</span></span></h1>
            </div>
            <div data-hero-after className="flex flex-wrap gap-3">
              {user.role === 'admin' && <Button to="/admin" variant="outline">Admin panel</Button>}
              <Button onClick={logout} variant="outline" icon={LogOut}>Log out</Button>
            </div>
          </div>

          <dl data-hero-after className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-3">
            {[['Total given', inr(total)], ['Donations', data?.donations.length ?? '–'], ['Certificates', data?.certificates.length ?? '–']].map(([k, v]) => (
              <div key={k} className="bg-paper p-7">
                <dt className="eyebrow">{k}</dt>
                <dd className="big-num mt-3">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-20 grid gap-16 lg:grid-cols-2">
            <div>
              <Label n={1}>Donations</Label>
              {data?.donations.length === 0 && (
                <p className="mt-6 text-muted">No donations on this account yet. <Link to="/donate" className="text-ink underline underline-offset-4">Make your first one</Link>.</p>
              )}
              <ul className="mt-6 border-t border-rule">
                {data?.donations.map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-4 border-b border-rule py-5">
                    <div>
                      <p className="big-num !text-2xl">{inr(d.amount)}</p>
                      <p className="mt-1 text-sm text-muted">{fmtDate(d.paidAt)} · {d.receiptNo}</p>
                    </div>
                    <Tag>{programmeLabel(d.programme)}</Tag>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Label n={2}>Certificates</Label>
              {data?.certificates.length === 0 && <p className="mt-6 text-muted">Certificates appear here after a donation or when we issue one to you.</p>}
              <ul className="mt-6 border-t border-rule">
                {data?.certificates.map((c) => <CertRow key={c._id} c={c} />)}
              </ul>
            </div>
          </div>
          {data?.error && <p className="mt-8 text-sm" role="alert">Could not load your records. Please refresh.</p>}
        </div>
      </section>
    </Page>
  );
}
