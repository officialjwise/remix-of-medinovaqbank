import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  downloadQuestionTemplate,
  useBulkUploadQuestions,
  useQuestionBanksLite,
} from "@/api/questions.api";

export const Route = createFileRoute("/admin/banks/$bankId/upload")({
  head: () => ({
    meta: [
      { title: "Admin · Bulk Upload — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBankUpload,
});

const COLUMNS = [
  "question number",
  "question stem",
  "options (A-D)",
  "right option",
  "difficulty (optional)",
  "topic (optional)",
];

const OPT_LETTERS = ["A", "B", "C", "D", "E"];
// Must match the backend QuestionDifficulty enum. Compared case-insensitively.
const DIFFICULTIES = ["easy", "medium", "hard"];

/** Normalise a header cell to one of our known fields. */
function classifyHeader(
  h: string,
): "num" | "stem" | "options" | "correct" | "difficulty" | "topic" | null {
  const s = h.toLowerCase().trim();
  if (s.includes("number") || s === "#" || s === "no") return "num";
  if (s.includes("stem") || (s.includes("question") && !s.includes("number"))) return "stem";
  // Check "right/correct/answer" BEFORE "option" — otherwise the header
  // "Right Option" matches `option` and the correct-answer column is lost.
  if (s.includes("right") || s.includes("correct") || s.includes("answer")) return "correct";
  if (s.includes("option")) return "options";
  if (s.includes("difficulty")) return "difficulty";
  if (s.includes("topic")) return "topic";
  return null;
}

/** Parse the packed "A. text\nB. text" options cell into {key,text}[]. */
function parseOptionsCell(cell: string): { key: string; text: string }[] {
  return cell
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^\(?([A-Ea-e])\)?[)..:-]?\s*(.*)$/);
      if (m) return { key: m[1].toUpperCase(), text: m[2].trim() };
      return { key: "", text: line };
    });
}

interface RowError {
  row: number;
  column?: string;
  reason: string;
}

interface PreviewRow {
  rowNum: number;
  data: Record<string, string>;
  errors: RowError[];
}

interface UploadResult {
  created: number;
  failed: number;
  errors: RowError[];
}

type Step = "upload" | "preview" | "importing" | "done";

