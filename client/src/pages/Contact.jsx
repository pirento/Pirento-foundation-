import { useState } from 'react';
import { Copy, Check, Send } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Field, Label, Lines } from '../components/ui.jsx';
import { brand } from '../data/site.js';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'Partnership', message: '' });
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
  // shortcut: no backend for messages; opens the visitor's email app. Add an API route if messages must be stored.
  const send = (e) => {
    e.preventDefault();
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    location.href = `mailto:${brand.email}?subject=${encodeURIComponent(`${form.topic}: ${form.name}`)}&body=${encodeURIComponent(body)}`;
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
            </div>
            <Field label="Topic" id="topic" required>
              <select id="topic" className="input" value={form.topic} onChange={set('topic')}>
                {['Partnership', 'CSR support', 'Volunteering', 'Donation by bank transfer', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Message" id="message" required>
              <textarea id="message" required rows={5} className="input" value={form.message} onChange={set('message')} />
            </Field>
            <Button type="submit" variant="accent" icon={Send}>Open in email app</Button>
          </form>
        </div>
      </section>
    </Page>
  );
}
