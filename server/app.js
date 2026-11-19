import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes, { loadUser } from './auth.js';
import donationRoutes from './donations.js';
import certificateRoutes from './certificates.js';
import adminRoutes from './admin.js';
import contactRoutes from './contact.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  // rawBody is kept for the Razorpay webhook signature check.
  app.use(express.json({ limit: '100kb', verify: (req, _res, buf) => (req.rawBody = buf) }));
  app.use(cookieParser());
  app.use(loadUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production the built React app is served by the same server.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/.*/, (_req, res, next) => res.sendFile(path.join(dist, 'index.html'), (e) => e && next()));

  app.use((err, _req, res, _next) => {
    if (!err.expose) console.error(err);
    res.status(err.status || 500).json({ error: err.expose ? err.message : err.status === 400 ? 'Bad request.' : 'Something went wrong. Please try again.' });
  });
  return app;
}
