import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useContentProtection } from "@/hooks/useContentProtection";
import { AccessRestricted } from "@/components/shared/AccessRestricted";
import type { ProtectionContext } from "@/stores/protectionStore";

/**
 * Wraps protected content (notes reader, quiz session). Applies the content
 * protection hook, blurs on focus-loss / PrintScreen, and swaps in the
 * restriction screen if the user is locked out. Honest by design — this is
 * deterrence + detection, not guaranteed prevention. (Per client request the
 * diagonal per-user watermark overlay was removed; the subtle "Protected"
 * badge sits bottom-left so it never covers the flag/bookmark controls.)
 */
export function ProtectedSurface({
  context,
  contextId,
  page,
  children,
  className = "",
  showBadge = true,
}: {
  context: ProtectionContext;
  contextId: string;
  page?: number;
  children: ReactNode;
  className?: string;
  showBadge?: boolean;
}) {
  const { ref, blurred, restriction } = useContentProtection({ context, contextId, page });

  if (restriction) return <AccessRestricted restriction={restriction} />;

  return (
    <div
      ref={ref}
      className={`relative select-none ${className}`}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Protected content (blurred when the tab loses focus / on PrintScreen) */}
      <div
        className={`transition-[filter] duration-150 ${blurred ? "pointer-events-none blur-xl" : ""}`}
      >
        {children}
      </div>

      {/* Capture-blur shield message */}
      {blurred && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="rounded-xl border border-warning/30 bg-surface px-4 py-3 text-center shadow-lg">
            <p className="text-sm font-bold text-foreground">Protected content hidden</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Return focus to this tab to continue.
            </p>
          </div>
        </div>
      )}

      {showBadge && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-20 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground backdrop-blur">
          <ShieldCheck className="h-3 w-3 text-accent" /> Protected · logged
        </div>
      )}
    </div>
  );
}
