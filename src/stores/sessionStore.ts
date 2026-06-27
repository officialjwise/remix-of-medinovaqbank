import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * HYBRID session UI store.
 *
 * The session lifecycle (create / fetch state / submit / complete / results /
 * review) now lives entirely on the server and is driven through TanStack Query
 * mutations in `@/api/quiz.api`. This store holds ONLY transient, client-side UI
 * state that the server neither owns nor needs to know about mid-quiz:
 *
 *   - `selected`     : the currently-picked (but not-yet-submitted) option per
 *                      question, keyed by questionId. Cleared once submitted.
 *   - `submittedAnswerId` : the answerId returned by the submit endpoint, kept so
 *                      tutor mode can fetch the clinical breakdown for it.
 *   - `bookmarked` / `flagged` : per-question UI toggles (no backend field yet).
 *
 * It deliberately does NOT store question content, the correct answer, scores,
 * or any session metadata — all of that is fetched on demand from the server so
 * the question bank can never be extracted from client state.
 */

export type OptionLabel = "A" | "B" | "C" | "D" | "E";

/** Per-session transient UI state, keyed by sessionId. */
interface SessionUI {
  /** questionId -> selected option id (pre-submit only). */
  selected: Record<string, string>;
  /** questionId -> answerId returned by the submit endpoint. */
  submittedAnswerId: Record<string, string>;
  /** questionId -> true if the user submitted (in this client). */
  submitted: Record<string, true>;
  bookmarked: Record<string, true>;
  flagged: Record<string, true>;
}

interface SessionUIState {
  ui: Record<string, SessionUI>;
  /** Pick (but do not submit) an option for a question. */
  selectOption: (sessionId: string, questionId: string, optionId: string) => void;
  /** Record that a question was submitted, storing the resulting answerId. */
  markSubmitted: (sessionId: string, questionId: string, answerId: string) => void;
  toggleBookmark: (sessionId: string, questionId: string) => void;
  toggleFlag: (sessionId: string, questionId: string) => void;
  /** Clear all UI state for a session (e.g. after completion). */
  resetSession: (sessionId: string) => void;
}

const EMPTY_UI: SessionUI = {
  selected: {},
  submittedAnswerId: {},
  submitted: {},
  bookmarked: {},
  flagged: {},
};

function ensure(ui: Record<string, SessionUI>, sessionId: string): SessionUI {
  return ui[sessionId] ?? EMPTY_UI;
}

export const useSessionStore = create<SessionUIState>()(
  persist(
    (set, get) => ({
      ui: {},
      selectOption: (sessionId, questionId, optionId) => {
        const cur = ensure(get().ui, sessionId);
        // Don't allow changing a selection after submission.
        if (cur.submitted[questionId]) return;
        set({
          ui: {
            ...get().ui,
            [sessionId]: {
              ...cur,
              selected: { ...cur.selected, [questionId]: optionId },
            },
          },
        });
      },
      markSubmitted: (sessionId, questionId, answerId) => {
        const cur = ensure(get().ui, sessionId);
        set({
          ui: {
            ...get().ui,
            [sessionId]: {
              ...cur,
              submitted: { ...cur.submitted, [questionId]: true },
              submittedAnswerId: {
                ...cur.submittedAnswerId,
                [questionId]: answerId,
              },
            },
          },
        });
      },
      toggleBookmark: (sessionId, questionId) => {
        const cur = ensure(get().ui, sessionId);
        const next = { ...cur.bookmarked };
        if (next[questionId]) delete next[questionId];
        else next[questionId] = true;
        set({
          ui: { ...get().ui, [sessionId]: { ...cur, bookmarked: next } },
        });
      },
      toggleFlag: (sessionId, questionId) => {
        const cur = ensure(get().ui, sessionId);
        const next = { ...cur.flagged };
        if (next[questionId]) delete next[questionId];
        else next[questionId] = true;
        set({ ui: { ...get().ui, [sessionId]: { ...cur, flagged: next } } });
      },
      resetSession: (sessionId) => {
        const { [sessionId]: _drop, ...rest } = get().ui;
        void _drop;
        set({ ui: rest });
      },
    }),
    { name: "medinova-session-ui" },
  ),
);

/** Selector helper: read a session's UI state (always defined). */
export function useSessionUI(sessionId: string): SessionUI {
  return useSessionStore((s) => s.ui[sessionId] ?? EMPTY_UI);
}
