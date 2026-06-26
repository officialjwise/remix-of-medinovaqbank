import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  useProtectionStore,
  type ProtectionContext,
  type ProtectionEventType,
  type Restriction,
} from "@/stores/protectionStore";

interface Options {
  context: ProtectionContext;
  contextId: string;
  page?: number;
}

/**
 * Best-effort content protection (deterrence + detection, NOT guaranteed
 * prevention — you can't truly block OS screenshots from a browser). Disables
 * the easy copy paths, detects what the browser can observe, blurs on
 * focus-loss / PrintScreen, and reports every attempt to the backend (mock
 * store) which applies the admin-configured strike → lockout policy.
 *
 * Returns a `ref` to attach to the protected element, a `blurred` flag, and the
 * active `restriction` (if the user is/has become restricted).
 */
export function useContentProtection({ context, contextId, page }: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const enabled = useProtectionStore((s) => s.settings.enabled);
  const reportEvent = useProtectionStore((s) => s.reportEvent);
  const getActiveRestriction = useProtectionStore((s) => s.getActiveRestriction);

  const [blurred, setBlurred] = useState(false);
  const [restriction, setRestriction] = useState<Restriction | null>(null);

  const lastByType = useRef<Record<string, number>>({});
  const lastToast = useRef(0);
  const devtoolsReported = useRef(false);

  // Reflect any existing restriction immediately on mount.
  useEffect(() => {
    if (user) setRestriction(getActiveRestriction(user.id));
  }, [user, getActiveRestriction]);

  const report = useCallback(
    (type: ProtectionEventType) => {
      if (!user) return;
      const now = Date.now();
      if (now - (lastByType.current[type] ?? 0) < 2500) return; // throttle identical events
      lastByType.current[type] = now;

      const r = reportEvent({ type, context, contextId, page, user });
      if (r) setRestriction(r);

      if (now - lastToast.current > 4000) {
        lastToast.current = now;
        toast.warning("Screen capture is not permitted", {
          description: "This attempt has been logged and may restrict your account.",
        });
      }
    },
    [user, reportEvent, context, contextId, page],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const el = ref.current;

    const onContext = (e: Event) => { e.preventDefault(); report("context_menu"); };
    const onCopy = (e: Event) => { e.preventDefault(); report("clipboard_copy"); };

    const blurBriefly = () => {
      setBlurred(true);
      window.setTimeout(() => setBlurred(false), 1300);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") { blurBriefly(); report("screenshot_key"); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); report("print_attempt"); }
      // Block common save/devtools shortcuts on the surface.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") { blurBriefly(); report("screenshot_key"); }
    };
    const onBeforePrint = () => report("print_attempt");
    const onVisibility = () => {
      if (document.hidden) { setBlurred(true); report("tab_blur"); } else setBlurred(false);
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

    // Best-effort devtools heuristic — report once to avoid false lockouts.
    const dt = window.setInterval(() => {
      const gap = 170;
      const open = window.outerWidth - window.innerWidth > gap || window.outerHeight - window.innerHeight > gap;
      if (open && !devtoolsReported.current) {
        devtoolsReported.current = true;
        report("devtools_open");
      }
      if (!open) devtoolsReported.current = false;
    }, 1500);

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
      window.clearInterval(dt);
    };
  }, [enabled, report]);

  return { ref, blurred, restriction };
}
