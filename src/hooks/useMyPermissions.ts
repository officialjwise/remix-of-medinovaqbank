import { useAuthStore } from "@/stores/authStore";
import { isAdminRole } from "@/lib/roles";

/**
 * The current user's effective RBAC permissions, sourced from /auth/me and
 * persisted in the auth store. Drives permission-based UI: nav items, route
 * guards, and action buttons render only when the user holds the permission.
 *
 * `super_admin` implicitly holds everything (the backend already returns the
 * full set, but we also short-circuit here so the UI never lies if the list is
 * momentarily empty).
 */
export function useMyPermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const has = (permission: string): boolean => isSuperAdmin || permissions.includes(permission);
  const hasAny = (perms: string[]): boolean =>
    isSuperAdmin || perms.some((p) => permissions.includes(p));
  const hasAll = (perms: string[]): boolean =>
    isSuperAdmin || perms.every((p) => permissions.includes(p));

  return {
    permissions,
    has,
    hasAny,
    hasAll,
    isSuperAdmin,
    /** True for ADMIN and SUPER_ADMIN (and custom roles, stored as ADMIN). */
    isAdmin: isAdminRole(role),
  };
}
