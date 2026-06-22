import type { PricingPlan } from "@/types";

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Try the platform risk-free",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "GHS",
    cta: "Start free trial",
    features: [
      "50 free trial questions",
      "Tutor mode preview",
      "Basic performance overview",
      "Mobile + desktop access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious exam prep",
    priceMonthly: 199,
    priceYearly: 1899,
    currency: "GHS",
    popular: true,
    cta: "Subscribe to Pro",
    features: [
      "Full question bank (10,000+)",
      "Tutor mode + Quiz mode",
      "Detailed explanations & references",
      "Advanced analytics & percentile",
      "Leaderboard access",
      "Flag, note & review system",
    ],
  },
  {
    id: "institution",
    name: "Institution",
    tagline: "Schools, hospitals, study groups",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "GHS",
    cta: "Contact sales",
    features: [
      "Everything in Pro",
      "Bulk seats with admin dashboard",
      "Cohort analytics",
      "Custom question sets",
      "Priority support",
      "Single sign-on (SSO)",
    ],
  },
];
