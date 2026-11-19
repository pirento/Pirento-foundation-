// Dashboard: the donor's gifts with 80G receipts and certificates.

import { Link } from 'react-router';
import { Download, FileText } from 'lucide-react';
import { PageTitle, programmeLabel, pill } from '../../components/Desk.jsx';
import { Notice } from '../../components/ui.jsx';
import { fmtDate, inr, pdfUrl } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Donations() {
  useTitle('Donations', 'My account');
  const [d] = useLoad('/donations/mine');
  return (
    <>
      <PageTitle sub="Every gift with its 80G receipt and certificate. Form 10BE for your tax claim follows after we file Form 10BD.">
        Donations
      </PageTitle>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      {d?.donations?.length === 0 && (
        <p className="text-muted">
          No donations yet.{' '}
          <Link to="/donate" className="text-ink underline underline-offset-4">
            Make your first one
          </Link>
          .
        </p>
      )}
      <ul className="border-t border-rule">
        {d?.donations?.map((x) => (
          <li
            key={x._id}
            className="flex flex-col gap-4 border-b border-rule py-5 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="big-num !text-2xl">
                {inr(x.amount)}{' '}
                {x.status === 'refunded' && (
                  <span className="align-middle text-sm font-normal text-muted">(refunded)</span>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">
                {fmtDate(x.paidAt)} · {x.receiptNo} · {programmeLabel(x.programme)}
                {x.subscription && ' · monthly'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {x.receiptUrl && (
                <a href={x.receiptUrl} target="_blank" rel="noopener noreferrer" className={pill}>
                  <FileText aria-hidden className="size-4" /> 80G receipt{' '}
                  <span className="sr-only">(PDF, opens in a new tab)</span>
                </a>
              )}
              {x.certNo && x.status === 'paid' && (
                <a href={pdfUrl(x.certNo)} target="_blank" rel="noopener noreferrer" className={pill}>
                  <Download aria-hidden className="size-4" /> Certificate{' '}
                  <span className="sr-only">(PDF, opens in a new tab)</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
