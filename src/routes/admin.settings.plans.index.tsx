import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Lock, Plus, Pencil, Users, X } from "lucide-react";
import { toast } from "sonner";
import { durationPlans } from "@/data/plans";
import { useAuthStore } from "@/stores/authStore";

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
          <p className="mt-1 text-sm text-muted-foreground">{plans.length} plans · {totalSubs.toLocaleString()} active subscribers</p>
        </div>
        <button
          onClick={() => navigate({ to: "/admin/settings/plans/create" })}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Plan
        </button>
      </div>

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
