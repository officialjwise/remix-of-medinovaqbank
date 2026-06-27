import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Trial+Paid = everyone; Paid Only = paid users only (trial sees locked); Hidden = nobody. */
export type NoteTier = "trial_paid" | "paid_only" | "hidden";
export type NoteStatus = "processing" | "ready" | "failed";

export interface NoteTopic {
  id: string;
  name: string;
  pageStart: number;
  pageEnd: number;
  /** When the note is Trial+Paid, hide this topic's pages from trial users. */
  hiddenForTrial: boolean;
}

export interface AdminNote {
  id: string;
  title: string;
  description: string;
  category: string;
  examType: string;
  coverColor: string;
  tier: NoteTier;
  status: NoteStatus;
  pageCount: number;
  topics: NoteTopic[];
  active: boolean;
  createdAt: string;
  subscribers: number;
  /** Source bullets used to synthesize page text (mock; real app streams images). */
  source: string[];
}

export const TIER_LABELS: Record<NoteTier, string> = {
  trial_paid: "Trial + Paid",
  paid_only: "Paid Only",
  hidden: "Hidden",
};

/* ------------------------------------------------------------------ */
/* Page content (simulated — real app serves watermarked page images)  */
/* ------------------------------------------------------------------ */

export interface NotePageContent {
  page: number;
  topicId: string | null;
  topicName: string;
  heading: string;
  paragraphs: string[];
}

const FILLER = [
  "Recognise the classic presentation early — the highest-yield discriminator is the combination of history, examination findings, and the single confirmatory investigation.",
  "Management is stepwise: stabilise, confirm the diagnosis, then treat the underlying cause while monitoring for the common complications.",
  "Examiners reward candidates who can justify why each alternative is wrong, not merely identify the correct answer.",
  "Remember the red-flags that mandate escalation, and the contraindications that change first-line therapy.",
];

export function getNotePageContent(note: AdminNote, page: number): NotePageContent {
  const topic = note.topics.find((t) => page >= t.pageStart && page <= t.pageEnd) ?? null;
  const src = note.source.length ? note.source : FILLER;
  const lead = src[(page - 1) % src.length];
  const extra = FILLER[(page + note.id.length) % FILLER.length];
  return {
    page,
    topicId: topic?.id ?? null,
    topicName: topic?.name ?? "General",
    heading: `${note.title} — ${topic?.name ?? "General"} (p.${page})`,
    paragraphs: [lead, extra, src[(page + 2) % src.length] ?? extra],
  };
}

/** Simulated signed-URL fetch: returns ONE page at a time with a short delay. */
export function fetchNotePage(note: AdminNote, page: number): Promise<NotePageContent> {
  return new Promise((resolve) => setTimeout(() => resolve(getNotePageContent(note, page)), 220));
}

/** Pages a trial user is allowed to see for a Trial+Paid note (hidden topics removed). */
export function trialHiddenPages(note: AdminNote): Set<number> {
  const hidden = new Set<number>();
  for (const t of note.topics) {
    if (t.hiddenForTrial) for (let p = t.pageStart; p <= t.pageEnd; p++) hidden.add(p);
  }
  return hidden;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface NotesState {
  notes: AdminNote[];
  add: (note: Omit<AdminNote, "id" | "createdAt" | "status" | "subscribers">) => string;
  update: (id: string, patch: Partial<AdminNote>) => void;
  remove: (id: string) => void;
  toggleActive: (id: string) => void;
  reprocess: (id: string) => void;
  setTopics: (id: string, topics: NoteTopic[]) => void;
  getById: (id: string) => AdminNote | undefined;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      // GAP: admin high-yield notes management is a local-only screen; the real
      // backend notes API (@/api/notes.api) serves the user-facing reader. No
      // mock seed — starts empty until an admin adds notes.
      notes: [],
      add: (note) => {
        const id = `note-${Date.now().toString(36)}`;
        set((s) => ({
          notes: [
            {
              ...note,
              id,
              status: "processing",
              subscribers: 0,
              createdAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        }));
        // Simulate processing → ready.
        setTimeout(
          () =>
            set((s) => ({
              notes: s.notes.map((n) => (n.id === id ? { ...n, status: "ready" } : n)),
            })),
          2200,
        );
        return id;
      },
      update: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      remove: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      toggleActive: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, active: !n.active } : n)),
        })),
      reprocess: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, status: "processing" } : n)),
        }));
        setTimeout(
          () =>
            set((s) => ({
              notes: s.notes.map((n) => (n.id === id ? { ...n, status: "ready" } : n)),
            })),
          2000,
        );
      },
      setTopics: (id, topics) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, topics } : n)) })),
      getById: (id) => get().notes.find((n) => n.id === id),
    }),
    { name: "medinova-notes-v2", version: 2 },
  ),
);
