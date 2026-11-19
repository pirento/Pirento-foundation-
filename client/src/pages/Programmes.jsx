// Programmes page: one feature row per programme with what we count, track and check.
import Page, { PageHero } from '../components/Page.jsx';
import { programmeArt } from '../components/Art.jsx';
import { Button, Tag } from '../components/ui.jsx';
import { programmes, futureNote } from '../data/site.js';
import FinalCta from '../components/FinalCta.jsx';

export default function Programmes() {
  return (
    <Page
      title="Programmes"
      description="Pirento Green, Food Relief, Education, and Health & livelihood: what we do and how we measure it."
    >
      <PageHero
        label="Programmes"
        lines={['Count it. Track it.', 'Check it.']}
        intro="Each programme reports what was counted, the outcome we track, and the quality check behind it. Year one is about one pilot per programme with clean records."
      />
      <section className="border-t border-rule py-28 md:py-40">
        <div className="container-x space-y-28 md:space-y-40">
          {programmes.map((p, i) => {
            const Art = programmeArt[p.key];
            return (
              <article
                key={p.key}
                id={p.key}
                className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-12 lg:gap-16"
              >
                <div
                  data-reveal
                  className={`overflow-hidden rounded-[22px] border border-rule lg:col-span-7 ${i % 2 ? 'lg:order-2' : ''}`}
                >
                  <div className="aspect-[16/10]">
                    <Art />
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <p data-reveal className="eyebrow">
                    {p.category} · {p.period}
                  </p>
                  <h2 data-lines className="h-item mt-4 !text-[clamp(2rem,3.6vw,3.25rem)]">
                    <span className="line">
                      <span>{p.name}</span>
                    </span>
                  </h2>
                  <p data-reveal className="prose-body mt-4">
                    {p.lead}
                  </p>
                  <ul
                    data-reveal
                    className="mt-6 space-y-3 border-l border-rule pl-5 text-[0.95rem] leading-relaxed text-muted"
                  >
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <dl data-reveal className="mt-8 grid gap-3 rounded-[18px] border border-rule p-5 text-sm">
                    {[
                      ['Counted', p.measure.counted],
                      ['Outcome', p.measure.outcome],
                      ['Quality check', p.measure.quality],
                    ].map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3">
                        <dt className="text-muted">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div data-reveal className="mt-6 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                  <div data-reveal className="mt-8">
                    <Button to={`/donate?programme=${p.key}`} variant="outline" cursor="Donate">
                      Support {p.name}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
          <p data-reveal className="max-w-2xl border-t border-rule pt-8 text-sm leading-relaxed text-muted">
            {futureNote}
          </p>
        </div>
      </section>
      <FinalCta />
    </Page>
  );
}
