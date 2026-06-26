/**
 * Backend (NestJS) response shapes — the wire format INSIDE the standard
 * envelope's `data`. These mirror the backend DTOs and are converted to the
 * frontend domain types in `@/api/mappers`. Kept separate from `@/types` so the
 * boundary mapping is explicit and the UI never depends on wire casing/shape.
 *
 * Grows per feature as endpoints are wired.
 */

export type BackendRole = "user" | "super_admin";

/** POST /auth/login | /auth/register | /auth/refresh | onboarding/complete */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

/** UserResponseDto — GET /users/me, GET /auth/me (.user), PATCH /users/me, avatar */
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: BackendRole;
  provider?: string;
  specialty?: string | null;
  institution?: string | null;
  country?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  trialQuestionsUsed?: number;
  lastActiveAt?: string | null;
  createdAt: string;
}

/** GET /users/me/subscription — SubscriptionStatusSummary */
export interface BackendSubscriptionSummary {
  hasActiveSubscription: boolean;
  plan?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining?: number | null;
  isTrial?: boolean;
  isTrialActive?: boolean;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialDaysRemaining?: number | null;
  trialQuestionsUsed?: number;
  trialLimit?: number;
  trialQuestionsRemaining?: number;
  canAccessQuiz?: boolean;
  features?: string[];
}

/** GET /auth/me — AuthMeResponseDto */
export interface BackendAuthMe {
  user: BackendUser;
  subscription?: {
    active: boolean;
    plan?: string | null;
    status?: string | null;
    endDate?: string | null;
    daysRemaining?: number | null;
  };
  access?: {
    canAccessQuiz: boolean;
    isTrial: boolean;
    trialQuestionsUsed: number;
    trialLimit: number;
    trialRemaining: number;
  };
}

/** Onboarding session — OnboardingStateDto */
export interface BackendOnboardingState {
  token: string;
  provider: "local" | "google";
  email: string;
  name?: string | null;
  currentStep: string;
  completedSteps: string[];
  data?: Record<string, unknown>;
  status: string;
  expiresAt: string;
}
