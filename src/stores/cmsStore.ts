import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  body: string; // rich HTML
}

export interface LegalDoc {
  title: string;
  body: string; // rich HTML
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface AboutContent {
  heroTitle: string;
  heroSubtitle: string;
  features: { id: string; title: string; body: string }[];
  testimonials: Testimonial[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

export interface CmsContent {
  faqs: FaqEntry[];
  helpArticles: HelpArticle[];
  legal: { terms: LegalDoc; privacy: LegalDoc; refund: LegalDoc; cookie: LegalDoc };
  about: AboutContent;
  contact: ContactInfo;
}

const today = "2026-06-26";

const DEFAULT_CMS: CmsContent = {
  // Fallback only — the live API (/cms/faq, /cms/help) takes precedence. Kept in
  // sync with the backend seed (src/database/seed-data/help-articles.ts).
  faqs: [
    {
      id: "f1",
      category: "Getting Started",
      question: "How does the free trial work?",
      answer:
        "Create an account to start a free trial with a limited number of questions across the banks — no card required. The trial lasts a fixed number of days and questions (whichever comes first) and is locked to the device you sign up on.",
    },
    {
      id: "f2",
      category: "Getting Started",
      question: "What's the difference between Tutor and Quiz mode?",
      answer:
        "Tutor mode reveals the answer and a full clinical breakdown after every question — best for learning. Quiz mode mimics the real exam and reveals everything only at the end — best for testing yourself.",
    },
    {
      id: "f3",
      category: "Getting Started",
      question: "Can I use my account on multiple devices?",
      answer:
        "Trial accounts are locked to a single device for security. Paid subscribers can sign in across their devices, subject to the plan's active-session limits.",
    },
    {
      id: "f4",
      category: "Billing",
      question: "What payment methods do you accept?",
      answer:
        "Payments are processed securely by Paystack. You can pay by debit/credit card or mobile money. All prices are shown in Ghana Cedis (GHS).",
    },
    {
      id: "f5",
      category: "Billing",
      question: "Can I cancel or change my plan?",
      answer:
        "Yes, any time from the Subscription page. You keep access until the end of the current billing period; we don't pro-rate refunds for partial periods.",
    },
    {
      id: "f6",
      category: "Content",
      question: "Do I get access to all question banks with a paid plan?",
      answer:
        "Yes. A paid plan unlocks the full library across Internal Medicine, Surgery, OB/GYN, Paediatrics, Pharmacology, Pathology and more — plus all High-Yield Notes.",
    },
    {
      id: "f7",
      category: "Content",
      question: "How are the answer explanations created?",
      answer:
        "Every question ships with a structured clinical breakdown: why the correct answer is right, why each distractor is wrong, the key learning point, and links to related concepts.",
    },
    {
      id: "f8",
      category: "Performance",
      question: "How is my performance scored?",
      answer:
        "After each session you get your score, accuracy, and a breakdown by subject and difficulty. Analytics also place your performance against the cohort so you can see your percentile and trajectory.",
    },
    {
      id: "f9",
      category: "Account",
      question: "How do I reset my password?",
      answer:
        "On the sign-in page choose Forgot password, enter your email, and follow the secure link we send. For Google accounts, sign in with Google instead.",
    },
    {
      id: "f10",
      category: "Account",
      question: "Is my data secure and private?",
      answer:
        "We collect only what we need and never sell your data. Passwords are hashed, payments are handled by Paystack (we never store card details), and you can enable two-factor authentication.",
    },
  ],
  helpArticles: [
    {
      id: "h1",
      category: "Getting Started",
      title: "How do I start a quiz?",
      body: "<p>From your dashboard, open <strong>Question Banks</strong>, pick a bank, choose <strong>Tutor</strong> or <strong>Quiz</strong> mode and the number of questions, then start answering. You can filter by subject, topic, and difficulty first.</p>",
    },
    {
      id: "h2",
      category: "Quizzes & Study Modes",
      title: "Flagging and bookmarking questions",
      body: "<p>While answering you can <strong>bookmark</strong> a question to revisit later, or <strong>flag</strong> one you think has an issue. Bookmarks live in your profile; flags are reviewed by the content team.</p>",
    },
    {
      id: "h3",
      category: "Quizzes & Study Modes",
      title: "Resuming an in-progress quiz",
      body: "<p>If you leave a quiz partway through, it stays <strong>in progress</strong>. Return from your dashboard to pick up exactly where you left off — your answers so far are saved.</p>",
    },
    {
      id: "h4",
      category: "High-Yield Notes",
      title: "What are High-Yield Notes?",
      body: "<p>Concise, exam-focused summaries of key topics, presented page by page — ideal for quick revision between question sets. Some are available on trial; paid plans unlock the full library.</p>",
    },
    {
      id: "h5",
      category: "Billing & Subscriptions",
      title: "Managing your subscription",
      body: "<p>View your plan, renewal date, and payment history, and change or cancel your plan, from the <strong>Subscription</strong> page.</p>",
    },
    {
      id: "h6",
      category: "Account & Security",
      title: "Enabling two-factor authentication (2FA)",
      body: "<p>For extra security, enable 2FA in your account settings using an authenticator app. You'll then enter a 6-digit code when you sign in.</p>",
    },
    {
      id: "h7",
      category: "Troubleshooting",
      title: "My payment didn't reflect",
      body: "<p>Payments confirm within a few minutes. If access isn't unlocked after that, contact support with your Paystack reference and the email on your account so we can reconcile it.</p>",
    },
    {
      id: "h8",
      category: "Troubleshooting",
      title: "I can't sign in",
      body: "<p>Use the same method you signed up with (email/password or Google). Try <strong>Forgot password</strong> to reset. Repeated failures briefly lock the account for security — wait a few minutes and try again.</p>",
    },
  ],
  legal: {
    terms: {
      title: "Terms of Service",
      body: "<p>By using Medinovaqbank you agree to these terms. The platform is provided for educational purposes to support medical exam preparation.</p><p>Accounts are personal and may not be shared. Trial accounts are bound to a single device.</p>",
      updatedAt: today,
    },
    privacy: {
      title: "Privacy Policy",
      body: "<p>We collect the minimum data needed to operate the service: your account details, study activity, and device/geo signals used for security and analytics.</p><p>We never sell your data.</p>",
      updatedAt: today,
    },
    refund: {
      title: "Refund Policy",
      body: "<p>Subscriptions are billed upfront. We do not pro-rate refunds for partial periods, but you keep access until the end of your billing cycle.</p>",
      updatedAt: today,
    },
    cookie: {
      title: "Cookie Policy",
      body: "<p>We use essential cookies to keep you signed in and analytics cookies to improve the product. You can control non-essential cookies in your browser.</p>",
      updatedAt: today,
    },
  },
  about: {
    heroTitle: "Master Medicine. Pass with Confidence.",
    heroSubtitle:
      "Medinovaqbank is the modern question bank for medical exams — board-style vignettes, clinical breakdowns, and analytics that show exactly where you stand.",
    features: [
      {
        id: "a1",
        title: "Clinical Breakdowns",
        body: "Every answer explained — why it's right, why the others are wrong, and the key learning point.",
      },
      {
        id: "a2",
        title: "Gaussian Analytics",
        body: "See your percentile against the cohort and track your trajectory over time.",
      },
      {
        id: "a3",
        title: "Exam Coverage",
        body: "USMLE, PLAB, MRCP, the Ghana Medical & Dental Council exam and more.",
      },
    ],
    // No seeded testimonials — real, consented ones are added via the admin CMS.
    // Both render sites guard on `testimonials.length > 0`, so the section is
    // simply hidden until then.
    testimonials: [],
  },
  contact: {
    email: "support@medinovaqbank.com",
    // Left blank until a verified support number exists; UI omits the phone card.
    phone: "",
    address: "Accra, Ghana",
  },
};

interface CmsState {
  cms: CmsContent;
  setFaqs: (faqs: FaqEntry[]) => void;
  setHelpArticles: (articles: HelpArticle[]) => void;
  setLegal: (key: keyof CmsContent["legal"], doc: LegalDoc) => void;
  setAbout: (about: AboutContent) => void;
  setContact: (contact: ContactInfo) => void;
}

export const useCmsStore = create<CmsState>()(
  persist(
    (set) => ({
      cms: DEFAULT_CMS,
      setFaqs: (faqs) => set((s) => ({ cms: { ...s.cms, faqs } })),
      setHelpArticles: (helpArticles) => set((s) => ({ cms: { ...s.cms, helpArticles } })),
      setLegal: (key, doc) =>
        set((s) => ({ cms: { ...s.cms, legal: { ...s.cms.legal, [key]: doc } } })),
      setAbout: (about) => set((s) => ({ cms: { ...s.cms, about } })),
      setContact: (contact) => set((s) => ({ cms: { ...s.cms, contact } })),
    }),
    // version bumped to 2 so clients that cached the old seeded testimonials /
    // placeholder phone drop them and pick up the cleaned defaults.
    { name: "medinova-cms-v2", version: 2 },
  ),
);
