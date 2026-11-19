// Create account: email (and optional mobile) verified by code before the account exists.

import { useState } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Social, CodeInput, useCooldown, DevCode, placeholderFor, labelFor } from './parts.jsx';

function VerifyRow({ channel, value, onValue, required, record, setRecord }) {
  const [left, startCooldown] = useCooldown();
  const id = `${channel}-otp`;
  const send = async () => {
    setRecord({ ...record, working: 'send', error: '' });
    try {
      const r = await api('/auth/otp/send', {
        method: 'POST',
        body: { channel, target: value, purpose: 'register' },
      });
      setRecord({ sentTo: r.target, devCode: r.devCode, verified: false });
      startCooldown();
    } catch (e) {
      setRecord({ ...record, working: null, error: e.message });
    }
  };
  const verify = async (code, clear) => {
    setRecord({ ...record, working: 'verify', error: '' });
    try {
      await api('/auth/otp/verify', { method: 'POST', body: { channel, target: value, code } });
      setRecord({ ...record, working: null, verified: true, error: '' });
    } catch (e) {
      clear();
      setRecord({ ...record, working: null, error: e.message });
    }
  };
  return (
    <div className="rounded-[18px] border border-rule p-4">
      <label htmlFor={channel} className="mb-2 block text-sm font-medium">
        {labelFor(channel)}{' '}
        <span className="font-normal text-muted">{required ? '(required)' : '(optional)'}</span>
      </label>
      <div className="flex gap-2">
        <input
          id={channel}
          type={channel === 'email' ? 'email' : 'tel'}
          autoComplete={channel === 'email' ? 'email' : 'tel'}
          placeholder={placeholderFor(channel)}
          className="input"
          value={value}
          onChange={(e) => (onValue(e.target.value), setRecord({}))}
        />
        {record.verified ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-on-accent">
            <Check aria-hidden className="size-4" /> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!value || record.working || left > 0}
            className="shrink-0 rounded-full border border-ink px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-paper disabled:border-rule disabled:text-muted disabled:hover:bg-transparent"
          >
            {record.working === 'send'
              ? 'Sending…'
              : left > 0
                ? `${left}s`
                : record.sentTo
                  ? 'Resend'
                  : 'Send OTP'}
          </button>
        )}
      </div>
      {record.sentTo && !record.verified && (
        <div className="mt-3">
          <label htmlFor={id} className="mb-2 block text-xs text-muted">
            Code sent to {record.sentTo}
          </label>
          <CodeInput id={id} disabled={record.working === 'verify'} onComplete={verify} />
          <p id={`${id}-hint`} className="sr-only">
            Six digits. It checks itself.
          </p>
          <DevCode code={record.devCode} />
        </div>
      )}
      {record.error && (
        <p className="mt-2 text-sm" role="alert">
          {record.error}
        </p>
      )}
    </div>
  );
}

export default function Register({ cfg, next }) {
  const { signIn } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', agree: false });
  const [emailRec, setEmailRec] = useState({});
  const [phoneRec, setPhoneRec] = useState({});
  const [state, setState] = useState({ busy: false, error: '' });
  const ready =
    f.name.trim() &&
    emailRec.verified &&
    (!f.phone || phoneRec.verified) &&
    f.password.length >= 8 &&
    f.agree;

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: '' });
    try {
      await signIn('/auth/register', { ...f, phone: f.phone || undefined });
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  }
  return (
    <div>
      <Social
        cfg={cfg}
        next={next}
        signup
        onGoogle={(credential) =>
          signIn('/auth/google', { credential }).catch((e) => setState({ busy: false, error: e.message }))
        }
      />
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Full name"
          name="name"
          required
          autoComplete="name"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <VerifyRow
          channel="email"
          required
          value={f.email}
          onValue={(v) => setF({ ...f, email: v })}
          record={emailRec}
          setRecord={setEmailRec}
        />
        <VerifyRow
          channel="phone"
          value={f.phone}
          onValue={(v) => setF({ ...f, phone: v })}
          record={phoneRec}
          setRecord={setPhoneRec}
        />
        <Field
          label="Set a password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          hint="At least 8 characters."
        />
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={f.agree}
            onChange={(e) => setF({ ...f, agree: e.target.checked })}
            className="mt-1 size-4 accent-[var(--ink)]"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="text-ink underline underline-offset-4">
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="text-ink underline underline-offset-4">
              Privacy Policy
            </Link>{' '}
            <span className="sr-only">(open in a new tab)</span>, and to Pirento Foundation storing these
            details to run my account, receipts and certificates.
          </span>
        </label>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        <Button type="submit" variant="accent" disabled={!ready || state.busy} className="w-full">
          {state.busy ? 'Creating…' : 'Create account'}
        </Button>
        {!emailRec.verified && (
          <p className="text-center text-xs text-muted">
            Verify your email (and mobile, if you add one) to continue.
          </p>
        )}
      </form>
    </div>
  );
}

/* ---------- page ---------- */
