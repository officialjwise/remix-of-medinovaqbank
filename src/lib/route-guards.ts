import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * beforeLoad guard for admin sub-routes: redirect to the admin dashboard unless
 * the user holds `permission` (super_admin always passes). The parent `/admin`
 * route has already enforced admin-rank + auth + store hydration, so this only
 * needs the fine-grained permission check. SSR no-ops (gate runs client-side).
 */
export function requirePermission(permission: string): void {
  if (typeof window === "undefined") return;
  const { user, permissions } = useAuthStore.getState();
  const ok = user?.role === "SUPER_ADMIN" || permissions.includes(permission);
  if (!ok) throw redirect({ to: "/admin/dashboard" });
}

/** As {@link requirePermission}, but any one of `perms` grants access. */
export function requireAnyPermission(perms: string[]): void {
  if (typeof window === "undefined") return;
  const { user, permissions } = useAuthStore.getState();
  const ok = user?.role === "SUPER_ADMIN" || perms.some((p) => permissions.includes(p));
  if (!ok) throw redirect({ to: "/admin/dashboard" });
}
