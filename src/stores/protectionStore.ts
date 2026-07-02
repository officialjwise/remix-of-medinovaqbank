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
  | "screenshot_key" // PrintScreen / Mac ⌘⇧3 / ⌘⇧4
  | "screen_recording" // Mac ⌘⇧5 (screen recording)
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
  screenshot_key: "Screenshot key (PrintScreen / ⌘⇧3 / ⌘⇧4)",
  screen_recording: "Screen recording (⌘⇧5)",
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
  // devtools_open intentionally excluded — the browser heuristic false-fires on
  // zoom/resize/sidebars; it's no longer detected client-side.
  countedEvents: ["screenshot_key", "clipboard_copy", "print_attempt"],
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
    {
      name: "medinova-protection",
      version: 3,
      // Merge persisted settings over defaults so newly-added fields (e.g. new
      // event types) always have a value and old versions hydrate cleanly.
      // Also drop the retired `devtools_open` event from any persisted config.
      migrate: (persisted) => {
        const prev = (persisted as Partial<ProtectionState> | null)?.settings;
        const merged = { ...DEFAULT_SETTINGS, ...(prev ?? {}) };
        merged.countedEvents = (merged.countedEvents ?? []).filter(
          (e) => e !== "devtools_open",
        );
        return { settings: merged } as ProtectionState;
      },
    },
  ),
);
