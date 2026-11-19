# Pirento Foundation website

MERN app: React 19 + Vite + Tailwind v4 (`client/`), Express 5 + MongoDB/Mongoose (`server/`).
Design follows the Pirento design system (layout, motion, preloader) with the Foundation palette: Deep Blue `#07518A`, Warm Creme `#FFF0D5`, Electric Yellow `#F5E500`, plus Anton condensed caps for poster headlines.
Content comes from *Profile, Work Plan & Governance* (Oct 2026) and lives in `client/src/data/site.js`.

## Features
- **Public site:** Home, About (vision, board, governance, registration status), Programmes, Ecosystem (Venturecore → Pirento Foundation → School / University of Pirento as future plans, link to pirento.com), Donate, Contact, Verify.
- **Donations:** Razorpay checkout → server verifies the signature → numbered receipt (`PF/2026-27/00001`, resets each financial year) → donation certificate PDF.
- **Accounts:** Google sign-in, email OTP, mobile OTP, or password. Sign-up verifies the email (and mobile, if given) with a 6-digit code; forgot-password resets by code. Codes are hashed, expire in 10 minutes, allow 5 tries and have a 30-second resend wait. Session is a JWT in an httpOnly cookie.
- **Dashboard:** the user's donations and certificates, including gifts made earlier with the same (now verified) email.
- **Admin desk** (`/admin/login`, separate from the public site): password, then a 6-digit code to the admin's email; 12-hour sessions. Admin accounts cannot use the public sign-in. Sidebar pages: Overview (totals, by programme), Donations (record offline gifts, resend receipt, CSV export for accounts), Certificates (issue, revoke/restore), Messages (contact-form inbox), Users.
- **Emails (HTML, mobile-friendly):** sign-in/verification codes, welcome, donation receipt with certificate link, certificate issued, contact-form acknowledgement, and a copy of every contact message to `support@pirentofoundation.org`. Emails never block a payment: if SMTP fails, the error is logged.
- **Policies:** Terms of Use, Privacy Policy (DPDP Act 2023), Refund & Cancellation (also covers delivery, as Razorpay asks). Linked in the footer, sign-up and donate form.
- **Razorpay webhook:** marks a donation paid even if the donor closes the browser before the success screen.
- **Certificates:** A4 PDF generated on the fly, each with an unguessable number (`PFC-…`) and a public verify page at `/verify/<number>`.

## Run locally
```bash
npm run install:all
cp server/.env.example server/.env   # fill JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (and Razorpay keys when ready)
npm run dev:server                   # API on :5000 (needs MongoDB at MONGODB_URI)
npm run dev:client                   # site on :5173, proxies /api to :5000
npm test                             # end-to-end API test with an in-memory MongoDB
```
The admin account in `ADMIN_EMAIL` is created on first start. Log in at `/login`, you land on `/admin`.

## Deploy (one Node service)
`npm run build` then `npm start` with `NODE_ENV=production`. Express serves the API and `client/dist`.
Works on Render / Railway / any VPS with a MongoDB Atlas URI. Set `SITE_URL` to the real domain (it is printed on certificates).

## Login providers
- **Google:** set `GOOGLE_CLIENT_ID` (OAuth client, type Web; add your domain to Authorised JavaScript origins). The button appears automatically.
- **Email OTP:** set `SMTP_*`. **Mobile OTP:** set `TWILIO_*` (Indian SMS needs a DLT-registered sender/template).
- In development with no provider, codes are printed in the server log and shown on screen as "Test mode". In production without a provider, that channel refuses to send.

## Razorpay activation checklist
Razorpay reviews the website before enabling live payments. It needs: Contact page (`/contact`), Terms (`/terms`), Privacy (`/privacy`), Refund & Cancellation (`/refund-policy`), and clear pricing (the donate form). All are live. Then set the live keys and the webhook secret.

## Before going live
- Online donations stay **off** until `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are set; the form then shows a bank-transfer note.
- Domain is set to `pirentofoundation.org`. Add a 1200×630 `client/public/og.png` for link previews.
- Have a lawyer review `client/src/data/policies.js` (written as a sound draft, not legal advice), and name the Grievance Officer.
- Set up the mailbox `support@pirentofoundation.org` and its SMTP login; add SPF, DKIM and DMARC records for the domain so emails don't land in spam.
- The site says "Section 8 company (registration pending)" and "not eligible for 80G" everywhere. Update `brand` in `site.js` and the `LEGAL` line in `server/pdf.js` once registration, CIN and 80G arrive.
- Confirm the Foundation phone number and the board offices (marked "to be confirmed").
