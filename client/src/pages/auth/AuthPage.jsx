// /login and /register: poster panel on the left, the form on the right.

import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import Page from '../../components/Page.jsx';
import { Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import Register from './Register.jsx';
import SignIn from './SignIn.jsx';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    api('/auth/config').then(setCfg, () => setCfg({ googleClientId: null, sms: false, email: true }));
  }, []);
  const nextParam = params.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
  if (user) return <Navigate to={next || (user.role === 'admin' ? '/admin' : '/dashboard')} replace />;
  const q = next ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <Page
      title={isLogin ? 'Sign in' : 'Create account'}
      description="Sign in to your Pirento Foundation account with Google, an email code or a mobile code."
    >
      <section className="pb-24 pt-[84px]">
        <div className="container-x grid gap-6 lg:grid-cols-12">
          <div className="inverse relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[28px] bg-inverse p-8 text-on-inverse md:p-12 lg:col-span-6">
            <div
              aria-hidden
              className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--inverse-rule)_1px,transparent_1px),linear-gradient(90deg,var(--inverse-rule)_1px,transparent_1px)] [background-size:72px_72px]"
            />
            <p data-hero-after className="relative eyebrow">
              {isLogin ? 'Account sign-in' : 'Create your account'}
            </p>
            <h1 data-hero className="poster relative mt-10 text-[clamp(3.2rem,8vw,7.5rem)]">
              <span className="line">
                <span>One account.</span>
              </span>
              <span className="line">
                <span className="text-accent">Every receipt.</span>
              </span>
            </h1>
            <p data-hero-after className="relative mt-8 max-w-sm text-inverse-muted">
              Receipts, 80G documents, membership and certificates in one place. Sign in with Bharat ID by
              Pirento, Google, or a code sent to your mobile or email.
            </p>
          </div>

          <div data-hero-visual className="rounded-[28px] border border-rule p-6 md:p-10 lg:col-span-6">
            <div
              className="mb-8 grid grid-cols-2 gap-1 rounded-full border border-rule p-1"
              role="tablist"
              aria-label="Account"
            >
              {[
                ['/login', 'Sign in', isLogin],
                ['/register', 'Create account', !isLogin],
              ].map(([to, label, on]) => (
                <Link
                  key={to}
                  to={`${to}${q}`}
                  role="tab"
                  aria-selected={on}
                  className={`rounded-full py-2.5 text-center text-sm font-medium transition-colors ${on ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
            {params.get('error') && (
              <div className="mb-6">
                <Notice kind="error">{params.get('error')}</Notice>
              </div>
            )}
            {!cfg ? (
              <div className="h-72" aria-busy="true" />
            ) : isLogin ? (
              <SignIn cfg={cfg} next={next} />
            ) : (
              <Register cfg={cfg} next={next} />
            )}
          </div>
        </div>
      </section>
    </Page>
  );
}
