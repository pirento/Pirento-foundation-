import { Link } from 'react-router';
import Page, { PageHero } from '../components/Page.jsx';
import { policies } from '../data/policies.js';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Policy({ slug }) {
  const doc = policies.find((p) => p.slug === slug);
  return (
    <Page title={doc.title} description={doc.intro}>
      <PageHero label={`Policy · Last updated ${doc.updated}`} lines={doc.lines} intro={doc.intro} />
      <section className="border-t border-rule py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <nav aria-label="On this page" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">On this page</p>
              <ol className="mt-4 space-y-2 text-sm">
                {doc.sections.map((s, i) => (
                  <li key={s.h}>
                    <a href={`#${slugify(s.h)}`} className="text-muted hover:text-ink">
                      <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span> {s.h}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="eyebrow mt-10">Other policies</p>
              <ul className="mt-4 space-y-2 text-sm">
                {policies.filter((p) => p.slug !== slug).map((p) => (
                  <li key={p.slug}><Link to={`/${p.slug}`} className="text-muted underline-offset-4 hover:text-ink hover:underline">{p.title}</Link></li>
                ))}
              </ul>
            </div>
          </nav>
          <article className="max-w-[44rem] lg:col-span-8 lg:col-start-5">
            {doc.sections.map((s, i) => (
              <section key={s.h} id={slugify(s.h)} className="scroll-mt-28 border-t border-rule py-10 first:border-0 first:pt-0">
                <h2 className="text-[clamp(1.5rem,2.4vw,2rem)]">
                  <span className="mr-3 text-base tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h2>
                {s.body.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="mt-5 space-y-3 border-l border-rule pl-5 leading-relaxed text-muted">
                      {b.map((li) => <li key={li}>{li}</li>)}
                    </ul>
                  ) : (
                    <p key={j} className="mt-5 leading-[1.75] text-muted">{b}</p>
                  ),
                )}
              </section>
            ))}
          </article>
        </div>
      </section>
    </Page>
  );
}
