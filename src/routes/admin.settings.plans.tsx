import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { durationPlans, type DurationPlan } from "@/data/plans";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin/settings/plans")({
  head: () => ({ meta: [{ title: "Admin · Plans — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettingsPlans,
});

interface PlanRow extends DurationPlan {
  active: boolean;
  badgeLabel: string;
}

function AdminSettingsPlans() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuper = role === "SUPER_ADMIN";

  const [plans, setPlans] = useState<PlanRow[]>(
    durationPlans.map((p) => ({ ...p, active: true, badgeLabel: p.badge?.label ?? "" })),
  );
  const [editing, setEditing] = useState<PlanRow | null>(null);

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

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pricing Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan keys are immutable — only display name, price, badge, and active state can be edited.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[120px_1fr_120px_100px_140px_100px_60px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Key</span>
          <span>Name</span>
          <span>Duration</span>
          <span className="text-right">Price (GHS)</span>
          <span>Badge</span>
          <span>Active</span>
          <span></span>
        </div>
        {plans.map((p) => (
          <div key={p.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[120px_1fr_120px_100px_140px_100px_60px] md:items-center md:gap-4">
            <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
            <span className="text-sm font-semibold text-foreground">{p.name}</span>
            <span className="text-xs text-muted-foreground">{p.months} mo</span>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">{p.price.toLocaleString()}</span>
            <span className="truncate text-xs text-foreground">{p.badgeLabel || "—"}</span>
            <span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-success-light text-success" : "bg-surface-alt text-muted-foreground"}`}>
                {p.active ? "Active" : "Hidden"}
              </span>
            </span>
            <div className="flex justify-end">
              <button onClick={() => setEditing(p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit"><Edit className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditPlanModal
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            toast.success(`"${updated.name}" updated`);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditPlanModal({ plan, onClose, onSave }: { plan: PlanRow; onClose: () => void; onSave: (p: PlanRow) => void }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price);
  const [badgeLabel, setBadgeLabel] = useState(plan.badgeLabel);
  const [active, setActive] = useState(plan.active);

  const save = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Price must be ≥ 0"); return; }
    onSave({ ...plan, name, price, badgeLabel, active });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">Edit plan</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"><X className="h-4 w-4" /></button>
        </header>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Plan key (read-only)</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-surface-alt px-2 py-1 font-mono text-xs text-foreground">
              <Lock className="h-3 w-3" /> {plan.id}
            </p>
          </div>
          <Field label="Display Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
          </Field>
          <Field label="Price (GHS)">
            <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-mono" />
          </Field>
          <Field label="Badge Label (optional)">
            <input value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} placeholder="e.g. Most Popular" className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
          </Field>
          <Field label="Status">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span>{active ? "Active — shown to customers" : "Hidden — not shown to customers"}</span>
            </label>
          </Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
          <button onClick={save} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save Plan</button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
