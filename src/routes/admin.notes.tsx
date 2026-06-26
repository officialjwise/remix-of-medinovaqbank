import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Trash2,
  Settings2,
  Users,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  useNotesStore,
  TIER_LABELS,
  type AdminNote,
  type NoteTier,
  type NoteStatus,
} from "@/stores/notesStore";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/admin/notes")({
  head: () => ({
    meta: [
      { title: "Admin · High-Yield Notes — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNotes,
});

const PAGE_SIZE = 10;

const TIER_PILL: Record<NoteTier, string> = {
  trial_paid: "bg-success/10 text-success",
  paid_only: "bg-warning/10 text-warning",
  hidden: "bg-error/10 text-error",
};

const STATUS_PILL: Record<NoteStatus, string> = {
  ready: "bg-success/10 text-success",
  processing: "bg-warning/10 text-warning",
  failed: "bg-error/10 text-error",
};

const STATUS_LABEL: Record<NoteStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

function AdminNotes() {
  const navigate = useNavigate();
  const notes = useNotesStore((s) => s.notes);
  const toggleActive = useNotesStore((s) => s.toggleActive);
  const reprocess = useNotesStore((s) => s.reprocess);
  const remove = useNotesStore((s) => s.remove);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"All" | NoteTier>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | NoteStatus>("All");
  const [activeFilter, setActiveFilter] = useState<"All" | "active" | "inactive">("All");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<AdminNote | null>(null);

  const debounced = useDebounce(search, 250);

  const categories = useMemo(
    () => Array.from(new Set(notes.map((n) => n.category))).sort(),
    [notes],
  );

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return notes.filter((n) => {
      if (tierFilter !== "All" && n.tier !== tierFilter) return false;
      if (categoryFilter !== "All" && n.category !== categoryFilter) return false;
      if (statusFilter !== "All" && n.status !== statusFilter) return false;
      if (activeFilter === "active" && !n.active) return false;
      if (activeFilter === "inactive" && n.active) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notes, debounced, tierFilter, categoryFilter, statusFilter, activeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalSubscribers = notes.reduce((s, n) => s + n.subscribers, 0);

  // Reset to page 1 whenever filters change the result set under our feet.
  const resetPage = () => setPage(1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">High-Yield Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{notes.length} notes</span> ·{" "}
            {notes.filter((n) => n.active).length} active · {totalSubscribers.toLocaleString()} subscribers
          </p>
        </div>
        <Link
          to="/admin/notes/upload"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Upload Note
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Search by title or category…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as typeof tierFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All tiers</option>
          {(Object.keys(TIER_LABELS) as NoteTier[]).map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All statuses</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as typeof activeFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {notes.length === 0 ? "No notes yet" : "No notes match those filters"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {notes.length === 0
              ? "Upload a PDF to publish your first high-yield note."
              : "Try adjusting your search or filters."}
          </p>
          {notes.length === 0 && (
            <Link
              to="/admin/notes/upload"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Upload Note
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((n) => (
            <article
              key={n.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgb(14_124_123_/_0.25)]"
            >
              <div className="h-1.5 w-full" style={{ background: n.coverColor }} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_PILL[n.tier]}`}>
                    {TIER_LABELS[n.tier]}
                  </span>
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <ToggleSwitch
                      size="sm"
                      checked={n.active}
                      ariaLabel={`Toggle ${n.title} active`}
                      onChange={() => {
                        toggleActive(n.id);
                        toast.success(`${n.title} ${n.active ? "deactivated" : "activated"}`);
                      }}
                    />
                    {n.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="mt-3 line-clamp-2 text-base font-bold tracking-tight text-foreground">{n.title}</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {n.category} · {n.examType}
                </p>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{n.description}</p>

                <div className="my-4 border-t border-border" />

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_PILL[n.status]}`}>
                    {n.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                    {STATUS_LABEL[n.status]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {n.pageCount} pages
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {n.subscribers.toLocaleString()}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-1.5 border-t border-border pt-4">
                  <Link
                    to="/admin/notes/$noteId"
                    params={{ noteId: n.id }}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-alt text-xs font-semibold text-foreground hover:bg-surface-alt/70"
                  >
                    <Layers className="h-3.5 w-3.5" /> Manage Topics
                  </Link>
                  <Link
                    to="/admin/notes/$noteId"
                    params={{ noteId: n.id }}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                    aria-label="View & edit"
                    title="View & edit"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Link>
                  {n.status === "failed" && (
                    <button
                      onClick={() => {
                        reprocess(n.id);
                        toast.success(`Reprocessing "${n.title}"`);
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-warning/30 bg-warning/10 px-2.5 text-xs font-semibold text-warning hover:bg-warning/20"
                      aria-label="Reprocess"
                      title="Reprocess"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(n)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-error/30 bg-error/10 px-2.5 text-xs font-semibold text-error hover:bg-error/20"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-foreground">
              {safePage} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete note?"
        variant="destructive"
        confirmLabel="Delete"
        description={
          confirmDelete ? (
            <>
              This will permanently remove <span className="font-semibold text-foreground">{confirmDelete.title}</span> and all of its
              pages. This action cannot be undone.
            </>
          ) : undefined
        }
        onConfirm={() => {
          if (confirmDelete) {
            remove(confirmDelete.id);
            toast.success("Note deleted");
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
