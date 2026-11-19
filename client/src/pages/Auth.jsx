import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import Page from '../components/Page.jsx';
import { Button, Field, Notice } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [state, setState] = useState({ busy: false, error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const next = params.get('next')?.startsWith('/') && !params.get('next').startsWith('//') ? params.get('next') : null;

  if (user) return <Navigate to={next || (user.role === 'admin' ? '/admin' : '/dashboard')} replace />;

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: '' });
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
      navigate(next || '/dashboard', { replace: true });
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  }

  return (
    <Page title={isLogin ? 'Log in' : 'Create account'}>
      <section className="relative min-h-[90vh] pb-24 pt-36 md:pt-44">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p data-hero-after className="eyebrow">{isLogin ? 'Welcome back' : 'Your account'}</p>
            <h1 data-hero className="h-hero mt-6">
              <span className="line"><span>{isLogin ? 'Log in.' : 'All your receipts.'}</span></span>
              <span className="line"><span className="text-muted">{isLogin ? 'Pick up where you left off.' : 'One place.'}</span></span>
            </h1>
            <p data-hero-after className="prose-body mt-8">
              Your account keeps every donation receipt and certificate together, ready to download any time.
            </p>
          </div>
          <form data-hero-visual onSubmit={submit} className="space-y-5 self-start rounded-[22px] border border-rule bg-paper p-6 md:p-10 lg:col-span-6 lg:col-start-7">
            {!isLogin && <Field label="Full name" name="name" required autoComplete="name" value={form.name} onChange={set('name')} />}
            <Field label="Email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
            {!isLogin && <Field label="Phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />}
            <Field label="Password" name="password" type="password" required minLength={isLogin ? undefined : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} hint={isLogin ? undefined : 'At least 8 characters.'} />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" variant="accent" disabled={state.busy} className="w-full">
              {state.busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted">
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <Link to={`/${isLogin ? 'register' : 'login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-ink underline underline-offset-4">
                {isLogin ? 'Create an account' : 'Log in'}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </Page>
  );
}
