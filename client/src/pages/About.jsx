import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import Page, { PageHero } from '../components/Page.jsx';
import { SectionHeader, StatusBadge, Label, Lines } from '../components/ui.jsx';
import { brand, vision, mission, board, governance, registrations, roadmap, futureNote } from '../data/site.js';
import { FinalCta } from './Home.jsx';
import { reducedMotion } from '../lib/motion.js';

/** Vertical rail that fills with accent as you scroll. */
export function Timeline({ items }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-fill]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <ol ref={ref} className="relative pl-10">
      <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-rule">
        <span data-fill className="absolute inset-0 origin-top bg-accent" />
      </span>
      {items.map((r) => (
        <li key={r.stage} data-reveal className="relative pb-12 last:pb-0">
          <span aria-hidden className={`absolute -left-10 top-1.5 size-[15px] rounded-full border border-ink ${r.status === 'Now' ? 'bg-accent' : 'bg-paper'}`} />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm tabular-nums text-muted">{r.stage}</span>
            <StatusBadge status={r.status} />
          </div>
          <h3 className="mt-3 text-2xl md:text-3xl">{r.title}</h3>
          <p className="mt-2 max-w-xl text-muted">{r.text}</p>
        </li>
      ))}
    </ol>
  );
}

export default function About() {
  return (
    <Page title="About" description="Who runs Pirento Foundation, how it is governed, and where it stands on registration.">
      <PageHero
        label="About the Foundation"
        lines={['The social-impact arm', 'of Venturecore.']}
        intro={`${brand.name} is the charitable arm of ${brand.sponsor}. Venturecore gives the initial corpus and brand licence, and its directors form the first board, but the Foundation keeps its own bank account, books and decisions.`}
      />

      <section className="border-t border-rule py-28 md:py-40">
        <div className="container-x grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule md:grid-cols-2">
          {[['Vision', vision], ['Mission', mission]].map(([k, v]) => (
            <div key={k} data-reveal className="bg-paper p-8 md:p-12">
              <p className="eyebrow">{k}</p>
              <p className="display mt-6 text-[clamp(1.5rem,2.4vw,2.25rem)]">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="inverse bg-inverse py-28 text-on-inverse md:py-40">
        <div className="container-x">
          <SectionHeader n={1} label="Founding board" inverse lines={['The people', 'accountable for it.']} intro="The directors of Venturecore form the first board. Offices are proposed and will be confirmed before incorporation. We also plan to add one independent member from outside the company." />
          <ul className="mt-16 grid gap-4 md:grid-cols-3">
            {board.map((b) => (
              <li key={b.name} data-reveal className="rounded-[22px] border border-inverse-rule p-7">
                <span aria-hidden className="grid size-14 place-items-center rounded-full border border-inverse-rule font-display text-lg">
                  {b.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <h3 className="mt-8 text-2xl">{b.name}</h3>
                <p className="mt-2 text-sm text-inverse-muted">{b.role}</p>
                <p className="mt-4 border-t border-inverse-rule pt-4 text-sm">{b.office}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-28 md:py-40">
        <div className="container-x">
          <SectionHeader n={2} label="Governance" lines={['Rules we hold', 'ourselves to.']} intro="A public charity has to keep its money, books and decisions separate from its sponsor. These are ours." />
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {governance.map((g, i) => (
              <div key={g.title} data-reveal className="rounded-[18px] bg-stone p-7">
                <span className="text-sm tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-6 text-xl">{g.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-28 md:py-40">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label n={3}>Registration</Label>
            <Lines lines={['Where we stand,', 'honestly.']} className="h-section mt-6" />
            <p data-reveal className="prose-body mt-6">{brand.pendingNote}</p>
          </div>
          <ul className="md:col-span-8">
            {registrations.map((r) => (
              <li key={r.name} data-reveal className="flex items-center justify-between gap-4 border-b border-rule py-5 first:border-t">
                <span className="text-lg">{r.name}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-rule py-28 md:py-40">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label n={4}>Roadmap</Label>
            <Lines lines={['Pilot first.', 'Scale on proof.']} className="h-section mt-6" />
            <p data-reveal className="mt-6 max-w-sm text-sm leading-relaxed text-muted">{futureNote}</p>
          </div>
          <div className="md:col-span-8"><Timeline items={roadmap} /></div>
        </div>
      </section>

      <FinalCta />
    </Page>
  );
}
