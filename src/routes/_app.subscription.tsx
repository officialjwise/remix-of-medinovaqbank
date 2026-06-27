import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePaidPlans, type Plan } from "@/api/plans.api";
import {
  useSubscriptionStatus,
  usePaymentHistory,
  useInitializePayment,
  type PaymentTransactionView,
} from "@/api/payments.api";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({
    meta: [{ title: "Subscription — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: SubscriptionPage,
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function SubscriptionPage() {
  const { data: status } = useSubscriptionStatus();
  const { data: paidPlans = [] } = usePaidPlans();
  const { data: history = [], isLoading: historyLoading } = usePaymentHistory();
  const initialize = useInitializePayment();

  const [pendingPlanKey, setPendingPlanKey] = useState<string | null>(null);

  const isActive = status?.hasActiveSubscription ?? false;
  const isTrial = status?.isTrialActive ?? false;
  const trialDaysLeft = status?.trialDaysRemaining ?? 0;
  const questionsLeft = status?.trialQuestionsRemaining;
  const questionsTotal = status?.trialLimit;

  /** Initialize a real Paystack checkout and redirect to the authorization URL. */
  async function subscribe(plan: Plan) {
    setPendingPlanKey(plan.planKey);
    try {
      const res = await initialize.mutateAsync(plan.planKey);
      // Hand off to Paystack's hosted checkout; it returns to /payment/callback.
      window.location.href = res.authorizationUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start payment.";
      toast.error(message);
      setPendingPlanKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscription</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your plan, renewals, and payment history.
      </p>

      {/* Current plan / trial */}
      {isActive ? (
        <section className="mt-6 rounded-2xl border-2 border-success bg-success-light/40 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-6 w-6" />
            </span>
            <div className="min-w-[16rem] flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-success">
                Active Subscription
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {status?.planName ?? "Active plan"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Renews{" "}
                <span className="font-semibold text-foreground">{formatDate(status?.endDate)}</span>
                {typeof status?.daysRemaining === "number" && status.daysRemaining >= 0 && (
                  <>
                    {" "}
                    · <span className="font-semibold text-foreground">
                      {status.daysRemaining}
                    </span>{" "}
                    {status.daysRemaining === 1 ? "day" : "days"} left
                  </>
                )}
              </p>
            </div>
            <a
              href="#plans"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Upgrade / Renew
            </a>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border-2 border-warning bg-warning-light/40 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-white">
              <Clock className="h-6 w-6" />
            </span>
            <div className="min-w-[16rem] flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-warning">Free Trial</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {isTrial
                  ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"}${
                      questionsLeft != null && questionsTotal != null
                        ? ` and ${questionsLeft}/${questionsTotal} questions`
                        : ""
                    } left`
                  : "Subscribe to get started"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Subscribe to unlock every bank, full analytics, the leaderboard, and multi-device
                access.
              </p>
            </div>
            <a
              href="#plans"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              See Plans ↓
            </a>
          </div>
        </section>
      )}

      {/* Plans (live from admin-defined plans) */}
      <section id="plans" className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {isActive ? "Renew or upgrade" : "Choose a plan"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paidPlans.map((p) => {
            const featured = !!p.badgeLabel;
            const pending = pendingPlanKey === p.planKey;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-xl border bg-surface p-5 ${featured ? "border-2 border-accent shadow-[var(--shadow-card-hover)]" : "border-border shadow-[var(--shadow-card)]"}`}
              >
                {p.badgeLabel && (
                  <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                    {p.badgeLabel}
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {p.name}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  <span className="text-xs font-semibold text-muted-foreground">GHS </span>
                  {p.price.toLocaleString()}
                  <span className="text-xs font-medium text-muted-foreground">
                    {" "}
                    {p.durationLabel}
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {p.bullets
                    .filter((b) => b.included)
                    .slice(0, 4)
                    .map((b) => (
                      <li key={b.id} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                        <span>{b.text}</span>
                      </li>
                    ))}
                </ul>
                <button
                  type="button"
                  disabled={pending || initialize.isPending}
                  onClick={() => void subscribe(p)}
                  className={`mt-4 inline-flex h-9 items-center justify-center rounded-lg text-xs font-semibold disabled:opacity-60 ${featured ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border border-border bg-surface text-foreground hover:bg-surface-alt"}`}
                >
                  {pending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {pending ? "Redirecting…" : isActive ? "Switch Plan" : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Need to compare every feature?{" "}
          <Link to="/pricing" className="font-semibold text-accent hover:underline">
            View full pricing page
          </Link>
        </p>
      </section>

      {/* Payment history (live) */}
      <section className="mt-10 rounded-2xl border border-border bg-surface">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Payment History</h2>
        </header>
        <div>
          <div className="hidden grid-cols-[120px_1fr_100px_180px_120px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Date</span>
            <span>Plan</span>
            <span className="text-right">Amount</span>
            <span>Reference</span>
            <span>Status</span>
          </div>
          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payment history…
            </div>
          ) : history.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No payments yet. Subscribe to a plan to get started.
            </div>
          ) : (
            history.map((p) => <PaymentRow key={p.id} tx={p} />)
          )}
        </div>
      </section>
    </div>
  );
}

function PaymentRow({ tx }: { tx: PaymentTransactionView }) {
  const badgeClass =
    tx.status === "success"
      ? "bg-success-light text-success"
      : tx.status === "failed"
        ? "bg-error-light text-error"
        : "bg-warning-light text-warning";
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[120px_1fr_100px_180px_120px] md:items-center md:gap-4">
      <span className="text-sm text-muted-foreground">
        {new Date(tx.createdAt).toLocaleDateString()}
      </span>
      <span className="text-sm font-semibold text-foreground">{tx.planName}</span>
      <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">
        {tx.currency} {tx.amount.toLocaleString()}
      </span>
      <span className="truncate font-mono text-xs text-muted-foreground">{tx.reference}</span>
      <span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
        >
          {tx.statusLabel}
        </span>
      </span>
    </div>
  );
}
