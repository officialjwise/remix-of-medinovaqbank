import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ToggleRight, Hash, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";
import type { FeatureType, PlatformFeature } from "@/data/features";

export const Route = createFileRoute("/admin/settings/features")({
  head: () => ({ meta: [{ title: "Admin · Feature Catalog — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: FeatureCatalogPage,
});

function FeatureCatalogPage() {
  const { features, add, update, remove } = useFeatureCatalogStore();
  const [editing, setEditing] = useState<PlatformFeature | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PlatformFeature | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/settings/plans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Feature Catalog</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The master list of platform capabilities you can attach to any plan or the free trial. {features.length} features.
            </p>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Feature
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface-alt/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Feature</th>
              <th className="px-5 py-3">Key</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {features.map((f) => (
              <tr key={f.key} className="hover:bg-surface-alt/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${f.type === "boolean" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                      {f.type === "boolean" ? <ToggleRight className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{f.key}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${f.type === "boolean" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                    {f.type === "boolean" ? "Toggle" : "Numeric limit"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(f)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => setDeleting(f)} className="inline-flex h-8 items-center justify-center rounded-md border border-error/30 bg-error/5 px-2.5 text-error hover:bg-error/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <FeatureEditor
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={(f) => {
            if (editing) { update(editing.key, f); toast.success("Feature updated"); }
            else { add(f); toast.success("Feature added"); }
            setEditing(null); setCreating(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="Removing a feature also removes it from any plans that reference it."
        variant="destructive"
        confirmLabel="Delete feature"
        onCancel={() => setDeleting(null)}
        onConfirm={() => { if (deleting) remove(deleting.key); setDeleting(null); toast.success("Feature deleted"); }}
      />
    </div>
  );
}

function FeatureEditor({ initial, onClose, onSave }: { initial: PlatformFeature | null; onClose: () => void; onSave: (f: PlatformFeature) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<FeatureType>(initial?.type ?? "boolean");
  const [defaultLimit, setDefaultLimit] = useState(initial?.defaultLimit ?? -1);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-base font-bold text-foreground">{initial ? "Edit feature" : "New feature"}</h3>
        </header>
        <div className="space-y-4 p-5">
          <Labeled label="Name">
            <input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")); }} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </Labeled>
          <Labeled label="Key">
            <input value={key} onChange={(e) => setKey(e.target.value)} disabled={!!initial} className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm disabled:opacity-60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </Labeled>
          <Labeled label="Description">
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </Labeled>
          <Labeled label="Type">
            <div className="flex gap-2">
              {(["boolean", "limit"] as FeatureType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${type === t ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>
                  {t === "boolean" ? "Toggle (on/off)" : "Numeric limit"}
                </button>
              ))}
            </div>
          </Labeled>
          {type === "limit" && (
            <Labeled label="Default limit (-1 = unlimited)">
              <input type="number" value={defaultLimit} onChange={(e) => setDefaultLimit(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </Labeled>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
          <button disabled={!name.trim() || !key.trim()} onClick={() => onSave({ name: name.trim(), key: key.trim(), description: description.trim(), type, defaultLimit: type === "limit" ? defaultLimit : undefined })} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50">
            {initial ? "Save changes" : "Add feature"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
