import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { durationPlans } from "@/data/plans";
import { FEATURE_CATALOG } from "@/data/features";

/**
 * Single source of truth for subscription plans + the free trial. The admin
 * plan pages, the public pricing page, the in-app subscription/upgrade screens
 * all read from here — change a price once and it changes everywhere.
 */

export interface PlanBullet {
  id: string;
  text: string;
  included: boolean;
}

export interface CatalogSelection {
  included: boolean;
  limit?: number; // -1 = unlimited
}

export interface Plan {
  id: string;
  name: string;
  price: number; // GHS
  durationDays: number;
  durationLabel: string;
  badgeLabel: string;
  sortOrder: number;
  active: boolean;
  subscribers: number;
  isTrial?: boolean;
  trialDays?: number;
  questionCap?: number;
  bullets: PlanBullet[];
  catalogFeatures: Record<string, CatalogSelection>;
}

const subscribersByPlan: Record<string, number> = { monthly: 312, q3: 248, h6: 421, y12: 273 };

function defaultCatalog(included: boolean): Record<string, CatalogSelection> {
  return Object.fromEntries(
    FEATURE_CATALOG.map((f) => [
      f.key,
      {
        included: f.type === "boolean" ? included : true,
        limit: f.type === "limit" ? (f.defaultLimit ?? -1) : undefined,
      },
    ]),
  );
}

// Distinct feature mix per plan so the cards genuinely differ — longer plans
// unlock more (leaderboard, multi-device, priority support, savings).
const PLAN_BULLETS: Record<string, string[]> = {
  monthly: [
    "Full access to every question bank",
    "Clinical breakdowns on every answer",
    "Performance analytics dashboard",
    "Single device",
  ],
  q3: [
    "Everything in Monthly",
    "Leaderboard & percentile ranking",
    "2 devices",
    "Save 7% vs monthly",
  ],
  h6: ["Everything in 3-Month", "Priority email support", "3 devices", "Save 19% vs monthly"],
  y12: [
    "Everything in 6-Month",
    "Unlimited devices",
    "Early access to new banks",
    "Save 35% vs monthly",
  ],
};

const PLAN_CATALOG: Record<string, Record<string, CatalogSelection>> = {
  monthly: {
    ...defaultCatalog(true),
    leaderboard: { included: false },
    multi_device: { included: false },
    priority_support: { included: false },
    max_devices: { included: true, limit: 1 },
  },
  q3: {
    ...defaultCatalog(true),
    priority_support: { included: false },
    multi_device: { included: true },
    max_devices: { included: true, limit: 2 },
  },
  h6: {
    ...defaultCatalog(true),
    multi_device: { included: true },
    max_devices: { included: true, limit: 3 },
  },
  y12: {
    ...defaultCatalog(true),
    multi_device: { included: true },
    max_devices: { included: true, limit: -1 },
  },
};

const seededPaid: Plan[] = durationPlans.map((p, i) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  durationDays: p.months * 30,
  durationLabel: p.durationLabel,
  badgeLabel: p.badge?.label ?? "",
  sortOrder: i,
  active: true,
  subscribers: subscribersByPlan[p.id] ?? 0,
  bullets: (PLAN_BULLETS[p.id] ?? p.features).map((text, j) => ({
    id: `${p.id}-b${j}`,
    text,
    included: true,
  })),
  catalogFeatures: PLAN_CATALOG[p.id] ?? defaultCatalog(true),
}));

const seededTrial: Plan = {
  id: "trial",
  name: "Free Trial",
  price: 0,
  durationDays: 7,
  durationLabel: "7 days free",
  badgeLabel: "No card required",
  sortOrder: -1,
  active: true,
  subscribers: 912,
  isTrial: true,
  trialDays: 7,
  questionCap: 10,
  bullets: [
    { id: "t-b0", text: "Sample question bank access", included: true },
    { id: "t-b1", text: "Clinical breakdowns", included: true },
    { id: "t-b2", text: "Full analytics & leaderboard", included: false },
    { id: "t-b3", text: "Single device only", included: true },
  ],
  catalogFeatures: {
    ...defaultCatalog(false),
    ai_breakdowns: { included: true },
    question_limit: { included: true, limit: 10 },
    max_devices: { included: true, limit: 1 },
  },
};

interface PlansState {
  plans: Plan[];
  upsert: (plan: Plan) => void;
  remove: (id: string) => void;
  toggleActive: (id: string) => void;
  getById: (id: string) => Plan | undefined;
}

export const usePlansStore = create<PlansState>()(
  persist(
    (set, get) => ({
      plans: [seededTrial, ...seededPaid],
      upsert: (plan) =>
        set((s) => {
          const exists = s.plans.some((p) => p.id === plan.id);
          return {
            plans: exists ? s.plans.map((p) => (p.id === plan.id ? plan : p)) : [...s.plans, plan],
          };
        }),
      remove: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      toggleActive: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        })),
      getById: (id) => get().plans.find((p) => p.id === id),
    }),
    { name: "medinova-plans-v2", version: 1 },
  ),
);

/**
 * Active paid plans, sorted — the canonical list for pricing surfaces.
 * Wrapped in `useShallow` so the derived array's identity is stable across
 * renders (a raw filter/sort selector would loop under zustand v5's
 * useSyncExternalStore). Always call these hooks, never a raw selector.
 */
export const usePaidPlans = () =>
  usePlansStore(
    useShallow((s) =>
      s.plans.filter((p) => !p.isTrial && p.active).sort((a, b) => a.sortOrder - b.sortOrder),
    ),
  );

export const useTrialPlan = () => usePlansStore((s) => s.plans.find((p) => p.isTrial));
