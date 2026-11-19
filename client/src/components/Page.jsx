import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { usePageMotion } from '../lib/motion.js';

/** Sets title/description and runs the page's entrance + scroll motion. */
export default function Page({ title, description, children }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title ? `${title} · Pirento Foundation` : 'Pirento Foundation · People. Planet. Possibility.';
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
  usePageMotion(ref, pathname);
  return (
    <main id="main" ref={ref} className="animate-[page-in_0.6s_var(--ease-ui)]">
      {children}
    </main>
  );
}

/** Standard top-of-page hero for inner pages. */
export function PageHero({ label, lines, intro, children }) {
  return (
    <section className="relative pb-20 pt-40 md:pb-28 md:pt-48">
      <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
      <div className="container-x">
        <p data-hero-after className="eyebrow">{label}</p>
        <h1 data-hero className="h-hero mt-6 max-w-5xl">
          {lines.map((l, i) => (
            <span className="line" key={i}><span>{l}</span></span>
          ))}
        </h1>
        {intro && <p data-hero-after className="prose-body mt-8">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
