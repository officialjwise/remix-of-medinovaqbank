import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";

import { SplashScreen } from "@/components/layout/SplashScreen";
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
  const navigate = Route.useNavigate();
  const fingerprint = useDeviceFingerprint();

  useEffect(() => {
    if (user?.role === "USER" && subscription?.status === "TRIAL" && fingerprint) {
      if (user.deviceFingerprint && user.deviceFingerprint !== fingerprint) {
        if (window.location.pathname !== "/sessions/active") {
          navigate({ to: "/sessions/active" });
        }
      } else if (!user.deviceFingerprint) {
        setUser({ ...user, deviceFingerprint: fingerprint });
      }
    }
  }, [user, subscription, fingerprint, navigate]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
