// Dashboard home: totals, member badge and the "finish setting up" checklist.

import { Link } from 'react-router';
import { BadgeCheck, Repeat, Check } from 'lucide-react';
import { PageTitle } from '../../components/Desk.jsx';
import { Button } from '../../components/ui.jsx';
import { fmtDate, inr } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';

export default function Overview({ summary }) {
  useTitle('Overview', 'My account');
  if (!summary) return <p className="text-muted">Loading…</p>;
  const { user, totals, membership, checklist, bharat } = summary;
  const todo = checklist.filter((c) => !c.done);
  const links = {
    email: '/dashboard/profile',
    password: '/dashboard/profile',
    pan: '/dashboard/profile',
    bharat: '/dashboard/bharat-id',
  };
  return (
    <>
      <PageTitle eyebrow={membership ? `Pirento Foundation member · ${membership.memberNo}` : 'My account'}>
        Namaste, {user.name.split(' ')[0]}.
      </PageTitle>
      {membership && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[18px] border-2 border-ink bg-stone p-5">
          <BadgeCheck aria-hidden className="size-6" />
          <p className="font-medium">A Pirento Foundation Member</p>
          <span className="text-sm text-muted">
            · {membership.validTo ? `valid until ${fmtDate(membership.validTo)}` : 'lifetime'} · Bharat ID{' '}
            {bharat === 'complete' ? 'complete' : bharat === 'pending' ? 'pending' : 'not linked'}
          </span>
        </div>
      )}
      <dl className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total given', inr(totals.given)],
          [`This year (FY ${totals.fy})`, inr(totals.thisFy)],
          ['Monthly gift', totals.monthly ? `${inr(totals.monthly)}/mo` : '–'],
          ['Certificates', totals.certificates],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper p-6">
            <dt className="eyebrow">{k}</dt>
            <dd className="big-num mt-3">{v}</dd>
          </div>
        ))}
      </dl>
      {todo.length > 0 && (
        <div className="mt-10 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Finish setting up</h2>
          <ul className="mt-4 divide-y divide-rule">
            {checklist.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-4 py-3">
                <span className={`flex items-center gap-3 ${c.done ? 'text-muted line-through' : ''}`}>
                  <span
                    className={`grid size-6 place-items-center rounded-full border ${c.done ? 'border-accent bg-accent text-on-accent' : 'border-rule'}`}
                  >
                    {c.done && <Check aria-hidden className="size-3.5" />}
                  </span>
                  {c.label}
                </span>
                {!c.done && (
                  <Link to={links[c.key]} className="text-sm underline underline-offset-4">
                    {c.key === 'bharat' ? 'Pending · complete now' : 'Do it'}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/donate" variant="accent">
          Donate
        </Button>
        {!membership && (
          <Button to="/dashboard/membership" variant="outline">
            Become a member
          </Button>
        )}
        <Button to="/donate?monthly=1" variant="outline" icon={Repeat}>
          Give monthly
        </Button>
      </div>
    </>
  );
}
