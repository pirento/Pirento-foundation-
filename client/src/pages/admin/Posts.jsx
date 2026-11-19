// Admin: write and publish "Updates" that appear on the public site.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { donateOptions } from '../../data/site.js';
import { api, fmtDate } from '../../lib/api.js';
import { useLoad, useTitle } from '../../lib/hooks.js';

export default function Posts() {
  useTitle('Website updates', 'Admin');
  const [d, reload] = useLoad('/admin/posts');
  const empty = { title: '', summary: '', body: '', programme: '', link: '', published: true };
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(editing ? `/admin/posts/${editing}` : '/admin/posts', {
        method: editing ? 'PUT' : 'POST',
        body: f,
      });
      setMsg({
        ok: editing ? 'Update saved.' : f.published ? 'Published on the website.' : 'Saved as draft.',
      });
      setF(empty);
      setEditing(null);
      reload();
    } catch (err) {
      setMsg({ error: err.message });
    }
  };
  const remove = async (p) => {
    if (!confirm(`Delete “${p.title}”?`)) return;
    await api(`/admin/posts/${p._id}`, { method: 'DELETE' });
    reload();
  };
  return (
    <>
      <PageTitle sub="Post news from the field. Published updates appear on the home page and at /updates.">
        Website updates
      </PageTitle>
      <form onSubmit={save} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
        <h2 className="text-2xl">{editing ? 'Edit update' : 'New update'}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Title"
            name="ptitle"
            required
            maxLength={140}
            value={f.title}
            onChange={set('title')}
          />
          <Field label="Programme" id="pprog">
            <select id="pprog" className="input" value={f.programme} onChange={set('programme')}>
              <option value="">None</option>
              {donateOptions
                .filter((o) => o.key !== 'general')
                .map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <Field
          label="Summary"
          name="psum"
          maxLength={300}
          value={f.summary}
          onChange={set('summary')}
          hint="One or two lines for the card."
        />
        <Field label="Story" id="pbody">
          <textarea
            id="pbody"
            rows={8}
            maxLength={20000}
            className="input"
            value={f.body}
            onChange={set('body')}
            placeholder="Leave a blank line between paragraphs."
          />
        </Field>
        <Field
          label="Link"
          name="plink"
          type="url"
          value={f.link}
          onChange={set('link')}
          hint="Optional, e.g. a photo album or news article (https://…)."
        />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={f.published} onChange={set('published')} className="size-4" />{' '}
          Publish on the website
        </label>
        {msg?.error && <Notice kind="error">{msg.error}</Notice>}
        {msg?.ok && <Notice>{msg.ok}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="accent" icon={Plus}>
            {editing ? 'Save' : 'Add update'}
          </Button>
          {editing && (
            <Button variant="outline" icon={null} onClick={() => (setEditing(null), setF(empty))}>
              Cancel
            </Button>
          )}
        </div>
      </form>
      <ul className="mt-10 border-t border-rule">
        {d?.posts?.map((p) => (
          <li
            key={p._id}
            className="flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {p.title} {!p.published && <span className="text-xs text-muted">(draft)</span>}
              </p>
              <p className="text-sm text-muted">
                {fmtDate(p.publishedAt ?? p.createdAt)} · /updates/{p.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (
                  setEditing(p._id),
                  setF({
                    title: p.title,
                    summary: p.summary ?? '',
                    body: p.body ?? '',
                    programme: p.programme ?? '',
                    link: p.link ?? '',
                    published: p.published,
                  }),
                  scrollTo(0, 0)
                )}
                className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
              >
                Edit
              </button>
              <button
                onClick={() => remove(p)}
                className="rounded-full border border-rule px-3 py-1 text-xs hover:border-ink"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
