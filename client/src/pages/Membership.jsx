// Public membership page and the useJoin() hook that pays the membership fee.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BadgeCheck, CalendarHeart, Megaphone, Fingerprint } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Label, Lines, Notice, SectionHeader } from '../components/ui.jsx';
import { Faq, loadCheckout } from './Donate.jsx';
import { api, inr } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useSettings } from '../lib/settings.jsx';
import { brand, membership } from '../data/site.js';

const icons = [BadgeCheck, CalendarHeart, Megaphone, Fingerprint];

/** Pays the membership fee through Razorpay. Used here and in the dashboard. */
export function useJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ busy: false, error: '' });
  const join = async () => {
    if (!user) return navigate('/register?next=/membership');
    setState({ busy: true, error: '' });
    try {
      await loadCheckout();
      const o = await api('/membership/order', { method: 'POST' });
      const rzp = new window.Razorpay({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: 'INR',
        name: brand.name,
        description: 'Membership fee',
        prefill: o.prefill,
        theme: { color: '#07518A' },
        modal: { ondismiss: () => setState({ busy: false, error: '' }) },
        handler: async (resp) => {
          try {
            await api('/membership/verify', { method: 'POST', body: { id: o.id, ...resp } });
            navigate('/dashboard/membership?joined=1');
          } catch (e) {
            setState({ busy: false, error: e.message });
          }
        },
      });
      rzp.on('payment.failed', (x) =>
        setState({ busy: false, error: x.error?.description || 'Payment failed. No money was taken.' }),
      );
      rzp.open();
    } catch (e) {
      setState({ busy: false, error: e.message });
    }
  };
  return { join, ...state };
}

export default function Membership() {
  const st = useSettings();
  const { user } = useAuth();
  const { join, busy, error } = useJoin();
  const fee = st.membershipFee ?? 1000;
  const validity = st.membershipMonths ? `${st.membershipMonths} months` : 'life';

  return (
    <Page
      title="Membership"
      description={`Become a member of Pirento Foundation for ${inr(fee)}. Certificate, member card and Bharat ID by Pirento.`}
    >
      <section className="pb-20 pt-[84px] md:pb-28">
        <div className="container-x">
          <div className="inverse relative overflow-hidden rounded-[28px] bg-inverse px-6 py-10 text-on-inverse sm:px-10 md:px-14 md:py-14">
            <div
              aria-hidden
              className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--inverse-rule)_1px,transparent_1px),linear-gradient(90deg,var(--inverse-rule)_1px,transparent_1px)] [background-size:72px_72px]"
            />
            <div className="relative grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p data-hero-after className="eyebrow">
                  Pirento Foundation membership
                </p>
                <h1 data-hero className="poster h-poster mt-6">
                  <span className="line">
                    <span>Be one</span>
                  </span>
                  <span className="line">
                    <span className="text-accent">of us.</span>
                  </span>
                </h1>
                <p
                  data-hero-after
                  className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-inverse-muted"
                >
                  Members stand with our work all year: trees that survive, food on time, children in school.
                  You get a numbered certificate, a member card and your Bharat ID by Pirento.
                </p>
              </div>
              <div data-hero-visual className="rounded-[22px] bg-paper p-7 text-ink lg:col-span-5">
                <p className="eyebrow">Membership fee</p>
                <p className="poster mt-3 text-[clamp(3.5rem,7vw,5.5rem)] tabular-nums">{inr(fee)}</p>
                <p className="text-sm text-muted">for {validity} · fee receipt by email</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {membership.benefits.map((b) => (
                    <li key={b.title} className="flex gap-2">
                      <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0" /> {b.title}
                    </li>
                  ))}
                </ul>
                {error && (
                  <div className="mt-6">
                    <Notice kind="error">{error}</Notice>
                  </div>
                )}
                <Button onClick={join} variant="accent" disabled={busy} className="mt-8 w-full" cursor="Join">
                  {busy ? 'Opening payment…' : user ? `Pay ${inr(fee)} and join` : 'Create account to join'}
                </Button>
                {!user && (
                  <p className="mt-3 text-center text-xs text-muted">
                    Already have an account?{' '}
                    <Link to="/login?next=/membership" className="underline">
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 md:py-36">
        <div className="container-x">
          <SectionHeader
            n={1}
            label="What members get"
            lines={['More than a receipt.', 'A place in the work.']}
            intro={membership.note}
          />
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {membership.benefits.map((b, i) => {
              const Icon = icons[i];
              return (
                <div
                  key={b.title}
                  data-reveal
                  className="group rounded-[22px] border border-rule p-7 transition-[border-color,translate] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
                >
                  <span className="grid size-12 place-items-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="mt-8 text-xl">{b.title}</h3>
                  <p className="mt-2 text-muted">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="inverse bg-inverse py-28 text-on-inverse md:py-36">
        <div className="container-x">
          <SectionHeader
            n={2}
            label="How to join"
            inverse
            lines={['Four steps.', 'Ten minutes.']}
            intro="Bharat ID by Pirento is a private Pirento account ID, not a government ID. You finish it on Bharat ID; it shows as pending in your dashboard until then."
          />
          <ol className="relative mt-20 grid gap-12 md:grid-cols-4 md:gap-8">
            <span
              aria-hidden
              className="absolute left-0 right-0 top-5 hidden h-px bg-inverse-rule md:block"
            />
            {membership.steps.map((s, i) => (
              <li key={s.title} data-reveal className="relative">
                <span className="relative grid size-10 place-items-center rounded-full border border-inverse-rule bg-inverse text-sm tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-6 text-2xl">{s.title}</h3>
                <p className="mt-3 max-w-xs text-inverse-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <div data-reveal className="mt-16">
            <Button onClick={join} variant="inverse" disabled={busy}>
              {user ? `Join for ${inr(fee)}` : 'Create account to join'}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-28 md:py-36">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label n={3}>Questions</Label>
            <Lines lines={['Before you join.']} className="h-section mt-6" />
            <p data-reveal className="mt-6 text-sm text-muted">
              Only want to give?{' '}
              <Link to="/donate" className="underline underline-offset-4">
                Donate without membership
              </Link>
              .
            </p>
          </div>
          <div className="md:col-span-8">
            <Faq items={membership.faqs} />
          </div>
        </div>
      </section>
    </Page>
  );
}
