import { Fingerprint } from 'lucide-react';

// Status words follow the Bharat ID by Pirento trust model: precise, never "verified" in general.
export const BHARAT_STATUS = {
  created: { label: 'Registered with Pirento', complete: false },
  contact_confirmed: { label: 'Contact method confirmed', complete: true },
  profile_submitted: { label: 'Information submitted; not independently verified', complete: true },
  pirento_reviewed: { label: 'Reviewed by Pirento', complete: true },
  provider_verified: { label: 'Verified by an authorised provider', complete: true },
  restricted: { label: 'Restricted, contact Pirento support', complete: false },
  closed: { label: 'Closed', complete: false },
};

export const bharatState = (b) => (!b ? 'not_linked' : BHARAT_STATUS[b.status]?.complete ? 'complete' : 'pending');
const group = (n) => (n ? n.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') : '—');

/** Digital account card. Deliberately plain: no emblems, flags or official-looking devices. */
export function BharatIdCard({ b, name }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-inverse p-6 text-on-inverse md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.06em]">Bharat ID by Pirento</p>
          <p className="mt-1 text-xs text-inverse-muted">Private Pirento Account ID — Not a Government ID</p>
        </div>
        <Fingerprint aria-hidden className="size-6 text-accent" />
      </div>
      <p className="poster mt-8 text-[clamp(2rem,4.5vw,3rem)] tabular-nums tracking-wide">{group(b?.number)}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 text-sm">
        <span>{b?.name || name}</span>
        <span className="rounded-full border border-inverse-rule px-3 py-1 text-xs">{b ? BHARAT_STATUS[b.status]?.label ?? b.status : 'Not linked yet'}</span>
      </div>
    </div>
  );
}
