import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, GripVertical, Lock, Plus, Trash2, X, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";

export type PlanKey = "monthly" | "q3" | "h6" | "y12";

export interface PlanFeature {
  id: string;
  text: string;
  included: boolean;
}

/** Per-plan configuration of a catalog feature. */
export interface CatalogSelection {
  included: boolean;
  limit?: number; // for `limit` type features; -1 = unlimited
}

export interface PlanFormValues {
  planKey: PlanKey;
  name: string;
  price: number;
  durationDays: number;
  badgeLabel: string;
  sortOrder: number;
  active: boolean;
  features: PlanFeature[];
  /** Catalog feature key -> selection. Optional; defaults applied in the form. */
  catalogFeatures?: Record<string, CatalogSelection>;
}

const PLAN_KEYS: { value: PlanKey; label: string; months: number }[] = [
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "q3", label: "3 Months", months: 3 },
  { value: "h6", label: "6 Months", months: 6 },
  { value: "y12", label: "12 Months", months: 12 },
];

export const emptyPlan: PlanFormValues = {
  planKey: "monthly",
  name: "",
  price: 0,
  durationDays: 30,
  badgeLabel: "",
  sortOrder: 0,
  active: true,
  features: [
    { id: "f1", text: "Full access to every question bank", included: true },
    { id: "f2", text: "AI clinical breakdowns on every answer", included: true },
    { id: "f3", text: "Performance analytics dashboard", included: true },
  ],
};

let fid = 100;
const newId = () => `f${fid++}`;

function durationLabel(key: PlanKey) {
  const months = PLAN_KEYS.find((k) => k.value === key)?.months ?? 1;
  return months === 1 ? "/month" : months === 12 ? "/year" : `/ ${months} months`;
}

export function PlanForm({
  mode,
  initial,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: PlanFormValues;
  onSubmit: (values: PlanFormValues) => void;
}) {
  const catalog = useFeatureCatalogStore((s) => s.features);
  const [values, setValues] = useState<PlanFormValues>(() => ({
    ...initial,
    catalogFeatures:
      initial.catalogFeatures ??
      Object.fromEntries(
        catalog.map((f) => [
          f.key,
          {
            included: f.type === "boolean",
            limit: f.type === "limit" ? (f.defaultLimit ?? -1) : undefined,
          },
        ]),
      ),
  }));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const set = <K extends keyof PlanFormValues>(k: K, v: PlanFormValues[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  function setCatalog(key: string, patch: Partial<CatalogSelection>) {
    setValues((p) => ({
      ...p,
      catalogFeatures: {
        ...(p.catalogFeatures ?? {}),
        [key]: { ...(p.catalogFeatures?.[key] ?? { included: false }), ...patch },
      },
    }));
  }

  function updateFeature(id: string, patch: Partial<PlanFeature>) {
    set(
      "features",
      values.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }
  function addFeature() {
    set("features", [...values.features, { id: newId(), text: "", included: true }]);
  }
  function removeFeature(id: string) {
    set(
      "features",
      values.features.filter((f) => f.id !== id),
    );
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= values.features.length) return;
    const next = [...values.features];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set("features", next);
  }

  function submit(active: boolean) {
    if (!values.name.trim()) return toast.error("Plan name is required");
    if (!Number.isFinite(values.price) || values.price < 0) return toast.error("Price must be ≥ 0");
    if (values.features.some((f) => !f.text.trim()))
      return toast.error("Remove or fill in empty feature lines");
    onSubmit({ ...values, active });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* ---- Form ---- */}
      <div className="space-y-6">
        {/* Plan details */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold text-foreground">Plan details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Plan key">
              <div className="relative">
                <select
                  value={values.planKey}
                  disabled={mode === "edit"}
                  onChange={(e) => set("planKey", e.target.value as PlanKey)}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PLAN_KEYS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.value}
                    </option>
                  ))}
                </select>
                {mode === "edit" && (
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            </Field>
            <Field label="Display name">
              <input
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. 3 Months Access"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Price (GHS)">
              <input
                type="number"
                min={0}
                value={values.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Duration (days)">
              <input
                type="number"
                min={1}
                value={values.durationDays}
                onChange={(e) => set("durationDays", Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Badge label (optional)">
              <input
                value={values.badgeLabel}
                onChange={(e) => set("badgeLabel", e.target.value)}
                placeholder="Most Popular"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={values.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Active — shown to customers on the pricing page
          </label>
        </section>

        {/* Catalog feature selection */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Platform features for this plan</h3>
              <p className="text-xs text-muted-foreground">
                Toggle which capabilities this plan unlocks. Manage the master list in the Feature
                Catalog.
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
              const sel = values.catalogFeatures?.[f.key] ?? {
                included: false,
                limit: f.defaultLimit,
              };
              return (
                <div
                  key={f.key}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/30 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => setCatalog(f.key, { included: !sel.included })}
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${sel.included ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                    title={
                      sel.included ? "Included — click to exclude" : "Excluded — click to include"
                    }
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
                        title="Toggle unlimited"
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

        {/* Features editor */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Marketing bullet points</h3>
              <p className="text-xs text-muted-foreground">
                Lines shown on the plan card. Drag to reorder; toggle to include or exclude.
              </p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
            >
              <Plus className="h-3.5 w-3.5" /> Add feature
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {values.features.length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                No features yet — add your first line.
              </p>
            )}
            {values.features.map((f, i) => (
              <div
                key={f.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, i);
                  setDragIndex(null);
                }}
                className={`flex items-center gap-2 rounded-lg border border-border bg-surface-alt/30 p-1.5 ${dragIndex === i ? "opacity-50" : ""}`}
              >
                <span
                  className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => updateFeature(f.id, { included: !f.included })}
                  title={
                    f.included
                      ? "Included — click to mark excluded"
                      : "Excluded — click to mark included"
                  }
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${f.included ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                >
                  {f.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
                <input
                  value={f.text}
                  onChange={(e) => updateFeature(f.id, { text: e.target.value })}
                  placeholder="Feature description…"
                  className={`h-9 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground focus:border-border focus:bg-surface focus:outline-none ${f.included ? "" : "text-muted-foreground line-through"}`}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(f.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                  aria-label="Remove feature"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/admin/settings/plans"
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

      {/* ---- Live preview ---- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Live preview
        </p>
        <PlanPreview values={values} />
      </div>
    </div>
  );
}

function PlanPreview({ values }: { values: PlanFormValues }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] ${values.badgeLabel ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
    >
      {values.badgeLabel && (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {values.badgeLabel}
        </span>
      )}
      <p className="text-sm font-bold text-foreground">{values.name || "Plan name"}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">
          GHS {values.price.toLocaleString()}
        </span>
        <span className="pb-1 text-xs text-muted-foreground">{durationLabel(values.planKey)}</span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {values.features
          .filter((f) => f.text.trim())
          .map((f) => (
            <li key={f.id} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${f.included ? "bg-success/15 text-success" : "bg-error/10 text-error"}`}
              >
                {f.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span
                className={f.included ? "text-foreground" : "text-muted-foreground line-through"}
              >
                {f.text}
              </span>
            </li>
          ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-6 h-11 w-full rounded-lg bg-gradient-to-r from-primary to-accent text-sm font-bold text-white opacity-90"
      >
        Subscribe
      </button>
      {!values.active && (
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
