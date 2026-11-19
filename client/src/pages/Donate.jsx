// Donate page: one-time or monthly giving through Razorpay, no login needed, plus the FAQ.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Download, ShieldCheck, FileText, Repeat, HandHeart } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Field, Notice, Label, Lines, Hl } from '../components/ui.jsx';
import { api, inr, pdfUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { brand, donateOptions, donateSteps, faqs } from '../data/site.js';

const PRESETS = { once: [500, 1000, 2500, 5000], monthly: [300, 500, 1000, 2500] };

export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () =>
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    document.body.append(s);
  });
}

export function Faq({ items }) {
  return (
    <div className="border-t border-rule">
      {items.map((f) => (
        <details key={f.q} data-reveal className="group border-b border-rule">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span
              aria-hidden
              className="relative size-4 shrink-0 transition-transform duration-500 ease-ui group-open:rotate-45"
            >
              <span className="absolute left-0 top-1/2 h-px w-4 bg-ink" />
              <span className="absolute left-1/2 top-0 h-4 w-px bg-ink" />
            </span>
          </summary>
          <p className="max-w-2xl pb-6 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function Success({ done, name, user }) {
  return (
    <div role="status" className="rounded-[22px] border border-ink p-8 md:p-10">
      <span className="grid size-12 place-items-center rounded-full bg-accent text-on-accent">
        <ShieldCheck aria-hidden className="size-5" />
      </span>
      <h2 className="mt-6 text-4xl">Thank you, {name.split(' ')[0]}.</h2>
      <p className="mt-4 text-muted">
        We received <strong className="font-medium text-ink">{inr(done.amount)}</strong>
        {done.monthly && ' (first monthly gift)'}. Receipt no.{' '}
        <span className="tabular-nums text-ink">{done.receiptNo}</span>. A copy is on its way to your email.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          href={done.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={FileText}
          variant="accent"
        >
          80G receipt (PDF, opens in a new tab)
        </Button>
        {done.certNo && (
          <Button
            href={pdfUrl(done.certNo)}
            target="_blank"
            rel="noopener noreferrer"
            icon={Download}
            variant="outline"
          >
            Certificate (PDF, opens in a new tab)
          </Button>
        )}
      </div>
      {user ? (
        <p className="mt-6 text-sm text-muted">
          It is saved in{' '}
          <Link to="/dashboard/donations" className="text-ink underline underline-offset-4">
            your dashboard
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6">
          <Notice>
            We created a Pirento Foundation account for you (or linked this gift to your existing one). Check
            your email for a link to set your password; then you can see every receipt, manage monthly giving
            and complete your profile.
          </Notice>
        </div>
      )}
    </div>
  );
}

function DonateForm({ config }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialProgramme = donateOptions.some((o) => o.key === params.get('programme'))
    ? params.get('programme')
    : 'general';
  const [freq, setFreq] = useState(params.get('monthly') ? 'monthly' : 'once');
  const [form, setForm] = useState({
    amount: params.get('monthly') ? 500 : 1000,
    programme: initialProgramme,
    name: '',
    email: '',
    phone: '',
    pan: '',
    address: '',
  });
  const [state, setState] = useState({ busy: false, error: '', done: null });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (user)
      setForm((f) => ({
        ...f,
        name: f.name || user.name,
        email: f.email || user.email,
        phone: f.phone || user.phone || '',
        pan: f.pan || user.pan || '',
        address: f.address || user.address || '',
      }));
  }, [user]);

  const min = freq === 'monthly' ? config.minMonthly : config.min;

  async function submit(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isInteger(amount) || amount < min || amount > config.max)
      return setState({
        busy: false,
        error: `Please enter a whole amount between ${inr(min)} and ${inr(config.max)}.`,
        done: null,
      });
    setState({ busy: true, error: '', done: null });
    try {
      await loadCheckout();
      const monthly = freq === 'monthly';
      const r = await api(monthly ? '/donations/subscribe' : '/donations/order', {
        method: 'POST',
        body: { ...form, amount },
      });
      const rzp = new window.Razorpay({
        key: r.keyId,
        ...(monthly
          ? { subscription_id: r.subscriptionId }
          : { order_id: r.orderId, amount: r.amount, currency: 'INR' }),
        name: brand.name,
        description: `${monthly ? 'Monthly gift · ' : ''}${donateOptions.find((o) => o.key === form.programme)?.label}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#07518A' },
        modal: { ondismiss: () => setState((s) => ({ ...s, busy: false })) },
        handler: async (resp) => {
          try {
            const done = await api(monthly ? '/donations/subscribe/verify' : '/donations/verify', {
              method: 'POST',
              body: monthly ? { id: r.id, ...resp } : { donationId: r.donationId, ...resp },
            });
            setState({ busy: false, error: '', done });
          } catch (err) {
            setState({ busy: false, error: err.message, done: null });
          }
        },
      });
      rzp.on('payment.failed', (x) =>
        setState({
          busy: false,
          error: x.error?.description || 'Payment failed. No money was taken.',
          done: null,
        }),
      );
      rzp.open();
    } catch (err) {
      setState({ busy: false, error: err.message, done: null });
    }
  }

  if (state.done) return <Success done={state.done} name={form.name} user={user} />;

  return (
    <form onSubmit={submit} noValidate className="space-y-7 rounded-[22px] border border-rule p-6 md:p-10">
      <div
        role="radiogroup"
        aria-label="How often"
        className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1"
      >
        {[
          ['once', 'Give once', HandHeart],
          ['monthly', 'Give monthly', Repeat],
        ].map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={freq === k}
            onClick={() => (setFreq(k), setForm((f) => ({ ...f, amount: PRESETS[k][1] })))}
            className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors ${freq === k ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </button>
        ))}
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          Amount{freq === 'monthly' && ' per month'}{' '}
          <span className="font-normal text-muted">(required)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS[freq].map((a) => (
            <label
              key={a}
              className={`cursor-pointer rounded-full border px-4 py-3 text-center text-sm tabular-nums transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${Number(form.amount) === a ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
            >
              <input
                type="radio"
                name="preset"
                className="sr-only"
                checked={Number(form.amount) === a}
                onChange={() => setForm((f) => ({ ...f, amount: a }))}
              />
              {inr(a)}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label htmlFor="amount" className="sr-only">
            Other amount in rupees
          </label>
          <div className="relative">
            <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              ₹
            </span>
            <input
              id="amount"
              name="amount"
              inputMode="numeric"
              className="input !pl-9 tabular-nums"
              value={form.amount}
              onChange={set('amount')}
              placeholder="Other amount"
            />
          </div>
          {freq === 'monthly' && (
            <p className="mt-1.5 text-xs text-muted">
              From {inr(config.minMonthly)} a month. Stop any time from your dashboard.
            </p>
          )}
        </div>
      </fieldset>

      <Field label="Where should it go?" id="programme" required>
        <select id="programme" className="input" value={form.programme} onChange={set('programme')}>
          {donateOptions.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          required
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          hint="As on your PAN, for 80G."
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          hint="Your receipt and account link go here."
        />
        <Field
          label="Mobile"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={set('phone')}
        />
        <Field
          label="PAN"
          name="pan"
          value={form.pan}
          onChange={set('pan')}
          maxLength={10}
          hint="Needed for 80G reporting (Form 10BD/10BE)."
        />
      </div>
      <Field label="Address" id="address" hint="Printed on your 80G receipt.">
        <textarea
          id="address"
          rows={2}
          maxLength={300}
          className="input"
          autoComplete="street-address"
          value={form.address}
          onChange={set('address')}
        />
      </Field>

      {!user && (
        <p className="flex gap-3 rounded-[14px] bg-stone p-4 text-sm leading-relaxed">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent ring-1 ring-ink" />
          <span>
            No login needed. We will create your account and email you a link to set your password, so your
            receipts stay together.{' '}
            <Link to="/login?next=/donate" className="underline underline-offset-2">
              Already have one? Sign in
            </Link>
            .
          </span>
        </p>
      )}
      {state.error && <Notice kind="error">{state.error}</Notice>}
      {!config.online && (
        <Notice>
          Online payments are being set up. Until then, write to{' '}
          <a className="underline" href={`mailto:${brand.email}?subject=Donation%20by%20bank%20transfer`}>
            {brand.email}
          </a>{' '}
          for bank-transfer details; we will record your gift and send your receipt.
        </Notice>
      )}
      <Button
        type="submit"
        variant="accent"
        disabled={state.busy || !config.online}
        className="w-full sm:w-auto"
        cursor="Donate"
      >
        {state.busy
          ? 'Opening payment…'
          : `Donate ${Number(form.amount) ? inr(form.amount) : ''}${freq === 'monthly' ? ' every month' : ''}`}
      </Button>
      <p className="text-xs leading-relaxed text-muted">
        {brand.taxNote} By donating you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2">
          Terms
        </Link>
        ,{' '}
        <Link to="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/refund-policy" className="underline underline-offset-2">
          Refund & Cancellation Policy
        </Link>
        .
      </p>
    </form>
  );
}

export default function Donate() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api('/donations/config').then(setConfig, () =>
      setConfig({ online: false, min: 10, max: 500000, minMonthly: 100 }),
    );
  }, []);
  return (
    <Page
      title="Donate"
      description="Donate to Pirento Foundation, once or every month, and get an 80G receipt and a verifiable certificate."
    >
      <section className="relative pb-28 pt-36 md:pb-40 md:pt-44">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p data-hero-after className="eyebrow">
              Donate · 80G eligible
            </p>
            <h1 data-hero className="h-hero mt-6">
              <span className="line">
                <span>Give once,</span>
              </span>
              <span className="line">
                <span>
                  or <Hl>every month</Hl>.
                </span>
              </span>
            </h1>
            <p data-hero-after className="prose-body mt-8">
              Choose a programme or let us use it where it is needed most.{' '}
              <strong>Restricted gifts are spent only on their stated purpose.</strong>
            </p>
            <ol data-hero-after className="mt-10 space-y-5">
              {donateSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-rule text-xs tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p data-hero-after className="mt-10 text-sm text-muted">
              Want to stand with us all year?{' '}
              <Link to="/membership" className="text-ink underline underline-offset-4">
                Become a member
              </Link>
              .
            </p>
          </div>
          <div data-hero-visual className="lg:col-span-7">
            {config ? (
              <DonateForm config={config} />
            ) : (
              <div className="h-[640px] rounded-[22px] border border-rule" aria-busy="true" />
            )}
          </div>
        </div>
      </section>
      <section className="border-t border-rule py-28 md:py-40">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label n={1}>Questions</Label>
            <Lines lines={['Before you give.']} className="h-section mt-6" />
            <p data-reveal className="mt-6 text-sm text-muted">
              Something else?{' '}
              <Link to="/contact" className="underline underline-offset-4">
                Ask us
              </Link>
              .
            </p>
          </div>
          <div className="md:col-span-8">
            <Faq items={faqs} />
          </div>
        </div>
      </section>
    </Page>
  );
}
