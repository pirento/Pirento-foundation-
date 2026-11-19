// Policy text. Prepared as a careful draft for Pirento Foundation; have it reviewed by a lawyer before launch.
// Section bodies are arrays: a string is a paragraph, an array is a bullet list.
// Registration numbers are not repeated here: they live in admin Settings and show on the About page and every receipt.

const EMAIL = 'support@pirentofoundation.org';
const SITE = 'pirentofoundation.org';
const UPDATED = '19 November 2026';

export const policies = [
  {
    slug: 'terms',
    title: 'Terms of Use',
    lines: ['Terms of', 'Use.'],
    intro: `These terms apply when you use ${SITE}, create an account, donate, give monthly or become a member of Pirento Foundation. By using the site you agree to them.`,
    updated: UPDATED,
    sections: [
      {
        h: 'Who we are',
        body: [
          'Pirento Foundation (“we”, “us”) is a not-for-profit company registered under section 8 of the Companies Act, 2013, and the charitable arm of Venturecore Solutions Private Limited (CIN U63121UP2023PTC188021).',
          'The Foundation is registered under sections 12A and 80G of the Income-tax Act, 1961, holds CSR-1 registration to receive CSR funds, and holds FCRA registration for foreign contributions. Our registration numbers are listed on the About page and printed on every receipt.',
        ],
      },
      {
        h: 'Your account',
        body: [
          [
            'You must be 18 or older to hold an account, donate or become a member. Younger supporters may give through a parent or guardian.',
            'You can sign in with a password, a one-time code to your email or mobile, Google, or Bharat ID by Pirento.',
            'If you donate without signing in, we create an account for you with the email you give and send a one-time link to set your password. We never send passwords by email.',
            'Keep your password and codes private. Tell us at once at ' + EMAIL + ' if you think someone else has used your account.',
            'You can ask us to close your account at any time. We keep donation records for as long as the law requires (see the Privacy Policy).',
          ],
        ],
      },
      {
        h: 'Donations',
        body: [
          [
            'Donations are voluntary gifts. You receive no goods or services in return.',
            'Online payments are processed by Razorpay. We never see or store your card, UPI PIN or bank login.',
            'If you choose a programme, we spend your gift only on that programme. If it cannot run, we will write to you to redirect or refund the gift.',
            'Each confirmed donation gets a numbered receipt by email and in your account. Your first gift also gets a certificate.',
            'Refunds are covered by our Refund & Cancellation Policy.',
          ],
        ],
      },
      {
        h: 'Monthly giving',
        body: [
          'By choosing a monthly gift you authorise Razorpay to charge the amount you chose every month, through the card or UPI mandate you approve, until you stop it or 120 payments are made. You receive a receipt after every payment. You can stop it at any time from your dashboard or by writing to us; it stops before the next charge. If a charge fails, your bank or Razorpay may pause the mandate.',
        ],
      },
      {
        h: 'Tax deduction under 80G',
        body: [
          [
            'Donations to Pirento Foundation are eligible for deduction under section 80G, subject to the conditions and limits of that section.',
            'To be reported, your name as on PAN, your PAN and your address are needed. We report eligible donations to the Income Tax Department in Form 10BD; you then receive Form 10BE, which is the document for your claim.',
            'Cash donations above ₹2,000, membership fees and payments for anything received in return are not eligible.',
            'We cannot give tax advice; please confirm your own position with a tax adviser.',
          ],
        ],
      },
      {
        h: 'Foreign contributions',
        body: [
          'Under the Foreign Contribution (Regulation) Act, 2010, foreign contributions may be received only in our designated FCRA bank account. This website accepts payments only from Indian donors in Indian rupees. If you are a foreign national or an overseas organisation, or are giving from foreign sources, please write to ' + EMAIL + ' before giving.',
        ],
      },
      {
        h: 'Membership',
        body: [
          [
            'Pirento Foundation membership is a supporter membership. It does not make you a member or shareholder of the company under the Companies Act, 2013, and carries no voting or ownership rights.',
            'The fee and validity are shown on the Membership page when you join. Renewal is optional and never automatic.',
            'Members receive a numbered certificate and member card. Members are asked to link a Bharat ID by Pirento; until that is complete it shows as pending.',
            'We may cancel a membership obtained with false information or used to misrepresent the Foundation; its certificate will then show as revoked.',
            'The membership fee is not a donation and is not eligible for 80G.',
          ],
        ],
      },
      {
        h: 'Bharat ID by Pirento and Pirento One',
        body: [
          'Bharat ID by Pirento is a private Pirento account ID for use within the Pirento ecosystem. It is not Aadhaar, not a government ID, and not proof of citizenship, residence, legal identity or eligibility. It is issued and run by the Pirento ecosystem under its own terms. Linking it to this website is your choice.',
          'Pirento One is the Pirento ecosystem’s partner network. Joining it is separate from this website and has its own terms.',
        ],
      },
      {
        h: 'Certificates',
        body: [
          'Certificates we issue carry a unique number that anyone can check on our Verify page. They acknowledge a donation, membership or contribution; they are not tax documents. We may revoke a certificate issued by mistake, for a refunded payment, or obtained by false information.',
        ],
      },
      {
        h: 'Future plans',
        body: [
          'School of Pirento and University of Pirento are future plans only. They do not admit students, take fees or award certificates until land, recognition and UGC or board approvals are in place. Do not pay anyone who claims otherwise; report it to ' + EMAIL + '.',
        ],
      },
      {
        h: 'Using the site fairly',
        body: [
          [
            'Do not try to break, overload or gain unauthorised access to the site or other people’s accounts.',
            'Do not use the site for fraud, money laundering, or to make a payment you are not authorised to make.',
            'Do not copy our name, logo, text or illustrations for other purposes without written permission.',
          ],
        ],
      },
      {
        h: 'Our responsibility',
        body: [
          'We work to keep the site accurate and available, but we provide it “as is”. To the extent the law allows, we are not liable for indirect losses, or for outages caused by payment, email, SMS or Bharat ID providers. Nothing here limits rights you have under Indian consumer law.',
        ],
      },
      {
        h: 'Law and disputes',
        body: [
          'These terms are governed by the laws of India. Please write to us first; most issues are solved quickly. Courts at Basti, Uttar Pradesh have jurisdiction over any dispute.',
          'We may update these terms. The date above shows the latest version; important changes will be shown on the site and emailed to members.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    lines: ['Privacy', 'Policy.'],
    intro: 'How Pirento Foundation collects, uses and protects your personal data, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.',
    updated: UPDATED,
    sections: [
      {
        h: 'What we collect',
        body: [
          [
            'Account: name, email, mobile number, address, PAN, and a password stored only as a secure hash. If you sign in with Google, your Google account name and email.',
            'Bharat ID by Pirento, if you link it: your Bharat ID number, its status, and the name, email and mobile it holds, shared with your consent at the moment you link or refresh it.',
            'Donations and membership: amount, programme, date, receipt number, and the payment reference Razorpay gives us. For monthly gifts, the Razorpay subscription reference. Card, UPI and bank details go directly to Razorpay; we never receive them.',
            'Messages you send through the contact form.',
            'Technical: a session cookie that keeps you signed in, a short-lived cookie during Bharat ID sign-in, and your light/dark theme choice saved in your own browser. We do not use advertising or tracking cookies.',
          ],
        ],
      },
      {
        h: 'Why we use it',
        body: [
          [
            'To run your account, including creating one when you donate without signing in.',
            'To process donations, monthly gifts and membership fees, issue receipts and certificates, and keep the financial records the law requires.',
            'To report eligible donations to the Income Tax Department (Form 10BD) so you receive Form 10BE for your 80G claim. This needs your name, PAN and address.',
            'To show your membership and Bharat ID status in your dashboard.',
            'To reply to your messages and send service emails (codes, receipts, certificates, membership and monthly-gift notices).',
            'To prevent fraud and misuse.',
          ],
          'We use your data only with your consent or where the law requires it. We do not sell your data, and we do not send marketing messages unless you ask for them.',
        ],
      },
      {
        h: 'Who we share it with',
        body: [
          [
            'Razorpay, to process payments and monthly mandates.',
            'Our email and SMS providers, only to deliver codes and notifications.',
            'Google, only if you choose “Sign in with Google”.',
            'Bharat ID by Pirento, only if you choose to sign in with it or link it. We receive data from it; we do not send your donation records to it.',
            'The Income Tax Department, the Ministry of Corporate Affairs, the FCRA authorities, auditors and courts, when the law requires it.',
          ],
          'Each provider may use the data only to provide its service to us.',
        ],
      },
      {
        h: 'How long we keep it',
        body: [
          'Donation, membership and accounting records are kept for 8 years, as Indian company and tax law requires (longer if FCRA rules require it for foreign contributions). Account data is kept while your account is open and deleted within 90 days of closing it, except for those records. One-time codes expire after 10 minutes and are deleted automatically; password set-up links expire after 7 days.',
        ],
      },
      {
        h: 'Your rights',
        body: [
          [
            'See the personal data we hold about you. Most of it is in your dashboard.',
            'Correct or update it, from your Profile page or by writing to us.',
            'Withdraw consent: unlink Bharat ID, stop a monthly gift, or ask us to erase your data, subject to records we must keep by law.',
            'Name another person to exercise these rights if you die or cannot act yourself.',
            'Complain to our Grievance Officer, and then to the Data Protection Board of India.',
          ],
          `To use any of these, write to ${EMAIL} with the subject “Privacy request”. We reply within 30 days.`,
        ],
      },
      {
        h: 'Security',
        body: [
          'We use encrypted connections (HTTPS), hashed passwords and codes, PKCE-protected Bharat ID sign-in, short-lived admin sessions with a second login step, and limited staff access. Receipts are reachable only by you, through a private link or your account, and by our administrators. No system is perfectly secure; if a breach affects you, we will tell you and the authorities as the law requires.',
        ],
      },
      {
        h: 'Children',
        body: ['Our accounts and memberships are for people aged 18 and over. We do not knowingly collect children’s data online. Beneficiary records for our education programmes are kept offline with parental consent under our child-protection practices.'],
      },
      {
        h: 'Grievance Officer',
        body: [
          `Grievance Officer, Pirento Foundation. Email: ${EMAIL}. Address: C/o Sanjay Kumar, Village Mudila, Post Sihari Sardaha, Bhanpur, Basti, Uttar Pradesh 272190. We acknowledge complaints within 48 hours and resolve them within 30 days.`,
        ],
      },
    ],
  },
  {
    slug: 'refund-policy',
    title: 'Refund & Cancellation Policy',
    lines: ['Refunds and', 'cancellations.'],
    intro: 'Donations are gifts and are normally final. Here is when we refund, how to stop a monthly gift, and how membership fees work.',
    updated: UPDATED,
    sections: [
      {
        h: 'When we refund a donation',
        body: [
          [
            'You were charged twice for the same donation.',
            'You entered the wrong amount by mistake (for example ₹50,000 instead of ₹5,000).',
            'The payment was made without your permission.',
            'A restricted gift cannot be used for its stated programme, and you prefer a refund to redirecting it.',
          ],
          'Other donations cannot be cancelled or refunded once received, because they are committed to programme work. A refunded donation is removed from our Form 10BD report and cannot be claimed under 80G.',
        ],
      },
      {
        h: 'Stopping a monthly gift',
        body: [
          'Stop it any time from Dashboard → Monthly giving, or write to us. It stops at once and no further charges are made. Payments already made are not refunded unless one of the reasons above applies. If a monthly charge happened after you asked us to stop, we refund it in full.',
        ],
      },
      {
        h: 'Membership fees',
        body: [
          'You can cancel your membership and get a full refund within 7 days of paying, if you write to us. After that, membership fees are not refunded, but your membership stays valid until its end date. Membership never renews on its own.',
        ],
      },
      {
        h: 'How to ask',
        body: [
          `Write to ${EMAIL} within 7 days of the payment, with your name, the amount, the date, and the Razorpay payment ID or receipt number. We reply within 3 working days.`,
        ],
      },
      {
        h: 'How refunds are paid',
        body: [
          'Approved refunds go back to the original payment method through Razorpay, usually within 5 to 7 working days of approval, depending on your bank. The receipt and certificate for a refunded payment are cancelled and will show as revoked.',
          'If money left your account but the payment failed, your bank or Razorpay reverses it automatically, normally within 5 to 7 working days. Write to us if it does not arrive.',
        ],
      },
      {
        h: 'Delivery',
        body: [
          'We do not ship any physical goods. Receipts, certificates and member cards are delivered by email immediately after payment is confirmed, and are always available in your account and on the Verify page.',
        ],
      },
    ],
  },
];
