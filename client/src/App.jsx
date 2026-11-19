// Routes and page frame. The admin desk (/admin/*) gets its own layout; every other page shares the
// navbar, footer, preloader and custom cursor.
import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Page, { PageHero } from './components/Page.jsx';
import { Button } from './components/ui.jsx';
import { RequireAuth } from './lib/auth.jsx';
import { startSmoothScroll, scrollToTop } from './lib/motion.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Programmes from './pages/Programmes.jsx';
import Donate from './pages/Donate.jsx';
import Contact from './pages/Contact.jsx';
import Verify from './pages/Verify.jsx';
import Auth from './pages/auth/AuthPage.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import AdminShell from './pages/admin/AdminShell.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import Policy from './pages/Policy.jsx';
import Membership from './pages/Membership.jsx';
import SetPassword from './pages/SetPassword.jsx';
import Updates from './pages/Updates.jsx';
import Ecosystem from './components/Ecosystem.jsx';

function NotFound() {
  return (
    <Page title="Not found">
      <PageHero label="404" lines={['This page', 'does not exist.']}>
        <div data-hero-after className="mt-10">
          <Button to="/">Back to home</Button>
        </div>
      </PageHero>
    </Page>
  );
}

function EcosystemPage() {
  return (
    <Page
      title="Pirento ecosystem"
      description="How Pirento Foundation fits with Venturecore and pirento.com, and the future School and University of Pirento."
    >
      <PageHero
        label="Ecosystem"
        lines={['Where the Foundation', 'fits in.']}
        intro="Venturecore Solutions Private Limited sponsors Pirento Foundation, a registered Section 8 company. Bharat ID by Pirento and Pirento One sit alongside it in the Pirento ecosystem; School of Pirento and University of Pirento are our future plans for education."
      />
      <div className="border-t border-rule">
        <Ecosystem />
      </div>
    </Page>
  );
}

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(startSmoothScroll, []);
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 100);
    else scrollToTop();
  }, [pathname, hash]);

  if (pathname.startsWith('/admin'))
    return (
      <>
        <Cursor />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <RequireAuth admin>
                <AdminShell />
              </RequireAuth>
            }
          />
        </Routes>
      </>
    );

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Preloader />
      <Cursor />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/programmes" element={<Programmes />} />
        <Route path="/ecosystem" element={<EcosystemPage />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:certNo" element={<Verify />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/membership" element={<Membership />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/updates/:slug" element={<Updates />} />
        <Route path="/terms" element={<Policy slug="terms" key="terms" />} />
        <Route path="/privacy" element={<Policy slug="privacy" key="privacy" />} />
        <Route path="/refund-policy" element={<Policy slug="refund-policy" key="refund" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
