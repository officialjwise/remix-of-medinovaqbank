import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { pricingPlans } from "@/data/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Medinovaqbank" },
      {
        name: "description",
        content:
          "Simple, fair pricing for medical exam preparation. Start with a free trial, upgrade when you're ready.",
      },
      { property: "og:title", content: "Pricing — Medinovaqbank" },
      {
        property: "og:description",
        content:
          "Simple, fair pricing for medical exam preparation. Start with a free trial.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pick a plan that fits your prep
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you're ready. Cancel any time.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !yearly
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                yearly
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {pricingPlans.map((p) => {
            const price = yearly ? p.priceYearly : p.priceMonthly;
            const isFree = price === 0;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  p.popular
                    ? "border-accent bg-surface shadow-[var(--shadow-card-hover)]"
                    : "border-border bg-surface shadow-[var(--shadow-card)]"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {isFree ? (
                    <span className="text-4xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {p.currency}
                      </span>
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {yearly ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={p.id === "starter" ? "/signup" : "/signup"}
                  className={`mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    p.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary-light"
                      : "border border-border bg-surface text-foreground hover:bg-surface-alt"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in Ghana Cedis (GHS). Other currencies supported at checkout.
        </p>
      </section>

      <PublicFooter />
    </div>
  );
}
