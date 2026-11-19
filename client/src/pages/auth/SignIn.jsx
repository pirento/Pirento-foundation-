// Sign in: Bharat ID / Google, a one-time code by mobile or email, or a password (with reset).

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  Social,
  ChannelSwitch,
  CodeInput,
  useCooldown,
  DevCode,
  placeholderFor,
  labelFor,
} from './parts.jsx';

export default function SignIn({ cfg, next }) {
  const { signIn, setUser } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('code'); // code | password | reset
  const [channel, setChannel] = useState('phone');
  const [target, setTarget] = useState('');
  const [sent, setSent] = useState(null); // { target, devCode }
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [left, startCooldown] = useCooldown();

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const go = (v) => {
    setView(v);
    setSent(null);
    setError('');
  };
  const send = (purpose) =>
    run(async () => {
      const r = await api('/auth/otp/send', { method: 'POST', body: { channel, target, purpose } });
      setSent(r);
      startCooldown();
    });

  if (view === 'password')
    return (
      <form
        onSubmit={(e) => (e.preventDefault(), run(() => signIn('/auth/login', { id: target, password })))}
        className="space-y-5"
      >
        <Field
          label="Email or mobile number"
          name="id"
          required
          autoComplete="username"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <div>
          <Field
            label="Password"
            name="password"
            required
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-2 flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
            >
              {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}{' '}
              {show ? 'Hide' : 'Show'} password
            </button>
            <button
              type="button"
              onClick={() => go('reset')}
              className="text-ink underline underline-offset-4"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <Button type="submit" variant="accent" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <button
          type="button"
          onClick={() => go('code')}
          className="flex w-full items-center justify-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> Sign in with a code instead
        </button>
      </form>
    );

  const purpose = view === 'reset' ? 'reset' : 'login';
  return (
    <div>
      {view === 'code' && !sent && (
        <Social
          cfg={cfg}
          next={next}
          onGoogle={(credential) => run(() => signIn('/auth/google', { credential }))}
        />
      )}
      {view === 'reset' && (
        <div className="mb-6">
          <h2 className="text-2xl">Reset your password</h2>
          <p className="mt-1 text-sm text-muted">We’ll send a code to confirm it’s you.</p>
        </div>
      )}
      {!sent ? (
        <form onSubmit={(e) => (e.preventDefault(), send(purpose))} className="space-y-5">
          <ChannelSwitch value={channel} onChange={(c) => (setChannel(c), setTarget(''))} />
          <Field
            label={labelFor(channel)}
            name="target"
            required
            type={channel === 'email' ? 'email' : 'tel'}
            autoComplete={channel === 'email' ? 'email' : 'tel'}
            placeholder={placeholderFor(channel)}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            hint={`We’ll send a 6-digit code ${channel === 'phone' ? 'by SMS' : 'to this email'}.`}
          />
          {error && <Notice kind="error">{error}</Notice>}
          <Button type="submit" variant="accent" disabled={busy || !target} className="w-full">
            {busy ? 'Sending…' : 'Send code'}
          </Button>
        </form>
      ) : (
        <ResetOrCode
          key={sent.target}
          sent={sent}
          reset={view === 'reset'}
          busy={busy}
          error={error}
          left={left}
          onResend={() => send(purpose)}
          onChange={() => setSent(null)}
          onSubmit={(code, newPassword, clear) =>
            run(async () => {
              try {
                if (view === 'reset') {
                  const r = await api('/auth/password/reset', {
                    method: 'POST',
                    body: { channel, target, code, password: newPassword },
                  });
                  if (r.admin) return navigate('/admin/login?reset=1');
                  setUser(r.user);
                } else await signIn('/auth/otp/login', { channel, target, code });
              } catch (e) {
                clear?.();
                throw e;
              }
            })
          }
        />
      )}
      <div className="mt-6 flex justify-center">
        {view === 'code' ? (
          <button
            type="button"
            onClick={() => go('password')}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <KeyRound aria-hidden className="size-4" /> Use password instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go('password')}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" /> Back to sign-in
          </button>
        )}
      </div>
    </div>
  );
}

function ResetOrCode({ sent, reset, busy, error, left, onResend, onChange, onSubmit }) {
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  return (
    <form onSubmit={(e) => (e.preventDefault(), onSubmit(code, pw))} className="space-y-5">
      <p className="text-sm text-muted">
        Code sent to <strong className="font-medium text-ink">{sent.target}</strong>.{' '}
        <button type="button" onClick={onChange} className="text-ink underline underline-offset-4">
          Change
        </button>
      </p>
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium">
          6-digit code
        </label>
        <CodeInput
          id="code"
          disabled={busy}
          onComplete={(c, clear) => (setCode(c), !reset && onSubmit(c, null, clear))}
        />
        <p id="code-hint" className="mt-1.5 text-xs text-muted">
          {reset
            ? 'Enter or paste the code, then choose a new password.'
            : 'Enter or paste the code. It checks itself.'}
        </p>
        <DevCode code={sent.devCode} />
      </div>
      {reset && (
        <Field
          label="New password"
          name="newpw"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          hint="At least 8 characters."
        />
      )}
      {error && <Notice kind="error">{error}</Notice>}
      {reset && (
        <Button type="submit" variant="accent" disabled={busy || code.length !== 6} className="w-full">
          {busy ? 'Saving…' : 'Set password & sign in'}
        </Button>
      )}
      {busy && !reset && (
        <p className="text-sm text-muted" role="status">
          Checking…
        </p>
      )}
      <button
        type="button"
        disabled={left > 0 || busy}
        onClick={onResend}
        className="text-sm text-ink underline underline-offset-4 disabled:text-muted disabled:no-underline"
      >
        {left > 0 ? `Resend code in ${left}s` : 'Resend code'}
      </button>
    </form>
  );
}

/* ---------- create account ---------- */
