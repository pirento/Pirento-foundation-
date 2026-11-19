// Admin: searchable list of accounts.

import { useState } from 'react';
import { Link } from 'react-router';
import { bharatState } from '../../components/BharatId.jsx';
import { PageTitle } from '../../components/Desk.jsx';
import { Notice } from '../../components/ui.jsx';
import { fmtDate } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Users() {
  useTitle('Users', 'Admin');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [d] = useLoad(`/admin/users?q=${encodeURIComponent(query)}`);
  return (
    <>
      <PageTitle sub="Everyone with an account. Open a person to see all their gifts, membership and Bharat ID.">
        Users
      </PageTitle>
      <form onSubmit={(e) => (e.preventDefault(), setQuery(q))} className="mb-6 flex max-w-md gap-2">
        <label htmlFor="uq" className="sr-only">
          Search users
        </label>
        <input
          id="uq"
          className="input !py-2"
          placeholder="Name, email, mobile, Bharat ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="rounded-full border border-rule px-4 text-sm hover:border-ink">Search</button>
      </form>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>
              {['Name', 'Email', 'Mobile', 'Sign-in', 'Bharat ID', 'Joined'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d?.users?.map((u) => (
              <tr key={u.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/admin/users/${u.id}`} className="underline-offset-2 hover:underline">
                    {u.name}
                  </Link>
                  {u.role === 'admin' && <span className="ml-1 text-xs text-muted">(admin)</span>}
                </td>
                <td className="px-4 py-3">
                  {u.email} {u.emailVerified && <span className="text-xs text-muted">✓</span>}
                </td>
                <td className="px-4 py-3">
                  {u.phone || '–'} {u.phoneVerified && <span className="text-xs text-muted">✓</span>}
                </td>
                <td className="px-4 py-3">
                  {[u.google && 'Google', u.bharatId && 'Bharat ID', u.hasPassword && 'Password']
                    .filter(Boolean)
                    .join(', ') || 'Code'}
                </td>
                <td className="px-4 py-3">
                  {u.bharatId ? (
                    <>
                      {u.bharatId.number}
                      <br />
                      <span className="text-xs text-muted">{bharatState(u.bharatId)}</span>
                    </>
                  ) : (
                    '–'
                  )}
                </td>
                <td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
