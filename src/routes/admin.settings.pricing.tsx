import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { durationPlans } from "@/data/plans";

export const Route = createFileRoute("/_admin/settings/pricing")({
  head: () => ({ meta: [{ title: "Admin · Pricing — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminPricing,
});

function AdminPricing() {
  const [plans, setPlans] = useState(durationPlans);
  const [saved, setSaved] = useState(false);

  function update(id: string, patch: Partial<(typeof durationPlans)[number]>) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Pricing Plans</h2>
      <p className="mt-1 text-sm text-muted-foreground">Configure subscription tiers and pricing in GHS.</p>

      <div className="mt-6 space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_120px_120px_140px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.name}</p>
              <p className="text-sm font-semibold text-foreground">{p.durationLabel}</p>
            </div>
            <Field label="Price (GHS)">
              <input
                type="number"
                value={p.price}
                onChange={(e) => update(p.id, { price: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Months">
              <input type="number" value={p.months} readOnly className="input cursor-not-allowed bg-surface-alt" />
            </Field>
            <Field label="Save %">
              <input
                type="number"
                value={p.savePct ?? 0}
                onChange={(e) => update(p.id, { savePct: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">✓ Saved</span>}
        <button
          type="button"
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <style>{`
        .input { display: block; width: 100%; height: 2.25rem; padding: 0 0.625rem; font-size: 0.875rem; color: hsl(var(--foreground)); background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 0.5rem; outline: none; }
        .input:focus { border-color: hsl(var(--accent)); box-shadow: 0 0 0 3px hsl(var(--accent) / 0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
