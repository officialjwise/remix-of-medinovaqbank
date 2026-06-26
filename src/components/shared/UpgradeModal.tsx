import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useUpgradeModal } from "@/stores/upgradeModalStore";

const PERKS = [
  "Full access to every question bank",
  "Detailed AI clinical breakdowns",
  "Gaussian percentile & performance analytics",
  "Leaderboard competition & multi-device access",
];

/** Rendered once near the app root. Surfaced by any trial-gated feature. */
export function UpgradeModal() {
  const { open, title, body, close } = useUpgradeModal();
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-primary to-accent px-6 py-7 text-white">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-sm text-white/90">{body}</p>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Every plan includes
          </p>
          <ul className="mt-3 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              close();
              navigate({ to: "/subscription" });
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
          >
            View plans & upgrade <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={close}
            className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-surface-alt"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
