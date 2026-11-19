// Fixed top bar: logo, sliding pill nav, theme toggle, account and donate buttons, and the mobile menu.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { Moon, Sun, Menu, X, UserRound } from 'lucide-react';
import { brand, nav } from '../data/site.js';
import { useAuth } from '../lib/auth.jsx';
import { lockScroll, reducedMotion } from '../lib/motion.js';
import { Button } from './ui.jsx';

export function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-[0.8rem] font-semibold uppercase tracking-[0.04em] sm:gap-2.5 sm:text-[0.95rem] ${className}`}
    >
      <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
      {brand.name}
    </Link>
  );
}

function ThemeToggle() {
  const [mode, setMode] = useState(() => document.documentElement.dataset.mode);
  const toggle = (e) => {
    const next = mode === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.mode = next;
      try {
        localStorage.setItem('pf-mode', next);
      } catch {
        /* storage blocked: theme still switches for this visit */
      }
      flushSync(() => setMode(next));
    };
    if (!document.startViewTransition || reducedMotion()) return apply();
    const { clientX: x, clientY: y } = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document
      .startViewTransition(apply)
      .ready.then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 600, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
        ),
      );
  };
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      className="relative grid size-9 place-items-center sm:size-10 overflow-hidden rounded-full border border-rule transition-colors hover:border-ink"
    >
      <Sun
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ease-ui ${mode === 'dark' ? 'rotate-90 scale-0' : ''}`}
      />
      <Moon
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ease-ui ${mode === 'dark' ? '' : '-rotate-90 scale-0'}`}
      />
    </button>
  );
}

function PillNav() {
  const { pathname } = useLocation();
  const wrap = useRef(null);
  const [pill, setPill] = useState(null);
  useLayoutEffect(() => {
    const active = wrap.current?.querySelector('a.active');
    setPill(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
  }, [pathname]);
  return (
    <nav
      aria-label="Main"
      ref={wrap}
      className="relative hidden items-center rounded-full border border-rule p-1 xl:flex"
    >
      {pill && (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full bg-ink transition-all duration-500 ease-ui"
          style={pill}
        />
      )}
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end
          className={({ isActive }) =>
            `relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${isActive ? 'active text-paper' : 'text-muted hover:text-ink'}`
          }
        >
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}

function MobileMenu({ open, onClose }) {
  const panel = useRef(null);
  const { user } = useAuth();
  useEffect(() => {
    lockScroll(open);
    const el = panel.current;
    if (reducedMotion()) gsap.set(el, { clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' });
    else {
      gsap.to(el, {
        clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
        duration: 0.8,
        ease: 'expo.inOut',
      });
      if (open)
        gsap.fromTo(
          el.querySelectorAll('[data-m]'),
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.25 },
        );
    }
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [open, onClose]);

  const links = [
    ...nav,
    user
      ? { to: user.role === 'admin' ? '/admin' : '/dashboard', label: 'My account' }
      : { to: '/login', label: 'Log in' },
    { to: '/donate', label: 'Donate' },
  ];
  return (
    <div
      ref={panel}
      id="mobile-menu"
      inert={!open}
      style={{ clipPath: 'inset(0 0 100% 0)' }}
      className="fixed inset-0 z-40 flex flex-col bg-paper px-5 pb-8 pt-24 sm:px-8 xl:hidden"
    >
      <nav aria-label="Mobile" className="flex-1">
        <ul>
          {links.map((n, i) => (
            <li key={n.to} className="overflow-hidden border-b border-rule">
              <Link
                data-m
                to={n.to}
                onClick={onClose}
                className="flex items-baseline gap-4 py-3 font-display text-[2.4rem] font-medium tracking-[-0.04em]"
              >
                <span className="text-xs tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <a href={`mailto:${brand.email}`} className="hover:text-ink">
          {brand.email}
        </a>
        <a href={`tel:${brand.phone.replace(/\s/g, '')}`} className="hover:text-ink">
          {brand.phone}
        </a>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      setScrolled(y > 10);
      setHidden(y > last && y > 200);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[translate,background-color,border-color] duration-500 ease-ui ${hidden && !open ? '-translate-y-full' : ''} ${scrolled && !open ? 'border-b border-rule bg-paper/80 backdrop-blur-md' : 'border-b border-transparent'}`}
      >
        <div className="container-x flex h-[68px] items-center justify-between gap-3">
          <Logo />
          <PillNav />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="mr-2 hidden items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs 2xl:inline-flex">
              <span className="relative size-1.5 rounded-full bg-accent">
                <span aria-hidden className="pulse absolute inset-0 rounded-full bg-accent" />
              </span>
              {brand.status}
            </span>
            <ThemeToggle />
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'}
              aria-label={user ? 'My account' : 'Log in'}
              className="grid size-9 place-items-center rounded-full border border-rule transition-colors hover:border-ink sm:size-10"
            >
              <UserRound aria-hidden className="size-4" />
            </Link>
            {/* Wrapped so "hidden" can't lose to the button's own inline-flex; on phones Donate lives in the menu and hero. */}
            <span className="hidden sm:block">
              <Button to="/donate" variant="accent" className="!py-2.5" cursor="Donate">
                Donate
              </Button>
            </span>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid size-9 place-items-center rounded-full border border-rule sm:size-10 xl:hidden"
            >
              {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
