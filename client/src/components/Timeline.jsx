// Vertical roadmap timeline whose rail fills with the accent colour as you scroll.
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { reducedMotion } from '../lib/motion.js';
import { StatusBadge } from './ui.jsx';

/** Vertical rail that fills with accent as you scroll. */
export default function Timeline({ items }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-fill]',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom 60%', scrub: true },
        },
      );
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
          <span
            aria-hidden
            className={`absolute -left-10 top-1.5 size-[15px] rounded-full border border-ink ${r.status === 'Now' ? 'bg-accent' : 'bg-paper'}`}
          />
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
