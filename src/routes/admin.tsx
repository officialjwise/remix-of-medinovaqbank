import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAuthStore } from "@/stores/authStore";
import { isAdminRole } from "@/lib/roles";

import { SplashScreen } from "@/components/layout/SplashScreen";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    if (!useAuthStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useAuthStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }

    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/login" });
    // Admin-rank (ADMIN, SUPER_ADMIN, or a custom role stored as ADMIN) may enter;
    // what each can see/do inside is decided per-permission (nav + route guards).
    if (!isAdminRole(user?.role)) {
      throw redirect({ to: "/dashboard" });
    }
    // Bare /admin lands on the dashboard.
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  pendingComponent: SplashScreen,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
