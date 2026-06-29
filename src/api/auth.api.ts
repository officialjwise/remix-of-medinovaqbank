import type { Subscription, User } from "@/types";
import { apiClient, BASE_URL } from "./client";
import { mapSubscription, mapUser } from "./mappers";
import type {
  AuthTokens,
  BackendAuthMe,
  BackendOnboardingState,
  BackendSubscriptionSummary,
  BackendUser,
} from "./types";
import { useAuthStore } from "@/stores/authStore";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  specialty?: string;
  institution?: string;
  country?: string;
}

export interface OnboardingStartInput {
  email: string;
  password: string;
  name?: string;
}

export interface OnboardingStepInput {
  step: "profile" | "preferences";
  data?: Record<string, unknown>;
}

/** POST /auth/login — 2FA-enabled accounts get a challenge instead of tokens. */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challengeToken: string;
}

/** /auth/login may resolve to a token pair OR a 2FA challenge. */
export type LoginResult = AuthTokens | TwoFactorChallenge;

/** Narrow a login result to the 2FA-challenge branch. */
export function isTwoFactorChallenge(result: LoginResult): result is TwoFactorChallenge {
  return "twoFactorRequired" in result && result.twoFactorRequired === true;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResult>("/auth/login", { email, password }),

  /** Exchange a 2FA challenge token + 6-digit code for a token pair. */
  verifyTwoFactor: (challengeToken: string, code: string) =>
    apiClient.post<AuthTokens>("/auth/2fa/verify", { challengeToken, code }),

  register: (input: RegisterInput) => apiClient.post<AuthTokens>("/auth/register", input),

  forgotPassword: (email: string) => apiClient.post<null>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<null>("/auth/reset-password", { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<null>("/auth/change-password", { currentPassword, newPassword }),

  refresh: (refreshToken: string) => apiClient.post<AuthTokens>("/auth/refresh", { refreshToken }),

  logout: () => apiClient.post<null>("/auth/logout"),

  /** Current user + effective permissions (mapped). Throws if unauthenticated. */
  async getMe(): Promise<{ user: User; permissions: string[] }> {
    const data = await apiClient.get<BackendAuthMe>("/auth/me");
    return { user: mapUser(data.user), permissions: data.permissions ?? [] };
  },

  /** Profile via /users/me (mapped). */
  async getProfile(): Promise<User> {
    const data = await apiClient.get<BackendUser>("/users/me");
    return mapUser(data);
  },

  /** Server-sourced subscription/trial status (mapped). */
  async getSubscription(): Promise<Subscription> {
    const data = await apiClient.get<BackendSubscriptionSummary>("/users/me/subscription");
    return mapSubscription(data);
  },

  /** Full-page redirect entry point for Google OAuth. */
  googleUrl: (): string => `${BASE_URL}/auth/google`,

  // ── Resumable onboarding ──
  onboardingStart: (input: OnboardingStartInput) =>
    apiClient.post<BackendOnboardingState>("/auth/onboarding/start", input),

  onboardingResume: (token: string) =>
    apiClient.get<BackendOnboardingState>(`/auth/onboarding/${token}`),

  onboardingSaveStep: (token: string, input: OnboardingStepInput) =>
    apiClient.patch<BackendOnboardingState>(`/auth/onboarding/${token}/step`, input),

  onboardingComplete: (token: string) =>
    apiClient.post<AuthTokens>(`/auth/onboarding/${token}/complete`),

  onboardingAbandon: (token: string) => apiClient.post<null>(`/auth/onboarding/${token}/abandon`),
};

/**
 * Finalize a session from a freshly-issued token pair: persist tokens, load the
 * user via /auth/me, then best-effort load subscription. Used by login, register,
 * Google callback, and onboarding completion. Returns the mapped user.
 */
export async function establishSession(tokens: AuthTokens): Promise<User> {
  const store = useAuthStore.getState();
  // Set tokens first so the /auth/me request is authenticated.
  store.setTokens(tokens.accessToken, tokens.refreshToken);
  const { user, permissions } = await authApi.getMe();
  useAuthStore.getState().login(tokens.accessToken, tokens.refreshToken, user, permissions);

  // Subscription is best-effort — a failure must never block sign-in.
  try {
    const subscription = await authApi.getSubscription();
    useAuthStore.getState().setSubscription(subscription);
  } catch {
    /* leave subscription null; surfaces fetch lazily elsewhere */
  }
  return user;
}

/**
 * Re-sync the persisted session (role, roleKey, permissions) from /auth/me on
 * app load. Keeps an already-logged-in user's permission-gated UI correct after
 * a role/permission change, and upgrades older persisted sessions that predate
 * the ADMIN role / permission set. Silent best-effort: never throws.
 */
export async function refreshSession(): Promise<boolean> {
  const store = useAuthStore.getState();
  if (!store.isAuthenticated || !store.accessToken) return false;
  try {
    const { user, permissions } = await authApi.getMe();
    const prev = useAuthStore.getState();
    // Did role/roleKey/permissions actually change? If so the caller should
    // re-evaluate route guards (otherwise a guarded page already resolved
    // against stale/empty persisted permissions stays wrongly redirected).
    const changed =
      prev.user?.role !== user.role ||
      (prev.user?.roleKey ?? null) !== (user.roleKey ?? null) ||
      prev.permissions.length !== permissions.length ||
      permissions.some((p) => !prev.permissions.includes(p));
    prev.setUser(user);
    prev.setPermissions(permissions);
    return changed;
  } catch {
    /* leave the persisted session as-is; the client handles 401 refresh/logout */
    return false;
  }
}
