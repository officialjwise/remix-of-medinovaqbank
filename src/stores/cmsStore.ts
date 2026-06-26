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
  faqs: [
    { id: "f1", category: "Getting Started", question: "How does the free trial work?", answer: "Sign in with Google and get a 7-day free trial with sample questions across every bank — no credit card required. Your trial is locked to the device you sign up on." },
    { id: "f2", category: "Billing", question: "Can I cancel my subscription?", answer: "Yes, any time. You keep access until the end of your current billing period; we don't pro-rate refunds." },
    { id: "f3", category: "Billing", question: "Is this in GHS (Ghana Cedis)?", answer: "All prices are in Ghana Cedis. We accept cards and mobile money via Paystack at checkout." },
    { id: "f4", category: "Content", question: "Do I get access to all question banks?", answer: "Every paid plan unlocks the full library across Internal Medicine, Surgery, OB/GYN, Paediatrics, Pharmacology, Pathology, and more." },
    { id: "f5", category: "Content", question: "How do the answer explanations work?", answer: "After every answer (Tutor mode) or after a session (Quiz mode), our AI tutor explains the correct answer, why each distractor is wrong, the key learning point, and links to related concepts." },
  ],
  helpArticles: [
    { id: "h1", category: "Account", title: "Setting up your profile", body: "<p>Add your specialty, institution and a profile photo from the <strong>Profile</strong> page so your progress and leaderboard entry are personalised.</p>" },
    { id: "h2", category: "Quizzes", title: "Tutor mode vs Quiz mode", body: "<p><strong>Tutor mode</strong> shows the explanation after each question. <strong>Quiz mode</strong> mimics the real exam and reveals everything at the end.</p>" },
    { id: "h3", category: "Billing", title: "Managing your subscription", body: "<p>View invoices, change plans and see your renewal date from the <strong>Subscription</strong> page.</p>" },
  ],
  legal: {
    terms: { title: "Terms of Service", body: "<p>By using Medinovaqbank you agree to these terms. The platform is provided for educational purposes to support medical exam preparation.</p><p>Accounts are personal and may not be shared. Trial accounts are bound to a single device.</p>", updatedAt: today },
    privacy: { title: "Privacy Policy", body: "<p>We collect the minimum data needed to operate the service: your account details, study activity, and device/geo signals used for security and analytics.</p><p>We never sell your data.</p>", updatedAt: today },
    refund: { title: "Refund Policy", body: "<p>Subscriptions are billed upfront. We do not pro-rate refunds for partial periods, but you keep access until the end of your billing cycle.</p>", updatedAt: today },
    cookie: { title: "Cookie Policy", body: "<p>We use essential cookies to keep you signed in and analytics cookies to improve the product. You can control non-essential cookies in your browser.</p>", updatedAt: today },
  },
  about: {
    heroTitle: "Master Medicine. Pass with Confidence.",
    heroSubtitle: "Medinovaqbank is the modern question bank for medical exams — board-style vignettes, AI clinical breakdowns, and analytics that show exactly where you stand.",
    features: [
      { id: "a1", title: "AI Clinical Breakdowns", body: "Every answer explained — why it's right, why the others are wrong, and the key learning point." },
      { id: "a2", title: "Gaussian Analytics", body: "See your percentile against the cohort and track your trajectory over time." },
      { id: "a3", title: "Exam Coverage", body: "USMLE, PLAB, MRCP, the Ghana Medical & Dental Council exam and more." },
    ],
    testimonials: [
      { id: "t1", name: "Dr. Akua M.", role: "Internal Medicine", quote: "The clinical breakdowns are better than any textbook. I went from the 60th to the 90th percentile in six weeks." },
      { id: "t2", name: "Dr. Kwame O.", role: "Surgery", quote: "Quiz mode feels exactly like the real exam. The analytics told me precisely what to revise." },
    ],
  },
  contact: {
    email: "support@medinovaqbank.com",
    phone: "+233 20 000 0000",
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
      setLegal: (key, doc) => set((s) => ({ cms: { ...s.cms, legal: { ...s.cms.legal, [key]: doc } } })),
      setAbout: (about) => set((s) => ({ cms: { ...s.cms, about } })),
      setContact: (contact) => set((s) => ({ cms: { ...s.cms, contact } })),
    }),
    { name: "medinova-cms", version: 1 },
  ),
);
