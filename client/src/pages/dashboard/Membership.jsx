// Dashboard: membership card, certificate, fee receipt, renewal and history.

import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Download, BadgeCheck, FileText } from 'lucide-react';
import { BharatIdCard, bharatState } from '../../components/BharatId.jsx';
import { PageTitle, pill } from '../../components/Desk.jsx';
import { Button, Notice } from '../../components/ui.jsx';
import { fmtDate, inr, pdfUrl } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';
import { useSettings } from '../../lib/settings.jsx';
import { useJoin } from '../Membership.jsx';

export default function MembershipPage({ summary, refresh }) {
  useTitle('Membership', 'My account');
  const st = useSettings();
  const [params] = useSearchParams();
  const [d, reload] = useLoad('/membership/mine');
  const { join, busy, error } = useJoin();
  useEffect(() => void (params.get('joined') && (reload(), refresh())), [params, reload, refresh]);
  const m = d?.current;
  const renewable = m?.validTo && new Date(m.validTo) - Date.now() < 30 * 86400_000;
  return (
    <>
      <PageTitle sub="Your supporter membership of Pirento Foundation.">Membership</PageTitle>
      {params.get('joined') && (
        <div className="mb-8">
          <Notice>
            Welcome! Your membership is active. Your certificate and fee receipt are below and in your email.
          </Notice>
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      {d && !m && (
        <div className="rounded-[22px] border border-rule p-8">
          <p className="text-lg">You are not a member yet.</p>
          <p className="mt-2 max-w-lg text-muted">
            Membership is {inr(st.membershipFee ?? 1000)} for{' '}
            {st.membershipMonths ? `${st.membershipMonths} months` : 'life'}, with a numbered certificate,
            member card and your Bharat ID by Pirento.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={join} variant="accent" disabled={busy}>
              {busy ? 'Opening payment…' : `Join for ${inr(st.membershipFee ?? 1000)}`}
            </Button>
            <Button to="/membership" variant="outline">
              What members get
            </Button>
          </div>
        </div>
      )}
      {m && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[22px] border-2 border-ink bg-stone p-7">
            <div className="flex items-center gap-3">
              <BadgeCheck aria-hidden className="size-6" />
              <p className="text-xl font-medium">A Pirento Foundation Member</p>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted">Member no.</dt>
                <dd className="font-mono text-base">{m.memberNo}</dd>
              </div>
              <div>
                <dt className="text-muted">Valid until</dt>
                <dd className="text-base">{m.validTo ? fmtDate(m.validTo) : 'Lifetime'}</dd>
              </div>
              <div>
                <dt className="text-muted">Member since</dt>
                <dd className="text-base">{fmtDate(m.validFrom)}</dd>
              </div>
              <div>
                <dt className="text-muted">Fee receipt</dt>
                <dd className="text-base">{m.receiptNo}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={pdfUrl(m.certNo)} target="_blank" rel="noopener noreferrer" className={pill}>
                <Download aria-hidden className="size-4" /> Certificate{' '}
                <span className="sr-only">(PDF, opens in a new tab)</span>
              </a>
              <a
                href={`/api/membership/${m._id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className={pill}
              >
                <FileText aria-hidden className="size-4" /> Fee receipt{' '}
                <span className="sr-only">(PDF, opens in a new tab)</span>
              </a>
              {renewable && (
                <Button onClick={join} variant="accent" disabled={busy}>
                  Renew
                </Button>
              )}
            </div>
          </div>
          <div>
            <BharatIdCard b={summary?.user.bharatId} name={summary?.user.name} />
            {bharatState(summary?.user.bharatId) !== 'complete' && (
              <p className="mt-4 text-sm">
                <strong className="font-medium">Bharat ID: pending.</strong>{' '}
                <Link to="/dashboard/bharat-id" className="underline underline-offset-4">
                  Complete it now
                </Link>
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
                <span>
                  {h.receiptNo} · {inr(h.fee)}
                </span>
                <span className="text-muted capitalize">
                  {h.status} · {fmtDate(h.validFrom)} – {h.validTo ? fmtDate(h.validTo) : 'lifetime'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
