import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  Loader2,
  X,
  ShieldCheck,
  Lock,
  EyeOff,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useUploadNote, TIER_LABELS, type NoteTier } from "@/api/admin-notes.api";
import { useExamTypes } from "@/api/exam-types.api";
import { useCategories } from "@/api/categories.api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/notes/upload")({
  head: () => ({
    meta: [
      { title: "Admin · Upload Note — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UploadNotePage,
});

const MAX_BYTES = 50 * 1024 * 1024;

const TIER_OPTIONS: {
  value: NoteTier;
  icon: typeof ShieldCheck;
  blurb: string;
  tone: string;
}[] = [
  {
    value: "trial_and_paid",
    icon: ShieldCheck,
    blurb: "Visible to everyone. You can hide individual topics from trial users later.",
    tone: "text-success",
  },
  {
    value: "paid_only",
    icon: Lock,
    blurb: "Only paid subscribers can open it. Trial users see it locked.",
    tone: "text-warning",
  },
  {
    value: "none",
    icon: EyeOff,
    blurb: "Hidden from everyone — keep it as a draft until you're ready.",
    tone: "text-error",
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadNotePage() {
  const navigate = useNavigate();
  const upload = useUploadNote();
  const { data: categories = [] } = useCategories();
  const { data: examTypes = [] } = useExamTypes();

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [tier, setTier] = useState<NoteTier>("trial_and_paid");

  // Categories load async; default to the first once available.
  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
  }, [categories, categoryId]);
  // Exam types load async; default to the first once available.
  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].id);
  }, [examTypes, examTypeId]);

  const onPick = (f: File) => {
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File exceeds the 50MB limit");
      return;
    }
    setFile(f);
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!file) {
      toast.error("Select a PDF to upload");
      return;
    }
    if (!categoryId) {
      toast.error("Choose a category");
      return;
    }
    if (!examTypeId) {
      toast.error("Choose an exam type");
      return;
    }

    upload.mutate(
      {
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        examTypeId,
        accessTier: tier,
      },
      {
        onSuccess: (note) => {
          toast.success("Upload received — converting pages…");
          navigate({ to: "/admin/notes/$noteId", params: { noteId: note.id } });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        },
      },
    );
  };

  if (upload.isPending) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-bold text-foreground">Processing your note…</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We're converting <span className="font-semibold text-foreground">{file?.name}</span> into
          protected page images. Conversion may take a moment — you'll be taken to the note as soon
          as it's queued.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/notes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Notes
      </Link>

      <header className="mt-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload High-Yield Note
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF and we'll convert it into protected, watermarked page images. Users never
          receive the original PDF — pages are streamed one at a time as images.
        </p>
      </header>

      {/* PDF upload */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Source PDF
        </h3>
        {file ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-alt/40 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · PDF</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ) : (
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={cn(
              "mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-surface p-12 text-center transition-all",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border-strong hover:bg-surface-alt/30",
            )}
          >
            <FileUp className="h-12 w-12 text-muted-foreground/60" />
            <p className="mt-4 text-[15px] font-bold text-foreground">
              Drag and drop your PDF here
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              or click to browse · PDF only · up to 50MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
              }}
            />
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ImageIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
          The PDF is never delivered to users. After conversion, each page is served as a protected
          image to prevent downloading or printing the source.
        </p>
      </section>

      {/* Metadata */}
      <section className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Details</h3>

        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Acute Coronary Syndromes — STEMI vs NSTEMI"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary shown on the note card…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            {categories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-alt/40 px-3 py-3 text-xs text-muted-foreground">
                No categories yet.{" "}
                <Link to="/admin/categories" className="font-semibold text-accent hover:underline">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Exam Type">
            {examTypes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-alt/40 px-3 py-3 text-xs text-muted-foreground">
                No active exam types.{" "}
                <Link to="/admin/exam-types" className="font-semibold text-accent hover:underline">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <select
                value={examTypeId}
                onChange={(e) => setExamTypeId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {examTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </section>

      {/* Access tier */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Access Tier
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Who can open this note once it's live.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TIER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = tier === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTier(opt.value)}
                className={cn(
                  "flex flex-col rounded-xl border p-4 text-left transition",
                  selected
                    ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                    : "border-border bg-surface hover:border-border-strong hover:bg-surface-alt/30",
                )}
              >
                <span className="flex items-center justify-between">
                  <Icon className={cn("h-5 w-5", opt.tone)} />
                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </span>
                <span className="mt-2 text-sm font-bold text-foreground">
                  {TIER_LABELS[opt.value]}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">{opt.blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <Link
          to="/admin/notes"
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
        >
          <X className="h-4 w-4" /> Cancel
        </Link>
        <button
          onClick={submit}
          disabled={upload.isPending}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}{" "}
          Upload & Process
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}
