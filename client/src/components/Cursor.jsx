import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Dot + trailing ring; the ring grows over interactive elements and shows `data-cursor` labels. */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const [label, setLabel] = useState('');
  const [hover, setHover] = useState(false);
  const fine = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => {
    if (!fine) return;
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.1 });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.1 });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3.out' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3.out' });
    const move = (e) => {
      dx(e.clientX), dy(e.clientY), rx(e.clientX), ry(e.clientY);
      const el = e.target.closest?.('a, button, [data-cursor], input, select, textarea, summary, label');
      setHover(Boolean(el));
      setLabel(el?.closest('[data-cursor]')?.dataset.cursor ?? '');
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [fine]);

  if (!fine) return null;
  const size = label ? 84 : hover ? 52 : 34;
  return (
    <div aria-hidden className="cursor pointer-events-none fixed inset-0 z-[90]">
      <div ref={dot} className="absolute -left-1 -top-1 size-2 rounded-full bg-ink" />
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.7rem] font-medium transition-all duration-300 ease-ui ${label ? 'border-accent bg-accent text-on-accent' : 'border-ink/50'}`}
          style={{ width: size, height: size }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
