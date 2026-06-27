import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/**
 * Client-detectable protection events. These are what the BROWSER can observe
 * on a protected surface; they are reported to the backend, which owns all
 * strike/lockout policy (see `@/api/protection.api` reportEvent). No local
 * strike algorithm lives here anymore.
 */
export type ProtectionEventType =
  | "screenshot_key" // PrintScreen pressed
  | "clipboard_copy" // copy/cut intercepted
  | "print_attempt" // Ctrl/Cmd+P or beforeprint
  | "devtools_open" // devtools heuristic
  | "tab_blur" // window/tab lost focus (possible snip)
  | "context_menu"; // right-click

export type ProtectionContext = "quiz_session" | "high_yield_note";

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
/* Store — local protection configuration only.                        */
/* ------------------------------------------------------------------ */
/*
 * Runtime detection/reporting lives in `@/hooks/useContentProtection`, which
 * reports to the real backend; restriction status comes from the server
 * (`@/api/protection.api` useMyRestrictionStatus). This store holds only the
 * admin-facing local protection settings form state. No mock seed, no events,
 * no strike computation.
 */
interface ProtectionState {
  settings: ProtectionSettings;
  updateSettings: (patch: Partial<ProtectionSettings>) => void;
}

export const useProtectionStore = create<ProtectionState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: "medinova-protection", version: 2 },
  ),
);
