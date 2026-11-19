// Dashboard: name, mobile, PAN, address and password.

import { useState } from 'react';
import { PageTitle } from '../../components/Desk.jsx';
import { Button, Field, Notice } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useTitle } from '../../lib/hooks.js';

export default function Profile({ refresh }) {
  useTitle('Profile', 'My account');
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    name: user.name,
    phone: user.phone ?? '',
    pan: user.pan ?? '',
    address: user.address ?? '',
  });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [msg, setMsg] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      setUser((await api('/me/profile', { method: 'PUT', body: f })).user);
      setMsg({ profile: 'Saved.' });
      refresh();
    } catch (err) {
      setMsg({ profileError: err.message });
    }
  };
  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api('/me/password', { method: 'POST', body: pw });
      setPw({ current: '', password: '' });
      setMsg({ pw: 'Password updated.' });
      refresh();
    } catch (err) {
      setMsg({ pwError: err.message });
    }
  };
  return (
    <>
      <PageTitle sub="PAN and address are printed on your 80G receipts.">Profile</PageTitle>
      <div className="grid gap-8 xl:grid-cols-2">
        <form onSubmit={save} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
          <h2 className="text-2xl">Your details</h2>
          <Field
            label="Full name"
            name="name"
            required
            value={f.name}
            onChange={set('name')}
            hint="As on your PAN."
          />
          <div>
            <Field
              label="Email"
              name="email"
              value={user.email}
              disabled
              readOnly
              hint={
                user.emailVerified
                  ? 'Confirmed.'
                  : 'Not confirmed yet: sign in with an email code to confirm it.'
              }
            />
          </div>
          <Field
            label="Mobile"
            name="phone"
            type="tel"
            value={f.phone}
            onChange={set('phone')}
            hint={
              user.phone
                ? user.phoneVerified
                  ? 'Confirmed.'
                  : 'Not confirmed: sign in once with a mobile code to confirm it.'
                : undefined
            }
          />
          <Field label="PAN" name="pan" maxLength={10} value={f.pan} onChange={set('pan')} />
          <Field label="Address" id="address">
            <textarea
              id="address"
              rows={3}
              maxLength={300}
              className="input"
              value={f.address}
              onChange={set('address')}
            />
          </Field>
          {msg.profileError && <Notice kind="error">{msg.profileError}</Notice>}
          {msg.profile && <Notice>{msg.profile}</Notice>}
          <Button type="submit" variant="accent">
            Save details
          </Button>
        </form>
        <form
          onSubmit={changePw}
          className="space-y-5 self-start rounded-[22px] border border-rule p-6 md:p-8"
        >
          <h2 className="text-2xl">{user.hasPassword ? 'Change password' : 'Set a password'}</h2>
          {user.hasPassword && (
            <Field
              label="Current password"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          )}
          <Field
            label="New password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={pw.password}
            onChange={(e) => setPw({ ...pw, password: e.target.value })}
            hint="At least 8 characters."
          />
          {msg.pwError && <Notice kind="error">{msg.pwError}</Notice>}
          {msg.pw && <Notice>{msg.pw}</Notice>}
          <Button type="submit" variant="outline">
            {user.hasPassword ? 'Change password' : 'Set password'}
          </Button>
          <p className="text-sm text-muted">
            Signed in with:{' '}
            {[
              user.hasPassword && 'password',
              user.google && 'Google',
              user.bharatId && 'Bharat ID',
              'email/mobile code',
            ]
              .filter(Boolean)
              .join(', ')}
            .
          </p>
        </form>
      </div>
    </>
  );
}

/* ---------- shell ---------- */
