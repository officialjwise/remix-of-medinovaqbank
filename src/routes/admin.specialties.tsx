import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useMemo, useState } from "react";
import { Plus, Search, Stethoscope, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewToggle, viewGridClass } from "@/components/shared/ViewToggle";
import { CardGridSkeleton } from "@/components/shared/CardGridSkeleton";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useDebounce } from "@/hooks/useDebounce";
import { useViewMode } from "@/hooks/useViewMode";
import {
  useAdminSpecialties,
  useCreateSpecialty,
  useUpdateSpecialty,
  useToggleSpecialty,
  useDeleteSpecialty,
  type Specialty as SpecialtyRecord,
} from "@/api/specialties.api";

export const Route = createFileRoute("/admin/specialties")({
  beforeLoad: () => requirePermission("specialties.read"),
  head: () => ({
    meta: [
      { title: "Admin · Specialties — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SpecialtiesPage,
});

function SpecialtiesPage() {
  const { data: specialties = [], isLoading, isFetching } = useAdminSpecialties();
  const [view, setView] = useViewMode("specialties");
  const createMutation = useCreateSpecialty();
  const updateMutation = useUpdateSpecialty();
  const toggleMutation = useToggleSpecialty();
  const deleteMutation = useDeleteSpecialty();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const [editing, setEditing] = useState<SpecialtyRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SpecialtyRecord | null>(null);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return specialties.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }, [specialties, debounced]);

  const activeCount = specialties.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Specialties</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Medical specialties offered to users at sign-up and in their profile.{" "}
            {specialties.length} total · {activeCount} active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specialties…"
              className="h-10 w-56 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Add Specialty
          </button>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </header>

      {isLoading || (isFetching && filtered.length === 0) ? (
        <CardGridSkeleton count={6} mode={view} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No specialties found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different search, or add a new specialty.
          </p>
        </div>
      ) : (
        <div className={viewGridClass(view)}>
          {filtered.map((sp) => (
            <article
              key={sp.id}
              className={`group overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${
                sp.isActive ? "border-border" : "border-dashed border-border opacity-75"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-sm">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      sp.isActive
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-surface-alt text-muted-foreground border border-border"
                    }`}
                  >
                    {sp.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{sp.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {sp.description || "No description"}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => setEditing(sp)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-alt"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <span
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5"
                    title={
                      sp.isActive ? "Active — click to deactivate" : "Inactive — click to activate"
                    }
                  >
                    <ToggleSwitch
                      size="sm"
                      checked={sp.isActive}
                      ariaLabel={`Toggle ${sp.name}`}
                      disabled={toggleMutation.isPending}
                      onChange={() => {
                        toggleMutation.mutate(
                          { id: sp.id, isActive: !sp.isActive },
                          {
                            onSuccess: () =>
                              toast.success(
                                `${sp.name} ${sp.isActive ? "deactivated" : "activated"}`,
                              ),
                            onError: (e) =>
                              toast.error(e instanceof Error ? e.message : "Update failed"),
                          },
                        );
                      }}
                    />
                  </span>
                  <button
                    onClick={() => setDeleting(sp)}
                    title="Delete"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-3 text-xs font-semibold text-error hover:bg-error/10"
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
        <SpecialtyEditor
          initial={editing}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(values) => {
            const editingId = editing?.id;
            const onDone = (verb: string) => {
              toast.success(`Specialty ${verb}`);
              setEditing(null);
              setCreating(false);
            };
            const onError = (e: unknown) =>
              toast.error(e instanceof Error ? e.message : "Save failed");
            if (editingId) {
              updateMutation.mutate(
                {
                  id: editingId,
                  input: {
                    name: values.name,
                    description: values.description,
                    isActive: values.active,
                  },
                },
                { onSuccess: () => onDone("updated"), onError },
              );
            } else {
              createMutation.mutate(
                { name: values.name, description: values.description },
                { onSuccess: () => onDone("created"), onError },
              );
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="This specialty will no longer be selectable at sign-up. Existing users keep their stored value."
        variant="destructive"
        confirmLabel="Delete specialty"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (!target) return;
          deleteMutation.mutate(target.id, {
            onSuccess: () => toast.success("Specialty deleted"),
            onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
          });
        }}
      />
    </div>
  );
}

function SpecialtyEditor({
  initial,
  isSaving,
  onClose,
  onSave,
}: {
  initial: SpecialtyRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { name: string; description: string; active: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.isActive ?? true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">
            {initial ? "Edit specialty" : "New specialty"}
          </h3>
        </header>
        <div className="space-y-4 p-5">
          <Labeled label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Internal Medicine"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Labeled>
          <Labeled label="Description">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this specialty"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Labeled>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
            <span>Active — selectable at sign-up</span>
            <ToggleSwitch
              checked={active}
              onChange={(next) => setActive(next)}
              ariaLabel="Active — selectable at sign-up"
            />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || isSaving}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), active })}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving…" : initial ? "Save changes" : "Create specialty"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
