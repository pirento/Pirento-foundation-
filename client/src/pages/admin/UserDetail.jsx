// Admin: everything about one person — profile, gifts, membership, monthly giving, certificates.

import { Link, useParams } from 'react-router';
import { BHARAT_STATUS, bharatState } from '../../components/BharatId.jsx';
import { CertRow } from '../../components/CertRow.jsx';
import { PageTitle, programmeLabel } from '../../components/Desk.jsx';
import { Notice } from '../../components/ui.jsx';
import { fmtDate, inr } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function UserDetail() {
  const { id } = useParams();
  const [d] = useLoad(`/admin/users/${id}`);
  useTitle(d?.user?.name ?? 'User', 'Admin');
  if (!d) return <p className="text-muted">Loading…</p>;
  if (d.error) return <Notice kind="error">{d.error}</Notice>;
  const u = d.user;
  const total = d.donations.filter((x) => x.status === 'paid').reduce((a, x) => a + x.amount, 0);
  return (
    <>
      <p className="mb-4">
        <Link to="/admin/users" className="text-sm text-muted underline underline-offset-4">
          ← All users
        </Link>
      </p>
      <PageTitle sub={`${u.email}${u.phone ? ` · ${u.phone}` : ''} · joined ${fmtDate(u.createdAt)}`}>
        {u.name}
      </PageTitle>
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule grid-cols-2 xl:grid-cols-4">
        {[
          ['Given', inr(total)],
          ['Donations', d.donations.length],
          ['Membership', d.memberships.find((m) => m.status === 'active')?.memberNo ?? '–'],
          [
            'Bharat ID',
            u.bharatId ? `${u.bharatId.number ?? '—'} · ${bharatState(u.bharatId)}` : 'Not linked',
          ],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 bg-paper p-4 sm:p-6">
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-3 text-xl">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 grid gap-10 xl:grid-cols-2">
        <div>
          <h2 className="text-2xl">Profile</h2>
          <dl className="mt-4 divide-y divide-rule border-y border-rule text-sm">
            {[
              ['Email', `${u.email} ${u.emailVerified ? '✓' : '(unconfirmed)'}`],
              ['Mobile', u.phone ? `${u.phone} ${u.phoneVerified ? '✓' : '(unconfirmed)'}` : '–'],
              ['PAN', u.pan],
              ['Address', u.address],
              [
                'Sign-in',
                [u.hasPassword && 'password', u.google && 'Google', u.bharatId && 'Bharat ID']
                  .filter(Boolean)
                  .join(', ') || 'codes only',
              ],
              [
                'Bharat ID status',
                u.bharatId ? (BHARAT_STATUS[u.bharatId.status]?.label ?? u.bharatId.status) : '–',
              ],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd>{v || '–'}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-2xl">Membership & monthly</h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule text-sm">
            {d.memberships.map((m) => (
              <li key={m._id} className="flex justify-between py-2.5">
                <span>
                  {m.memberNo} · {m.receiptNo}
                </span>
                <span className="capitalize text-muted">
                  {m.status} · to {m.validTo ? fmtDate(m.validTo) : 'lifetime'}
                </span>
              </li>
            ))}
            {d.subscriptions.map((x) => (
              <li key={x._id} className="flex justify-between py-2.5">
                <span>
                  {inr(x.amount)}/month · {x.charges} paid
                </span>
                <span className="capitalize text-muted">{x.status}</span>
              </li>
            ))}
            {!d.memberships.length && !d.subscriptions.length && <li className="py-2.5 text-muted">None</li>}
          </ul>
        </div>
      </div>
      <h2 className="mt-12 text-2xl">Donations</h2>
      <ul className="mt-4 divide-y divide-rule border-y border-rule text-sm">
        {d.donations.map((x) => (
          <li key={x._id} className="flex flex-wrap justify-between gap-3 py-2.5">
            <span>
              {fmtDate(x.paidAt ?? x.createdAt)} · {inr(x.amount)} · {programmeLabel(x.programme)}
              {x.subscription && ' · monthly'}
            </span>
            <span className="text-muted">
              {x.receiptNo ?? x.status}
              {x.status === 'paid' && (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={`/api/donations/${x._id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    receipt
                  </a>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-2xl">Certificates</h2>
      <ul className="mt-4 border-t border-rule">
        {d.certificates.map((c) => (
          <CertRow key={c._id} c={c} />
        ))}
      </ul>
    </>
  );
}
