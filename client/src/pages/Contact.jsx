import { useState } from 'react';
import { Copy, Check, Send } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Field, Label, Lines, Notice } from '../components/ui.jsx';
import { brand, contactTopics } from '../data/site.js';
import { api } from '../lib/api.js';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const empty = { name: '', email: '', phone: '', topic: 'Partnership', message: '', website: '' };
  const [form, setForm] = useState(empty);
  const [state, setState] = useState({ busy: false, error: '', ref: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brand.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the address is still visible to copy by hand */
    }
  };
  const send = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', ref: '' });
    try {
      const r = await api('/contact', { method: 'POST', body: form });
      setState({ busy: false, error: '', ref: r.ref });
      setForm(empty);
    } catch (err) {
      setState({ busy: false, error: err.message, ref: '' });
    }
  };

  return (
    <Page title="Contact" description="Talk to Pirento Foundation about partnerships, CSR, volunteering or donations.">
      <section className="inverse bg-inverse pb-28 pt-40 text-on-inverse md:pb-40 md:pt-48">
        <div className="container-x">
          <p data-hero-after className="eyebrow">Contact</p>
          <h1 data-hero className="h-cta mt-8">
            <span className="line"><span>Have an idea?</span></span>
            <span className="line"><span className="text-inverse-muted">Let’s talk.</span></span>
          </h1>
          <div data-hero-after className="mt-14 flex flex-wrap items-center gap-4">
            <a href={`mailto:${brand.email}`} className="display text-[clamp(1.6rem,4vw,3.25rem)] underline decoration-accent decoration-2 underline-offset-[0.2em]">{brand.email}</a>
            <button onClick={copy} className="inline-flex items-center gap-2 rounded-full border border-inverse-rule px-4 py-2 text-sm hover:border-on-inverse">
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
              <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p data-hero-after className="mt-6 text-inverse-muted">
            <a href={`tel:${brand.phone.replace(/\s/g, '')}`} className="text-on-inverse hover:underline">{brand.phone}</a> · {brand.contactNote}
          </p>
        </div>
      </section>
      <section className="py-28 md:py-40">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label n={1}>Write to us</Label>
            <Lines lines={['Partners, CSR,', 'volunteers.']} className="h-section mt-6" />
            <p data-reveal className="prose-body mt-6">{brand.area}</p>
            <p data-reveal className="mt-6 text-sm leading-relaxed text-muted"><strong className="font-medium text-ink">Registered office:</strong> {brand.office}</p>
          </div>
          <form onSubmit={send} data-reveal className="space-y-5 rounded-[22px] border border-rule p-6 md:col-span-7 md:col-start-6 md:p-10">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" name="name" required value={form.name} onChange={set('name')} autoComplete="name" />
              <Field label="Email" name="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
              <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              <Field label="Topic" id="topic" required>
                <select id="topic" className="input" value={form.topic} onChange={set('topic')}>
                  {contactTopics.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Message" id="message" required hint="At least 10 characters.">
              <textarea id="message" required minLength={10} maxLength={4000} rows={5} className="input" value={form.message} onChange={set('message')} />
            </Field>
            {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" value={form.website} onChange={set('website')} />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            {state.ref && <Notice>Thank you. Your message reached us (reference {state.ref}). We have emailed you a copy and usually reply within 3 working days.</Notice>}
            <Button type="submit" variant="accent" icon={Send} disabled={state.busy}>{state.busy ? 'Sending…' : 'Send message'}</Button>
            <p className="text-xs text-muted">We use your details only to reply. See our <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.</p>
          </form>
        </div>
      </section>
    </Page>
  );
}
