# Pirento Foundation website

MERN app: React 19 + Vite + Tailwind v4 (`client/`), Express 5 + MongoDB/Mongoose (`server/`).
Design follows the Pirento design system (layout, motion, preloader) with the Foundation palette: Deep Blue `#07518A`, Warm Creme `#FFF0D5`, Electric Yellow `#F5E500`, plus Anton condensed caps for poster headlines.
Content comes from *Profile, Work Plan & Governance* (Oct 2026) and lives in `client/src/data/site.js`.

## Features
- **Public site:** Home, About (board, governance, registrations), Programmes, Membership, Ecosystem (Venturecore → Pirento Foundation → School / University of Pirento as future plans; Bharat ID by Pirento; Pirento One; pirento.com), Updates, Donate, Contact, Verify, and the three policies.
- **Donations without login:** one-time or monthly. After payment an account is created for the donor's email (or the gift is linked to the existing one) and a one-time *set your password* link is emailed (7 days). Passwords are never emailed.
- **80G receipts:** PDF per donation with the section 80G(5) particulars (Foundation PAN, 80G URN and validity, donor name/address/PAN, amount in figures and words, mode, Form 10BD/10BE note). Numbers come from **Admin → Settings**; until the 80G URN and PAN are entered, receipts say so instead of guessing. Opened by the donor's private link, their account, or an admin.
- **Monthly giving:** Razorpay Subscriptions (a plan per amount is created once). Every charge becomes a donation with its own receipt; only the first gets a certificate. Donors stop it from their dashboard.
- **Membership:** supporter membership (not company membership: no shares or votes). Fee and validity are in Settings (default ₹1,000 for 12 months). Payment → member number `PFMEM-000001`, fee receipt (`PFM/…`, never 80G), membership certificate, email, and a *Pirento Foundation Member* badge. Early renewal extends from the current end date.
- **Bharat ID by Pirento:** sign-in and account linking over OpenID Connect (code + PKCE). The dashboard shows *Pending* until Bharat ID reports a complete status (`contact_confirmed` or higher), then the ID number and shared details appear in the profile and on the membership certificate. Always labelled *Private Pirento Account ID — Not a Government ID*.
- **Donations:** Razorpay checkout → server verifies the signature → numbered receipt (`PF/2026-27/00001`, resets each financial year) → donation certificate PDF.
- **Accounts:** Google sign-in, email OTP, mobile OTP, or password. Sign-up verifies the email (and mobile, if given) with a 6-digit code; forgot-password resets by code. Codes are hashed, expire in 10 minutes, allow 5 tries and have a 30-second resend wait. Session is a JWT in an httpOnly cookie.
- **User dashboard** (`/dashboard`): overview with a set-up checklist, donations with 80G receipts, monthly giving, membership card, Bharat ID, certificates, and profile (PAN, address, mobile, password).
- **Admin desk** (`/admin/login`, separate from the public site): password, then a 6-digit code to the admin's email; 12-hour sessions. Admin accounts cannot use the public sign-in. Sidebar pages: Overview, Donations (search, offline gifts, receipt, resend, record refund, CSV), Monthly donors, Members (offline members, cancel), Certificates, Messages, Users (search, full person view), Website updates (publish news to the site), Settings (registration numbers, signatory, bank details, membership fee/validity, ecosystem links).
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
The admin account in `ADMIN_EMAIL` is created on first start. Admins sign in at `/admin/login` (password, then an email code). For local testing set `DEV_SHOW_CODES=1` in `server/.env` so codes show on screen.

## Deploy (one Node service)
`npm run build` then `npm start` with `NODE_ENV=production`. Express serves the API and `client/dist`.
Works on Render / Railway / any VPS with a MongoDB Atlas URI. Set `SITE_URL` to the real domain (it is printed on certificates).

## Bharat ID integration contract
The Bharat ID team registers this site as an OpenID Connect client. Needed from them: issuer URL (with `/.well-known/openid-configuration`), client ID and secret, and these userinfo claims: `sub`, `name`, `email`, `email_verified`, `phone_number`, `bharat_id` (10-digit number), `bharat_id_status` (`created`, `contact_confirmed`, `profile_submitted`, `pirento_reviewed`, `provider_verified`, `restricted`, `closed`). Redirect URI: `https://pirentofoundation.org/api/auth/bharatid/callback`.

## Login providers
- **Google:** set `GOOGLE_CLIENT_ID` (OAuth client, type Web; add your domain to Authorised JavaScript origins). The button appears automatically.
- **Email OTP:** set `SMTP_*`. **Mobile OTP:** set `TWILIO_*` (Indian SMS needs a DLT-registered sender/template).
- For local testing without a provider, set `DEV_SHOW_CODES=1`: codes are logged and shown on screen as "Test mode". Without it (and always when `NODE_ENV=production`) a channel with no provider refuses to send.

## Razorpay activation checklist
Razorpay reviews the website before enabling live payments. It needs: Contact page (`/contact`), Terms (`/terms`), Privacy (`/privacy`), Refund & Cancellation (`/refund-policy`), and clear pricing (the donate form). All are live. Then set the live keys and the webhook secret.

## Before going live
- Online donations stay **off** until `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are set; the form then shows a bank-transfer note.
- Domain is set to `pirentofoundation.org`. Add a 1200×630 `client/public/og.png` for link previews.
- **Admin → Settings:** enter the Foundation CIN, PAN, 12A, 80G URN and validity, CSR-1, FCRA, Darpan, and the signatory. Receipts, certificates, footer and About page use them. They are deliberately empty in the code.
- Have a lawyer and your CA review `client/src/data/policies.js` and the 80G receipt wording, and name the Grievance Officer.
- File Form 10BD each year from **Donations → Export CSV** (it includes PAN and address).
- Set up the mailbox `support@pirentofoundation.org` and its SMTP login; add SPF, DKIM and DMARC records for the domain so emails don't land in spam.
- Confirm the Foundation phone number and the board offices (marked "to be confirmed").
