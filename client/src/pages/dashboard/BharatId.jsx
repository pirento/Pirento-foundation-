// Dashboard: link, refresh or unlink Bharat ID by Pirento and show the details it shared.

import { useSearchParams } from 'react-router';
import { ExternalLink, Fingerprint } from 'lucide-react';
import { BharatIdCard, BHARAT_STATUS, bharatState } from '../../components/BharatId.jsx';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Notice } from '../../components/ui.jsx';
import { api, fmtDate } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useTitle } from '../../lib/hooks.js';
import { useSettings } from '../../lib/settings.jsx';

export default function BharatIdPage({ summary, refresh }) {
  useTitle('Bharat ID', 'My account');
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
      <PageTitle sub="Your private Pirento account ID. It is not Aadhaar or any government ID, and not proof of citizenship or residence.">
        Bharat ID by Pirento
      </PageTitle>
      {params.get('error') && (
        <div className="mb-6">
          <Notice kind="error">{params.get('error')}</Notice>
        </div>
      )}
      {params.get('bharatid') === 'linked' && (
        <div className="mb-6">
          <Notice>Bharat ID linked. Status: {BHARAT_STATUS[b?.status]?.label ?? b?.status}.</Notice>
        </div>
      )}
      <div className="grid gap-8 xl:grid-cols-2">
        <BharatIdCard b={b} name={summary?.user.name} />
        <div className="rounded-[22px] border border-rule p-7">
          <p className="eyebrow">Status</p>
          <p className="mt-2 text-2xl">
            {state === 'complete' ? 'Complete' : state === 'pending' ? 'Pending' : 'Not linked'}
          </p>
          <p className="mt-2 text-muted">
            {state === 'not_linked' &&
              'Create your Bharat ID on Bharat ID by Pirento, then link it here. The full process happens on Bharat ID.'}
            {state === 'pending' &&
              'Your Bharat ID is linked but not complete yet. Finish the steps on Bharat ID by Pirento, then refresh the status here.'}
            {state === 'complete' &&
              'Your Bharat ID is linked and complete. Its details show below and on your membership card.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {state !== 'complete' && st.bharatIdUrl && (
              <Button
                href={st.bharatIdUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                icon={ExternalLink}
              >
                Open Bharat ID by Pirento <span className="sr-only">(opens in a new tab)</span>
              </Button>
            )}
            <Button
              href={`/api/auth/bharatid/start?mode=link&next=/dashboard/bharat-id`}
              variant="accent"
              icon={Fingerprint}
            >
              {b ? 'Refresh status' : 'Link my Bharat ID'}
            </Button>
          </div>
        </div>
      </div>
      {b && (
        <div className="mt-10 rounded-[22px] border border-rule p-7">
          <h2 className="text-2xl">Details shared from Bharat ID</h2>
          <p className="mt-1 text-sm text-muted">
            Shared with your consent when you linked it. Information is shown exactly as Bharat ID reports it.
          </p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              ['Bharat ID number', b.number],
              ['Status', BHARAT_STATUS[b.status]?.label ?? b.status],
              ['Name', b.name],
              ['Email', b.email],
              ['Mobile', b.phone],
              ['Linked on', b.linkedAt && fmtDate(b.linkedAt)],
              ['Last checked', b.checkedAt && fmtDate(b.checkedAt)],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-rule pb-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-1">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={unlink}
            className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            Unlink Bharat ID
          </button>
        </div>
      )}
    </>
  );
}
