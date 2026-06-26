import { useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Info, Lock, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import type { Difficulty } from "@/types";

export const OPT_KEYS = ["A", "B", "C", "D", "E"] as const;
export type OptKey = (typeof OPT_KEYS)[number];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export interface QuestionFormValues {
  bankId: string;
  stem: string;
  imageUrl: string;
  difficulty: Difficulty;
  topic: string;
  tags: string[];
  options: { key: OptKey; text: string; imageUrl?: string }[];
  correctKey: OptKey;
  baseExplanation: string;
}

export function emptyQuestion(bankId: string): QuestionFormValues {
  return {
    bankId,
    stem: "",
    imageUrl: "",
    difficulty: "Intermediate",
    topic: "",
    tags: [],
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    correctKey: "A",
    baseExplanation: "",
  };
}

/** Validate an image file (type + size) then read it to a data URL. Toasts on failure. */
function readImageFile(file: File | undefined | null, onDone: (dataUrl: string) => void) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast.error("Please choose an image file");
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error("Image must be 5MB or smaller");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onDone(reader.result);
  };
  reader.onerror = () => toast.error("Could not read that image");
  reader.readAsDataURL(file);
}

export function QuestionForm({
  mode,
  initial,
  lockBank = false,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial: QuestionFormValues;
  lockBank?: boolean;
  onSubmit: (values: QuestionFormValues, publish: boolean) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<QuestionFormValues>(initial);
  const [tagInput, setTagInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const stemFileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof QuestionFormValues>(k: K, val: QuestionFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  function setOptionImage(key: OptKey, imageUrl: string | undefined) {
    set(
      "options",
      v.options.map((x) => (x.key === key ? { ...x, imageUrl } : x)),
    );
  }

  const valid = useMemo(
    () =>
      !!v.stem.trim() &&
      v.bankId &&
      v.options.every((o) => o.text.trim()) &&
      v.options.some((o) => o.key === v.correctKey),
    [v],
  );

  function submit(publish: boolean) {
    if (!v.bankId) return toast.error("Choose a question bank");
    if (!v.stem.trim()) return toast.error("Question stem is required");
    if (v.options.some((o) => !o.text.trim()))
      return toast.error("Every option needs text (or remove it)");
    if (!v.options.some((o) => o.key === v.correctKey))
      return toast.error("Mark exactly one option as correct");
    onSubmit(v, publish);
  }

  function addOption() {
    if (v.options.length >= 5) return;
    set("options", [...v.options, { key: OPT_KEYS[v.options.length], text: "" }]);
  }
  function removeOption(key: OptKey) {
    if (v.options.length <= 2) return;
    const filtered = v.options
      .filter((o) => o.key !== key)
      .map((o, i) => ({ ...o, key: OPT_KEYS[i] }));
    setV((p) => ({
      ...p,
      options: filtered,
      correctKey: p.correctKey === key ? filtered[0].key : p.correctKey,
    }));
  }
  function addTag() {
    const t = tagInput.trim();
    if (t && !v.tags.includes(t)) set("tags", [...v.tags, t]);
    setTagInput("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* ---- Content ---- */}
      <div className="space-y-5">
        <section className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <Field label="Question bank">
            <div className="relative">
              <select
                value={v.bankId}
                disabled={lockBank}
                onChange={(e) => set("bankId", e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a bank…</option>
                {questionBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {lockBank && (
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </Field>

          <Field label="Question stem">
            <textarea
              rows={5}
              value={v.stem}
              onChange={(e) => set("stem", e.target.value)}
              placeholder="A 45-year-old man presents with…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Question image (optional)">
            {v.imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border bg-surface-alt/30">
                <img
                  src={v.imageUrl}
                  alt="Question illustration"
                  className="max-h-72 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => set("imageUrl", "")}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/70 text-white backdrop-blur hover:bg-error"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => stemFileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  readImageFile(e.dataTransfer.files?.[0], (url) => set("imageUrl", url));
                }}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-surface-alt/20 hover:border-primary/50 hover:bg-surface-alt/40"}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Drag &amp; drop an image, or click to browse
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG or GIF — up to 5MB</span>
              </button>
            )}
            <input
              ref={stemFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                readImageFile(e.target.files?.[0], (url) => set("imageUrl", url));
                e.target.value = "";
              }}
            />
          </Field>
        </section>

        {/* Options */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Answer options</h3>
              <p className="text-xs text-muted-foreground">
                Select the radio to mark the correct answer. 2–5 options.
              </p>
            </div>
            {v.options.length < 5 && (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
              >
                <Plus className="h-3.5 w-3.5" /> Add option {OPT_KEYS[v.options.length]}
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {v.options.map((o) => {
              const isCorrect = v.correctKey === o.key;
              return (
                <div
                  key={o.key}
                  className={`rounded-lg border p-1.5 transition-colors ${isCorrect ? "border-success/40 bg-success/5" : "border-border"}`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("correctKey", o.key)}
                      title={isCorrect ? "Correct answer" : "Mark as correct"}
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isCorrect ? "bg-success text-white" : "bg-surface-alt text-foreground hover:bg-success/10"}`}
                    >
                      {isCorrect ? <Check className="h-4 w-4" /> : o.key}
                    </button>
                    <input
                      value={o.text}
                      onChange={(e) =>
                        set(
                          "options",
                          v.options.map((x) =>
                            x.key === o.key ? { ...x, text: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder={`Option ${o.key}`}
                      className="h-9 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground focus:border-border focus:bg-surface focus:outline-none"
                    />
                    {isCorrect && (
                      <span className="hidden flex-shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success sm:inline">
                        Correct
                      </span>
                    )}
                    <OptionImageButton
                      hasImage={!!o.imageUrl}
                      onPick={(url) => setOptionImage(o.key, url)}
                    />
                    {v.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(o.key)}
                        className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {o.imageUrl && (
                    <div className="relative mt-1.5 ml-11 inline-block overflow-hidden rounded-md border border-border bg-surface-alt/30">
                      <img
                        src={o.imageUrl}
                        alt={`Option ${o.key} illustration`}
                        className="max-h-28 w-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setOptionImage(o.key, undefined)}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground/70 text-white hover:bg-error"
                        aria-label={`Remove option ${o.key} image`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Explanation info */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Explanations are generated automatically
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Clinical breakdowns are generated when a student answers this question — the system
                explains why the correct answer is right, why each wrong option is incorrect, and
                the scenarios where each option would apply. You don't need to write an explanation.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Base explanation — admin reference only (optional)
            </label>
            <textarea
              rows={3}
              value={v.baseExplanation}
              onChange={(e) => set("baseExplanation", e.target.value)}
              placeholder="Internal notes to steer the AI or for reviewer context. Not shown to students."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </section>
      </div>

      {/* ---- Sidebar ---- */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold text-foreground">Classification</h3>
          <div className="mt-3 space-y-4">
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Difficulty
              </span>
              <div className="inline-flex w-full rounded-lg border border-border bg-surface-alt/40 p-0.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("difficulty", d)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${v.difficulty === d ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Topic">
              <input
                value={v.topic}
                onChange={(e) => set("topic", e.target.value)}
                placeholder="e.g. Cardiology"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Tags
              </span>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2">
                {v.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "tags",
                          v.tags.filter((x) => x !== t),
                        )
                      }
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Add tag…"
                  className="min-w-[6rem] flex-1 bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={!valid}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent text-sm font-bold text-white shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "create" ? "Publish question" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
}

/** Compact per-option image picker (hidden file input + small button). */
function OptionImageButton({
  hasImage,
  onPick,
}: {
  hasImage: boolean;
  onPick: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        title={hasImage ? "Replace option image" : "Add an image to this option"}
        aria-label={hasImage ? "Replace option image" : "Add option image"}
        className={`flex-shrink-0 rounded-md p-1.5 transition-colors ${hasImage ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"}`}
      >
        <ImagePlus className="h-4 w-4" />
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          readImageFile(e.target.files?.[0], onPick);
          e.target.value = "";
        }}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
