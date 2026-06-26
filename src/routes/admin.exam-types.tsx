import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  GraduationCap,
  Trash2,
  Edit3,
  Power,
  Stethoscope,
  Globe,
  Award,
  ShieldCheck,
  BookOpen,
  Brain,
  HeartPulse,
  Microscope,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useExamTypesStore, type ExamTypeRecord } from "@/stores/examTypesStore";

export const Route = createFileRoute("/admin/exam-types")({
  head: () => ({ meta: [{ title: "Admin · Exam Types — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: ExamTypesPage,
});

export const EXAM_TYPE_ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Stethoscope,
  Globe,
  Award,
  ShieldCheck,
  BookOpen,
  Brain,
  HeartPulse,
  Microscope,
  Activity,
};

const ICON_OPTIONS = Object.keys(EXAM_TYPE_ICONS);
const COLOR_OPTIONS = ["#0E7C7B", "#2BC97F", "#3B82F6", "#7C3AED", "#E89A1A", "#E11D48", "#0EA5E9", "#DB2777"];

function ExamTypesPage() {
  const { examTypes, add, update, remove, toggle } = useExamTypesStore();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const [editing, setEditing] = useState<ExamTypeRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ExamTypeRecord | null>(null);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return examTypes.filter((e) => !q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }, [examTypes, debounced]);

  const activeCount = examTypes.filter((e) => e.active).length;
  const totalBanks = examTypes.reduce((acc, e) => acc + e.bankCount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Exam Types</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Managed exam categories that question banks can be mapped to. {examTypes.length} total · {activeCount} active · {totalBanks} banks mapped.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exam types…"
              className="h-10 w-56 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Add Exam Type
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No exam types found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search, or add a new exam type.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((et) => {
            const Icon = EXAM_TYPE_ICONS[et.icon] ?? GraduationCap;
            return (
              <article
                key={et.id}
                className={`group overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${
                  et.active ? "border-border" : "border-dashed border-border opacity-75"
                }`}
              >
                <div className="h-1.5" style={{ background: et.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: et.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        et.active ? "bg-success/10 text-success border border-success/20" : "bg-surface-alt text-muted-foreground border border-border"
                      }`}
                    >
                      {et.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">{et.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{et.description}</p>
                  <p className="mt-3 text-xs font-semibold text-foreground">
                    {et.bankCount} {et.bankCount === 1 ? "bank" : "banks"} using this
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    <button
                      onClick={() => setEditing(et)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-alt"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggle(et.id)}
                      title={et.active ? "Deactivate" : "Activate"}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (et.bankCount > 0) {
                          toast.error(`Can't delete — ${et.bankCount} banks still use "${et.name}"`);
                          return;
                        }
                        setDeleting(et);
                      }}
                      title={et.bankCount > 0 ? "In use — cannot delete" : "Delete"}
                      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${
                        et.bankCount > 0
                          ? "cursor-not-allowed border-border bg-surface text-muted-foreground/50"
                          : "border-error/30 bg-error/5 text-error hover:bg-error/10"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <ExamTypeEditor
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(values) => {
            if (editing) {
              update(editing.id, values);
              toast.success("Exam type updated");
            } else {
              add(values);
              toast.success("Exam type created");
            }
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="This exam type is not used by any bank and can be safely removed."
        variant="destructive"
        confirmLabel="Delete exam type"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting.id);
          setDeleting(null);
          toast.success("Exam type deleted");
        }}
      />
    </div>
  );
}

function ExamTypeEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: ExamTypeRecord | null;
  onClose: () => void;
  onSave: (values: { name: string; description: string; color: string; icon: string; active: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICON_OPTIONS[0]);
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">{initial ? "Edit exam type" : "New exam type"}</h3>
        </header>
        <div className="space-y-4 p-5">
          <Labeled label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. USMLE Step 1"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Labeled>
          <Labeled label="Description">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this exam"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Labeled>
          <Labeled label="Color">
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-lg ring-2 ring-offset-2 ring-offset-surface transition ${color === c ? "ring-foreground" : "ring-transparent"}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </Labeled>
          <Labeled label="Icon">
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((key) => {
                const Icon = EXAM_TYPE_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                      icon === key ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={key}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </Labeled>
          <label className="flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
            <span>Active — available when creating banks</span>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((a) => !a)}
              className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-accent" : "border border-border bg-surface-alt"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), color, icon, active })}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {initial ? "Save changes" : "Create exam type"}
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
