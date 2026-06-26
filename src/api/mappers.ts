/**
 * Boundary mappers: convert backend wire shapes (`@/api/types`) into frontend
 * domain types (`@/types`). All casing/shape normalization happens here so the
 * UI is insulated from the backend's representation. Grows per feature.
 */
import type { Subscription, SubscriptionStatus, User, UserRole } from "@/types";
import type { AuthTokens, BackendRole, BackendSubscriptionSummary, BackendUser } from "@/api/types";

/** Backend lowercase role → frontend uppercase union. */
export function mapRole(role: BackendRole | string): UserRole {
  return role === "super_admin" ? "SUPER_ADMIN" : "USER";
}

/** Frontend role → backend casing (for the rare write path). */
export function toBackendRole(role: UserRole): BackendRole {
  return role === "SUPER_ADMIN" ? "super_admin" : "user";
}

/** Display-only public id derived from the internal uuid (uuid stays internal). */
export function publicIdFor(uuid: string, role: UserRole): string {
  const prefix = role === "SUPER_ADMIN" ? "ADM" : "U";
  const n = parseInt(uuid.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16)
    .toString()
    .padStart(6, "0");
  return `MQB-${prefix}-${n}`;
}

export function mapUser(u: BackendUser): User {
  const role = mapRole(u.role);
  return {
    id: u.id,
    publicId: publicIdFor(u.id, role),
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar ?? undefined,
    specialty: u.specialty ?? undefined,
    role,
    createdAt: u.createdAt,
  };
}

/** Derive the frontend's coarse status from the backend's richer summary. */
export function mapSubscriptionStatus(s: BackendSubscriptionSummary): SubscriptionStatus {
  if (s.hasActiveSubscription) return "ACTIVE";
  if (s.isTrialActive) return "TRIAL";
  if (s.isTrial || s.status === "expired") return "EXPIRED";
  return "NONE";
}

export function mapSubscription(s: BackendSubscriptionSummary): Subscription {
  return {
    status: mapSubscriptionStatus(s),
    planName: s.plan ?? undefined,
    renewsAt: s.endDate ?? undefined,
    trialQuestionsLeft: s.trialQuestionsRemaining,
    trialQuestionsTotal: s.trialLimit,
    trialStartedAt: s.trialStartedAt ?? undefined,
    trialEndsAt: s.trialEndsAt ?? undefined,
    // boundDevice is sourced from GET /users/me/devices when needed.
  };
}

export type { AuthTokens };
