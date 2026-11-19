// Admin desk layout: blue sidebar plus the routed admin pages.

import { Link, NavLink, Navigate, Route, Routes } from 'react-router';
import {
  LayoutDashboard,
  IndianRupee,
  Award,
  Inbox,
  LogOut,
  ExternalLink,
  BadgeCheck,
  Repeat,
  Newspaper,
  Users as UsersIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useLoad } from '../../lib/hooks.js';
import Certificates from './Certificates.jsx';
import Donations from './Donations.jsx';
import Members from './Members.jsx';
import Messages from './Messages.jsx';
import MonthlyDonors from './MonthlyDonors.jsx';
import Overview from './Overview.jsx';
import Posts from './Posts.jsx';
import SettingsPanel from './Settings.jsx';
import UserDetail from './UserDetail.jsx';
import Users from './Users.jsx';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/donations', label: 'Donations', icon: IndianRupee },
  { to: '/admin/monthly', label: 'Monthly donors', icon: Repeat },
  { to: '/admin/members', label: 'Members', icon: BadgeCheck },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'newMessages' },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/posts', label: 'Website updates', icon: Newspaper },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const [stats, reloadStats] = useLoad('/admin/stats');
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <aside className="inverse flex flex-col bg-inverse p-5 text-on-inverse lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:p-7">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2.5 whitespace-nowrap font-display text-[0.95rem] font-semibold uppercase tracking-[0.04em]"
          >
            <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-on-inverse" /> Pirento
          </Link>
          <span className="rounded-full border border-inverse-rule px-2.5 py-0.5 text-xs text-inverse-muted">
            Admin desk
          </span>
        </div>
        <nav
          aria-label="Admin"
          className="-mx-1 mt-6 flex gap-1 overflow-x-auto pb-1 lg:mt-12 lg:flex-col lg:overflow-visible"
        >
          {links.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-on-inverse text-inverse' : 'text-inverse-muted hover:text-on-inverse'}`
              }
            >
              <Icon aria-hidden className="size-4" /> {label}
              {badge && stats?.[badge] > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 text-xs font-medium text-on-accent">
                  {stats[badge]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-3 border-t border-inverse-rule pt-6 text-sm lg:block">
          <p className="truncate text-inverse-muted" title={user.email}>
            {user.email}
          </p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-inverse-muted hover:text-on-inverse"
          >
            <ExternalLink aria-hidden className="size-4" /> View site{' '}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-inverse-muted hover:text-on-inverse"
          >
            <LogOut aria-hidden className="size-4" /> Log out
          </button>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mb-8 flex justify-end gap-3 lg:hidden">
          <a href="/" className="text-sm text-muted underline underline-offset-4">
            View site
          </a>
          <button onClick={logout} className="text-sm text-muted underline underline-offset-4">
            Log out
          </button>
        </div>
        <div className="mx-auto max-w-[1180px]">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="donations" element={<Donations />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="messages" element={<Messages onChange={reloadStats} />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="members" element={<Members />} />
            <Route path="monthly" element={<MonthlyDonors />} />
            <Route path="posts" element={<Posts />} />
            <Route path="settings" element={<SettingsPanel />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ---------- admin login (password → email code) ---------- */
