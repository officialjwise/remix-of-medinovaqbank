import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export type NotifAudience = "admin" | "user";
export type NotifType =
  | "signup"
  | "payment_failed"
  | "payment_success"
  | "flagged_question"
  | "suspicious_login"
  | "api_error"
  | "subscription"
  | "trial"
  | "rank"
  | "new_bank"
  | "achievement";

export interface AppNotification {
  id: string;
  audience: NotifAudience;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** Optional deep-link target within the app. */
  href?: string;
}

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

const SEED: AppNotification[] = [
  // Admin
  {
    id: "an1",
    audience: "admin",
    type: "signup",
    title: "32 new signups today",
    body: "New accounts created in the last 24 hours.",
    createdAt: ago(8),
    read: false,
    href: "/admin/users",
  },
  {
    id: "an2",
    audience: "admin",
    type: "payment_failed",
    title: "Payment failed",
    body: "A 12-Month charge failed for kofi.adu12@example.com.",
    createdAt: ago(54),
    read: false,
    href: "/admin/transactions",
  },
  {
    id: "an3",
    audience: "admin",
    type: "flagged_question",
    title: "Question flagged",
    body: "Q-1421 in Surgery Core was flagged for review.",
    createdAt: ago(150),
    read: false,
    href: "/admin/flags",
  },
  {
    id: "an4",
    audience: "admin",
    type: "suspicious_login",
    title: "Suspicious login",
    body: "akua.mensah@example.com signed in from a new device in Lagos.",
    createdAt: ago(220),
    read: false,
    href: "/admin/sessions",
  },
  {
    id: "an5",
    audience: "admin",
    type: "api_error",
    title: "Gemini quota at 80%",
    body: "Monthly AI quota is approaching its limit.",
    createdAt: ago(700),
    read: true,
    href: "/admin/settings/system",
  },
  {
    id: "an6",
    audience: "admin",
    type: "subscription",
    title: "New 12-Month subscription",
    body: "Ama Owusu subscribed to the 12-Month plan.",
    createdAt: ago(900),
    read: true,
    href: "/admin/subscriptions",
  },
  // User
  {
    id: "un1",
    audience: "user",
    type: "trial",
    title: "Trial expiring soon",
    body: "Your free trial ends in 5 days. Upgrade to keep your progress.",
    createdAt: ago(120),
    read: false,
    href: "/subscription",
  },
  {
    id: "un2",
    audience: "user",
    type: "new_bank",
    title: "New question bank added",
    body: "Emergency Medicine is now available to practise.",
    createdAt: ago(1440),
    read: false,
    href: "/banks",
  },
  {
    id: "un3",
    audience: "user",
    type: "achievement",
    title: "Achievement unlocked 🏆",
    body: "You completed a 7-day study streak.",
    createdAt: ago(4320),
    read: true,
    href: "/leaderboard",
  },
  {
    id: "un4",
    audience: "user",
    type: "rank",
    title: "You climbed to #142",
    body: "You moved up 8 places on the leaderboard this week.",
    createdAt: ago(6000),
    read: true,
    href: "/leaderboard",
  },
];

interface NotificationsState {
  items: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: (audience: NotifAudience) => void;
  remove: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: SEED,
      markRead: (id) =>
        set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: (audience) =>
        set((s) => ({
          items: s.items.map((n) => (n.audience === audience ? { ...n, read: true } : n)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
    }),
    { name: "medinova-notifications", version: 1 },
  ),
);

/**
 * Notifications for an audience, newest first. Wrapped in `useShallow` so the
 * derived array identity is stable across renders (a raw filter/sort selector
 * loops under zustand v5). Always use this hook.
 */
export const useNotificationsByAudience = (audience: NotifAudience) =>
  useNotificationsStore(
    useShallow((s) =>
      s.items
        .filter((n) => n.audience === audience)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  );
