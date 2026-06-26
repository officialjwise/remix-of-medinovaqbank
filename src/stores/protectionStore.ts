import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminUsers } from "@/data/adminData";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProtectionEventType =
  | "screenshot_key" // PrintScreen pressed
  | "clipboard_copy" // copy/cut intercepted
  | "print_attempt" // Ctrl/Cmd+P or beforeprint
  | "devtools_open" // devtools heuristic
  | "tab_blur" // window/tab lost focus (possible snip)
  | "context_menu"; // right-click

export type ProtectionContext = "quiz_session" | "high_yield_note";

export interface ProtectionEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: ProtectionEventType;
  context: ProtectionContext;
  contextId: string;
  page?: number;
  ip: string;
  device: string;
  location: string;
  createdAt: string;
}

export type RestrictionStatus = "active" | "lifted" | "expired";

export interface Restriction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  strikes: number;
  restrictedAt: string;
  unlockAt: string;
  status: RestrictionStatus;
  manual?: boolean;
}

export interface ProtectionSettings {
  enabled: boolean;
  strikeThreshold: number;
  strikeWindowMin: number;
  lockoutHours: number;
  countedEvents: ProtectionEventType[];
}

export const EVENT_LABELS: Record<ProtectionEventType, string> = {
  screenshot_key: "Screenshot key (PrintScreen)",
  clipboard_copy: "Copy / cut attempt",
  print_attempt: "Print attempt",
  devtools_open: "DevTools opened",
  tab_blur: "Tab focus lost",
  context_menu: "Right-click",
};

export const ALL_EVENT_TYPES = Object.keys(EVENT_LABELS) as ProtectionEventType[];

const DEFAULT_SETTINGS: ProtectionSettings = {
  enabled: true,
  strikeThreshold: 3,
  strikeWindowMin: 60,
  lockoutHours: 24,
  countedEvents: ["screenshot_key", "clipboard_copy", "print_attempt", "devtools_open"],
};

/* ------------------------------------------------------------------ */
/* Seed (so the audit tab / restrictions page have data)               */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

const SEED_EVENTS: ProtectionEvent[] = (() => {
  const rnd = seeded(7777);
  const types = ALL_EVENT_TYPES;
  const ctx: ProtectionContext[] = ["quiz_session", "high_yield_note"];
  return Array.from({ length: 40 }, (_, i) => {
    const u = adminUsers[Math.floor(rnd() * adminUsers.length)];
    const c = ctx[Math.floor(rnd() * ctx.length)];
    return {
      id: `pe-${9000 + i}`,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      type: types[Math.floor(rnd() * types.length)],
      context: c,
      contextId:
        c === "quiz_session"
          ? `qs-${8000 + Math.floor(rnd() * 50)}`
          : `note-${1 + Math.floor(rnd() * 6)}`,
      page: c === "high_yield_note" ? 1 + Math.floor(rnd() * 12) : undefined,
      ip: `${10 + Math.floor(rnd() * 240)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`,
      device: u.device,
      location: `${u.city}, ${u.country}`,
      createdAt: ago(Math.floor(rnd() * 7200)),
    };
  });
})();

const SEED_RESTRICTIONS: Restriction[] = (() => {
  const rnd = seeded(13);
  return Array.from({ length: 5 }, (_, i) => {
    const u = adminUsers[Math.floor(rnd() * adminUsers.length)];
    const active = i < 2;
    const restrictedAt = ago(
      active ? 120 + Math.floor(rnd() * 600) : 4000 + Math.floor(rnd() * 4000),
    );
    const unlockAt = new Date(new Date(restrictedAt).getTime() + 24 * 3600_000).toISOString();
    return {
      id: `rst-${100 + i}`,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      reason: "3 screen-capture attempts within the strike window",
      strikes: 3,
      restrictedAt,
      unlockAt,
      status: active ? "active" : i % 2 === 0 ? "expired" : "lifted",
      manual: false,
    } as Restriction;
  });
})();

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface ReportInput {
  type: ProtectionEventType;
  context: ProtectionContext;
  contextId: string;
  page?: number;
  user: { id: string; name: string; email: string };
}

