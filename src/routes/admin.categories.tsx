import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Tag, Trash2, Edit3 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Admin · Categories — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  bankCount: number;
  questionCount: number;
  color: string;
  createdAt: string;
}

const seed: Category[] = [
  { id: "c-im", name: "Internal Medicine", slug: "internal-medicine", bankCount: 4, questionCount: 2840, color: "#0E7C7B", createdAt: "2025-01-08" },
  { id: "c-surg", name: "Surgery", slug: "surgery", bankCount: 3, questionCount: 1620, color: "#0EA5E9", createdAt: "2025-01-08" },
  { id: "c-obgyn", name: "Obstetrics & Gynaecology", slug: "obgyn", bankCount: 2, questionCount: 1140, color: "#A855F7", createdAt: "2025-01-15" },
  { id: "c-paeds", name: "Paediatrics", slug: "paediatrics", bankCount: 2, questionCount: 980, color: "#EC4899", createdAt: "2025-01-22" },
  { id: "c-pharm", name: "Pharmacology", slug: "pharmacology", bankCount: 3, questionCount: 1520, color: "#22C55E", createdAt: "2025-02-04" },
  { id: "c-path", name: "Pathology", slug: "pathology", bankCount: 2, questionCount: 720, color: "#F97316", createdAt: "2025-02-11" },
];

function CategoriesPage() {
  const [list, setList] = useState(seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const filtered = list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top-level subjects used to group question banks. {list.length} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="h-10 w-64 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> New category
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Tag className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No categories found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search, or create a new category.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => (
            <article
              key={cat.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgb(14_124_123_/_0.18)]"
            >
              <div className="h-2" style={{ background: cat.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
                  <span className="rounded-md bg-surface-alt px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    /{cat.slug}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Banks</p>
                    <p className="mt-0.5 text-base font-bold text-foreground">{cat.bankCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Questions</p>
                    <p className="mt-0.5 text-base font-bold text-foreground">{cat.questionCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => setEditing(cat)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-alt"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleting(cat)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-light/40 px-3 text-xs font-semibold text-error hover:bg-error-light"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <CategoryEditor
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(c) => {
            if (editing) {
              setList(list.map((x) => (x.id === c.id ? c : x)));
              toast.success("Category updated");
            } else {
              setList([{ ...c, id: `c-${Date.now()}`, bankCount: 0, questionCount: 0, createdAt: new Date().toISOString() }, ...list]);
              toast.success("Category created");
            }
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={
          <span>
            This category has <strong>{deleting?.bankCount}</strong> banks and{" "}
            <strong>{deleting?.questionCount.toLocaleString()}</strong> questions. They will become uncategorised.
          </span>
        }
        variant="destructive"
        typedConfirmation={deleting?.name}
        confirmLabel="Delete category"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          setList(list.filter((x) => x.id !== deleting?.id));
          setDeleting(null);
          toast.success("Category deleted");
        }}
      />
    </div>
  );
}

function CategoryEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: Category | null;
  onClose: () => void;
  onSave: (c: Category) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [color, setColor] = useState(initial?.color ?? "#0E7C7B");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">{initial ? "Edit category" : "New category"}</h3>
        </header>
        <div className="space-y-4 p-5">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initial) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
          <Field label="Slug">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
          <Field label="Accent colour">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-surface"
              />
              <code className="rounded bg-surface-alt px-2 py-1 text-xs">{color}</code>
            </div>
          </Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">
            Cancel
          </button>
          <button
            disabled={!name || !slug}
            onClick={() =>
              onSave({
                id: initial?.id ?? "",
                name,
                slug,
                color,
                bankCount: initial?.bankCount ?? 0,
                questionCount: initial?.questionCount ?? 0,
                createdAt: initial?.createdAt ?? new Date().toISOString(),
              })
            }
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {initial ? "Save changes" : "Create category"}
          </button>
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
