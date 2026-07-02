import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  useProtectionStore,
  type ProtectionContext,
  type ProtectionEventType,
} from "@/stores/protectionStore";
import {
  useReportProtectionEvent,
  useMyRestrictionStatus,
  type BackendProtectionEventType,
  type MyRestrictionStatus,
} from "@/api/protection.api";

interface Options {
  context: ProtectionContext;
  contextId: string;
  page?: number;
}

/**
 * Maps a client-detected event to the backend `ProtectionEventType` enum.
 * The browser observes a smaller set than the backend models; unmapped nuances
 * collapse to the closest backend type.
 */
const TO_BACKEND_EVENT: Record<ProtectionEventType, BackendProtectionEventType> = {
  screenshot_key: "screenshot_attempt",
  screen_recording: "screen_recording_suspected",
  clipboard_copy: "copy_attempt",
  print_attempt: "print_attempt",
  devtools_open: "devtools_open",
  tab_blur: "page_blur_during_protected",
  context_menu: "right_click",
};

/**
 * Per-event user-facing message. Only genuine capture/copy/print actions warn the
 * user — benign or ambiguous signals (tab blur, right-click) are still logged if
 * the admin counts them, but never accuse the user of "taking a screenshot".
 */
const TOAST_BY_TYPE: Partial<
  Record<ProtectionEventType, { title: string; description?: string }>
> = {
  screenshot_key: {
    title: "Screen capture isn't allowed here",
    description: "This attempt was logged and may restrict your account.",
  },
  screen_recording: {
    title: "Screen recording isn't allowed here",
    description: "This attempt was logged and may restrict your account.",
  },
  print_attempt: { title: "Printing is disabled for this content" },
  clipboard_copy: { title: "Copying is disabled for this content" },
  // tab_blur / context_menu: no toast — switching tabs or right-clicking must
  // never pop a "screenshot" warning.
};

/**
 * Best-effort content protection (deterrence + detection, NOT guaranteed
 * prevention — you can't truly block OS screenshots from a browser). Disables
 * the easy copy paths, detects what the browser can observe, blurs on
 * focus-loss / PrintScreen, and reports every attempt to the REAL backend
 * (`POST /protection/event`), which applies the admin-configured strike →
 * lockout policy. The active restriction is read authoritatively from the
 * server (`GET /users/me/restriction-status`).
 *
 * Returns a `ref` to attach to the protected element, a `blurred` flag, and the
 * active `restriction` (if the user is/has become restricted).
 */
export function useContentProtection({ context, contextId, page }: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const enabled = useProtectionStore((s) => s.settings.enabled);
  const countedEvents = useProtectionStore((s) => s.settings.countedEvents);

  const report = useReportProtectionEvent();
  const { data: status } = useMyRestrictionStatus(!!user);

  const restriction: MyRestrictionStatus | null = status?.restricted ? status : null;

  const [blurred, setBlurred] = useState(false);

  const lastByType = useRef<Record<string, number>>({});
  const lastToast = useRef(0);

  const reportMutate = report.mutate;
  const fire = useCallback(
    (type: ProtectionEventType) => {
      if (!user) return;
      // Respect the admin "counted events" config: a disabled event is neither
      // logged nor counted toward strikes.
      if (!countedEvents.includes(type)) return;
      const now = Date.now();
      if (now - (lastByType.current[type] ?? 0) < 2500) return; // throttle identical events
      lastByType.current[type] = now;

      reportMutate({
        eventType: TO_BACKEND_EVENT[type],
        context,
        contextId,
        pageNumber: page,
      });

      // Only warn for events that are actually the user's deliberate action, and
      // with wording that matches what happened (never a generic "screenshot").
      const message = TOAST_BY_TYPE[type];
      if (message && now - lastToast.current > 4000) {
        lastToast.current = now;
        toast.warning(
          message.title,
          message.description ? { description: message.description } : undefined,
        );
      }
    },
    [user, reportMutate, context, contextId, page, countedEvents],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const el = ref.current;

    // Only intercept events that are enabled in the admin "counted events"
    // config — a disabled event behaves normally and is never logged.
    const onContext = (e: Event) => {
      if (!countedEvents.includes("context_menu")) return;
      e.preventDefault();
      fire("context_menu");
    };
    const onCopy = (e: Event) => {
      if (!countedEvents.includes("clipboard_copy")) return;
      e.preventDefault();
      fire("clipboard_copy");
    };

    const blurBriefly = () => {
      setBlurred(true);
      window.setTimeout(() => setBlurred(false), 1300);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        blurBriefly();
        fire("screenshot_key");
      }
      // macOS screenshot/recording shortcuts: ⌘⇧3 (full), ⌘⇧4 (region),
      // ⌘⇧5 (screen recording). The OS may grab these, but keydown usually
      // still fires first — best-effort detection.
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) {
        blurBriefly();
        fire("screenshot_key");
      }
      if (e.metaKey && e.shiftKey && e.key === "5") {
        blurBriefly();
        fire("screen_recording");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        fire("print_attempt");
      }
      // Block common save/devtools shortcuts on the surface.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        blurBriefly();
        fire("screenshot_key");
      }
    };
    const onBeforePrint = () => fire("print_attempt");
    const onVisibility = () => {
      if (document.hidden) {
        setBlurred(true);
        fire("tab_blur");
      } else setBlurred(false);
    };
    const onWinBlur = () => setBlurred(true);
    const onWinFocus = () => setBlurred(false);

    el?.addEventListener("contextmenu", onContext);
    el?.addEventListener("copy", onCopy);
    el?.addEventListener("cut", onCopy);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("beforeprint", onBeforePrint);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onWinBlur);
    window.addEventListener("focus", onWinFocus);

    // NOTE: the old window-dimension DevTools heuristic was removed — it
    // false-fired on browser zoom, a docked sidebar, or resizing (accusing users
    // who did nothing). Browsers can't reliably detect DevTools anyway.

    return () => {
      el?.removeEventListener("contextmenu", onContext);
      el?.removeEventListener("copy", onCopy);
      el?.removeEventListener("cut", onCopy);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("beforeprint", onBeforePrint);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onWinBlur);
      window.removeEventListener("focus", onWinFocus);
    };
  }, [enabled, fire, countedEvents]);

  return { ref, blurred, restriction };
}
