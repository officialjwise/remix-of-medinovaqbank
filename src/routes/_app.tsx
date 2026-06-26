import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { authApi } from "@/api/auth.api";

import { SplashScreen } from "@/components/layout/SplashScreen";
import { MaintenanceScreen } from "@/components/layout/MaintenanceScreen";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useEffect } from "react";
export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    if (!useAuthStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useAuthStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  pendingComponent: SplashScreen,
  component: AppLayout,
});

function AppLayout() {
  const { user, subscription, setUser } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSubscription = useAuthStore((s) => s.setSubscription);
  const deviceBinding = useSettingsStore((s) => s.settings.trial.deviceBinding);
  const maintenanceMode = useSettingsStore((s) => s.settings.general.maintenanceMode);
  const navigate = Route.useNavigate();
  const fingerprint = useDeviceFingerprint();

  // Authoritative subscription/trial status from the server (never fabricated).
  const { data: fetchedSubscription } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: authApi.getSubscription,
    enabled: isAuthenticated,
  });
  useEffect(() => {
    if (fetchedSubscription) setSubscription(fetchedSubscription);
  }, [fetchedSubscription, setSubscription]);

  // When maintenance mode is on, non-admins see the maintenance page.
  const isAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    // Device binding only applies to trial users, and only when the admin policy is on.
    if (deviceBinding && user?.role === "USER" && subscription?.status === "TRIAL" && fingerprint) {
      if (user.deviceFingerprint && user.deviceFingerprint !== fingerprint) {
        if (window.location.pathname !== "/sessions/active") {
          navigate({ to: "/sessions/active" });
        }
      } else if (!user.deviceFingerprint) {
        setUser({ ...user, deviceFingerprint: fingerprint });
      }
    }
  }, [user, subscription, fingerprint, navigate, deviceBinding]);

  if (maintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
