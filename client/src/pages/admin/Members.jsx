// Admin: supporter members, offline joins and cancellations.

import { useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { bharatState } from '../../components/BharatId.jsx';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api, fmtDate, inr } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Members() {
  useTitle('Members', 'Admin');
  const [d, reload] = useLoad('/admin/members');
  const [f, setF] = useState({ email: '', method: 'upi', reference: '' });
  const [msg, setMsg] = useState(null);
  const add = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/admin/members', { method: 'POST', body: f });
      setMsg({ ok: `Member ${r.membership.memberNo} added; certificate and email sent.` });
      setF({ email: '', method: 'upi', reference: '' });
      reload();
    } catch (err) {
      setMsg({ error: err.message });
    }
  };
  const cancel = async (m) => {
    if (!confirm(`Cancel membership ${m.memberNo}? Its certificate will be revoked.`)) return;
    await api(`/admin/members/${m._id}`, { method: 'PATCH', body: { status: 'cancelled' } });
    reload();
  };
  const active = d?.members?.filter((m) => m.status === 'active') ?? [];
  return (
    <>
      <PageTitle sub="Supporter members, their validity and Bharat ID status. Online joins appear here automatically.">
        Members
      </PageTitle>
      <form onSubmit={add} className="mb-12 space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
        <h2 className="text-2xl">Add an offline member</h2>
        <p className="text-sm text-muted">
          For a fee paid by UPI, bank, cash or cheque. The person must already have an account.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Account email"
            name="memail"
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
          <Field label="Mode" id="mmethod" required>
            <select
              id="mmethod"
              className="input"
              value={f.method}
              onChange={(e) => setF({ ...f, method: e.target.value })}
            >
              {[
                ['upi', 'UPI'],
                ['bank', 'Bank transfer'],
                ['cash', 'Cash'],
                ['cheque', 'Cheque'],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Reference / UTR"
            name="mref"
            value={f.reference}
            onChange={(e) => setF({ ...f, reference: e.target.value })}
          />
        </div>
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <Button type="submit" variant="accent" icon={Plus}>
          Add member
        </Button>
      </form>
      <p className="mb-4 text-sm text-muted">
        {active.length} active · Bharat ID complete for{' '}
        {active.filter((m) => bharatState(m.user?.bharatId) === 'complete').length}
      </p>
      <div className="overflow-x-auto rounded-[18px] border border-rule">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-rule text-muted">
            <tr>
              {['Member', 'Person', 'Valid', 'Bharat ID', 'Fee', ''].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d?.members?.map((m) => (
              <tr
                key={m._id}
                className={`border-b border-rule last:border-0 ${m.status !== 'active' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 font-mono">
                  {m.memberNo}
                  <br />
                  <span className="font-sans text-xs capitalize text-muted">{m.status}</span>
                </td>
                <td className="px-4 py-3">
                  {m.user ? (
                    <Link to={`/admin/users/${m.user._id}`} className="hover:underline">
                      {m.user.name}
                    </Link>
                  ) : (
                    '–'
                  )}
                  <br />
                  <span className="text-xs text-muted">{m.user?.email}</span>
                </td>
                <td className="px-4 py-3">
                  {fmtDate(m.validFrom)} – {m.validTo ? fmtDate(m.validTo) : 'lifetime'}
                </td>
                <td className="px-4 py-3">
                  {m.user?.bharatId ? (
                    <>
                      {m.user.bharatId.number}
                      <br />
                      <span className="text-xs text-muted">{bharatState(m.user.bharatId)}</span>
                    </>
                  ) : (
                    <span className="text-muted">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inr(m.fee)} <span className="text-xs text-muted">{m.method}</span>
                  <br />
                  <span className="text-xs text-muted">{m.receiptNo}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {m.status === 'active' && (
                    <span className="flex justify-end gap-1.5">
                      <a
                        href={`/api/membership/${m._id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
                      >
                        Receipt
                      </a>
                      <button
                        onClick={() => cancel(m)}
                        className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
                      >
                        Cancel
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {d?.members?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
