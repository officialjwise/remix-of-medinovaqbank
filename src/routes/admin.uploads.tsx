import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Download, FileSpreadsheet, FileUp, Library, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useAdminBanks } from "@/api/banks.api";

export const Route = createFileRoute("/admin/uploads")({
  head: () => ({
    meta: [
      { title: "Admin · Bulk Uploads — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUploads,
});

const COLUMNS = [
  "question number",
  "question stem",
  "options (A-D)",
  "right option",
  "difficulty (optional)",
  "topic (optional)",
];

const downloadTemplate = (ext: "csv" | "xlsx") => {
  // Options column uses newline-separated, letter-prefixed entries inside a single quoted cell.
  const header = COLUMNS.join(",");
  const sample = `1,"A 45-year-old male with inferior ST elevation. Which artery is occluded?","A. Left anterior descending\nB. Right coronary artery\nC. Left circumflex\nD. Posterior descending",B,Intermediate,Cardiology`;
  const blob = new Blob([`${header}\n${sample}\n`], {
    type: ext === "csv" ? "text/csv" : "application/vnd.ms-excel",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `question-bank-template.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${ext.toUpperCase()} template downloaded`);
};

function AdminUploads() {
  const navigate = useNavigate();
  const [bankId, setBankId] = useState<string>("");
  const { data: banksData } = useAdminBanks({ limit: 100 });
  const banks = banksData?.banks ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Bulk Uploads</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Import questions into any bank from a CSV or XLSX file.
        </p>
      </div>

      {/* Quick start: pick a bank → go to its upload flow */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UploadCloud className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Start an upload</h3>
            <p className="text-xs text-muted-foreground">
              Choose the target bank, then drag and drop your file.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Target bank
            </span>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a question bank…</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.questionCount.toLocaleString()} questions
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!bankId}
            onClick={() => navigate({ to: "/admin/banks/$bankId/upload", params: { bankId } })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Templates + format */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold text-foreground">Templates</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Start from a correctly formatted file.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => downloadTemplate("csv")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <Download className="h-4 w-4 text-primary" /> CSV Template
            </button>
            <button
              onClick={() => downloadTemplate("xlsx")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <FileSpreadsheet className="h-4 w-4 text-accent" /> XLSX Template
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold text-foreground">Expected columns</h3>
          <p className="mt-2 break-words font-mono text-xs leading-relaxed text-muted-foreground">
            {COLUMNS.join("  │  ")}
          </p>
          <p className="mt-3 rounded-lg bg-surface-alt/60 p-3 text-xs text-muted-foreground">
            Put <span className="font-semibold text-foreground">each option on its own line</span>{" "}
            inside the options cell, prefixed with its letter — e.g.{" "}
            <span className="font-mono text-foreground">A. First option</span>. The{" "}
            <span className="font-semibold text-foreground">right option</span> column is just the
            letter (A–E).
          </p>
        </div>
      </section>

      {/* Per-bank shortcuts */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Upload into a specific bank
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((b) => (
            <button
              key={b.id}
              onClick={() =>
                navigate({ to: "/admin/banks/$bankId/upload", params: { bankId: b.id } })
              }
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: b.accentHex }}
              >
                <Library className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {b.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {b.questionCount.toLocaleString()} questions
                </span>
              </span>
              <FileUp className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
