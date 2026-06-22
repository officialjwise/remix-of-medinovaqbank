import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, FileUp, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";

export const Route = createFileRoute("/admin/banks/$bankId/upload")({
  head: () => ({ meta: [{ title: "Admin · Bulk Upload — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBankUpload,
});

const COLUMNS = [
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_option",
  "difficulty",
  "topic",
  "tags",
];

interface RowError {
  row: number;
  reason: string;
}

interface UploadResult {
  created: number;
  failed: number;
  errors: RowError[];
}

const downloadCsv = () => {
  const csv = COLUMNS.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question-bank-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const downloadErrors = (errors: RowError[]) => {
  const csv = "row,reason\n" + errors.map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "upload-errors.csv";
  a.click();
  URL.revokeObjectURL(url);
};

function AdminBankUpload() {
  const { bankId } = Route.useParams();
  const bank = questionBanks.find((b) => b.id === bankId);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!bank) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Bank not found.</p>
        <Link to="/admin/banks" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">← Back to banks</Link>
      </div>
    );
  }

  const onPick = (f: File) => {
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      toast.error("File must be .csv or .xlsx");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setResult(null);
    // Simulated upload
    for (let i = 1; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 40));
      setProgress(i);
    }
    setUploading(false);
    setResult({
      created: 120,
      failed: 3,
      errors: [
        { row: 14, reason: "correct_option must be one of A,B,C,D,E" },
        { row: 38, reason: "option_a is empty" },
        { row: 91, reason: "difficulty must be Beginner, Intermediate, or Advanced" },
      ],
    });
    toast.success("Import complete: 120 created, 3 failed");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/banks" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Banks
      </Link>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Upload Question Bank</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Bank: <span className="font-semibold text-foreground">{bank.name}</span></p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={downloadCsv} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
          <Download className="h-4 w-4" /> Download Template CSV
        </button>
        <button onClick={() => toast.info("XLSX template — same columns")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
          <FileSpreadsheet className="h-4 w-4" /> Download Template XLSX
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPick(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-surface p-10 text-center transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-border hover:bg-surface-alt"}`}
        role="button"
        tabIndex={0}
      >
        <FileUp className="h-10 w-10 text-muted-foreground" />
        {file ? (
          <>
            <p className="mt-3 text-sm font-semibold text-foreground">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · click to replace</p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-semibold text-foreground">Drag and drop your .csv or .xlsx file here</p>
            <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
          </>
        )}
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface-alt/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Expected Columns</p>
        <p className="mt-1.5 break-all font-mono text-xs text-foreground">
          {COLUMNS.join(" | ")}
        </p>
      </div>

      <button
        onClick={upload}
        disabled={!file || uploading}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading… {progress}%</> : "Upload and Import"}
      </button>

      {uploading && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-bold text-success">
                <Check className="h-3 w-3" /> {result.created} created
              </span>
              {result.failed > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error-light px-2.5 py-0.5 text-xs font-bold text-error">
                  <AlertCircle className="h-3 w-3" /> {result.failed} failed
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <button onClick={() => downloadErrors(result.errors)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt">
                <Download className="h-3.5 w-3.5" /> Errors CSV
              </button>
            )}
          </header>
          {result.errors.length > 0 && (
            <div>
              <div className="grid grid-cols-[80px_1fr] gap-4 border-b border-border bg-surface-alt/40 px-5 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <span>Row</span>
                <span>Reason</span>
              </div>
              {result.errors.map((e) => (
                <div key={e.row} className="grid grid-cols-[80px_1fr] gap-4 border-b border-border px-5 py-2 last:border-b-0">
                  <span className="font-mono text-xs text-foreground">{e.row}</span>
                  <span className="text-sm text-error">{e.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
