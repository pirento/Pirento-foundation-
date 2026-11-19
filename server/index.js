// Starts the server: loads .env, checks the secret, connects to MongoDB, creates the admin, listens.
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { ensureAdmin } from './auth.js';

try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  /* no .env file: rely on real environment variables */
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters (see .env.example).');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pirento');
await ensureAdmin();
const port = Number(process.env.PORT) || 5000;
createApp().listen(port, () => console.log(`Pirento Foundation API on http://localhost:${port}`));
