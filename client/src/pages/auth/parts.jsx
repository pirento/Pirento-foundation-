// Small pieces shared by the sign-in and sign-up forms.

import { useEffect, useState, useRef } from 'react';
import { Mail, Fingerprint, Smartphone } from 'lucide-react';

export function GoogleButton({ clientId, onCredential, text = 'continue_with' }) {
  const box = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => cb.current(r.credential),
      });
      window.google.accounts.id.renderButton(box.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
        width: Math.min(box.current.offsetWidth || 360, 400),
      });
    };
    if (window.google?.accounts) render();
    else {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = render;
      document.head.append(s);
    }
    return () => void (cancelled = true);
  }, [clientId, text]);
  if (!clientId) return null;
  return <div ref={box} className="flex min-h-11 w-full justify-center" />;
}

/** Bharat ID by Pirento and Google, above the code/password forms. */
/** Bharat ID by Pirento (always offered) and Google (when configured), above the code/password forms. */
export function Social({ cfg, next, onGoogle, signup }) {
  const [notReady, setNotReady] = useState(false);
  const bharatHref = `/api/auth/bharatid/start?mode=login${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  return (
    <>
      <div className="space-y-3">
        <a
          href={bharatHref}
          onClick={(e) => {
            // Until the Bharat ID client is connected, explain here instead of bouncing through an error page.
            if (!cfg.bharatId) {
              e.preventDefault();
              setNotReady(true);
            }
          }}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-inverse px-4 text-sm font-medium text-on-inverse transition-opacity hover:opacity-90"
        >
          <Fingerprint aria-hidden className="size-4 shrink-0 text-accent" />{' '}
          {signup ? 'Sign up' : 'Continue'} with Bharat ID by Pirento
        </a>
        {notReady && (
          <p role="status" className="rounded-[14px] bg-stone px-4 py-3 text-sm">
            Bharat ID sign-in opens as soon as Bharat ID by Pirento is connected to this site. For now, use
            your mobile number or email below.
          </p>
        )}
        <GoogleButton
          clientId={cfg.googleClientId}
          text={signup ? 'signup_with' : 'continue_with'}
          onCredential={onGoogle}
        />
      </div>
      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
      </div>
    </>
  );
}

export function ChannelSwitch({ value, onChange }) {
  const opts = [
    ['phone', 'Mobile', Smartphone],
    ['email', 'Email', Mail],
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Get the code by"
      className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1"
    >
      {opts.map(([k, label, Icon]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors ${value === k ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
        >
          <Icon aria-hidden className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}

/** Six-digit code box. Calls onComplete as soon as 6 digits are in. */
export function CodeInput({ id, onComplete, disabled }) {
  const [v, setV] = useState('');
  return (
    <input
      id={id}
      value={v}
      disabled={disabled}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 6);
        setV(d);
        if (d.length === 6) onComplete(d, () => setV(''));
      }}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="••••••"
      aria-describedby={`${id}-hint`}
      className="input text-center font-mono text-2xl tracking-[0.6em] tabular-nums"
    />
  );
}

export function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(30)];
}

export const DevCode = ({ code }) =>
  code ? (
    <p className="mt-2 rounded-[10px] bg-stone px-3 py-2 text-xs">
      Test mode, no SMS/email provider set: code <strong className="font-mono">{code}</strong>
    </p>
  ) : null;

export const placeholderFor = (ch) => (ch === 'phone' ? '98765 43210' : 'you@example.com');

export const labelFor = (ch) => (ch === 'phone' ? 'Mobile number' : 'Email address');

/* ---------- sign in ---------- */
