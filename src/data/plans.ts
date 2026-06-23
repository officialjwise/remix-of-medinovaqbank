import type { PricingPlan } from "@/types";

export interface DurationPlan {
  id: "monthly" | "q3" | "h6" | "y12";
  name: string;
  durationLabel: string;
  months: number;
  price: number;
  currency: "GHS";
  perMonth: number;
  badge?: { label: string; tone: "accent" | "amber" | "navy" };
  features: string[];
  savePct?: number;
  cta: string;
}

const baseFeatures = [
  "Full access to every question bank",
  "Detailed explanations on every answer",
  "Leaderboard & percentile rank",
  "Performance analytics dashboard",
];

export const durationPlans: DurationPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    durationLabel: "/month",
    months: 1,
    price: 129,
    currency: "GHS",
    perMonth: 129,
    features: baseFeatures,
    cta: "Subscribe",
  },
  {
    id: "q3",
    name: "3 Months",
    durationLabel: "/ 3 months",
    months: 3,
    price: 299,
    currency: "GHS",
    perMonth: Math.round(299 / 3),
    badge: { label: "★ Most Popular", tone: "accent" },
    features: [...baseFeatures, "Save 7%"],
    savePct: 7,
    cta: "Subscribe",
  },
  {
    id: "h6",
    name: "6 Months",
    durationLabel: "/ 6 months",
    months: 6,
    price: 499,
    currency: "GHS",
    perMonth: Math.round(499 / 6),
    badge: { label: "✦ Best Value", tone: "amber" },
    features: [...baseFeatures, "Save 19%"],
    savePct: 19,
    cta: "Subscribe",
  },
  {
    id: "y12",
    name: "12 Months",
    durationLabel: "/ year",
    months: 12,
    price: 799,
    currency: "GHS",
    perMonth: Math.round(799 / 12),
    badge: { label: "♦ Ultimate", tone: "navy" },
    features: [...baseFeatures, "Save 35%", "Priority support"],
    savePct: 35,
    cta: "Subscribe",
  },
];

// Kept for legacy imports — re-shaped from durationPlans.
export const pricingPlans: PricingPlan[] = durationPlans.map((p) => ({
  id: p.id,
  name: p.name,
  tagline: p.durationLabel,
  priceMonthly: p.perMonth,
  priceYearly: p.price,
  currency: p.currency,
  features: p.features,
  popular: p.id === "q3",
  cta: p.cta,
}));

export const pricingFaqs = [
  {
    q: "How does the free trial work?",
    a: "Sign in with Google and you get 10 free questions across every bank — no credit card required. After your trial, subscribe to any plan to keep practising.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, any time. You'll keep access until the end of your current billing period; we don't pro-rate refunds.",
  },
  {
    q: "Is this in GHS (Ghana Cedis)?",
    a: "All prices are in Ghana Cedis. We accept cards and mobile money via Paystack at checkout.",
  },
  {
    q: "Do I get access to all question banks?",
    a: "Yes — every paid plan unlocks the full library across Internal Medicine, Surgery, OB/GYN, Paediatrics, Pharmacology, Pathology, and more.",
  },
  {
    q: "How does the answer explanation work?",
    a: "After every answer (Tutor mode) or after a session (Quiz mode), our AI tutor explains the correct answer, why each distractor is wrong, the key learning point, and links to related concepts.",
  },
];