const downloadCsv = () => {
  // Papa.unparse handles RFC-4180 quoting, including the newline-separated options cell.
  const sample = [
    {
      "question number": "1",
      "question stem":
        "A 45-year-old male presents with inferior ST elevation (II, III, aVF). Which artery is most likely occluded?",
      "options (A-D)":
        "A. Left anterior descending\nB. Right coronary artery\nC. Left circumflex\nD. Posterior descending",
      "right option": "B",
      "difficulty (optional)": "Medium",
      "topic (optional)": "Cardiology",
    },
  ];
  const csv = Papa.unparse({
    fields: COLUMNS,
    data: sample.map((r) => COLUMNS.map((c) => (r as Record<string, string>)[c])),
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question-bank-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const downloadErrors = (errors: RowError[]) => {
  const csv =
    "row,column,reason\n" +
    errors.map((e) => `${e.row},"${e.column ?? ""}","${e.reason.replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "upload-errors.csv";
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Parse an uploaded CSV with PapaParse (RFC-4180 quoting; handles commas, quotes,
 * and embedded newlines inside the packed "options (A-D)" cell). Validates each row.
 */
function parseCsvText(text: string): { rows: PreviewRow[]; fatal?: string } {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  const grid = result.data.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim()));
  if (grid.length === 0) return { rows: [], fatal: "The file is empty." };

  // Map header positions → fields.
  const header = grid[0].map((h) => String(h ?? ""));
  const colIndex: Record<string, number> = {};
  header.forEach((h, i) => {
    const field = classifyHeader(h);
    if (field && colIndex[field] === undefined) colIndex[field] = i;
  });
  if (
    colIndex.stem === undefined ||
    colIndex.options === undefined ||
    colIndex.correct === undefined
  ) {
    return {
      rows: [],
      fatal: "Missing required columns. Expected: question stem, options (A-D), right option.",
    };
  }

  const at = (r: string[], field: string) =>
    colIndex[field] !== undefined ? String(r[colIndex[field]] ?? "").trim() : "";

  const rows: PreviewRow[] = grid.slice(1).map((r, idx) => {
    const rowNum = idx + 2; // +1 for header, +1 for 1-based
    const stem = at(r, "stem");
    const optionsCell = at(r, "options");
    const correctRaw = at(r, "correct")
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    const difficulty = at(r, "difficulty");
    const topic = at(r, "topic");
    const options = parseOptionsCell(optionsCell);
    const errors: RowError[] = [];

    if (!stem)
      errors.push({ row: rowNum, column: "question stem", reason: "Question stem is required" });
    if (options.length < 2)
      errors.push({
        row: rowNum,
        column: "options (A-D)",
        reason: "At least 2 options are required (one per line, e.g. 'A. ...')",
      });
    if (options.some((o) => !o.key))
      errors.push({
        row: rowNum,
        column: "options (A-D)",
        reason: "Each option line must start with its letter (A., B., …)",
      });
    const optionKeys = options.map((o) => o.key);
    if (!correctRaw || !OPT_LETTERS.includes(correctRaw)) {
      errors.push({ row: rowNum, column: "right option", reason: "Must be one of A, B, C, D, E" });
    } else if (!optionKeys.includes(correctRaw)) {
      errors.push({
        row: rowNum,
        column: "right option",
        reason: `Letter ${correctRaw} has no matching option`,
      });
    }
    if (difficulty && !DIFFICULTIES.includes(difficulty.toLowerCase())) {
      errors.push({
        row: rowNum,
        column: "difficulty",
        reason: "Must be Easy, Medium, or Hard",
      });
    }

    return {
      rowNum,
      data: {
        question_text: stem,
        options_preview: options.map((o) => `${o.key || "?"}. ${o.text}`).join("  ·  "),
        correct_option: correctRaw || at(r, "correct"),
        difficulty,
        topic,
      },
      errors,
    };
  });

  return { rows };
}

function AdminBankUpload() {
  const { bankId } = Route.useParams();
  const { data: banks } = useQuestionBanksLite();
  const bank = banks?.find((b) => b.id === bankId);
  const bulkUpload = useBulkUploadQuestions();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewStats = useMemo(() => {
    const valid = preview.filter((r) => r.errors.length === 0).length;
    const invalid = preview.filter((r) => r.errors.length > 0).length;
    return { valid, invalid, total: preview.length };
  }, [preview]);

  const onPick = (f: File) => {
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      toast.error("File must be .csv or .xlsx");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File exceeds the 10MB limit");
      return;
    }
    // XLSX is parsed server-side; we only do a CSV pre-flight preview in-browser.
    if (/\.xlsx$/i.test(f.name)) {
      setFile(f);
      setResult(null);
      setPreview([]);
      setStep("preview");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, fatal } = parseCsvText(String(reader.result ?? ""));
      if (fatal) return toast.error(fatal);
      if (rows.length === 0) return toast.error("No data rows found beneath the header.");
      setFile(f);
      setResult(null);
      setPreview(rows);
      setStep("preview");
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsText(f);
  };

  /**
   * Send the original file to the backend, which parses + validates + persists.
   * We map the returned BulkUploadResult into the local UploadResult shape.
   */
  const doImport = async () => {
    if (!file) return;
    setStep("importing");
    setProgress(40);
    setResult(null);
    try {
      const res = await bulkUpload.mutateAsync({ bankId, file });
      setProgress(100);
      setResult({
        created: res.created,
        failed: res.failed,
        errors: res.errors.map((e) => ({ row: e.row, reason: e.reason })),
      });
      setStep("done");
      toast.success(`Import complete: ${res.created} created, ${res.failed} failed`);
    } catch (err) {
      setStep("preview");
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setStep("upload");
    setProgress(0);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/admin/banks"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Banks
      </Link>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
        Upload Question Bank
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bank: <span className="font-bold text-primary">{bank?.name ?? "Question bank"}</span>
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <span className={step === "upload" ? "text-primary" : "text-muted-foreground"}>
          1. Upload
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
        <span className={step === "preview" ? "text-primary" : "text-muted-foreground"}>
          2. Preview & Validate
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
        <span
          className={
            step === "importing" || step === "done" ? "text-primary" : "text-muted-foreground"
          }
        >
          3. Import
        </span>
      </div>

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <div className="mt-6 space-y-5 animate-slide-up">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt hover:border-border-strong transition-all"
            >
              <Download className="h-4 w-4 text-primary" /> Download Template CSV
            </button>
            <button
              onClick={() =>
                void downloadQuestionTemplate().catch((err) =>
                  toast.error(err instanceof Error ? err.message : "Could not download template"),
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt hover:border-border-strong transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-accent" /> Download Template XLSX
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onPick(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-surface p-12 text-center transition-all duration-300 ${dragOver ? "border-primary bg-primary/5 shadow-[var(--shadow-card-hover)]" : "border-border hover:border-border-strong hover:bg-surface-alt/30"}`}
            role="button"
            tabIndex={0}
          >
            <FileUp className="h-12 w-12 text-muted-foreground/60" />
            <p className="mt-4 text-[15px] font-bold text-foreground">
              Drag and drop your .csv or .xlsx file here
            </p>
            <p className="mt-2 text-sm text-muted-foreground">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
              }}
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface-alt/30 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Expected Columns
            </p>
            <p className="break-all font-mono text-xs text-foreground/80 leading-relaxed">
              {COLUMNS.join(" │ ")}
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === "preview" && file && (
        <div className="mt-6 space-y-5 animate-slide-up">
          {/* File info bar */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {previewStats.total} rows detected
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-alt transition-all"
            >
              <X className="h-3.5 w-3.5" /> Replace file
            </button>
          </div>

          {/* Validation summary */}
          {preview.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold text-success border border-success/20">
                <Check className="h-3.5 w-3.5" /> {previewStats.valid} valid
              </span>
              {previewStats.invalid > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error border border-error/20">
                  <AlertCircle className="h-3.5 w-3.5" /> {previewStats.invalid} with errors
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Final validation runs on the server when you import.
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              In-browser preview is available for CSV only. This file will be parsed and validated
              on the server when you import.
            </p>
          )}

          {/* Preview table (CSV pre-flight only) */}
          {preview.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/30">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">
                        Row
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-10">
                        ✓
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-w-[250px]">
                        Question
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Correct
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Difficulty
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Topic
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-w-[200px]">
                        Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => {
                      const hasErrors = row.errors.length > 0;
                      const errorColumns = new Set(row.errors.map((e) => e.column));
                      return (
                        <tr
                          key={row.rowNum}
                          className={`border-b border-border last:border-b-0 transition-colors ${hasErrors ? "bg-error/5 hover:bg-error/10" : "hover:bg-surface-alt/30"}`}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {row.rowNum}
                          </td>
                          <td className="px-4 py-3">
                            {hasErrors ? (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error/10">
                                <AlertCircle className="h-3.5 w-3.5 text-error" />
                              </span>
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                                <Check className="h-3.5 w-3.5 text-success" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`block max-w-[320px] truncate text-sm ${errorColumns.has("question stem") ? "font-bold text-error" : "text-foreground"}`}
                            >
                              {row.data.question_text || (
                                <span className="italic text-error">Empty</span>
                              )}
                            </span>
                            {row.data.options_preview && (
                              <span
                                className={`mt-0.5 block max-w-[320px] truncate text-xs ${errorColumns.has("options (A-D)") ? "text-error" : "text-muted-foreground"}`}
                                title={row.data.options_preview}
                              >
                                {row.data.options_preview}
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-bold ${errorColumns.has("right option") ? "text-error" : "text-foreground"}`}
                          >
                            {row.data.correct_option || "—"}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm ${errorColumns.has("difficulty") ? "font-bold text-error" : "text-foreground/80"}`}
                          >
                            {row.data.difficulty || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground/80">
                            {row.data.topic || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {hasErrors ? (
                              <div className="space-y-1">
                                {row.errors.map((e, i) => (
                                  <p key={i} className="text-xs font-medium text-error">
                                    <span className="font-bold text-error/70">{e.column}:</span>{" "}
                                    {e.reason}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-success/70">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              {preview.length > 0 && previewStats.invalid > 0 && (
                <p className="text-xs font-medium text-warning">
                  {previewStats.invalid} row{previewStats.invalid !== 1 ? "s" : ""} may be skipped
                  due to errors
                </p>
              )}
              <button
                onClick={doImport}
                disabled={bulkUpload.isPending || (preview.length > 0 && previewStats.valid === 0)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Check className="h-4 w-4" />{" "}
                {preview.length > 0 ? `Import ${previewStats.valid} Questions` : "Import Questions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Importing */}
      {step === "importing" && (
        <div className="mt-6 flex flex-col items-center justify-center py-16 animate-slide-up">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-bold text-foreground">Importing questions…</p>
          <p className="mt-1 text-sm text-muted-foreground">{progress}% complete</p>
          <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === "done" && result && (
        <div className="mt-6 space-y-5 animate-slide-up">
          <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold text-success border border-success/20">
                  <Check className="h-3.5 w-3.5" /> {result.created} created
                </span>
                {result.failed > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error border border-error/20">
                    <AlertCircle className="h-3.5 w-3.5" /> {result.failed} failed
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <button
                  onClick={() => downloadErrors(result.errors)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt transition-all"
                >
                  <Download className="h-3.5 w-3.5 text-primary" /> Export Errors CSV
                </button>
              )}
            </header>
            {result.errors.length > 0 && (
              <div>
                <div className="grid grid-cols-[60px_1fr] gap-4 border-b border-border bg-surface-alt/30 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Row</span>
                  <span>Reason</span>
                </div>
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[60px_1fr] gap-4 border-b border-border px-6 py-3 last:border-b-0 hover:bg-surface-alt/20 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-foreground">{e.row}</span>
                    <span className="text-sm text-error font-medium">{e.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt transition-all"
            >
              Upload Another File
            </button>
            <Link
              to="/admin/banks"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-5 text-sm font-bold text-primary hover:bg-primary/20 transition-all"
            >
              Back to Banks
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
