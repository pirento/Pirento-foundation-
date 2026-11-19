import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import Page from '../components/Page.jsx';
import { HeroArt } from '../components/Art.jsx';
import { Button, Hl, SectionHeader, StatusBadge, Tag, Lines, Label } from '../components/ui.jsx';
import { brand, mission, programmes, roadmap, governance, donateSteps } from '../data/site.js';
import { Timeline } from './About.jsx';
import Ecosystem from '../components/Ecosystem.jsx';

function Hero() {
  const visual = useRef(null);
  const tilt = (e) => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = visual.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    visual.current.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  };
  return (
    <section className="pb-20 pt-[84px] md:pb-28">
      <div className="container-x">
        <div className="inverse relative overflow-hidden rounded-[28px] bg-inverse px-6 pb-8 pt-8 text-on-inverse sm:px-10 md:px-14 md:pb-12 md:pt-12">
          <div aria-hidden className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--inverse-rule)_1px,transparent_1px),linear-gradient(90deg,var(--inverse-rule)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <p data-hero-after className="text-sm leading-snug">
              green /<br />food /<br />education
              <span aria-hidden className="mt-3 block h-0.5 w-8 bg-on-inverse" />
            </p>
            <p data-hero-after className="max-w-[16rem] text-right text-xs leading-relaxed text-inverse-muted">
              {brand.legalForm}
              <br />Basti, Uttar Pradesh
            </p>
          </div>

          <div className="relative mt-6 grid items-end gap-10 md:mt-2 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 data-hero className="poster h-poster">
                <span className="line"><span>People.</span></span>
                <span className="line"><span>Planet.</span></span>
                <span className="line"><span className="text-accent">Possibility.</span></span>
              </h1>
              <p data-hero-after className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-inverse-muted">
                We plant <strong className="font-medium text-on-inverse">trees that survive</strong>, get <strong className="font-medium text-on-inverse">food to families on time</strong>, and help students stay in school. Every rupee gets a receipt; every gift a certificate you can verify.
              </p>
              <div data-hero-after className="mt-8 flex flex-wrap gap-3">
                <Button to="/donate" variant="accent" cursor="Donate">Donate now</Button>
                <Button to="/ecosystem" variant="outline" className="!border-inverse-rule !text-on-inverse [--wipe:var(--on-inverse)] hover:!text-inverse">Pirento ecosystem</Button>
              </div>
            </div>
            <div data-hero-visual className="lg:col-span-5" onPointerMove={tilt} onPointerLeave={() => (visual.current.style.transform = '')}>
              <div ref={visual} className="overflow-hidden rounded-[22px] border border-inverse-rule shadow-[0_30px_80px_-40px_rgba(2,20,40,0.6)] transition-transform duration-500 ease-ui">
                <HeroArt />
              </div>
            </div>
          </div>

          <div aria-hidden data-hero-after className="relative mt-10 flex items-end justify-between gap-6 border-t border-inverse-rule pt-6">
            <p className="poster text-[clamp(1.6rem,3.4vw,2.8rem)]">Plant · Feed · Teach</p>
            <p className="poster flex items-end gap-2 text-right leading-[0.85]">
              <span className="text-[clamp(2.4rem,5vw,4.5rem)]">01</span>
              <span className="pb-1 text-left text-[clamp(0.9rem,1.4vw,1.25rem)]">Pilot<br />year</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Programmes() {
  return (
    <section className="py-28 md:py-40">
      <div className="container-x">
        <SectionHeader n={1} label="What we do" lines={['Three programmes.', 'One standard of proof.']} intro="Every programme reports a count, an outcome and a quality check. Year one is one clean pilot each." />
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {programmes.map((p, i) => (
            <Link key={p.key} to={`/programmes#${p.key}`} data-reveal data-cursor="View" className="group flex flex-col justify-between gap-10 rounded-[22px] border border-rule p-7 transition-[border-color,translate] duration-500 ease-ui hover:-translate-y-1 hover:border-ink md:p-9">
              <div className="flex items-start justify-between">
                <span className="text-sm tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="grid size-11 place-items-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
              </div>
              <div>
                <p className="eyebrow">{p.category}</p>
                <h3 className="h-item mt-3">{p.name}</h3>
                <p className="mt-3 max-w-md text-muted">{p.lead}</p>
                <div className="mt-6 flex flex-wrap gap-2">{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToGive() {
  return (
    <section className="inverse bg-inverse py-28 text-on-inverse md:py-40">
      <div className="container-x">
        <SectionHeader n={3} label="How giving works" inverse lines={['Give in a minute.', 'Keep the proof forever.']} intro="Your receipt and certificate are generated the moment your payment is confirmed." />
        <ol className="relative mt-20 grid gap-12 md:grid-cols-3 md:gap-8">
          <span aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-inverse-rule md:block" />
          {donateSteps.map((s, i) => (
            <li key={s.title} data-reveal className="relative">
              <span className="relative grid size-10 place-items-center rounded-full border border-inverse-rule bg-inverse text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 text-2xl">{s.title}</h3>
              <p className="mt-3 max-w-xs text-inverse-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div data-reveal className="mt-16 flex flex-wrap items-center gap-4">
          <Button to="/donate" variant="inverse" cursor="Donate">Donate now</Button>
          <Link to="/verify" className="text-sm text-inverse-muted underline underline-offset-4 hover:text-on-inverse">Verify a certificate</Link>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="py-28 md:py-40">
      <div className="container-x">
        <SectionHeader n={4} label="Governance" lines={['Our money stays separate.', <>Our books stay <Hl>open</Hl>.</>]} intro={mission} />
        <div className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {governance.map((g) => (
            <div key={g.title} data-reveal className="bg-paper p-7 md:p-9">
              <h3 className="text-xl">{g.title}</h3>
              <p className="mt-3 text-muted">{g.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="border-t border-rule py-28 md:py-40">
      <div className="container-x grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Label n={5}>Roadmap</Label>
          <Lines lines={['Pilot first.', 'Scale on proof.']} className="h-section mt-6" />
          <div data-reveal className="mt-6 flex gap-2"><StatusBadge status="Now" /><StatusBadge status="Expected" /></div>
        </div>
        <div className="md:col-span-8">
          <Timeline items={roadmap} />
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="inverse border-b border-inverse-rule bg-inverse py-28 text-on-inverse md:py-40">
      <div className="container-x">
        <Label n="—">Get involved</Label>
        <Lines lines={['Plant one.', 'Feed one.', <span className="text-accent">Teach one.</span>]} className="poster h-cta mt-8" />
        <div data-reveal className="mt-12 flex flex-wrap gap-3">
          <Button to="/donate" variant="inverse" cursor="Donate">Donate now</Button>
          <Button to="/contact" variant="outline" className="!border-inverse-rule !text-on-inverse [--wipe:var(--on-inverse)] hover:!text-inverse">Partner with us</Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Page description="Pirento Foundation plants trees that survive, runs food and emergency relief, and supports education in Basti and eastern Uttar Pradesh.">
      <Hero />
      <Programmes />
      <Ecosystem n={2} />
      <HowToGive />
      <Trust />
      <Roadmap />
      <FinalCta />
    </Page>
  );
}
