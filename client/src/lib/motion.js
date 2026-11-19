// Smooth scrolling and the page entrance / scroll-reveal animations (GSAP + Lenis).
import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis;
// Late fonts and images change page height after the triggers were measured, which left lower sections
// waiting for a scroll position that no longer exists (blank sections on phones). Re-measure when that happens.
let refreshTimer;
const refreshSoon = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
};
document.fonts?.ready.then(refreshSoon);
addEventListener('load', refreshSoon);
new ResizeObserver(refreshSoon).observe(document.body);

export function startSmoothScroll() {
  if (reducedMotion() || lenis) return;
  lenis = new Lenis({ duration: 1.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export const scrollToTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0));
export const lockScroll = (on) => {
  document.documentElement.style.overflow = on ? 'hidden' : '';
  on ? lenis?.stop() : lenis?.start();
};

// Resolves when the preloader curtain has lifted (immediately if it never shows).
let release;
export const preloaderDone = new Promise((r) => (release = r));
export const finishPreloader = () => release();

/**
 * Page motion, scoped to `ref`:
 *  [data-hero] .line > span  → hero lines slide up after the preloader
 *  [data-lines] .line > span → heading lines slide up on scroll
 *  [data-reveal]             → fade up in batches, once
 *  .hl                       → highlighter sweeps in when seen
 */
export function usePageMotion(ref, key) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hls = root.querySelectorAll('.hl');
    if (reducedMotion()) {
      hls.forEach((el) => el.classList.add('on'));
      return;
    }
    let ctx;
    let cancelled = false;
    const hero = root.querySelectorAll('[data-hero] .line > span');
    const heroAfter = root.querySelectorAll('[data-hero-after]');
    const heroVisual = root.querySelectorAll('[data-hero-visual]');
    // Empty selections are skipped so GSAP does not warn.
    const set = (els, v) => els.length && gsap.set(els, v);
    set(hero, { yPercent: 110 });
    set(heroAfter, { autoAlpha: 0, y: 24 });
    set(heroVisual, { autoAlpha: 0, scale: 0.97 });

    preloaderDone.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline();
        if (hero.length) tl.to(hero, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09 });
        if (heroAfter.length)
          tl.to(
            heroAfter,
            { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 },
            hero.length ? '-=0.9' : 0,
          );
        if (heroVisual.length)
          tl.to(heroVisual, { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, '-=0.7');

        root.querySelectorAll('[data-lines]').forEach((h) => {
          gsap.from(h.querySelectorAll('.line > span'), {
            yPercent: 110,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: h, start: 'top 88%', once: true },
          });
        });
        const items = root.querySelectorAll('[data-reveal]');
        set(items, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(items, {
          start: 'top 92%',
          once: true,
          onEnter: (b) =>
            gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }),
        });
        hls.forEach((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => setTimeout(() => el.classList.add('on'), 500),
          }),
        );
        ScrollTrigger.refresh();
      }, root);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ref, key]);
}
