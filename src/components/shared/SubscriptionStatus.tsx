import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { useTrial } from "@/hooks/useTrial";

/** Compact subscription/trial chip for the header. Clickable → subscription. */
export function SubscriptionChip() {
  const { isTrial, daysLeft, questionsLeft, expired, subscription } = useTrial();

  if (subscription?.status === "ACTIVE") {
    const renews = subscription.renewsAt
      ? new Date(subscription.renewsAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
      : "active";
    return (
      <Link
        to="/subscription"
        className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success transition hover:bg-success/15 sm:inline-flex"
      >
        <Crown className="h-3.5 w-3.5" />
        {subscription.planName ? `${subscription.planName} — ${renews}` : `Pro — ${renews}`}
      </Link>
    );
  }

  if (isTrial) {
    const tone = expired
      ? "border-error/30 bg-error/10 text-error hover:bg-error/15"
      : daysLeft <= 2
        ? "border-warning/40 bg-warning/15 text-warning hover:bg-warning/20"
        : "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15";
    return (
      <Link
        to="/subscription"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${tone}`}
      >
        {expired ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {expired ? "Trial ended" : `Trial: ${daysLeft}d · ${questionsLeft} Qs`}
      </Link>
    );
  }

  return (
    <Link
      to="/subscription"
      className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground sm:inline-flex"
    >
      <Sparkles className="h-3.5 w-3.5" /> Subscribe
    </Link>
  );
}

/** Persistent trial banner shown above page content for trial users. */
export function TrialBanner() {
  const { isTrial, daysLeft, questionsLeft, expired } = useTrial();
  if (!isTrial) return null;

  if (expired) {
    return (
      <div className="mb-5 flex flex-col items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-error/15 text-error">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Your free trial has ended</p>
          <p className="text-xs text-muted-foreground">Subscribe to unlock the full library, analytics, and multi-device access.</p>
        </div>
        <Link
          to="/subscription"
          className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-sm hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> Upgrade now
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-col items-start gap-3 rounded-xl border border-warning/30 bg-gradient-to-r from-warning/10 to-accent/5 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
        <Clock className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">
          Free Trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} and {questionsLeft} questions remaining
        </p>
        <p className="text-xs text-muted-foreground">Upgrade to unlock every bank, full analytics, the leaderboard, and access from any device.</p>
      </div>
      <Link
        to="/subscription"
        className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-sm hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> Upgrade
      </Link>
    </div>
  );
}
