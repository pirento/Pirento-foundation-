// Shared building blocks for the "desk" pages: the donor dashboard and the admin panel.
import { donateOptions } from '../data/site.js';

/** Big poster-style page heading with an optional eyebrow above and a short line below. */
export function PageTitle({ children, sub, eyebrow }) {
  return (
    <div className="mb-10">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="poster text-[clamp(2.6rem,5vw,4.5rem)]">{children}</h1>
      {sub && <p className="mt-2 max-w-xl text-muted">{sub}</p>}
    </div>
  );
}

/** Human label for a programme key, e.g. "green" → "Pirento Green". */
export const programmeLabel = (key) => donateOptions.find((o) => o.key === key)?.label ?? key;

/** Class list for the small outlined pill links (receipt, certificate, …). */
export const pill =
  'inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink';
