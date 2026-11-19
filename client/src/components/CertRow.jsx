// One certificate in a list: a small thumbnail, its details, and a "view" link (plus any extra buttons).
import { Download } from 'lucide-react';
import { fmtDate, pdfUrl } from '../lib/api.js';
import { pill } from './Desk.jsx';

export function CertRow({ c, children }) {
  return (
    <li className="flex flex-col gap-4 border-b border-rule py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid h-14 w-[4.5rem] shrink-0 place-items-center rounded-[10px] border border-rule bg-stone"
        >
          <span className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
        </span>
        <div>
          <p className="font-medium">
            {c.title}
            {c.revoked && <span className="ml-2 text-xs text-muted">(revoked)</span>}
          </p>
          <p className="text-sm text-muted">
            {c.recipientName} · {fmtDate(c.createdAt)} · <span className="font-mono text-xs">{c.certNo}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!c.revoked && (
          <a href={pdfUrl(c.certNo)} target="_blank" rel="noopener noreferrer" className={pill}>
            <Download aria-hidden className="size-4" /> View certificate{' '}
            <span className="sr-only">(PDF, opens in a new tab)</span>
          </a>
        )}
        {children}
      </div>
    </li>
  );
}
