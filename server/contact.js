import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Message } from './models.js';
import { isEmail } from './auth.js';
import { notify, templates, SUPPORT_EMAIL } from './mail.js';

export const TOPICS = ['Partnership', 'CSR support', 'Volunteering', 'Donation or receipt', 'Privacy or data request', 'Grievance', 'Other'];

const router = Router();

router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, message: { error: 'Too many messages. Please try again later.' } }), async (req, res) => {
  const { name, email, phone, topic, message, website } = req.body ?? {};
  if (website) return res.json({ ok: true }); // honeypot field: bots fill it, people never see it
  if (!name?.trim() || !isEmail(email)) return res.status(400).json({ error: 'Please enter your name and a valid email.' });
  if (!TOPICS.includes(topic)) return res.status(400).json({ error: 'Please choose a topic.' });
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 4000)
    return res.status(400).json({ error: 'Please write a message of 10 to 4,000 characters.' });
  const m = await Message.create({ name, email, phone: phone || undefined, topic, message });
  notify({ to: SUPPORT_EMAIL(), replyTo: m.email, ...templates.contactAdmin(m) });
  notify({ to: m.email, ...templates.contactAck(m) });
  res.status(201).json({ ok: true, ref: String(m._id).slice(-8).toUpperCase() });
});

export default router;