interface ProtectionState {
  settings: ProtectionSettings;
  events: ProtectionEvent[];
  restrictions: Restriction[];
  updateSettings: (patch: Partial<ProtectionSettings>) => void;
  /** Records an event, applies strike logic, returns the active restriction if now restricted. */
  reportEvent: (input: ReportInput) => Restriction | null;
  getActiveRestriction: (userId: string) => Restriction | null;
  violationCount: (userId: string) => number;
  eventsForUser: (userId: string) => ProtectionEvent[];
  liftRestriction: (id: string) => void;
  manualRestrict: (input: {
    userId: string;
    userName: string;
    userEmail: string;
    reason: string;
    hours: number;
  }) => void;
}

function deviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : "Unknown OS";
  return `${browser} on ${os}`;
}

/** Expire active restrictions whose unlockAt has passed (lazy, on read). */
function withExpired(restrictions: Restriction[]): Restriction[] {
  const now = Date.now();
  let changed = false;
  const next = restrictions.map((r) => {
    if (r.status === "active" && new Date(r.unlockAt).getTime() <= now) {
      changed = true;
      return { ...r, status: "expired" as RestrictionStatus };
    }
    return r;
  });
  return changed ? next : restrictions;
}

export const useProtectionStore = create<ProtectionState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      events: SEED_EVENTS,
      restrictions: SEED_RESTRICTIONS,

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      reportEvent: ({ type, context, contextId, page, user }) => {
        const { settings } = get();
        const event: ProtectionEvent = {
          id: `pe-${Date.now().toString(36)}-${Math.floor(performance.now())}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          type,
          context,
          contextId,
          page,
          ip: "—",
          device: deviceLabel(),
          location: "—",
          createdAt: new Date().toISOString(),
        };

        let createdRestriction: Restriction | null = null;
        set((s) => {
          const events = [event, ...s.events];
          let restrictions = withExpired(s.restrictions);

          // Already restricted? keep it.
          const existing = restrictions.find((r) => r.userId === user.id && r.status === "active");
          if (existing) {
            createdRestriction = existing;
            return { events, restrictions };
          }

          if (settings.enabled && settings.countedEvents.includes(type)) {
            const windowStart = Date.now() - settings.strikeWindowMin * 60_000;
            const strikes = events.filter(
              (e) =>
                e.userId === user.id &&
                settings.countedEvents.includes(e.type) &&
                new Date(e.createdAt).getTime() >= windowStart,
            ).length;

            if (strikes >= settings.strikeThreshold) {
              const now = new Date();
              createdRestriction = {
                id: `rst-${Date.now().toString(36)}`,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                reason: `${strikes} flagged capture attempts within ${settings.strikeWindowMin} minutes`,
                strikes,
                restrictedAt: now.toISOString(),
                unlockAt: new Date(now.getTime() + settings.lockoutHours * 3600_000).toISOString(),
                status: "active",
              };
              restrictions = [createdRestriction, ...restrictions];
            }
          }
          return { events, restrictions };
        });
        return createdRestriction;
      },

      getActiveRestriction: (userId) => {
        const restrictions = withExpired(get().restrictions);
        if (restrictions !== get().restrictions) set({ restrictions });
        return restrictions.find((r) => r.userId === userId && r.status === "active") ?? null;
      },

      violationCount: (userId) => get().events.filter((e) => e.userId === userId).length,
      eventsForUser: (userId) => get().events.filter((e) => e.userId === userId),

      liftRestriction: (id) =>
        set((s) => ({
          restrictions: s.restrictions.map((r) => (r.id === id ? { ...r, status: "lifted" } : r)),
        })),

      manualRestrict: ({ userId, userName, userEmail, reason, hours }) =>
        set((s) => {
          const now = new Date();
          const restriction: Restriction = {
            id: `rst-${Date.now().toString(36)}`,
            userId,
            userName,
            userEmail,
            reason,
            strikes: 0,
            restrictedAt: now.toISOString(),
            unlockAt: new Date(now.getTime() + hours * 3600_000).toISOString(),
            status: "active",
            manual: true,
          };
          // supersede any existing active restriction
          const restrictions = s.restrictions.map((r) =>
            r.userId === userId && r.status === "active"
              ? { ...r, status: "lifted" as RestrictionStatus }
              : r,
          );
          return { restrictions: [restriction, ...restrictions] };
        }),
    }),
    { name: "medinova-protection", version: 1 },
  ),
);
