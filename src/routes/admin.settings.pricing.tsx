import { createFileRoute, Link } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { ArrowRight } from "lucide-react";
import { useAdminPlans } from "@/api/plans.api";

export const Route = createFileRoute("/admin/settings/pricing")({
  beforeLoad: () => requirePermission("plans.read"),
  head: () => ({
    meta: [{ title: "Admin · Pricing — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPricing,
});

function AdminPricing() {
  const { data: plans = [] } = useAdminPlans();
  const paid = plans.filter((p) => !p.isTrial).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Pricing Plans</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Live subscription tiers and pricing in GHS. Edit pricing, duration, and features under{" "}
        <Link to="/admin/subscriptions/plans" className="font-semibold text-accent hover:underline">
          Subscription Plans
        </Link>
        .
      </p>

      <div className="mt-6 space-y-3">
        {paid.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_120px_120px_160px]"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {p.name}
              </p>
              <p className="text-sm font-semibold text-foreground">{p.durationLabel}</p>
            </div>
            <Field label="Price (GHS)">
              <input type="number" value={p.price} readOnly className="input bg-surface-alt" />
            </Field>
            <Field label="Duration (days)">
              <input
                type="number"
                value={p.durationDays}
                readOnly
                className="input cursor-not-allowed bg-surface-alt"
              />
            </Field>
            <div className="flex items-end">
              <Link
                to="/admin/subscriptions/plans/$planId/edit"
                params={{ planId: p.id }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
              >
                Edit plan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .input { display: block; width: 100%; height: 2.25rem; padding: 0 0.625rem; font-size: 0.875rem; color: var(--color-foreground); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; outline: none; }
        .input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-accent) 20%, transparent); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
