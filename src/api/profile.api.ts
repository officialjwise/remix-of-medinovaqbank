/**
 * PROFILE domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1):
 *   GET    /users/me           — signed-in user's profile (UserResponseDto)
 *   PATCH  /users/me           — update profile (UpdateProfileDto)
 *   GET    /users/me/stats     — quiz KPIs (UserStats)
 *   POST   /users/me/avatar    — multipart 'file' upload -> updated profile
 *   DELETE /users/me/avatar    — clear avatar -> updated profile
 *   POST   /auth/change-password — { currentPassword, newPassword } -> null
 *
 * The HTTP client strips the JSON content-type automatically for FormData
 * bodies so the browser can set the multipart boundary.
 *
 * GAPS:
 *   - The shared local `User` type (authStore) only carries id/email/name/
 *     avatarUrl/specialty/role/createdAt. The richer backend fields
 *     (institution, country, status, trial usage, …) are exposed on the
 *     `Profile` view model here but NOT persisted to the auth store. Screens
 *     that need institution/country read them from the live profile query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendUserRole = "user" | "super_admin";
export type BackendAuthProvider = "local" | "google";
export type BackendUserStatus = "active" | "flagged" | "suspended";

// ── Frontend role (mirrors the shared UserRole union). ──
export type DisplayUserRole = "USER" | "SUPER_ADMIN";

const ROLE_TO_DISPLAY: Record<BackendUserRole, DisplayUserRole> = {
  user: "USER",
  super_admin: "SUPER_ADMIN",
};

// ── Backend wire shape (UserResponseDto). ──
export interface BackendUserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: BackendUserRole;
  provider: BackendAuthProvider;
  specialty: string | null;
  institution: string | null;
  country: string;
  isActive: boolean;
  status: BackendUserStatus;
  statusReason: string | null;
  flaggedAt: string | null;
  flagReason: string | null;
  isEmailVerified: boolean;
  trialQuestionsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
}

// ── Frontend domain shape (what the profile UI consumes). ──
export interface Profile {
  id: string;
  email: string;
  name: string;
  /** <- backend `avatar` (null -> undefined for the store/avatar UI). */
  avatarUrl?: string;
  role: DisplayUserRole;
  provider: BackendAuthProvider;
  specialty: string | null;
  institution: string | null;
  country: string;
  isActive: boolean;
  status: BackendUserStatus;
  isEmailVerified: boolean;
  trialQuestionsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
}

// ── Boundary mapper: UserResponseDto -> Profile. ──
export function mapProfile(u: BackendUserProfile): Profile {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar ?? undefined,
    role: ROLE_TO_DISPLAY[u.role] ?? "USER",
    provider: u.provider,
    specialty: u.specialty,
    institution: u.institution,
    country: u.country,
    isActive: u.isActive,
    status: u.status,
    isEmailVerified: u.isEmailVerified,
    trialQuestionsUsed: u.trialQuestionsUsed,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,
  };
}

// ── Update payload (mirrors UpdateProfileDto). ──
export interface ProfileUpdateInput {
  name?: string;
  specialty?: string;
  institution?: string;
  country?: string;
  avatar?: string;
}

// ── Quiz KPIs (UserStats). ──
export interface UserStats {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  accuracy: number;
  averageScore: number;
}

// ── Change-password payload (mirrors ChangePasswordDto). ──
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  /** Signed-in user's profile. */
  async getMe(): Promise<Profile> {
    const data = await apiClient.get<BackendUserProfile>("/users/me");
    return mapProfile(data);
  },

  async updateMe(input: ProfileUpdateInput): Promise<Profile> {
    const data = await apiClient.patch<BackendUserProfile>("/users/me", input);
    return mapProfile(data);
  },

  async getStats(): Promise<UserStats> {
    return apiClient.get<UserStats>("/users/me/stats");
  },

  /** Upload a new avatar (multipart 'file'). */
  async uploadAvatar(file: File | Blob): Promise<Profile> {
    const form = new FormData();
    // The backend reads the field named 'file' (FileInterceptor('file')).
    form.append("file", file, "avatar.jpg");
    const data = await apiClient.post<BackendUserProfile>("/users/me/avatar", form);
    return mapProfile(data);
  },

  async removeAvatar(): Promise<Profile> {
    const data = await apiClient.delete<BackendUserProfile>("/users/me/avatar");
    return mapProfile(data);
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post<null>("/auth/change-password", input);
  },
};

// ── Query keys ──
export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  stats: () => [...profileKeys.all, "stats"] as const,
};

// ── Hooks ──

/** Signed-in user's profile. */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: profileApi.getMe,
    staleTime: 60_000,
  });
}

/** Quiz KPI summary for the signed-in user. */
export function useUserStats() {
  return useQuery({
    queryKey: profileKeys.stats(),
    queryFn: profileApi.getStats,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => profileApi.updateMe(input),
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me(), profile);
      void qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File | Blob) => profileApi.uploadAvatar(file),
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me(), profile);
      void qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => profileApi.removeAvatar(),
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me(), profile);
      void qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => profileApi.changePassword(input),
  });
}
