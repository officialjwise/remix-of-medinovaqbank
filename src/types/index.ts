export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  /** Internal record id (uuid) — kept internal, not shown in the UI. */
  id: string;
  /** Public-facing, human-friendly account id shown to the user. */
  publicId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  specialty?: string;
  role: UserRole;
  createdAt: string;
  deviceFingerprint?: string;
}

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "NONE";

export interface Subscription {
  status: SubscriptionStatus;
  planName?: string;
  renewsAt?: string;
  trialQuestionsLeft?: number;
  trialQuestionsTotal?: number;
  /** ISO date the trial began. */
  trialStartedAt?: string;
  /** ISO date the trial ends (start + configured trial days). */
  trialEndsAt?: string;
  /** Human-readable label of the device the account is bound to. */
  boundDevice?: string;
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
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type ExamType = "USMLE" | "PLAB" | "MDCN" | "MEDICAL COUNCIL" | "GENERAL";

export interface QuestionBank {
  id: string;
  subject: string;
  subjectColor: string;
  accentHex: string;
  name: string;
  description: string;
  questionCount: number;
  difficulty: Difficulty;
  topics: string[];
  examType: ExamType;
  sessionsCount: number;
  isFree?: boolean;
  createdAt: string;
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

export interface QuestionOption {
  key: "A" | "B" | "C" | "D" | "E";
  text: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  bankId: string;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctKey: "A" | "B" | "C" | "D" | "E";
  whyCorrect: string;
  whyWrong: Partial<Record<"A" | "B" | "C" | "D" | "E", string>>;
  keyPoint: string;
  related: string[];
}

export interface ActiveSession {
  id: string;
  bankId: string;
  bankName: string;
  mode: QuizMode;
  questionIds: string[];
  answers: Record<string, "A" | "B" | "C" | "D" | "E">;
  submitted: Record<string, true>;
  startedAt: string;
  durationSec?: number;
  bookmarked: Record<string, true>;
}
