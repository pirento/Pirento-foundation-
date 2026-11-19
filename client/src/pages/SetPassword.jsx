// Landing page for the "set your password" link emailed after a donation without login.
import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import Page from '../components/Page.jsx';
import { Button, Field, Notice } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

/** Landing page for the "set your password" link emailed after a donation without login. */
export default function SetPassword() {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  const [pw, setPw] = useState({ a: '', b: '' });
  const [state, setState] = useState({ busy: false, error: '' });
  if (user) return <Navigate to="/dashboard/profile" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (pw.a !== pw.b) return setState({ busy: false, error: 'The two passwords do not match.' });
    setState({ busy: true, error: '' });
    try {
      await signIn('/auth/password/set', { token: params.get('token'), password: pw.a });
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };
  return (
    <Page title="Set your password">
      <section className="relative min-h-[80vh] pb-24 pt-36 md:pt-44">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
        <div className="container-x max-w-xl">
          <p data-hero-after className="eyebrow">
            Your account
          </p>
          <h1 data-hero className="poster mt-4 text-[clamp(3rem,8vw,5.5rem)]">
            <span className="line">
              <span>Set your password.</span>
            </span>
          </h1>
          <p data-hero-after className="prose-body mt-6">
            Your User ID is the email your receipt came to. Choose a password to open your dashboard:
            receipts, monthly giving, membership and profile.
          </p>
          <form
            data-hero-visual
            onSubmit={submit}
            className="mt-10 space-y-5 rounded-[22px] border border-rule bg-paper p-6 md:p-8"
          >
            <Field
              label="New password"
              name="a"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={pw.a}
              onChange={(e) => setPw({ ...pw, a: e.target.value })}
              hint="At least 8 characters."
            />
            <Field
              label="Repeat password"
              name="b"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={pw.b}
              onChange={(e) => setPw({ ...pw, b: e.target.value })}
            />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button
              type="submit"
              variant="accent"
              disabled={state.busy || !params.get('token')}
              className="w-full"
            >
              {state.busy ? 'Saving…' : 'Set password and open dashboard'}
            </Button>
            <p className="text-center text-sm text-muted">
              Link expired?{' '}
              <Link to="/login" className="underline underline-offset-4">
                Use “Forgot password”
              </Link>
              .
            </p>
          </form>
        </div>
      </section>
    </Page>
  );
}
