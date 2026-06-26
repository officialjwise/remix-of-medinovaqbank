import type { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useTrial } from "@/hooks/useTrial";
import { TRIAL_LOCKED_COPY } from "@/lib/trial";

/**
 * Wraps premium content. For trial users who don't have the feature, the
 * content is blurred and an elegant upsell overlay invites them to upgrade
 * (opening the global UpgradeModal) — never a hard error.
 */
export function FeatureLock({ featureKey, children }: { featureKey: string; children: ReactNode }) {
  const { can, requireFeature } = useTrial();

  if (can(featureKey)) return <>{children}</>;

  const copy = TRIAL_LOCKED_COPY[featureKey] ?? {
    title: "Premium feature",
    body: "Upgrade to unlock this on any paid plan.",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <button
        type="button"
        onClick={() => requireFeature(featureKey)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 p-6 text-center backdrop-blur-[2px] transition hover:bg-surface/60"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="h-6 w-6" />
        </span>
        <span className="text-base font-bold text-foreground">{copy.title}</span>
        <span className="max-w-sm text-sm text-muted-foreground">{copy.body}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4" /> Upgrade to unlock
        </span>
      </button>
    </div>
  );
}
