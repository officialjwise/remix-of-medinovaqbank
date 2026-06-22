import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Subscription, User } from "@/types";

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      subscription: null,
      login: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false, subscription: null }),
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
    }),
    { name: "medinova-auth" },
  ),
);
