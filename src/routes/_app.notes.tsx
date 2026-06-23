import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Clock, Search, Sparkles } from "lucide-react";
import { highYieldNotes } from "@/data/notes";

export const Route = createFileRoute("/_app/notes")({
  head: () => ({
    meta: [
      { title: "High Yield Notes — Medinovaqbank" },
      { name: "description", content: "Curated, exam-focused clinical notes for rapid revision." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("All");
  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(highYieldNotes.map((n) => n.subject)))],
    [],
  );
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return highYieldNotes.filter((n) => {
      if (subject !== "All" && n.subject !== subject) return false;
      if (!needle) return true;
      return (
        n.title.toLowerCase().includes(needle) ||
        n.summary.toLowerCase().includes(needle) ||
        n.bullets.some((b) => b.toLowerCase().includes(needle))
      );
    });
  }, [q, subject]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="card-surface relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              <Sparkles className="h-3 w-3" /> Curated for exams
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              High Yield Notes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Concise, board-style revision notes written and reviewed by Ghanaian clinicians.
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
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No notes match your search.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((n) => (
            <article key={n.id} className="card-surface overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${n.subjectColor}`} />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    <BookOpen className="h-3 w-3" />
                    {n.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {n.readMinutes} min read
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">{n.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{n.summary}</p>

                <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                  {n.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {n.pearls.length > 0 && (
                  <div className="mt-4 rounded-xl border border-accent/20 bg-accent-light/40 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                      💡 Clinical Pearls
                    </p>
                    <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                      {n.pearls.map((p, i) => (
                        <li key={i}>· {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
