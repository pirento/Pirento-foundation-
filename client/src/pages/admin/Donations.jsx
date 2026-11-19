// Admin: all donations (search, receipts, refunds, CSV) and the form for offline gifts.

import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Download, Mail, FileText, Undo2 } from 'lucide-react';
import { PageTitle, programmeLabel } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { donateOptions } from '../../data/site.js';
import { api, fmtDate, inr, pdfUrl } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

function OfflineDonation({ onDone }) {
  const empty = {
    name: '',
    email: '',
    phone: '',
    pan: '',
    address: '',
    amount: '',
    programme: 'general',
    method: 'bank',
    reference: '',
  };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/donations', { method: 'POST', body: { ...f, amount: Number(f.amount) } });
      setMsg({
        ok: `Recorded ${r.donation.receiptNo}. Certificate ${r.certNo} issued and receipt emailed.`,
        certNo: r.certNo,
      });
      setF(empty);
      onDone();
    } catch (err) {
      setMsg({ error: err.message });
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
      <h2 className="text-2xl">Record an offline donation</h2>
      <p className="text-sm text-muted">
        Bank transfer, UPI, cash or cheque. Receipt number, certificate and email go out automatically.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Donor name" name="name" required value={f.name} onChange={set('name')} />
        <Field label="Email" name="email" type="email" required value={f.email} onChange={set('email')} />
        <Field
          label="Amount (₹)"
          name="amount"
          inputMode="numeric"
          required
          value={f.amount}
          onChange={set('amount')}
        />
        <Field label="Mode" id="method" required>
          <select id="method" className="input" value={f.method} onChange={set('method')}>
            {[
              ['bank', 'Bank transfer'],
              ['upi', 'UPI'],
              ['cash', 'Cash'],
              ['cheque', 'Cheque'],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Programme" id="programme" required>
          <select id="programme" className="input" value={f.programme} onChange={set('programme')}>
            {donateOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference / UTR" name="reference" value={f.reference} onChange={set('reference')} />
        <Field label="Phone" name="phone" value={f.phone} onChange={set('phone')} />
        <Field label="PAN" name="pan" maxLength={10} value={f.pan} onChange={set('pan')} />
      </div>
      <Field label="Address (for 80G receipt)" name="address" value={f.address} onChange={set('address')} />
      {msg?.error && <Notice kind="error">{msg.error}</Notice>}
      {msg?.ok && (
        <Notice>
          {msg.ok}{' '}
          <a className="underline" href={pdfUrl(msg.certNo)} target="_blank" rel="noopener noreferrer">
            View PDF (opens in a new tab)
          </a>
        </Notice>
      )}
      <Button type="submit" variant="accent" icon={Plus}>
        Record donation
      </Button>
    </form>
  );
}

export default function Donations() {
  useTitle('Donations', 'Admin');
  const [status, setStatus] = useState('paid');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [d, reload] = useLoad(`/admin/donations?status=${status}&q=${encodeURIComponent(query)}`);
  const [sent, setSent] = useState('');
  const refund = async (x) => {
    if (
      !confirm(
        `Record ${x.receiptNo} (${inr(x.amount)}) as refunded? First issue the refund in the Razorpay dashboard. The certificate will be revoked.`,
      )
    )
      return;
    await api(`/admin/donations/${x._id}`, { method: 'PATCH', body: { status: 'refunded' } });
    reload();
  };
  const resend = async (id) => {
    await api(`/admin/donations/${id}/resend`, { method: 'POST' });
    setSent(id);
  };
  return (
    <>
      <PageTitle sub="Online payments arrive here on their own. Record cash, cheque and bank gifts below.">
        Donations
      </PageTitle>
      <div className="space-y-12">
        <OfflineDonation onDone={reload} />
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                ['paid', 'Paid'],
                ['created', 'Started, not paid'],
                ['failed', 'Failed'],
                ['refunded', 'Refunded'],
                ['', 'All'],
              ].map(([v, l]) => (
                <button
                  key={l}
                  onClick={() => setStatus(v)}
                  aria-pressed={status === v}
                  className={`rounded-full border px-4 py-1.5 text-sm ${status === v ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => (e.preventDefault(), setQuery(q))} className="flex gap-2">
              <label htmlFor="dq" className="sr-only">
                Search donations
              </label>
              <input
                id="dq"
                className="input !py-1.5"
                placeholder="Name, email, receipt, payment ID"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="rounded-full border border-rule px-4 text-sm hover:border-ink">
                Search
              </button>
            </form>
            <a
              href="/api/admin/donations.csv"
              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink"
            >
              <Download aria-hidden className="size-4" /> Export paid (CSV)
            </a>
          </div>
          {d?.error && <Notice kind="error">{d.error}</Notice>}
          <div className="mt-6 overflow-x-auto rounded-[18px] border border-rule">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-rule text-muted">
                <tr>
                  {['Date', 'Donor', 'Amount', 'Programme', 'Mode', 'Receipt / status', ''].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d?.donations?.map((x) => (
                  <tr key={x._id} className="border-b border-rule last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(x.paidAt ?? x.createdAt)}</td>
                    <td className="px-4 py-3">
                      {x.user ? (
                        <Link to={`/admin/users/${x.user}`} className="underline-offset-2 hover:underline">
                          {x.name}
                        </Link>
                      ) : (
                        x.name
                      )}
                      <br />
                      <span className="text-xs text-muted">
                        {x.email}
                        {x.pan && ` · ${x.pan}`}
                      </span>
                      {x.subscription && <span className="ml-1 text-xs text-muted">· monthly</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{inr(x.amount)}</td>
                    <td className="px-4 py-3">{programmeLabel(x.programme)}</td>
                    <td className="px-4 py-3 capitalize">
                      {x.method}
                      {x.paymentId && (
                        <>
                          <br />
                          <span className="font-mono text-xs text-muted">{x.paymentId}</span>
                        </>
                      )}
                      {x.reference && (
                        <>
                          <br />
                          <span className="text-xs text-muted">{x.reference}</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {x.receiptNo ?? <span className="capitalize text-muted">{x.status}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {x.status === 'paid' && (
                        <span className="flex flex-wrap justify-end gap-1.5">
                          <a
                            href={`/api/donations/${x._id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
                          >
                            <FileText aria-hidden className="size-3.5" /> Receipt
                          </a>
                          <button
                            onClick={() => resend(x._id)}
                            disabled={sent === x._id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink disabled:text-muted"
                          >
                            <Mail aria-hidden className="size-3.5" /> {sent === x._id ? 'Sent' : 'Resend'}
                          </button>
                          <button
                            onClick={() => refund(x)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
                          >
                            <Undo2 aria-hidden className="size-3.5" /> Refunded
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {d?.donations?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      Nothing here yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
