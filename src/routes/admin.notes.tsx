import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { highYieldNotes } from "@/data/notes";

export const Route = createFileRoute("/admin/notes")({
  head: () => ({ meta: [{ title: "Admin · High Yield Notes — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminNotes,
});

function AdminNotes() {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">High Yield Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">{highYieldNotes.length} notes published</p>
        </div>
        <button
          onClick={() => toast.success("New note draft created")}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> New Note
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {highYieldNotes.map((n) => (
          <article key={n.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  <BookOpen className="h-3 w-3" /> {n.subject}
                </span>
                <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{n.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Updated {n.updatedAt} · {n.readMinutes} min read
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  onClick={() => toast.info(`Editing "${n.title}"`)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(n.id)}
                  className="rounded-md p-1.5 text-error hover:bg-error-light"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-foreground">Delete note?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold">Cancel</button>
              <button onClick={() => { toast.success("Note deleted"); setConfirmDelete(null); }} className="inline-flex h-10 items-center rounded-lg bg-error px-4 text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
