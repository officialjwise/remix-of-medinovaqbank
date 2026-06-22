import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/_admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/admin/login" });
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
