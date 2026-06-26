import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { durationPlans, type DurationPlan } from "@/data/plans";
import { PaystackCheckoutModal } from "@/components/payments/PaystackCheckoutModal";
import { useAuthStore } from "@/stores/authStore";
import { usePaidPlans, useTrialPlan, type Plan } from "@/stores/plansStore";
import { useCmsStore } from "@/stores/cmsStore";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Medinovaqbank" },
      {
        name: "description",
        content:
          "Flexible plans for every medical professional. Start with 10 free questions — no credit card required. GHS 129/month, GHS 799/year.",
      },
      { property: "og:title", content: "Pricing — Medinovaqbank" },
      {
        property: "og:description",
        content: "Flexible plans for every medical professional. Start with 10 free questions.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const paid = usePaidPlans();
  const trial = useTrialPlan();
  const { cms } = useCmsStore();
  const [checkoutPlan, setCheckoutPlan] = useState<DurationPlan | null>(null);

  // The checkout modal/payment flow needs the rich DurationPlan (months, currency,
  // perMonth). Store plan ids mirror durationPlans, so look it up by id.
  function startCheckout(plan: Plan) {
    const match = durationPlans.find((d) => d.id === plan.id);
    if (match) setCheckoutPlan(match);
  }

  const gridCols = paid.length >= 4 ? "lg:grid-cols-4" : paid.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="container-page pb-24 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Flexible Plans for Every Medical Professional
          </h1>
          <p className="mt-4 text-muted-foreground">
            {trial ? `Start with ${trial.questionCap ?? 10} free questions. No credit card required.` : "No credit card required to get started."}
          </p>
        </div>

        <div className={`mx-auto mt-14 grid max-w-7xl gap-6 sm:grid-cols-2 ${gridCols}`}>
          {paid.map((p) => (
            <PlanCard key={p.id} plan={p} isAuthenticated={isAuthenticated} onSubscribe={() => startCheckout(p)} />
          ))}
        </div>

        {/* Free trial callout — driven from the trial plan */}
        {trial && (
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-gradient-to-r from-accent to-[#008C82] p-6 text-center text-white shadow-[var(--shadow-card-hover)]">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">{trial.name} · {trial.durationLabel}</p>
            <p className="mt-2 text-base font-semibold">
              Not sure yet? Try {trial.questionCap ?? 10} free questions — {trial.badgeLabel || "no card required"}. Just sign in with Google.
            </p>
            <ul className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/90">
              {trial.bullets.filter((b) => b.included).map((b) => (
                <li key={b.id} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {b.text}
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-accent hover:bg-white/90"
            >
              Start Free Trial
            </Link>
          </div>
        )}

        {/* FAQ — from CMS */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
            {cms.faqs.map((f) => (
              <FaqItem key={f.id} q={f.question} a={f.answer} />
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />

      <PaystackCheckoutModal
        plan={checkoutPlan}
        open={checkoutPlan !== null}
        onClose={() => setCheckoutPlan(null)}
      />
    </div>
  );
}

function PlanCard({ plan, isAuthenticated, onSubscribe }: { plan: Plan; isAuthenticated: boolean; onSubscribe: () => void }) {
  const isPopular = plan.id === "q3";
  const includedBullets = plan.bullets.filter((b) => b.included);
  const perMonth = plan.durationDays > 0 ? Math.round(plan.price / (plan.durationDays / 30)) : plan.price;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-surface p-6 transition-all hover:-translate-y-0.5 ${
        isPopular ? "border-2 border-accent shadow-[var(--shadow-card-hover)]" : "border-border shadow-[var(--shadow-card)]"
      }`}
    >
      {plan.badgeLabel && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
          {plan.badgeLabel}
        </span>
      )}
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{plan.name}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-xs font-semibold text-muted-foreground">GHS</span>
        <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price.toLocaleString()}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{plan.durationLabel}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">≈ GHS {perMonth.toLocaleString()}/month</p>

      <ul className="mt-5 space-y-2.5 text-sm">
        {includedBullets.map((b) => (
          <li key={b.id} className="flex items-start gap-2 text-foreground">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>

      {isAuthenticated ? (
        <button
          type="button"
          onClick={onSubscribe}
          className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
            isPopular
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "border border-border bg-surface text-foreground hover:bg-surface-alt"
          }`}
        >
          Subscribe
        </button>
      ) : (
        <Link
          to="/login"
          className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
            isPopular
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "border border-border bg-surface text-foreground hover:bg-surface-alt"
          }`}
        >
          Subscribe
        </Link>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="flex w-full flex-col items-stretch px-5 py-4 text-left"
      aria-expanded={open}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
      {open && <span className="mt-2 text-sm text-muted-foreground">{a}</span>}
    </button>
  );
}
