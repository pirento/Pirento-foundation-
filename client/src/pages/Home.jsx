import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import Page from '../components/Page.jsx';
import { HeroArt } from '../components/Art.jsx';
import { Button, Hl, SectionHeader, StatusBadge, Tag, Lines, Label } from '../components/ui.jsx';
import { brand, mission, programmes, roadmap, governance, donateSteps } from '../data/site.js';
import { Timeline } from './About.jsx';

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
    <section className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-44">
      <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
      <div className="container-x grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p data-hero-after className="eyebrow">
            {brand.legalForm} · Basti, Uttar Pradesh
          </p>
          <h1 data-hero className="h-hero mt-6">
            <span className="line"><span>People. Planet.</span></span>
            <span className="line"><span><Hl>Possibility.</Hl></span></span>
          </h1>
          <p data-hero-after className="prose-body mt-8">
            We plant <strong>trees that survive</strong>, get <strong>food to families on time</strong>, and help students stay in school, starting in Basti and eastern Uttar Pradesh. Every rupee gets a receipt and every gift a certificate you can verify.
          </p>
          <div data-hero-after className="mt-10 flex flex-wrap gap-3">
            <Button to="/donate" variant="accent" cursor="Donate">Donate now</Button>
            <Button to="/programmes" variant="outline">See our programmes</Button>
          </div>
        </div>
        <div data-hero-visual className="lg:col-span-5" onPointerMove={tilt} onPointerLeave={() => (visual.current.style.transform = '')}>
          <div ref={visual} className="overflow-hidden rounded-[22px] border border-rule shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)] transition-transform duration-500 ease-ui">
            <HeroArt />
          </div>
        </div>
      </div>
      <div aria-hidden className="container-x mt-16 hidden items-center gap-3 text-xs text-muted md:flex">
        <span className="relative block h-10 w-px overflow-hidden bg-rule"><span className="scroll-line absolute inset-0 bg-ink" /></span>
        Scroll
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
        <SectionHeader n={2} label="How giving works" inverse lines={['Give in a minute.', 'Keep the proof forever.']} intro="Your receipt and certificate are generated the moment your payment is confirmed." />
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
        <SectionHeader n={3} label="Governance" lines={['Our money stays separate.', <>Our books stay <Hl>open</Hl>.</>]} intro={mission} />
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
          <Label n={4}>Roadmap</Label>
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
        <Lines lines={['Plant one.', 'Feed one.', 'Teach one.']} className="h-cta mt-8" />
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
      <HowToGive />
      <Trust />
      <Roadmap />
      <FinalCta />
    </Page>
  );
}
