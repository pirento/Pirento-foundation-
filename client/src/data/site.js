// All public text lives here. Source: "Pirento Foundation — Profile, Work Plan & Governance" (Oct 2026).

export const brand = {
  name: 'Pirento Foundation',
  tagline: 'People. Planet. Possibility.',
  status: 'Donations open',
  legalForm: 'Section 8 company (registration pending)',
  sponsor: 'Venturecore Solutions Private Limited',
  sponsorCin: 'U63121UP2023PTC188021',
  email: 'support@pirento.com',
  phone: '+91 9988556861',
  contactNote: 'Contact details to be confirmed for the Foundation.',
  office: 'C/o Sanjay Kumar, Village Mudila, Post Sihari Sardaha, Bhanpur, Basti, Uttar Pradesh 272190 (proposed)',
  area: 'Basti and eastern Uttar Pradesh first; Lucknow and wider India later.',
  pendingNote:
    'Registration is pending. Until registration and 80G approval arrive, donations are not eligible for tax exemption.',
};

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programmes', label: 'Programmes' },
  { to: '/verify', label: 'Verify' },
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

export const registrations = [
  { name: 'Section 8 incorporation', status: 'Expected' },
  { name: 'PAN and bank account', status: 'Expected' },
  { name: '12A and 80G (Income Tax Act)', status: 'Expected' },
  { name: 'NGO Darpan', status: 'Expected' },
  { name: 'CSR-1 (to receive CSR funds)', status: 'Expected' },
];

export const donateSteps = [
  { title: 'Choose a cause', text: 'Pick a programme, or let us use it where it is needed most.' },
  { title: 'Pay securely', text: 'UPI, cards or net banking through Razorpay. We never see your card details.' },
  { title: 'Get your acknowledgement', text: 'A numbered receipt and a certificate you can download and verify online.' },
];

export const faqs = [
  { q: 'Is my donation tax-exempt?', a: 'Not yet. Registration and 80G approval are pending, so we cannot promise tax exemption. We will say so clearly on this site once approval arrives.' },
  { q: 'Can I choose where my money goes?', a: 'Yes. Pick a programme on the donation form. Restricted donations are spent only on their stated purpose.' },
  { q: 'Do I need an account to donate?', a: 'No. An account just keeps all your receipts and certificates in one place.' },
  { q: 'How do I check a certificate is real?', a: 'Every certificate has a number. Enter it on the Verify page to see who it was issued to and whether it is still valid.' },
  { q: 'Can I give by bank transfer?', a: 'Yes. Write to us and we will share the Foundation’s bank details once the account is open, then record your gift and send your certificate.' },
];
