// Dashboard: monthly gifts, with a button to stop them.

import { useState } from 'react';
import { Repeat } from 'lucide-react';
import { PageTitle, programmeLabel, pill } from '../../components/Desk.jsx';
import { Button, Notice, Tag } from '../../components/ui.jsx';
import { api, fmtDate, inr } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Monthly() {
  useTitle('Monthly giving', 'My account');
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
      <PageTitle sub="Monthly gifts through Razorpay. A receipt arrives after every payment; stop any time.">
        Monthly giving
      </PageTitle>
      {error && <Notice kind="error">{error}</Notice>}
      {d && active.length === 0 && (
        <div className="rounded-[22px] border border-rule p-8">
          <p className="text-lg">You have no monthly gift running.</p>
          <p className="mt-2 text-muted">
            Steady monthly support lets us plan plantations, kits and scholarships ahead.
          </p>
          <div className="mt-6">
            <Button to="/donate?monthly=1" variant="accent" icon={Repeat}>
              Start a monthly gift
            </Button>
          </div>
        </div>
      )}
      <ul className="mt-6 space-y-4">
        {d?.subscriptions?.map((s) => (
          <li
            key={s._id}
            className={`flex flex-col gap-4 rounded-[18px] border p-6 sm:flex-row sm:items-center sm:justify-between ${s.status === 'active' ? 'border-ink' : 'border-rule'}`}
          >
            <div>
              <p className="big-num !text-2xl">
                {inr(s.amount)}
                <span className="text-base text-muted"> / month</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {programmeLabel(s.programme)} · {s.charges} payment{s.charges === 1 ? '' : 's'}
                {s.lastChargedAt && ` · last ${fmtDate(s.lastChargedAt)}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="capitalize">{s.status === 'halted' ? 'Paused by bank' : s.status}</Tag>
              {['active', 'halted'].includes(s.status) && (
                <button onClick={() => cancel(s)} disabled={busy === s._id} className={pill}>
                  {busy === s._id ? 'Stopping…' : 'Stop monthly gift'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
