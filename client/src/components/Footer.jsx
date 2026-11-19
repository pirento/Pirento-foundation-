// Site footer: who we are, contact, link columns, the big wordmark and the legal line with registration numbers.
import { Link } from 'react-router';
import { ArrowUp } from 'lucide-react';
import { brand, nav, socials, legalLinks } from '../data/site.js';
import { scrollToTop } from '../lib/motion.js';
import { useSettings } from '../lib/settings.jsx';

const give = [
  { to: '/donate', label: 'Donate' },
  { to: '/donate?monthly=1', label: 'Give monthly' },
  { to: '/membership', label: 'Become a member' },
  { to: '/updates', label: 'Updates' },
  { to: '/verify', label: 'Verify a certificate' },
  { to: '/dashboard', label: 'My account' },
];

const linkClass = 'text-inverse-muted transition-colors hover:text-on-inverse';

function Column({ title, children }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const st = useSettings();
  const regs = [
    st.cin && `CIN ${st.cin}`,
    st.pan && `PAN ${st.pan}`,
    st.reg12A && `12A ${st.reg12A}`,
    st.reg80G && `80G ${st.reg80G}`,
    st.csr1 && `CSR-1 ${st.csr1}`,
    st.fcra && `FCRA ${st.fcra}`,
  ].filter(Boolean);
  const email = st.email || brand.email;
  const phone = st.phone || brand.phone;

  return (
    <footer className="inverse bg-inverse text-on-inverse">
      <div className="container-x pt-20 md:pt-24">
        <div className="grid gap-12 border-b border-inverse-rule pb-14 md:grid-cols-12 md:pb-16">
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-[0.04em]"
            >
              <span aria-hidden className="size-3 rounded-[3px] bg-accent ring-1 ring-on-inverse" />
              {brand.name}
            </Link>
            <p className="mt-2 text-sm text-inverse-muted">{brand.tagline}</p>
            <p className="display mt-8 text-2xl md:text-3xl">
              Trees that survive. Food on time.{' '}
              <span className="text-inverse-muted">A record for every rupee.</span>
            </p>
            <address className="mt-8 space-y-1.5 text-sm not-italic text-inverse-muted">
              <a href={`mailto:${email}`} className="block break-all text-on-inverse hover:underline">
                {email}
              </a>
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="block hover:text-on-inverse">
                {phone}
              </a>
              <span className="block">{st.address || brand.office}</span>
            </address>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-6 md:col-start-7"
          >
            <Column title="Explore">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className={linkClass}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </Column>
            <Column title="Give">
              {give.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className={linkClass}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </Column>
            <Column title="Policies">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={st.pirentoUrl || 'https://pirento.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  pirento.com ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </Column>
          </nav>

          <div className="flex gap-3 md:col-span-1 md:justify-end">
            {socials.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} (opens in a new tab)`}
                className="grid size-11 place-items-center rounded-full border border-inverse-rule hover:border-on-inverse"
              >
                <s.icon aria-hidden className="size-4" />
              </a>
            ))}
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="grid size-11 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-300 hover:-translate-y-1"
            >
              <ArrowUp aria-hidden className="size-4" />
            </button>
          </div>
        </div>

        {/* Sized to the container width (cqw), so the wordmark fills one line on every screen without distortion. */}
        <div className="mt-10 [container-type:inline-size]" aria-hidden>
          <p className="poster whitespace-nowrap text-[12.6cqw] leading-[0.85]">Pirento Foundation</p>
        </div>

        <div className="flex flex-col gap-3 py-8 text-xs leading-relaxed text-inverse-muted md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl">
            © {new Date().getFullYear()} {brand.name}. A not-for-profit company registered under section 8 of
            the Companies Act, 2013, and the charitable arm of {brand.sponsor} (CIN {brand.sponsorCin}).
            {regs.length > 0 && (
              <>
                <br />
                {regs.join(' · ')}
              </>
            )}
          </p>
          <p className="shrink-0">Donations eligible for deduction under section 80G.</p>
        </div>
      </div>
    </footer>
  );
}
