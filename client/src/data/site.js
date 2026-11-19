// All public text lives here. Registration numbers, fees and partner links come from admin Settings (/api/settings).

export const brand = {
  name: 'Pirento Foundation',
  tagline: 'People. Planet. Possibility.',
  status: 'Donations open',
  legalForm: 'Section 8 company',
  registrationsLine: 'Section 8 · 12A · 80G · CSR-1 · FCRA',
  sponsor: 'Venturecore Solutions Private Limited',
  sponsorCin: 'U63121UP2023PTC188021',
  email: 'support@pirentofoundation.org',
  domain: 'pirentofoundation.org',
  phone: '+91 9988556861',
  contactNote: 'Phone number to be confirmed.',
  office: 'C/o Sanjay Kumar, Village Mudila, Post Sihari Sardaha, Bhanpur, Basti, Uttar Pradesh 272190',
  area: 'Basti and eastern Uttar Pradesh first; Lucknow and wider India later.',
  taxNote:
    'Donations are eligible for deduction under section 80G of the Income-tax Act, subject to its limits. Add your PAN and address to get an 80G receipt; cash gifts above ₹2,000 are not deductible.',
};

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programmes', label: 'Programmes' },
  { to: '/membership', label: 'Membership' },
  { to: '/ecosystem', label: 'Ecosystem' },
  { to: '/contact', label: 'Contact' },
];

export const socials = []; // PLACEHOLDER: add real social profile links when they exist.

export const vision =
  'Communities that live with dignity, food security, a healthy environment and access to good education.';
export const mission =
  'To run transparent, practical programmes that protect nature, respond to hunger and emergencies, and widen access to learning, backed by accountable governance and trusted partners.';

export const programmes = [
  {
    key: 'green',
    name: 'Pirento Green',
    category: 'Environment',
    period: 'Pilot · 0–12 months',
    lead: 'Trees that survive, not plantation counts.',
    points: [
      'Native, climate-resilient trees on village, school and roadside land, with written permission from the landowner or panchayat.',
      'Every site geotagged; survival checked at 6, 12 and 24 months, with a local caretaker for each site.',
      'A community nursery near the Basti village land.',
      'Pond clean-up, rainwater harvesting and check bunds.',
      'Plastic-free drives and environmental awareness in schools.',
    ],
    tags: ['Native trees', 'Survival checks', 'Water & soil'],
    measure: { counted: 'Trees planted, sites, volunteers', outcome: 'Survival at 6 / 12 / 24 months', quality: 'Geotagged photos, species suitability, spot checks' },
  },
  {
    key: 'food',
    name: 'Pirento Food Relief',
    category: 'Food security & emergency relief',
    period: 'Pilot · 0–12 months',
    lead: 'Food on time, to the right household, with a record for every kit.',
    points: [
      'Scheduled ration-kit and meal distribution to verified needy households.',
      'A community kitchen or food-bank tie-up once volumes justify it.',
      'Rapid relief (food, drinking water, essentials) during floods, cold waves and other local emergencies.',
      'Beneficiary register, food-safety checks, stock records and a duplicate check for every distribution.',
    ],
    tags: ['Ration kits', 'Emergency relief', 'Beneficiary register'],
    measure: { counted: 'Meals and ration kits, households served', outcome: 'Response time in emergencies', quality: 'Food safety, stock reconciliation, duplicate control' },
  },
  {
    key: 'education',
    name: 'Pirento Education',
    category: 'Education',
    period: 'Pilot · 0–12 months',
    lead: 'Scholarships, kits and skills for students who need them most.',
    points: [
      'Scholarships for students from poor families, selected on need and merit.',
      'School kits (bags, books, uniforms), digital access and mentoring.',
      'Skill and vocational courses for youth, drawing on Venturecore’s experience in digital services.',
    ],
    tags: ['Scholarships', 'School kits', 'Skills'],
    measure: { counted: 'Students supported, kits given', outcome: 'Attendance, retention, progression', quality: 'Need-based selection, child safeguarding' },
  },
  {
    key: 'health',
    name: 'Health & livelihood',
    category: 'Community welfare',
    period: 'Supporting programme',
    lead: 'Camps, training and partnerships that support the three core programmes.',
    points: [
      'Health and sanitation awareness camps with qualified doctors.',
      'Livelihood training for women and youth.',
      'Partnerships with government schemes, local bodies, NGOs and CSR donors.',
    ],
    tags: ['Health camps', 'Women & youth', 'Partnerships'],
    measure: { counted: 'Camps held, people trained', outcome: 'People earning after training', quality: 'Qualified doctors, trainer records' },
  },
];

