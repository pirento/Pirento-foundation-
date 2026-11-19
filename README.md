# Pirento Foundation website

MERN app: React 19 + Vite + Tailwind v4 (`client/`), Express 5 + MongoDB/Mongoose (`server/`).
Design follows the Pirento design system (forest + marigold tokens, Space Grotesk / Inter, GSAP + Lenis motion, preloader).
Content comes from *Profile, Work Plan & Governance* (Oct 2026) and lives in `client/src/data/site.js`.

## Features
- **Public site:** Home, About (vision, board, governance, registration status), Programmes, Donate, Contact, Verify.
- **Donations:** Razorpay checkout → server verifies the signature → numbered receipt (`PF/2026-27/00001`, resets each financial year) → donation certificate PDF.
- **User login:** register / log in (JWT in an httpOnly cookie, bcrypt). Dashboard lists the user's donations and certificates.
- **Admin login:** stats by programme, all donations, record offline gifts (bank / UPI / cash / cheque), issue volunteer / participation / appreciation certificates, revoke or restore, list users.
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

## Before going live
- Online donations stay **off** until `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are set; the form then shows a bank-transfer note.
- Replace `YOUR-DOMAIN` in `client/index.html`, `public/robots.txt`, `public/sitemap.xml`, and add a 1200×630 `public/og.png`.
- The site says "Section 8 company (registration pending)" and "not eligible for 80G" everywhere. Update `brand` in `site.js` and the `LEGAL` line in `server/pdf.js` once registration, CIN and 80G arrive.
- Confirm the Foundation email/phone and the board offices (marked "to be confirmed").
