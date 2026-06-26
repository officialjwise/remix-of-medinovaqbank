import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { Subscription, User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Server-sourced subscription/trial status (never fabricated client-side). */
  subscription: Subscription | null;
  /** Establish a session from a token pair + the user fetched via /auth/me. */
  login: (accessToken: string, refreshToken: string, user: User) => void;
  /** Rotate tokens (used by the client's refresh flow). */
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setSubscription: (s: Subscription | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      subscription: null,
      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          subscription: null,
        }),
    }),
    {
      name: "medinova-auth",
      // Persist identity + tokens only; subscription is always re-fetched.
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

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
