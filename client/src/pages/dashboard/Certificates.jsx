// Dashboard: every certificate issued to this person.

import { CertRow } from '../../components/CertRow.jsx';
import { PageTitle } from '../../components/Desk.jsx';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Certificates() {
  useTitle('Certificates', 'My account');
  const [d] = useLoad('/certificates/mine');
  return (
    <>
      <PageTitle sub="Donation, membership and volunteer certificates. Anyone can check them on the Verify page.">
        Certificates
      </PageTitle>
      {d?.certificates?.length === 0 && (
        <p className="text-muted">
          Certificates appear here after a donation, when you join, or when we issue one to you.
        </p>
      )}
      <ul className="border-t border-rule">
        {d?.certificates?.map((c) => (
          <CertRow key={c._id} c={c} />
        ))}
      </ul>
    </>
  );
}
