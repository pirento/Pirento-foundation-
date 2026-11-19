// Donor dashboard layout: sidebar plus the routed account pages.

import { NavLink, Navigate, Route, Routes } from 'react-router';
import {
  LayoutDashboard,
  IndianRupee,
  Award,
  LogOut,
  BadgeCheck,
  Repeat,
  Fingerprint,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useLoad } from '../../lib/hooks.js';
import BharatIdPage from './BharatId.jsx';
import Certificates from './Certificates.jsx';
import Donations from './Donations.jsx';
import MembershipPage from './Membership.jsx';
import Monthly from './Monthly.jsx';
import Overview from './Overview.jsx';
import Profile from './Profile.jsx';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/donations', label: 'Donations', icon: IndianRupee },
  { to: '/dashboard/monthly', label: 'Monthly giving', icon: Repeat },
  { to: '/dashboard/membership', label: 'Membership', icon: BadgeCheck },
  { to: '/dashboard/bharat-id', label: 'Bharat ID', icon: Fingerprint, badge: true },
  { to: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, refresh] = useLoad('/me/summary');
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  const pending = summary?.membership && summary.bharat !== 'complete';
  return (
    <main id="main" className="container-x pb-24 pt-[96px]">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <p className="eyebrow">My account</p>
            <p className="mt-2 truncate font-medium" title={user.email}>
              {user.name}
            </p>
            {summary?.membership && (
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-on-accent">
                <BadgeCheck aria-hidden className="size-3.5" /> Member
              </p>
            )}
          </div>
          <nav
            aria-label="My account"
            className="-mx-1 flex gap-1 overflow-x-auto pb-2 lg:mt-8 lg:flex-col lg:overflow-visible"
          >
            {links.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`
                }
              >
                <Icon aria-hidden className="size-4" /> {label}
                {badge && pending && (
                  <span className="ml-auto rounded-full bg-accent px-2 text-[0.65rem] font-medium uppercase text-on-accent">
                    Pending
                  </span>
                )}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted hover:text-ink lg:mt-6"
            >
              <LogOut aria-hidden className="size-4" /> Log out
            </button>
          </nav>
        </aside>
        <div className="mt-8 min-w-0 lg:mt-0">
          <Routes>
            <Route index element={<Overview summary={summary} />} />
            <Route path="donations" element={<Donations />} />
            <Route path="monthly" element={<Monthly />} />
            <Route path="membership" element={<MembershipPage summary={summary} refresh={refresh} />} />
            <Route path="bharat-id" element={<BharatIdPage summary={summary} refresh={refresh} />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="profile" element={<Profile refresh={refresh} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}
