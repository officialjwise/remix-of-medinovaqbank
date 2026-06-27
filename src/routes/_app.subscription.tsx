import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, Clock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTrial } from "@/hooks/useTrial";
import { type DurationPlan } from "@/data/plans";
import { usePaidPlans, type Plan } from "@/api/plans.api";
import { PaystackCheckoutModal } from "@/components/payments/PaystackCheckoutModal";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({
    meta: [{ title: "Subscription — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: SubscriptionPage,
});

const paymentHistory = [
  {
    date: "2025-12-15",
    plan: "3 Months Access",
    amount: 299,
    ref: "PSK-9F2A1B",
    status: "Successful",
  },
  { date: "2025-09-15", plan: "Monthly", amount: 129, ref: "PSK-7C8E33", status: "Successful" },
  { date: "2025-08-15", plan: "Monthly", amount: 129, ref: "PSK-5D1F22", status: "Successful" },
];

/** Map a backend Plan to the DurationPlan shape the Paystack modal expects. */
function toDurationPlan(p: Plan): DurationPlan {
  const months = Math.max(1, Math.round(p.durationDays / 30));
  const features = p.bullets.filter((b) => b.included).map((b) => b.text);
  return {
    id: p.planKey as unknown as DurationPlan["id"],
    name: p.name,
    durationLabel: p.durationLabel,
    months,
    price: p.price,
    currency: "GHS",
    perMonth: Math.round(p.price / months),
    features,
    cta: "Subscribe",
  };
}

function SubscriptionPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const isActive = subscription?.status === "ACTIVE";
  const { isTrial, daysLeft, questionsLeft, questionsTotal } = useTrial();
  const { data: paidPlans = [] } = usePaidPlans();
  const [checkoutPlan, setCheckoutPlan] = useState<DurationPlan | null>(null);

  const renewsLabel = subscription?.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

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
                {subscription?.planName ?? "Active plan"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Renews <span className="font-semibold text-foreground">{renewsLabel}</span>
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
                  ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} and ${questionsLeft}/${questionsTotal} questions left`
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

      {/* Plans (live from admin-defined store) */}
      <section id="plans" className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {isActive ? "Renew or upgrade" : "Choose a plan"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paidPlans.map((p) => {
            const featured = !!p.badgeLabel;
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
                  onClick={() => setCheckoutPlan(toDurationPlan(p))}
                  className={`mt-4 inline-flex h-9 items-center justify-center rounded-lg text-xs font-semibold ${featured ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border border-border bg-surface text-foreground hover:bg-surface-alt"}`}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {isActive ? "Switch Plan" : "Subscribe"}
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

      {/* Payment history */}
      <section className="mt-10 rounded-2xl border border-border bg-surface">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Payment History</h2>
        </header>
        <div>
          <div className="hidden grid-cols-[120px_1fr_100px_140px_120px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Date</span>
            <span>Plan</span>
            <span className="text-right">Amount</span>
            <span>Reference</span>
            <span>Status</span>
          </div>
          {paymentHistory.map((p) => (
            <div
              key={p.ref}
              className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[120px_1fr_100px_140px_120px] md:items-center md:gap-4"
            >
              <span className="text-sm text-muted-foreground">
                {new Date(p.date).toLocaleDateString()}
              </span>
              <span className="text-sm font-semibold text-foreground">{p.plan}</span>
              <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">
                GHS {p.amount}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{p.ref}</span>
              <span>
                <span className="inline-flex rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
                  {p.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <PaystackCheckoutModal
        plan={checkoutPlan}
        open={checkoutPlan !== null}
        onClose={() => setCheckoutPlan(null)}
      />
    </div>
  );
}
