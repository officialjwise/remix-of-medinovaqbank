import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { Check, Clock, Layers, Pencil, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminPlans, useTogglePlan, type Plan } from "@/api/plans.api";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export const Route = createFileRoute("/admin/subscriptions/plans/")({
  beforeLoad: () => requirePermission("plans.read"),
  head: () => ({
    meta: [
      { title: "Admin · Subscription Plans — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubscriptionPlansPage,
});

function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const { data: plans = [] } = useAdminPlans();
  const togglePlan = useTogglePlan();

  const trial = plans.find((p) => p.isTrial);
  const paid = plans.filter((p) => !p.isTrial).sort((a, b) => a.sortOrder - b.sortOrder);
  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);

  function onToggle(p: Plan) {
    togglePlan.mutate(
      { id: p.id, isActive: !p.active },
      {
        onSuccess: () => toast.success(`"${p.name}" ${p.active ? "deactivated" : "activated"}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscription Plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paid.length} paid plans + free trial · {totalSubs.toLocaleString()} active subscribers
            · pricing here drives the public site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/settings/features"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            <Layers className="h-4 w-4" /> Feature Catalog
          </Link>
          <button
            onClick={() => navigate({ to: "/admin/subscriptions/plans/create" })}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </button>
        </div>
      </div>

      {/* Free Trial card */}
      {trial && (
        <section className="overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/5 to-accent/5 p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{trial.name}</h3>
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                    Managed trial
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {trial.trialDays ?? 7} days · {trial.questionCap ?? 10} questions ·{" "}
                  {trial.subscribers.toLocaleString()} on trial now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={trial.active}
                onChange={() => onToggle(trial)}
                ariaLabel="Toggle trial active"
              />
              <Link
                to="/admin/subscriptions/plans/$planId/edit"
                params={{ planId: trial.id }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
              >
                <Pencil className="h-3.5 w-3.5" /> Configure
              </Link>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {trial.bullets
              .filter((b) => b.included)
              .map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"
                >
                  <Check className="h-3 w-3" /> {b.text}
                </span>
              ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paid.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)] ${p.badgeLabel ? "border-primary/40 ring-1 ring-primary/20" : "border-border"} ${p.active ? "" : "opacity-70"}`}
          >
            {p.badgeLabel && (
              <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {p.badgeLabel}
              </span>
            )}
            <p className="text-sm font-bold text-foreground">{p.name}</p>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {p.planKey}
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                GHS {p.price.toLocaleString()}
              </span>
              <span className="pb-1 text-xs text-muted-foreground">{p.durationLabel}</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              {p.bullets
                .filter((b) => b.included)
                .slice(0, 5)
                .map((b) => (
                  <li key={b.id} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                    <span className="text-muted-foreground">{b.text}</span>
                  </li>
                ))}
            </ul>
            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {p.subscribers.toLocaleString()}
              <span className="ml-auto flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${p.active ? "bg-success/10 text-success" : "bg-surface-alt text-muted-foreground"}`}
                >
                  {p.active ? "Active" : "Hidden"}
                </span>
                <ToggleSwitch
                  size="sm"
                  checked={p.active}
                  onChange={() => onToggle(p)}
                  ariaLabel={`Toggle ${p.name}`}
                />
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to="/admin/subscriptions/plans/$planId/edit"
                params={{ planId: p.id }}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-alt"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
