export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  specialty?: string;
  role: UserRole;
  createdAt: string;
}

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "NONE";

export interface Subscription {
  status: SubscriptionStatus;
  planName?: string;
  renewsAt?: string;
  trialQuestionsLeft?: number;
  trialQuestionsTotal?: number;
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

export type QuizMode = "TUTOR" | "QUIZ";

export interface QuestionBank {
  id: string;
  subject: string;
  subjectColor: string; // tailwind class fragment
  name: string;
  description: string;
  questionCount: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface SessionSummary {
  id: string;
  bankId: string;
  bankName: string;
  mode: QuizMode;
  scorePct: number;
  questionsAnswered: number;
  totalQuestions: number;
  completedAt: string;
  inProgress?: boolean;
}
