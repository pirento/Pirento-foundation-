// Admin home: totals, giving by programme, and a nudge to fill in registration numbers.

import { Link } from 'react-router';
import { Award, Plus } from 'lucide-react';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Notice } from '../../components/ui.jsx';
import { donateOptions } from '../../data/site.js';
import { inr } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';
import { useSettings } from '../../lib/settings.jsx';

export default function Overview() {
  useTitle('Overview', 'Admin');
  const [s] = useLoad('/admin/stats');
  const st = useSettings();
  if (!s) return <p className="text-muted">Loading…</p>;
  if (s.error) return <Notice kind="error">{s.error}</Notice>;
  return (
    <>
      <PageTitle sub="Donations, members and messages at a glance.">Overview</PageTitle>
      {!st.reg80G && (
        <div className="mb-8">
          <Notice kind="error">
            80G and registration numbers are not entered yet, so receipts carry no 80G particulars.{' '}
            <Link to="/admin/settings" className="underline">
              Open Settings
            </Link>
            .
          </Notice>
        </div>
      )}
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Raised (paid)', inr(s.raised)],
          ['Donations', s.donations],
          ['Unique donors', s.donors],
          ['Members', s.members],
          ['Monthly donors', `${s.monthlyDonors} · ${inr(s.monthlyAmount)}/mo`],
          ['Accounts', s.users],
          ['Valid certificates', s.certificates],
          ['New messages', s.newMessages],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper p-6">
            <dt className="eyebrow">{k}</dt>
            <dd className="big-num mt-3">{v}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-14 text-2xl">By programme</h2>
      <ul className="mt-4 border-t border-rule">
        {donateOptions.map((o) => {
          const row = s.byProgramme.find((b) => b._id === o.key);
          const pct = s.raised ? Math.round(((row?.raised ?? 0) / s.raised) * 100) : 0;
          return (
            <li
              key={o.key}
              className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-b border-rule py-4 sm:grid-cols-[14rem_1fr_9rem]"
            >
              <span>{o.label}</span>
              <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-stone sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right tabular-nums">
                {inr(row?.raised)} <span className="text-xs text-muted">({row?.count ?? 0})</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/admin/donations" variant="outline" icon={Plus}>
          Record offline donation
        </Button>
        <Button to="/admin/certificates" variant="outline" icon={Award}>
          Issue certificate
        </Button>
      </div>
    </>
  );
}
