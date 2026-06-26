import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Edit, Eye, Filter } from "lucide-react";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import type { Question } from "@/types";

export const Route = createFileRoute("/admin/questions/")({
  head: () => ({
    meta: [
      { title: "Admin · Questions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminQuestions,
});

function AdminQuestions() {
  const [query, setQuery] = useState("");
  const [bankFilter, setBankFilter] = useState("All");

  const allQuestions: Question[] = useMemo(
    () => questionBanks.flatMap((b) => getQuestionsForBank(b.id, 12)),
    [],
  );

  const rows = useMemo(() => {
    return allQuestions.filter((q) => {
      if (bankFilter !== "All" && q.bankId !== bankFilter) return false;
      if (query.trim()) {
        const s = query.toLowerCase();
        return q.stem.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s);
      }
      return true;
    });
  }, [query, bankFilter, allQuestions]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {allQuestions.length.toLocaleString()} questions across {questionBanks.length} banks
          </p>
        </div>
        <Link
          to="/admin/questions/create"
          search={{ bankId: undefined }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-md hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Question
        </Link>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, topics…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm"
          >
            <option value="All">All banks</option>
            {questionBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting filters or create a new question.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-alt/50 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3">Bank</th>
                <th className="px-5 py-3">Topic</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((q) => {
                const bank = questionBanks.find((b) => b.id === q.bankId);
                return (
                  <tr key={q.id} className="hover:bg-surface-alt/40">
                    <td className="max-w-[420px] truncate px-5 py-3 font-medium text-foreground">{q.stem}</td>
                    <td className="px-5 py-3 text-muted-foreground">{bank?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{q.topic}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase">
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to="/admin/banks/$bankId/questions/$questionId"
                          params={{ bankId: q.bankId, questionId: q.id }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-alt"
                          aria-label="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          to="/admin/banks/$bankId/questions/$questionId"
                          params={{ bankId: q.bankId, questionId: q.id }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-alt"
                          aria-label="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}