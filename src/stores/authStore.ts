import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Subscription, User } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { deviceLabel } from "@/lib/trial";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  subscription: Subscription | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setSubscription: (s: Subscription) => void;
}

/** Build a fresh trial subscription using the admin-configured trial policy. */
function buildTrial(): Subscription {
  const { trialDays, trialQuestionLimit } = useSettingsStore.getState().settings.general;
  const now = new Date();
  const ends = new Date(now.getTime() + trialDays * 86_400_000);
  return {
    status: "TRIAL",
    trialQuestionsLeft: trialQuestionLimit,
    trialQuestionsTotal: trialQuestionLimit,
    trialStartedAt: now.toISOString(),
    trialEndsAt: ends.toISOString(),
    boundDevice: deviceLabel(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      subscription: null,
      login: (accessToken, user) =>
        set({
          accessToken,
          user,
          isAuthenticated: true,
          subscription: user.role === "USER" ? buildTrial() : null,
        }),
      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false, subscription: null }),
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
    }),
    { name: "medinova-auth" },
  ),
);

import { useState, useEffect } from "react";

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return () => {
      unsubFinishHydration();
    };
  }, []);
  return hydrated;
}
