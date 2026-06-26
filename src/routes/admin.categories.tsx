import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Tag, Trash2, Edit3, ChevronDown, X, Check, FolderTree } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoriesStore, type Category } from "@/stores/categoriesStore";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [{ title: "Admin · Categories — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, addCategory, updateCategory, removeCategory } = useCategoriesStore();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.subcategories.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [categories, debounced]);

  const totalSubs = categories.reduce((acc, c) => acc + c.subcategories.length, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Categories &amp; Subcategories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length} parent categories · {totalSubs} subcategories. Group banks &amp;
            questions properly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="h-10 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Tag className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No categories found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different search, or create a new category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={() => setEditing(cat)}
              onDelete={() => setDeleting(cat)}
            />
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
          onSave={(values) => {
            if (editing) {
              updateCategory(editing.id, values);
              toast.success("Category updated");
            } else {
              addCategory(values);
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
            This category has <strong>{deleting?.bankCount}</strong> banks,{" "}
            <strong>{deleting?.questionCount.toLocaleString()}</strong> questions and{" "}
            <strong>{deleting?.subcategories.length}</strong> subcategories. They will become
            uncategorised.
          </span>
        }
        variant="destructive"
        typedConfirmation={deleting?.name}
        confirmLabel="Delete category"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) removeCategory(deleting.id);
          setDeleting(null);
          toast.success("Category deleted");
        }}
      />
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { addSubcategory, updateSubcategory, removeSubcategory } = useCategoriesStore();
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function submitNew() {
    if (!newName.trim()) return;
    addSubcategory(category.id, newName.trim());
    toast.success(`Added "${newName.trim()}"`);
    setNewName("");
    setAdding(false);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="h-1.5" style={{ background: category.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: category.color }}
            >
              <FolderTree className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">{category.name}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">/{category.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-error/30 bg-error/5 px-2.5 text-error hover:bg-error/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Stat label="Banks" value={category.bankCount} />
          <Stat label="Questions" value={category.questionCount} />
          <Stat label="Subcategories" value={category.subcategories.length} />
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            Subcategories ({category.subcategories.length})
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-3 space-y-2">
              {category.subcategories.length === 0 && !adding && (
                <p className="rounded-lg border border-dashed border-border py-3 text-center text-xs text-muted-foreground">
                  No subcategories yet.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {category.subcategories.map((s) =>
                  editId === s.id ? (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-2 py-1"
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateSubcategory(category.id, s.id, editName.trim() || s.name);
                            setEditId(null);
                            toast.success("Subcategory updated");
                          }
                          if (e.key === "Escape") setEditId(null);
                        }}
                        className="w-28 bg-transparent text-xs font-semibold text-foreground outline-none"
                      />
                      <button
                        onClick={() => {
                          updateSubcategory(category.id, s.id, editName.trim() || s.name);
                          setEditId(null);
                          toast.success("Subcategory updated");
                        }}
                        className="text-accent"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={s.id}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      {s.name}
                      <button
                        onClick={() => {
                          setEditId(s.id);
                          setEditName(s.name);
                        }}
                        className="text-muted-foreground hover:text-accent"
                        aria-label="Edit subcategory"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          removeSubcategory(category.id, s.id);
                          toast.success("Subcategory removed");
                        }}
                        className="text-muted-foreground hover:text-error"
                        aria-label="Remove subcategory"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ),
                )}
              </div>

              {adding ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNew();
                      if (e.key === "Escape") setAdding(false);
                    }}
                    placeholder="Subcategory name…"
                    className="h-8 flex-1 rounded-lg border border-border bg-surface px-3 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    onClick={submitNew}
                    className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold hover:bg-surface-alt"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add subcategory
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold text-foreground">{value.toLocaleString()}</p>
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
  onSave: (v: { name: string; slug: string; color: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [color, setColor] = useState(initial?.color ?? "#0E7C7B");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">
            {initial ? "Edit category" : "New category"}
          </h3>
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
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            disabled={!name || !slug}
            onClick={() => onSave({ name, slug, color })}
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
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
