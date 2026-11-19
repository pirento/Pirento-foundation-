// First-visit preloader: a 000 → 100 counter, then the panel lifts like a curtain.
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { finishPreloader, reducedMotion } from '../lib/motion.js';
import { brand } from '../data/site.js';

function shouldShow() {
  try {
    if (reducedMotion() || sessionStorage.getItem('pf-loaded')) return false;
    sessionStorage.setItem('pf-loaded', '1');
  } catch {
    /* storage blocked: still show once per page load */
  }
  return !reducedMotion();
}

export default function Preloader() {
  const [show, setShow] = useState(shouldShow);
  const root = useRef(null);
  const num = useRef(null);

  useLayoutEffect(() => {
    if (!show) return finishPreloader();
    document.documentElement.style.overflow = 'hidden';
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          onComplete: () => {
            document.documentElement.style.overflow = '';
            setShow(false);
          },
        })
        .from('[data-top]', { yPercent: 110, duration: 0.7, ease: 'expo.out', stagger: 0.05 })
        .to(
          counter,
          {
            v: 100,
            duration: 1.1,
            ease: 'power2.inOut',
            onUpdate: () =>
              num.current && (num.current.textContent = String(Math.round(counter.v)).padStart(3, '0')),
          },
          0.1,
        )
        .to('[data-bar]', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.1)
        .add(finishPreloader, '+=0.15')
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '<');
    }, root);
    return () => ctx.revert();
  }, [show]);

  if (!show) return null;
  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#07518a] p-5 text-[#fff0d5] sm:p-8 lg:p-12"
    >
      <div className="flex justify-between overflow-hidden text-sm font-medium uppercase tracking-[0.04em]">
        <span data-top>{brand.name}</span>
        <span data-top>© {new Date().getFullYear()}</span>
      </div>
      <div>
        <div
          ref={num}
          className="poster leading-none tabular-nums"
          style={{ fontSize: 'clamp(5rem, 20vw, 16rem)' }}
        >
          000
        </div>
        <div className="mt-6 h-px bg-[#2a6aa3]">
          <div data-bar className="h-px origin-left scale-x-0 bg-[#f5e500]" />
        </div>
      </div>
    </div>
  );
}
