import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  GripVertical,
  Lock,
  Plus,
  Trash2,
  X,
  Infinity as InfinityIcon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useFeatures } from "@/api/features.api";
import type { Plan, PlanBullet } from "@/api/plans.api";

let bid = 1000;
const newId = () => `b${bid++}`;

/** Backend SubscriptionPlan enum values. */
const PLAN_KEY_OPTIONS: { value: Plan["planKey"] }[] = [
  { value: "monthly" },
  { value: "three_months" },
  { value: "six_months" },
  { value: "twelve_months" },
  { value: "free_trial" },
];

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function SubscriptionPlanForm({
  mode,
  initial,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: Plan;
  onSubmit: (plan: Plan) => void;
}) {
  const { data: catalog = [] } = useFeatures();
  const [v, setV] = useState<Plan>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const set = <K extends keyof Plan>(k: K, val: Plan[K]) => setV((p) => ({ ...p, [k]: val }));

  function setCatalog(
    key: string,
    patch: Partial<{ included: boolean; limit?: number }>,
    featureId?: string,
  ) {
    setV((p) => ({
      ...p,
      catalogFeatures: {
        ...p.catalogFeatures,
        [key]: {
          ...(p.catalogFeatures[key] ?? { included: false }),
          ...patch,
          featureKey: key,
          featureId: p.catalogFeatures[key]?.featureId ?? featureId,
        },
      },
    }));
  }
  function updateBullet(id: string, patch: Partial<PlanBullet>) {
    set(
      "bullets",
      v.bullets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= v.bullets.length) return;
    const next = [...v.bullets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set("bullets", next);
  }

  function submit(active: boolean) {
    if (!v.name.trim()) return toast.error("Plan name is required");
    if (!v.planKey.trim()) return toast.error("Plan key is required");
    if (v.price < 0) return toast.error("Price must be ≥ 0");
    if (v.bullets.some((b) => !b.text.trim()))
      return toast.error("Remove or fill in empty bullet lines");
    onSubmit({ ...v, active });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold text-foreground">Plan details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Plan key">
              <div className="relative">
                <input
                  value={v.planKey}
                  disabled={mode === "edit"}
                  list="plan-key-suggestions"
                  placeholder="e.g. pro_annual_2026"
                  onChange={(e) =>
                    set(
                      "planKey",
                      e.target.value
                        .toLowerCase()
                        .replace(/[\s-]+/g, "_")
                        .replace(/[^a-z0-9_]/g, ""),
                    )
                  }
                  className={`${inputCls} font-mono disabled:cursor-not-allowed disabled:opacity-60`}
                />
                <datalist id="plan-key-suggestions">
                  {PLAN_KEY_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value} />
                  ))}
                </datalist>
                {mode === "edit" && (
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
              {mode === "create" && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  A unique key (lowercase, digits, underscores). Immutable once created.
                </p>
              )}
            </Field>
            <Field label="Display name">
              <input
                value={v.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. 3 Months Access"
                className={inputCls}
              />
            </Field>
            <Field label="Price (GHS)">
              <input
                type="number"
                min={0}
                value={v.price === 0 ? "" : v.price}
                placeholder="0"
                onChange={(e) => set("price", e.target.value === "" ? 0 : Number(e.target.value))}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Duration (days)">
              <input
                type="number"
                min={1}
                value={v.durationDays === 0 ? "" : v.durationDays}
                placeholder="30"
                onChange={(e) =>
                  set("durationDays", e.target.value === "" ? 0 : Number(e.target.value))
                }
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Duration label">
              <input
                value={v.durationLabel}
                onChange={(e) => set("durationLabel", e.target.value)}
                placeholder="/ 3 months"
                className={inputCls}
              />
            </Field>
            <Field label="Badge label (optional)">
              <input
                value={v.badgeLabel}
                onChange={(e) => set("badgeLabel", e.target.value)}
                placeholder="Most Popular"
                className={inputCls}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={v.sortOrder === 0 ? "" : v.sortOrder}
                placeholder="0"
                onChange={(e) =>
                  set("sortOrder", e.target.value === "" ? 0 : Number(e.target.value))
                }
                className={`${inputCls} font-mono`}
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={v.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Active — shown to customers
          </label>
        </section>

        {v.isTrial && (
          <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-bold text-foreground">Trial configuration</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Trial duration (days)">
                <input
                  type="number"
                  min={1}
                  value={v.trialDays ? v.trialDays : ""}
                  placeholder="7"
                  onChange={(e) =>
                    set("trialDays", e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Question cap">
                <input
                  type="number"
                  min={0}
                  value={v.questionCap ? v.questionCap : ""}
                  placeholder="10"
                  onChange={(e) =>
                    set("questionCap", e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Platform features for this plan</h3>
              <p className="text-xs text-muted-foreground">
                Toggle which capabilities this plan unlocks; set numeric limits where applicable.
              </p>
            </div>
            <Link
              to="/admin/settings/features"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
            >
              Feature Catalog
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {catalog.map((f) => {
              const sel = v.catalogFeatures[f.key] ?? { included: false, limit: f.defaultLimit };
              return (
                <div
                  key={f.key}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/30 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => setCatalog(f.key, { included: !sel.included }, f.id)}
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${sel.included ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                  >
                    {sel.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${sel.included ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {f.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{f.description}</p>
                  </div>
                  {f.type === "limit" && sel.included && (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCatalog(f.key, {
                            limit:
                              sel.limit === -1
                                ? f.defaultLimit && f.defaultLimit > 0
                                  ? f.defaultLimit
                                  : 10
                                : -1,
                          })
                        }
                        className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold ${sel.limit === -1 ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground"}`}
                      >
                        <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                      </button>
                      <input
                        type="number"
                        min={0}
                        disabled={sel.limit === -1}
                        value={sel.limit === -1 ? "" : (sel.limit ?? 0)}
                        onChange={(e) => setCatalog(f.key, { limit: Number(e.target.value) })}
                        placeholder="∞"
                        className="h-8 w-20 rounded-md border border-border bg-surface px-2 font-mono text-sm disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Marketing bullet points</h3>
              <p className="text-xs text-muted-foreground">
                Lines shown on the plan card. Drag to reorder; toggle to include/exclude.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                set("bullets", [...v.bullets, { id: newId(), text: "", included: true }])
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {v.bullets.map((b, i) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, i);
                  setDragIndex(null);
                }}
                className={`flex items-center gap-2 rounded-lg border border-border bg-surface-alt/30 p-1.5 ${dragIndex === i ? "opacity-50" : ""}`}
              >
                <span className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => updateBullet(b.id, { included: !b.included })}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${b.included ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                >
                  {b.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
                <input
                  value={b.text}
                  onChange={(e) => updateBullet(b.id, { text: e.target.value })}
                  placeholder="Feature description…"
                  className={`h-9 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground focus:border-border focus:bg-surface focus:outline-none ${b.included ? "" : "text-muted-foreground line-through"}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "bullets",
                      v.bullets.filter((x) => x.id !== b.id),
                    )
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/admin/subscriptions/plans"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Cancel
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => submit(false)}
              className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-bold text-white shadow-md hover:opacity-90"
            >
              {mode === "create" ? "Create plan" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Live preview
        </p>
        <PlanPreview plan={v} />
      </div>
    </div>
  );
}

function PlanPreview({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] ${plan.badgeLabel ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
    >
      {plan.badgeLabel && (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {plan.badgeLabel}
        </span>
      )}
      <p className="text-sm font-bold text-foreground">{plan.name || "Plan name"}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">
          {plan.price === 0 ? "Free" : `GHS ${plan.price.toLocaleString()}`}
        </span>
        <span className="pb-1 text-xs text-muted-foreground">{plan.durationLabel}</span>
      </div>
      {plan.isTrial && (
        <p className="mt-1 text-xs font-semibold text-warning">
          {plan.trialDays ?? 7} days · {plan.questionCap ?? 10} questions
        </p>
      )}
      <ul className="mt-5 space-y-2.5">
        {plan.bullets
          .filter((b) => b.text.trim())
          .map((b) => (
            <li key={b.id} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${b.included ? "bg-success/15 text-success" : "bg-error/10 text-error"}`}
              >
                {b.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span
                className={b.included ? "text-foreground" : "text-muted-foreground line-through"}
              >
                {b.text}
              </span>
            </li>
          ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-6 h-11 w-full rounded-lg bg-gradient-to-r from-primary to-accent text-sm font-bold text-white opacity-90"
      >
        {plan.isTrial ? "Start free trial" : "Subscribe"}
      </button>
      {!plan.active && (
        <p className="mt-2 text-center text-[11px] font-semibold text-warning">
          Hidden — not shown to customers
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
