import { Link } from 'react-router';
import { ArrowUp } from 'lucide-react';
import { brand, nav, socials, legalLinks } from '../data/site.js';
import { scrollToTop } from '../lib/motion.js';

const more = [
  { to: '/donate', label: 'Donate' },
  { to: '/dashboard', label: 'My account' },
  { to: '/verify', label: 'Verify a certificate' },
];

export default function Footer() {
  return (
    <footer className="inverse bg-inverse text-on-inverse">
      <div className="container-x pt-24">
        <div className="grid gap-12 border-b border-inverse-rule pb-16 md:grid-cols-12">
          <p className="display text-3xl md:col-span-5">
            Trees that survive.
            <br />
            Food on time. <span className="text-inverse-muted">A record for every rupee.</span>
          </p>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-sm md:col-span-5">
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.to}><Link to={n.to} className="text-inverse-muted transition-colors hover:text-on-inverse">{n.label}</Link></li>
              ))}
            </ul>
            <ul className="space-y-3">
              {more.map((n) => (
                <li key={n.to}><Link to={n.to} className="text-inverse-muted transition-colors hover:text-on-inverse">{n.label}</Link></li>
              ))}
              <li>
                <a href="https://pirento.com" target="_blank" rel="noopener noreferrer" className="text-inverse-muted transition-colors hover:text-on-inverse">
                  pirento.com <span className="sr-only">(opens in a new tab)</span>↗
                </a>
              </li>
              <li><a href={`mailto:${brand.email}`} className="text-inverse-muted transition-colors hover:text-on-inverse">{brand.email}</a></li>
            </ul>
          </nav>
          <div className="flex items-start gap-3 md:col-span-2 md:justify-end">
            {socials.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`} className="grid size-11 place-items-center rounded-full border border-inverse-rule hover:border-on-inverse">
                <s.icon aria-hidden className="size-4" />
              </a>
            ))}
            <button onClick={scrollToTop} aria-label="Back to top" className="grid size-11 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-300 hover:-translate-y-1">
              <ArrowUp aria-hidden className="size-4" />
            </button>
          </div>
        </div>
        <svg viewBox="0 0 1000 120" className="mt-12 w-full fill-on-inverse" role="img" aria-label={brand.name}>
          <text x="0" y="104" textLength="1000" lengthAdjust="spacingAndGlyphs" fontFamily="Anton, sans-serif" fontSize="130">
            PIRENTO FOUNDATION
          </text>
        </svg>
        <div className="flex flex-col gap-2 py-8 text-xs leading-relaxed text-inverse-muted md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name} · {brand.legalForm}. An initiative of {brand.sponsor}, CIN {brand.sponsorCin}.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {legalLinks.map((l) => <Link key={l.to} to={l.to} className="underline-offset-4 hover:text-on-inverse hover:underline">{l.label}</Link>)}
            <span>Not yet eligible for 80G.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
