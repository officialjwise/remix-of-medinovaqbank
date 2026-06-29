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
  /** Effective RBAC permission keys (from /auth/me) — drives permission UI. */
  permissions: string[];
  /** Establish a session from a token pair + the user/permissions from /auth/me. */
  login: (accessToken: string, refreshToken: string, user: User, permissions?: string[]) => void;
  /** Rotate tokens (used by the client's refresh flow). */
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setPermissions: (permissions: string[]) => void;
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
      permissions: [],
      login: (accessToken, refreshToken, user, permissions = []) =>
        set({ accessToken, refreshToken, user, permissions, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setPermissions: (permissions) => set({ permissions }),
      setSubscription: (subscription) => set({ subscription }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          subscription: null,
          permissions: [],
        }),
    }),
    {
      name: "medinova-auth",
      // Persist identity + tokens + permissions so permission-gated UI renders
      // correctly on first paint (before /auth/me re-fetch); subscription is
      // always re-fetched.
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
        permissions: s.permissions,
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
