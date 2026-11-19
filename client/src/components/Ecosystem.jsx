import { Building2, HeartHandshake, School, GraduationCap, ArrowUpRight, Fingerprint, Handshake } from 'lucide-react';
import { useSettings } from '../lib/settings.jsx';
import { Button } from './ui.jsx';
import { ecosystem, programmes, futureNote } from '../data/site.js';
import { SectionHeader, StatusBadge, Tag } from './ui.jsx';

const Badge = ({ icon: Icon, accent }) => (
  <span className={`grid size-12 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${accent ? 'border-accent bg-accent text-on-accent' : 'border-rule group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent'}`}>
    <Icon aria-hidden className="size-5" />
  </span>
);

const Stem = () => <span aria-hidden className="mx-auto block h-10 w-px bg-ink/40 md:h-14" />;

/** Organisation tree: Venturecore → Pirento Foundation → programmes now + School / University later. */
export default function Ecosystem({ n = 1 }) {
  const { parent, foundation, future, site, bharatId, pirentoOne } = ecosystem;
  const st = useSettings();
  return (
    <section id="ecosystem" className="scroll-mt-24 py-28 md:py-40">
      <div className="container-x">
        <SectionHeader n={n} label="Pirento ecosystem" lines={['One family.', 'Many ways to serve.']} intro="Pirento Foundation sits inside the Pirento ecosystem, sponsored by Venturecore, alongside Bharat ID by Pirento and the Pirento One partner network. Today it runs four programmes; tomorrow it plans to build schools." />

        <div className="mx-auto mt-16 max-w-4xl">
          <div data-reveal className="group flex items-start gap-5 rounded-[22px] border border-rule p-6 transition-colors duration-500 hover:border-ink md:p-8">
            <Badge icon={Building2} />
            <div>
              <p className="eyebrow">{parent.meta}</p>
              <h3 className="mt-2 text-2xl md:text-3xl">{parent.name}</h3>
              <p className="mt-2 text-muted">{parent.text}</p>
            </div>
          </div>
          <Stem />
          <div data-reveal className="flex items-start gap-5 rounded-[22px] border-2 border-ink bg-stone p-6 md:p-8">
            <Badge icon={HeartHandshake} accent />
            <div>
              <p className="eyebrow !text-ink/70">{foundation.meta}</p>
              <h3 className="mt-2 text-3xl md:text-4xl">{foundation.name}</h3>
              <p className="mt-2 text-ink/80">{foundation.text}</p>
            </div>
          </div>
          <Stem />
        </div>

        <div className="relative grid gap-4 lg:grid-cols-3">
          <span aria-hidden className="absolute -top-px left-[16.6%] right-[16.6%] hidden h-px bg-ink/40 lg:block" />
          <div data-reveal className="rounded-[22px] border border-rule p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Programmes</p>
              <StatusBadge status="Now" />
            </div>
            <ul className="mt-6 space-y-3">
              {programmes.map((p) => (
                <li key={p.key} className="flex items-baseline justify-between gap-3 border-b border-rule pb-3 last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-right text-xs text-muted">{p.category}</span>
                </li>
              ))}
            </ul>
          </div>
          {future.map((f, i) => (
            <div key={f.name} data-reveal className="group rounded-[22px] border border-dashed border-ink/40 p-6 transition-colors duration-500 hover:border-ink md:p-8">
              <div className="flex items-center justify-between gap-3">
                <Badge icon={i ? GraduationCap : School} />
                <StatusBadge status="Expected" />
              </div>
              <h3 className="mt-6 text-2xl md:text-3xl">{f.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2"><Tag>{f.place}</Tag><Tag>{f.stage}</Tag><Tag>Future plan · Education</Tag></div>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{futureNote}</p>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {[
            [bharatId, Fingerprint, st.bharatIdUrl, 'Create your Bharat ID'],
            [pirentoOne, Handshake, st.pirentoOneUrl, 'Become a Pirento One partner'],
          ].map(([item, Icon, href, cta]) => (
            <div key={item.name} data-reveal className="group flex flex-col justify-between gap-8 rounded-[22px] border border-rule p-7 transition-colors duration-500 hover:border-ink md:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Badge icon={Icon} />
                  <span className="rounded-full border border-rule px-3 py-1 text-xs">{item.tag}</span>
                </div>
                <h3 className="mt-6 text-2xl md:text-3xl">{item.name}</h3>
                <p className="mt-3 leading-relaxed text-muted">{item.text}</p>
              </div>
              {href && (
                <div>
                  <Button href={href} target="_blank" rel="noopener noreferrer" variant="outline" icon={ArrowUpRight}>
                    {cta} <span className="sr-only">(opens in a new tab)</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <a
          data-reveal
          data-cursor="Visit"
          href={st.pirentoUrl || site.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-4 flex flex-col gap-6 rounded-[22px] bg-inverse p-7 text-on-inverse sm:flex-row sm:items-center sm:justify-between md:p-10"
        >
          <div>
            <p className="eyebrow !text-inverse-muted">Part of the Pirento family</p>
            <p className="poster mt-3 text-[clamp(2.6rem,6vw,5rem)]">{site.label}</p>
            <p className="mt-2 text-inverse-muted">{site.text}<span className="sr-only"> (opens in a new tab)</span></p>
          </div>
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-500 ease-ui group-hover:rotate-45">
            <ArrowUpRight aria-hidden className="size-6" />
          </span>
        </a>
      </div>
    </section>
  );
}
