import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Lock, Plus, Pencil, Users, X, Clock, Sparkles, Layers } from "lucide-react";
import { toast } from "sonner";
import { durationPlans } from "@/data/plans";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";

export const Route = createFileRoute("/admin/settings/plans/")({
  head: () => ({ meta: [{ title: "Admin · Plans — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettingsPlans,
});

interface PlanCard {
  id: string;
  name: string;
  price: number;
  durationLabel: string;
  badgeLabel: string;
  features: string[];
  subscribers: number;
  active: boolean;
}

const subscribersByPlan: Record<string, number> = { monthly: 312, q3: 248, h6: 421, y12: 273 };

function AdminSettingsPlans() {
  const isSuper = useAuthStore((s) => s.user?.role) === "SUPER_ADMIN";
  const navigate = useNavigate();

  const [plans, setPlans] = useState<PlanCard[]>(
    durationPlans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      durationLabel: p.durationLabel,
      badgeLabel: p.badge?.label ?? "",
      features: p.features,
      subscribers: subscribersByPlan[p.id] ?? 0,
      active: true,
    })),
  );

  if (!isSuper) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-light text-warning">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">Super Admin only</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plan configuration is restricted to super admins.</p>
      </div>
    );
  }

  function toggleActive(id: string) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
    const p = plans.find((x) => x.id === id);
    toast.success(`"${p?.name}" ${p?.active ? "deactivated" : "activated"}`);
  }

  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscription Plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plans.length} paid plans + free trial · {totalSubs.toLocaleString()} active subscribers</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/settings/features"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            <Layers className="h-4 w-4" /> Feature Catalog
          </Link>
          <button
            onClick={() => navigate({ to: "/admin/settings/plans/create" })}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </button>
        </div>
      </div>

      <FreeTrialCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
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
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{p.id}</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-foreground">GHS {p.price.toLocaleString()}</span>
              <span className="pb-1 text-xs text-muted-foreground">{p.durationLabel}</span>
            </div>

            <ul className="mt-4 flex-1 space-y-2">
              {p.features.slice(0, 5).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {p.subscribers.toLocaleString()} subscribers
              <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.active ? "bg-success/10 text-success" : "bg-surface-alt text-muted-foreground"}`}>
                {p.active ? "Active" : "Hidden"}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                to="/admin/settings/plans/$planId/edit"
                params={{ planId: p.id }}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-alt"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                onClick={() => toggleActive(p.id)}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${p.active ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20" : "border-success/30 bg-success/10 text-success hover:bg-success/20"}`}
              >
                {p.active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {p.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Free Trial managed plan card ───────────── */
function FreeTrialCard() {
  const general = useSettingsStore((s) => s.settings.general);
  const trial = useSettingsStore((s) => s.settings.trial);
  const update = useSettingsStore((s) => s.update);
  const catalog = useFeatureCatalogStore((s) => s.features);
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState(general.trialDays);
  const [limit, setLimit] = useState(general.trialQuestionLimit);
  const [features, setFeatures] = useState(trial.features);

  const enabledNames = catalog
    .filter((f) => f.type === "boolean" && features[f.key])
    .map((f) => f.name);

  return (
    <section className="overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/5 to-accent/5 p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Free Trial</h3>
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">Managed</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {general.trialDays} days · {general.trialQuestionLimit} questions · device-{trial.deviceBinding ? "bound" : "unbound"}
            </p>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt">
          <Pencil className="h-3.5 w-3.5" /> Configure trial
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {enabledNames.length === 0 ? (
          <span className="text-xs text-muted-foreground">No premium features enabled during trial.</span>
        ) : (
          enabledNames.map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <Check className="h-3 w-3" /> {n}
            </span>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-foreground">Configure Free Trial</h3>
            </header>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Trial duration (days)</span>
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Question cap</span>
                  <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </label>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Features enabled during trial</p>
                <div className="space-y-2">
                  {catalog.filter((f) => f.type === "boolean").map((f) => (
                    <label key={f.key} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground">
                      <span>{f.name}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={features[f.key] ?? false}
                        onClick={() => setFeatures({ ...features, [f.key]: !features[f.key] })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${features[f.key] ? "bg-accent" : "border border-border bg-surface-alt"}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${features[f.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button onClick={() => setEditing(false)} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
              <button
                onClick={() => {
                  update("general", { trialDays: days, trialQuestionLimit: limit });
                  update("trial", { features });
                  setEditing(false);
                  toast.success("Free trial configuration saved");
                }}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Save trial
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