export const donateOptions = [
  { key: 'general', label: 'Where it is needed most' },
  { key: 'green', label: 'Pirento Green' },
  { key: 'food', label: 'Food & emergency relief' },
  { key: 'education', label: 'Education' },
  { key: 'health', label: 'Health & livelihood' },
];
export const presetAmounts = [500, 1000, 2500, 5000];

export const roadmap = [
  { stage: '0–12 months', status: 'Now', title: 'One pilot per programme', text: 'Pilot plantation with a survival baseline; scheduled distributions and an emergency protocol; scholarships and school kits.' },
  { stage: '1–3 years', status: 'Expected', title: 'Nurseries and partnerships', text: 'Nurseries with panchayat and school partners; a community kitchen or food-bank model; learning and skill centres.' },
  { stage: '3–7 years', status: 'Expected', title: 'District scale', text: 'District-scale restoration and a multi-district relief network. School of Pirento Lucknow, only after approvals.' },
  { stage: 'Long term', status: 'Expected', title: 'Lasting systems', text: 'Climate-resilience research and sustainable nutrition systems. University of Pirento Lucknow, only after lawful establishment.' },
];
export const futureNote =
  'School of Pirento and University of Pirento are future concepts only. They do not admit students, take fees or award certificates until land, recognition and UGC or board approvals are in place.';

export const board = [
  { name: 'Ravikant Soni', role: 'Founder & Director, Venturecore', office: 'Chairperson / Managing Director (to be confirmed)' },
  { name: 'Jang Bahadur Chaudhary', role: 'Director, Venturecore', office: 'Secretary or Treasurer (to be confirmed)' },
  { name: 'Ashish Soni', role: 'Director, Venturecore', office: 'Secretary or Treasurer (to be confirmed)' },
];

export const governance = [
  { title: 'Own money, own books', text: 'A separate bank account and PAN in the Foundation’s name. No mixing with Venturecore’s commercial funds.' },
  { title: 'Regular board meetings', text: 'At least quarterly, with a quorum and minutes kept.' },
  { title: 'Conflict of interest', text: 'Any deal with Venturecore, Pirento brands, board members or their relatives needs written terms and approval by members with no interest in it.' },
  { title: 'Restricted gifts honoured', text: 'A donation for a stated purpose is spent only on that purpose.' },
  { title: 'Audited every year', text: 'Financial year April–March, an annual audit, and an annual activity and fund-utilisation report.' },
  { title: 'Policies first', text: 'Finance and procurement, conflict of interest, child protection, food safety, grievance and whistle-blowing.' },
];

export const donateSteps = [
  { title: 'Choose a cause', text: 'Pick a programme, or let us use it where it is needed most.' },
  { title: 'Pay securely', text: 'UPI, cards or net banking through Razorpay, once or every month. No login needed.' },
  { title: 'Get your 80G receipt', text: 'A numbered 80G receipt, a certificate you can verify, and an account to keep them all.' },
];

export const faqs = [
  { q: 'Is my donation tax-deductible?', a: 'Yes. Pirento Foundation is registered under sections 12A and 80G of the Income-tax Act. Add your PAN and address on the form and your receipt carries the 80G particulars. We file Form 10BD and you receive Form 10BE, which is what you use to claim the deduction. Cash gifts above ₹2,000 are not deductible.' },
  { q: 'Do I need an account to donate?', a: 'No. Just fill the form and pay. We create an account for you automatically and email a link to set your password, so all your receipts stay in one place.' },
  { q: 'How does monthly giving work?', a: 'Choose “Monthly”, pick an amount from ₹100 and approve the mandate in Razorpay. You get a receipt every month and can stop any time from your dashboard; it ends before the next charge.' },
  { q: 'Can I choose where my money goes?', a: 'Yes. Pick a programme on the form. Restricted donations are spent only on their stated purpose.' },
  { q: 'Can companies give CSR funds?', a: 'Yes. We are registered for CSR (Form CSR-1). Write to us for our registration details and a CSR proposal.' },
  { q: 'Can I give from outside India?', a: 'We hold FCRA registration, but foreign contributions must go only to our designated FCRA bank account and cannot be taken through this form. Please write to us for the details.' },
  { q: 'How do I check a certificate is real?', a: 'Every certificate has a number. Enter it on the Verify page to see who it was issued to and whether it is still valid.' },
  { q: 'Can I get a refund?', a: 'Donations are normally final, but we refund duplicate charges, wrong amounts and unauthorised payments. See our Refund & Cancellation Policy.' },
];

