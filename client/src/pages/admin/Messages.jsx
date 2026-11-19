// Admin: contact-form inbox.

import { PageTitle } from '../../components/Desk.jsx';
import { Notice } from '../../components/ui.jsx';
import { api, fmtDate } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Messages({ onChange }) {
  useTitle('Messages', 'Admin');
  const [d, reload] = useLoad('/admin/messages');
  const mark = async (m) => {
    await api(`/admin/messages/${m._id}`, {
      method: 'PATCH',
      body: { status: m.status === 'new' ? 'done' : 'new' },
    });
    reload();
    onChange();
  };
  return (
    <>
      <PageTitle sub="Messages from the contact form. A copy also goes to the support inbox.">
        Messages
      </PageTitle>
      {d?.error && <Notice kind="error">{d.error}</Notice>}
      {d?.messages?.length === 0 && <p className="text-muted">No messages yet.</p>}
      <ul className="space-y-4">
        {d?.messages?.map((m) => (
          <li
            key={m._id}
            className={`rounded-[18px] border p-6 ${m.status === 'new' ? 'border-ink' : 'border-rule opacity-75'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {m.status === 'new' && (
                    <span
                      className="mr-2 inline-block size-2 rounded-full bg-accent ring-1 ring-ink"
                      aria-label="New"
                    />
                  )}
                  {m.name} <span className="font-normal text-muted">· {m.topic}</span>
                </p>
                <p className="text-sm text-muted">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.topic)}`}
                    className="underline underline-offset-2"
                  >
                    {m.email}
                  </a>
                  {m.phone && (
                    <>
                      {' '}
                      · <a href={`tel:${m.phone}`}>{m.phone}</a>
                    </>
                  )}{' '}
                  · {fmtDate(m.createdAt)} · Ref {m._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => mark(m)}
                className="rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink"
              >
                {m.status === 'new' ? 'Mark done' : 'Mark new'}
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
