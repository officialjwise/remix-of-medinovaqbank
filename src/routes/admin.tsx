import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    // Login page is public.
    if (location.pathname === "/admin/login") return;
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/admin/login" });
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/dashboard" });
    }
    // Bare /admin lands on the dashboard.
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/admin/login") {
    return <Outlet />;
  }
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
