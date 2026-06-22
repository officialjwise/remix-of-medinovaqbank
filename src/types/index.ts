export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "NONE";

export interface Subscription {
  status: SubscriptionStatus;
  planName?: string;
  renewsAt?: string;
  trialQuestionsLeft?: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  popular?: boolean;
  cta: string;
}
