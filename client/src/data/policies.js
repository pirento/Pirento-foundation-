// Policy text. Draft prepared for Pirento Foundation; have it reviewed by a lawyer before launch.
// Section bodies are arrays: a string is a paragraph, an array is a bullet list.

const EMAIL = 'support@pirentofoundation.org';
const SITE = 'pirentofoundation.org';
const UPDATED = '19 November 2026';

export const policies = [
  {
    slug: 'terms',
    title: 'Terms of Use',
    lines: ['Terms of', 'Use.'],
    intro: `These terms apply when you use ${SITE}, create an account, or donate to Pirento Foundation. By using the site you agree to them.`,
    updated: UPDATED,
    sections: [
      {
        h: 'Who we are',
        body: [
          'Pirento Foundation (“we”, “us”) is the charitable arm of Venturecore Solutions Private Limited (CIN U63121UP2023PTC188021), proposed as a Section 8 company. Its registration is pending.',
          'Until registration and approval under section 80G of the Income Tax Act arrive, we do not offer tax exemption on donations, and nothing on this site should be read as saying we do.',
        ],
      },
      {
        h: 'Your account',
        body: [
          [
            'You must be 18 or older to create an account or donate. Younger supporters may donate through a parent or guardian.',
            'Give accurate details. We verify your email and mobile number with one-time codes.',
            'Keep your password and codes private. Tell us at once at ' + EMAIL + ' if you think someone else has used your account.',
            'You can ask us to close your account at any time. We keep donation records as the law requires (see the Privacy Policy).',
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
            'Each confirmed donation gets a numbered receipt and a certificate by email and in your account.',
            'Refunds are covered by our Refund & Cancellation Policy.',
          ],
          'We accept donations only from Indian residents in Indian rupees. We do not accept foreign contributions until we hold FCRA registration.',
        ],
      },
      {
        h: 'Certificates',
        body: [
          'Certificates we issue carry a unique number that anyone can check on our Verify page. They acknowledge a donation or contribution; they are not tax-exemption receipts. We may revoke a certificate issued by mistake or obtained by false information, and the Verify page will then show it as revoked.',
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
          'We work to keep the site accurate and available, but we provide it “as is”. To the extent the law allows, we are not liable for indirect losses, or for outages caused by payment, email or SMS providers. Nothing here limits rights you have under Indian consumer law.',
        ],
      },
      {
        h: 'Law and disputes',
        body: [
          'These terms are governed by the laws of India. Please write to us first; most issues are solved quickly. Courts at Basti, Uttar Pradesh have jurisdiction over any dispute.',
          'We may update these terms. The date above shows the latest version; important changes will be shown on the site.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    lines: ['Privacy', 'Policy.'],
    intro: `How Pirento Foundation collects, uses and protects your personal data, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.`,
    updated: UPDATED,
    sections: [
      {
        h: 'What we collect',
        body: [
          [
            'Account: name, email, mobile number, and a password (stored only as a secure hash), or your Google account name and email if you sign in with Google.',
            'Donations: name, email, phone, optional PAN, amount, chosen programme, and the payment reference Razorpay gives us. Card, UPI and bank details go directly to Razorpay; we never receive them.',
            'Messages you send through the contact form.',
            'Technical: a session cookie that keeps you signed in, and your light/dark theme choice saved in your own browser. We do not use advertising or tracking cookies.',
          ],
        ],
      },
      {
        h: 'Why we use it',
        body: [
          [
            'To run your account and verify your email and mobile with one-time codes.',
            'To process donations, issue receipts and certificates, and keep the financial records the law requires.',
            'To reply to your messages and send you service emails (codes, receipts, certificates).',
            'To prevent fraud and misuse.',
          ],
          'We use your data only with your consent or where the law requires it. We do not sell your data, and we do not send marketing messages unless you ask for them.',
        ],
      },
      {
        h: 'Who we share it with',
        body: [
          [
            'Razorpay, to process payments.',
            'Our email and SMS providers, only to deliver codes and notifications.',
            'Google, only if you choose “Sign in with Google”.',
            'Auditors, tax authorities, regulators or courts, when the law requires it.',
          ],
          'Each provider may use the data only to provide its service to us.',
        ],
      },
      {
        h: 'How long we keep it',
        body: [
          'Donation and accounting records are kept for 8 years, as Indian company and tax law requires. Account data is kept while your account is open and deleted within 90 days of closing it, except for those records. One-time codes expire after 10 minutes and are deleted automatically.',
        ],
      },
      {
        h: 'Your rights',
        body: [
          [
            'See the personal data we hold about you.',
            'Correct or update it.',
            'Withdraw consent and ask us to erase it, subject to records we must keep by law.',
            'Name another person to exercise these rights if you die or cannot act yourself.',
            'Complain to our Grievance Officer, and then to the Data Protection Board of India.',
          ],
          `To use any of these, write to ${EMAIL} with the subject “Privacy request”. We reply within 30 days.`,
        ],
      },
      {
        h: 'Security',
        body: [
          'We use encrypted connections (HTTPS), hashed passwords and codes, short-lived admin sessions with a second login step, and limited staff access. No system is perfectly secure; if a breach affects you, we will tell you and the authorities as the law requires.',
        ],
      },
      {
        h: 'Children',
        body: ['Our accounts are for people aged 18 and over. We do not knowingly collect children’s data online. Beneficiary records for our education programmes are kept offline with parental consent under our child-protection practices.'],
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
    intro: 'Donations are gifts and are normally final. Here is when we refund, and how to ask.',
    updated: UPDATED,
    sections: [
      {
        h: 'When we refund',
        body: [
          [
            'You were charged twice for the same donation.',
            'You entered the wrong amount by mistake (for example ₹50,000 instead of ₹5,000).',
            'The payment was made without your permission.',
            'A restricted gift cannot be used for its stated programme, and you prefer a refund to redirecting it.',
          ],
          'Other donations cannot be cancelled or refunded once received, because they are committed to programme work.',
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
          'Approved refunds go back to the original payment method through Razorpay, usually within 5 to 7 working days of approval, depending on your bank. The receipt and certificate for a refunded gift are cancelled and will show as revoked.',
          'If money left your account but the donation failed, your bank or Razorpay reverses it automatically, normally within 5 to 7 working days. Write to us if it does not arrive.',
        ],
      },
      {
        h: 'Delivery',
        body: [
          'We do not ship any physical goods. Your receipt and certificate are delivered by email immediately after payment is confirmed, and are always available in your account and on the Verify page.',
        ],
      },
    ],
  },
];
