import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Smartphone, Mail, Check, Eye, EyeOff, ArrowLeft, KeyRound, Fingerprint } from 'lucide-react';
import Page from '../components/Page.jsx';
import { Button, Field, Notice } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';

/* ---------- small building blocks ---------- */

function GoogleButton({ clientId, onCredential, text = 'continue_with' }) {
  const box = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !box.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential) });
      window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'pill', text, width: Math.min(box.current.offsetWidth || 360, 400) });
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
function Social({ cfg, next, onGoogle, signup }) {
  if (!cfg.bharatId && !cfg.googleClientId) return null;
  return (
    <>
      <div className="space-y-3">
        {cfg.bharatId && (
          <a
            href={`/api/auth/bharatid/start?mode=login${next ? `&next=${encodeURIComponent(next)}` : ''}`}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-inverse text-sm font-medium text-on-inverse transition-opacity hover:opacity-90"
          >
            <Fingerprint aria-hidden className="size-4 text-accent" /> {signup ? 'Sign up' : 'Continue'} with Bharat ID by Pirento
          </a>
        )}
        <GoogleButton clientId={cfg.googleClientId} text={signup ? 'signup_with' : 'continue_with'} onCredential={onGoogle} />
      </div>
      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
      </div>
    </>
  );
}

function ChannelSwitch({ value, onChange, sms }) {
  const opts = [['phone', 'Mobile', Smartphone], ['email', 'Email', Mail]].filter(([k]) => k === 'email' || sms);
  if (opts.length < 2) return null;
  return (
    <div role="radiogroup" aria-label="Get the code by" className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1">
      {opts.map(([k, label, Icon]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors ${value === k ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
          <Icon aria-hidden className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}

/** Six-digit code box. Calls onComplete as soon as 6 digits are in. */
function CodeInput({ id, onComplete, disabled }) {
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

function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(30)];
}

const DevCode = ({ code }) => (code ? <p className="mt-2 rounded-[10px] bg-stone px-3 py-2 text-xs">Test mode, no SMS/email provider set: code <strong className="font-mono">{code}</strong></p> : null);
const placeholderFor = (ch) => (ch === 'phone' ? '98765 43210' : 'you@example.com');
const labelFor = (ch) => (ch === 'phone' ? 'Mobile number' : 'Email address');

/* ---------- sign in ---------- */

function SignIn({ cfg, next }) {
  const { signIn, setUser } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('code'); // code | password | reset
  const [channel, setChannel] = useState(cfg.sms ? 'phone' : 'email');
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
      <form onSubmit={(e) => (e.preventDefault(), run(() => signIn('/auth/login', { id: target, password })))} className="space-y-5">
        <Field label="Email or mobile number" name="id" required autoComplete="username" value={target} onChange={(e) => setTarget(e.target.value)} />
        <div>
          <Field label="Password" name="password" required type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mt-2 flex justify-between text-sm">
            <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
              {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />} {show ? 'Hide' : 'Show'} password
            </button>
            <button type="button" onClick={() => go('reset')} className="text-ink underline underline-offset-4">Forgot password?</button>
          </div>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <Button type="submit" variant="accent" disabled={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Button>
        <button type="button" onClick={() => go('code')} className="flex w-full items-center justify-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Sign in with a code instead
        </button>
      </form>
    );

  const purpose = view === 'reset' ? 'reset' : 'login';
  return (
    <div>
      {view === 'code' && !sent && <Social cfg={cfg} next={next} onGoogle={(credential) => run(() => signIn('/auth/google', { credential }))} />}
      {view === 'reset' && (
        <div className="mb-6">
          <h2 className="text-2xl">Reset your password</h2>
          <p className="mt-1 text-sm text-muted">We’ll send a code to confirm it’s you.</p>
        </div>
      )}
      {!sent ? (
        <form onSubmit={(e) => (e.preventDefault(), send(purpose))} className="space-y-5">
          <ChannelSwitch value={channel} onChange={(c) => (setChannel(c), setTarget(''))} sms={cfg.sms} />
          <Field label={labelFor(channel)} name="target" required type={channel === 'email' ? 'email' : 'tel'} autoComplete={channel === 'email' ? 'email' : 'tel'} placeholder={placeholderFor(channel)} value={target} onChange={(e) => setTarget(e.target.value)} hint={`We’ll send a 6-digit code ${channel === 'phone' ? 'by SMS' : 'to this email'}.`} />
          {error && <Notice kind="error">{error}</Notice>}
          <Button type="submit" variant="accent" disabled={busy || !target} className="w-full">{busy ? 'Sending…' : 'Send code'}</Button>
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
                  const r = await api('/auth/password/reset', { method: 'POST', body: { channel, target, code, password: newPassword } });
                  if (r.admin) return navigate('/admin/login?reset=1');
                  setUser(r.user);
                }
                else await signIn('/auth/otp/login', { channel, target, code });
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
          <button type="button" onClick={() => go('password')} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <KeyRound aria-hidden className="size-4" /> Use password instead
          </button>
        ) : (
          <button type="button" onClick={() => go('password')} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
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
        <button type="button" onClick={onChange} className="text-ink underline underline-offset-4">Change</button>
      </p>
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium">6-digit code</label>
        <CodeInput id="code" disabled={busy} onComplete={(c, clear) => (setCode(c), !reset && onSubmit(c, null, clear))} />
        <p id="code-hint" className="mt-1.5 text-xs text-muted">{reset ? 'Enter or paste the code, then choose a new password.' : 'Enter or paste the code. It checks itself.'}</p>
        <DevCode code={sent.devCode} />
      </div>
      {reset && <Field label="New password" name="newpw" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 8 characters." />}
      {error && <Notice kind="error">{error}</Notice>}
      {reset && <Button type="submit" variant="accent" disabled={busy || code.length !== 6} className="w-full">{busy ? 'Saving…' : 'Set password & sign in'}</Button>}
      {busy && !reset && <p className="text-sm text-muted" role="status">Checking…</p>}
      <button type="button" disabled={left > 0 || busy} onClick={onResend} className="text-sm text-ink underline underline-offset-4 disabled:text-muted disabled:no-underline">
        {left > 0 ? `Resend code in ${left}s` : 'Resend code'}
      </button>
    </form>
  );
}

/* ---------- create account ---------- */

function VerifyRow({ channel, value, onValue, required, record, setRecord }) {
  const [left, startCooldown] = useCooldown();
  const id = `${channel}-otp`;
  const send = async () => {
    setRecord({ ...record, working: 'send', error: '' });
    try {
      const r = await api('/auth/otp/send', { method: 'POST', body: { channel, target: value, purpose: 'register' } });
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
        {labelFor(channel)} <span className="font-normal text-muted">{required ? '(required)' : '(optional)'}</span>
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
          <button type="button" onClick={send} disabled={!value || record.working || left > 0} className="shrink-0 rounded-full border border-ink px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-paper disabled:border-rule disabled:text-muted disabled:hover:bg-transparent">
            {record.working === 'send' ? 'Sending…' : left > 0 ? `${left}s` : record.sentTo ? 'Resend' : 'Send OTP'}
          </button>
        )}
      </div>
      {record.sentTo && !record.verified && (
        <div className="mt-3">
          <label htmlFor={id} className="mb-2 block text-xs text-muted">Code sent to {record.sentTo}</label>
          <CodeInput id={id} disabled={record.working === 'verify'} onComplete={verify} />
          <p id={`${id}-hint`} className="sr-only">Six digits. It checks itself.</p>
          <DevCode code={record.devCode} />
        </div>
      )}
      {record.error && <p className="mt-2 text-sm" role="alert">{record.error}</p>}
    </div>
  );
}

function Register({ cfg, next }) {
  const { signIn } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', agree: false });
  const [emailRec, setEmailRec] = useState({});
  const [phoneRec, setPhoneRec] = useState({});
  const [state, setState] = useState({ busy: false, error: '' });
  const ready = f.name.trim() && emailRec.verified && (!f.phone || phoneRec.verified) && f.password.length >= 8 && f.agree;

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
      <Social cfg={cfg} next={next} signup onGoogle={(credential) => signIn('/auth/google', { credential }).catch((e) => setState({ busy: false, error: e.message }))} />
      <form onSubmit={submit} className="space-y-5">
        <Field label="Full name" name="name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <VerifyRow channel="email" required value={f.email} onValue={(v) => setF({ ...f, email: v })} record={emailRec} setRecord={setEmailRec} />
        {cfg.sms && <VerifyRow channel="phone" value={f.phone} onValue={(v) => setF({ ...f, phone: v })} record={phoneRec} setRecord={setPhoneRec} />}
        <Field label="Set a password" name="password" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} hint="At least 8 characters." />
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} className="mt-1 size-4 accent-[var(--ink)]" />
          <span>I agree to the <Link to="/terms" target="_blank" className="text-ink underline underline-offset-4">Terms of Use</Link> and <Link to="/privacy" target="_blank" className="text-ink underline underline-offset-4">Privacy Policy</Link> <span className="sr-only">(open in a new tab)</span>, and to Pirento Foundation storing these details to run my account, receipts and certificates.</span>
        </label>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        <Button type="submit" variant="accent" disabled={!ready || state.busy} className="w-full">{state.busy ? 'Creating…' : 'Create account'}</Button>
        {!emailRec.verified && <p className="text-center text-xs text-muted">Verify your email{cfg.sms ? ' (and mobile, if you add one)' : ''} to continue.</p>}
      </form>
    </div>
  );
}

/* ---------- page ---------- */

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
    <Page title={isLogin ? 'Sign in' : 'Create account'} description="Sign in to your Pirento Foundation account with Google, an email code or a mobile code.">
      <section className="pb-24 pt-[84px]">
        <div className="container-x grid gap-6 lg:grid-cols-12">
          <div className="inverse relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[28px] bg-inverse p-8 text-on-inverse md:p-12 lg:col-span-6">
            <div aria-hidden className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--inverse-rule)_1px,transparent_1px),linear-gradient(90deg,var(--inverse-rule)_1px,transparent_1px)] [background-size:72px_72px]" />
            <p data-hero-after className="relative eyebrow">{isLogin ? 'Account sign-in' : 'Create your account'}</p>
            <h1 data-hero className="poster relative mt-10 text-[clamp(3.2rem,8vw,7.5rem)]">
              <span className="line"><span>One account.</span></span>
              <span className="line"><span className="text-accent">Every receipt.</span></span>
            </h1>
            <p data-hero-after className="relative mt-8 max-w-sm text-inverse-muted">
              Receipts, 80G documents, membership and certificates in one place. Sign in with Bharat ID by Pirento, Google, or a code sent to your mobile or email.
            </p>
          </div>

          <div data-hero-visual className="rounded-[28px] border border-rule p-6 md:p-10 lg:col-span-6">
            <div className="mb-8 grid grid-cols-2 gap-1 rounded-full border border-rule p-1" role="tablist" aria-label="Account">
              {[['/login', 'Sign in', isLogin], ['/register', 'Create account', !isLogin]].map(([to, label, on]) => (
                <Link key={to} to={`${to}${q}`} role="tab" aria-selected={on} className={`rounded-full py-2.5 text-center text-sm font-medium transition-colors ${on ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
                  {label}
                </Link>
              ))}
            </div>
            {params.get('error') && <div className="mb-6"><Notice kind="error">{params.get('error')}</Notice></div>}
            {!cfg ? <div className="h-72" aria-busy="true" /> : isLogin ? <SignIn cfg={cfg} next={next} /> : <Register cfg={cfg} next={next} />}
          </div>
        </div>
      </section>
    </Page>
  );
}
