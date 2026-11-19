// Admin: Razorpay subscriptions (monthly gifts).

import { Link } from 'react-router';
import { PageTitle, programmeLabel } from '../../components/Desk.jsx';
import { fmtDate, inr } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function MonthlyDonors() {
  useTitle('Monthly donors', 'Admin');
  const [d] = useLoad('/admin/subscriptions');
  return (
    <>
      <PageTitle sub="Razorpay subscriptions. Every charge also appears under Donations with its own receipt.">
        Monthly donors
      </PageTitle>
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>
              {['Donor', 'Amount', 'Programme', 'Payments', 'Status', 'Since'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d?.subscriptions?.map((x) => (
              <tr key={x._id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">
                  {x.user ? (
                    <Link to={`/admin/users/${x.user}`} className="hover:underline">
                      {x.name}
                    </Link>
                  ) : (
                    x.name
                  )}
                  <br />
                  <span className="text-xs text-muted">{x.email}</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{inr(x.amount)}/mo</td>
                <td className="px-4 py-3">{programmeLabel(x.programme)}</td>
                <td className="px-4 py-3">
                  {x.charges}
                  {x.lastChargedAt && (
                    <span className="text-xs text-muted"> · last {fmtDate(x.lastChargedAt)}</span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{x.status}</td>
                <td className="px-4 py-3">{fmtDate(x.createdAt)}</td>
              </tr>
            ))}
            {d?.subscriptions?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No monthly donors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