export const ecosystem = {
  site: { label: 'pirento.com', href: 'https://pirento.com', text: 'The main Pirento website.' },
  bharatId: {
    name: 'Bharat ID by Pirento',
    tag: 'Private Pirento Account ID — Not a Government ID',
    text: 'One private Pirento account ID for sign-in, profile and consent across Pirento services. Every Foundation member links one.',
  },
  pirentoOne: {
    name: 'Pirento One',
    tag: 'Partner network',
    text: 'For professionals, agencies, institutions and community partners who want to introduce people and opportunities into the Pirento ecosystem, with the customer’s permission and clear responsibilities.',
  },
  parent: {
    name: 'Venturecore Solutions Private Limited',
    meta: 'Sponsor company · CIN U63121UP2023PTC188021',
    text: 'Gives the initial corpus and brand licence. Its directors form the Foundation’s first board.',
  },
  foundation: {
    name: 'Pirento Foundation',
    meta: 'Section 8 company · 12A · 80G · CSR-1 · FCRA',
    text: 'The charitable arm. Its own bank account, its own books, its own decisions. You are on its website.',
  },
  future: [
    {
      name: 'School of Pirento',
      place: 'Lucknow',
      stage: '3–7 years',
      text: 'A school for children from the communities we serve. Planned only after land, recognition and board approvals are in place.',
    },
    {
      name: 'University of Pirento',
      place: 'Lucknow',
      stage: 'Long term',
      text: 'Higher education and skills, built on what the school and scholarships teach us. Planned only after lawful establishment and UGC approval.',
    },
  ],
};

export const legalLinks = [
  { to: '/terms', label: 'Terms of Use' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund-policy', label: 'Refund & Cancellation' },
];
export const contactTopics = ['Partnership', 'CSR support', 'Volunteering', 'Donation or receipt', 'Privacy or data request', 'Grievance', 'Other'];

export const membership = {
  benefits: [
    { title: 'Your membership certificate', text: 'A numbered certificate and member card, verifiable online by anyone.' },
    { title: 'A place in the work', text: 'First invitations to plantation drives, relief camps and volunteer days in Basti and beyond.' },
    { title: 'Updates from the field', text: 'Programme reports, survival counts and fund-use summaries, before anyone else.' },
    { title: 'Bharat ID by Pirento', text: 'Your private Pirento account ID, linked to your membership and shown on your card.' },
  ],
  steps: [
    { title: 'Create your account', text: 'Sign up with email, mobile, Google or Bharat ID.' },
    { title: 'Pay the membership fee', text: 'Securely through Razorpay. You get a fee receipt at once.' },
    { title: 'Get your certificate', text: 'Member number, certificate and member card appear in your dashboard.' },
    { title: 'Complete your Bharat ID', text: 'Finish it on Bharat ID by Pirento. Until then it shows as pending in your dashboard.' },
  ],
  note: 'This is a supporter membership of Pirento Foundation. It does not make you a member or shareholder of the company under the Companies Act, 2013, and gives no voting rights. The fee is not a donation and is not eligible for 80G.',
  faqs: [
    { q: 'Who can become a member?', a: 'Anyone aged 18 or over who supports our work. You need a Pirento Foundation account.' },
    { q: 'Do I need Bharat ID to join?', a: 'You can pay and receive your certificate first. Linking your Bharat ID by Pirento completes your membership profile; it shows as pending until you finish it on Bharat ID.' },
    { q: 'Is Bharat ID a government ID?', a: 'No. Bharat ID by Pirento is a private Pirento account ID for use within the Pirento ecosystem. It is not Aadhaar or any government identity, and is not proof of citizenship or residence.' },
    { q: 'Is the fee tax-deductible?', a: 'No. Membership fees are not donations, so they are not eligible for 80G. Donations are.' },
    { q: 'Do I need membership to donate?', a: 'No. Anyone can donate, with or without an account or membership.' },
  ],
};
