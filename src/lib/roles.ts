import type { UserRole } from "@/types";

/**
 * Admin-rank check. Both ADMIN and SUPER_ADMIN may reach the admin area; what
 * each can actually do inside it is decided per-permission (see useMyPermissions).
 * Custom-role users are stored as ADMIN rank, so they pass this too.
 */
export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
