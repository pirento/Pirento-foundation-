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
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';

function NotFound() {
  return (
    <Page title="Not found">
      <PageHero label="404" lines={['This page', 'does not exist.']}>
        <div data-hero-after className="mt-10"><Button to="/">Back to home</Button></div>
      </PageHero>
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

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <Preloader />
      <Cursor />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/programmes" element={<Programmes />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:certNo" element={<Verify />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
