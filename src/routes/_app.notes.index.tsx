import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, FileText, Lock, Search, Sparkles, Star } from "lucide-react";
import { useNotesStore, type AdminNote } from "@/stores/notesStore";
import { useTrial } from "@/hooks/useTrial";
import { useUpgradeModal } from "@/stores/upgradeModalStore";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/_app/notes/")({
  head: () => ({
    meta: [
      { title: "High Yield Notes — Medinovaqbank" },
      { name: "description", content: "Curated, exam-focused clinical notes for rapid revision." },
    ],
  }),
  component: NotesPage,
});

const ALL = "All";

function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const { isTrial } = useTrial();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [examType, setExamType] = useState<string>(ALL);
  const debouncedQ = useDebounce(q, 250);

  const eligible = useMemo(() => notes.filter((n) => n.active && n.tier !== "hidden"), [notes]);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(eligible.map((n) => n.category))).sort()],
    [eligible],
  );
  const examTypes = useMemo(
    () => [ALL, ...Array.from(new Set(eligible.map((n) => n.examType))).sort()],
    [eligible],
  );

  const list = useMemo(() => {
    const needle = debouncedQ.trim().toLowerCase();
    return eligible.filter((n) => {
      if (category !== ALL && n.category !== category) return false;
      if (examType !== ALL && n.examType !== examType) return false;
      if (!needle) return true;
      return (
        n.title.toLowerCase().includes(needle) ||
        n.description.toLowerCase().includes(needle) ||
        n.category.toLowerCase().includes(needle) ||
        n.examType.toLowerCase().includes(needle)
      );
    });
  }, [eligible, debouncedQ, category, examType]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="card-surface relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              <Sparkles className="h-3 w-3" /> Curated for exams
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              High-Yield Notes
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Concise, board-style revision notes — read them page by page in the protected reader.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes…"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-64"
              />
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === ALL ? "All categories" : c}
                </option>
              ))}
            </select>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-label="Filter by exam type"
            >
              {examTypes.map((t) => (
                <option key={t} value={t}>
                  {t === ALL ? "All exams" : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-alt">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No notes found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or clear your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((n) => (
            <NoteCard key={n.id} note={n} locked={isTrial && n.tier === "paid_only"} />
          ))}
        </div>
      )}
    </div>
  );
}

function openUpgrade() {
  useUpgradeModal.getState().show({
    title: "Unlock premium high-yield notes",
    body: "Premium high-yield notes are available on any paid plan. Subscribe to read them in full.",
  });
}

function NoteCard({ note, locked }: { note: AdminNote; locked: boolean }) {
  const cover = (
    <div
      className="relative h-28 w-full overflow-hidden"
      style={{ backgroundColor: note.coverColor }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/25"
      />
      <FileText
        aria-hidden
        className="absolute -right-3 -top-3 h-24 w-24 text-white/15"
        strokeWidth={1.25}
      />
      <div className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
        {note.examType}
      </div>
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-foreground">
          <BookOpen className="h-3 w-3" />
          {note.category}
        </span>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
            <Star className="h-3 w-3" /> Premium
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <FileText className="h-3 w-3" />
            {note.pageCount} pages
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-1 text-base font-semibold text-foreground">{note.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{note.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{note.pageCount} pages</span>
        <span className={`text-xs font-semibold ${locked ? "text-warning" : "text-accent"}`}>
          {locked ? "Unlock to read" : "Open reader →"}
        </span>
      </div>
    </div>
  );

  if (locked) {
    return (
      <button
        type="button"
        onClick={openUpgrade}
        className="group card-surface relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]"
        aria-label={`${note.title} — premium, upgrade to read`}
      >
        <div className="relative">
          <div className="blur-[6px]">{cover}</div>
          <div className="absolute inset-0 grid place-items-center bg-background/30 backdrop-blur-[2px]">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-warning/30 bg-surface/90 shadow-sm">
              <Lock className="h-5 w-5 text-warning" />
            </span>
          </div>
        </div>
        {body}
      </button>
    );
  }

  return (
    <Link
      to="/notes/$noteId"
      params={{ noteId: note.id }}
      className="group card-surface flex flex-col overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      {cover}
      {body}
    </Link>
  );
}
