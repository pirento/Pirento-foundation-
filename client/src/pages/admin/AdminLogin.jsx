// Two-step admin sign-in: password, then a code sent to the admin's email.

import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useTitle } from '../../lib/hooks.js';

export default function AdminLogin() {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  const [f, setF] = useState({ email: '', password: '' });
  const [step, setStep] = useState(null); // { target, devCode }
  const [code, setCode] = useState('');
  const [state, setState] = useState({ busy: false, error: '' });
  useTitle('Sign in', 'Admin');
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  const run = async (fn) => {
    setState({ busy: true, error: '' });
    try {
      await fn();
      setState({ busy: false, error: '' });
    } catch (e) {
      setState({ busy: false, error: e.message });
    }
  };
  const first = (e) => (
    e.preventDefault(),
    run(async () => setStep(await api('/auth/admin/login', { method: 'POST', body: f })))
  );
  const second = (c) => run(() => signIn('/auth/admin/verify', { email: f.email, code: c }));

  return (
    <main className="grid min-h-screen place-items-center bg-inverse px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-paper p-7 md:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-[0.95rem] font-semibold uppercase tracking-[0.04em]"
        >
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" /> Pirento Foundation
        </Link>
        <p className="eyebrow mt-10">Admin desk · Step {step ? 2 : 1} of 2</p>
        <h1 className="poster mt-3 text-[clamp(2.6rem,8vw,3.75rem)]">
          {step ? 'Check your email.' : 'Admin sign-in.'}
        </h1>
        {user && (
          <Notice>You are signed in as a donor ({user.email}). Admin access needs an admin account.</Notice>
        )}
        {params.get('reset') && !step && (
          <div className="mt-6">
            <Notice>Password updated. Sign in below to finish.</Notice>
          </div>
        )}

        {!step ? (
          <form onSubmit={first} className="mt-8 space-y-5">
            <Field
              label="Admin email"
              name="email"
              type="email"
              required
              autoComplete="username"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" variant="accent" disabled={state.busy} className="w-full">
              {state.busy ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => (e.preventDefault(), second(code))} className="mt-8 space-y-5">
            <p className="text-sm text-muted">
              We sent a 6-digit code to <strong className="font-medium text-ink">{step.target}</strong>. It
              expires in 10 minutes.
            </p>
            <div>
              <label htmlFor="admin-code" className="mb-2 block text-sm font-medium">
                6-digit code
              </label>
              <input
                id="admin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(d);
                  if (d.length === 6) second(d);
                }}
                className="input text-center font-mono text-2xl tracking-[0.6em]"
              />
              {step.devCode && (
                <p className="mt-2 rounded-[10px] bg-stone px-3 py-2 text-xs">
                  Test mode, no email provider set: code <strong className="font-mono">{step.devCode}</strong>
                </p>
              )}
            </div>
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button
              type="submit"
              variant="accent"
              disabled={state.busy || code.length !== 6}
              className="w-full"
              icon={ShieldCheck}
            >
              {state.busy ? 'Verifying…' : 'Sign in'}
            </Button>
            <button
              type="button"
              onClick={() => (setStep(null), setCode(''))}
              className="text-sm text-muted underline underline-offset-4"
            >
              Start again
            </button>
          </form>
        )}
        <p className="mt-10 text-xs leading-relaxed text-muted">
          Restricted area. Sign-ins are rate-limited; admin sessions expire after 12 hours.
        </p>
      </div>
    </main>
  );
}
