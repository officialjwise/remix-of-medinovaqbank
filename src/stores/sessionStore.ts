import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveSession, Question, QuizMode } from "@/types";
import { getQuestionsForBank } from "@/data/questions";
import { questionBanks, recentSessions } from "@/data/banks";

type OptKey = "A" | "B" | "C" | "D" | "E";

interface SessionState {
  sessions: Record<string, ActiveSession>;
  questions: Record<string, Question>; // keyed by question id
  createSession: (input: {
    bankId: string;
    mode: QuizMode;
    count: number;
    topics: string[];
    difficulty: string;
    durationSec?: number;
  }) => string;
  /**
   * Rebuild a completed, read-only session from the history list so the
   * results/review pages work for past quizzes. Returns true if the session
   * exists (or was reconstructed), false if the id is unknown.
   */
  ensureHistoricalSession: (sessionId: string) => boolean;
  selectAnswer: (sessionId: string, qid: string, key: OptKey) => void;
  submitAnswer: (sessionId: string, qid: string) => void;
  toggleBookmark: (sessionId: string, qid: string) => void;
  finishSession: (sessionId: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      questions: {},
      createSession: ({ bankId, mode, count, topics, difficulty, durationSec }) => {
        const bank = questionBanks.find((b) => b.id === bankId);
        const questions = getQuestionsForBank(bankId, count, topics, difficulty);
        const id = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const qMap: Record<string, Question> = { ...get().questions };
        for (const q of questions) qMap[q.id] = q;
        const session: ActiveSession = {
          id,
          bankId,
          bankName: bank?.name ?? "Question Bank",
          mode,
          questionIds: questions.map((q) => q.id),
          answers: {},
          submitted: {},
          bookmarked: {},
          startedAt: new Date().toISOString(),
          durationSec,
        };
        set({ sessions: { ...get().sessions, [id]: session }, questions: qMap });
        return id;
      },
      ensureHistoricalSession: (sessionId) => {
        if (get().sessions[sessionId]) return true;
        const summary = recentSessions.find((s) => s.id === sessionId);
        if (!summary) return false;

        const bank = questionBanks.find((b) => b.id === summary.bankId);
        const questions = getQuestionsForBank(summary.bankId, summary.totalQuestions, [], "All");
        const qMap: Record<string, Question> = { ...get().questions };
        for (const q of questions) qMap[q.id] = q;

        // Deterministically assign answers so the reconstructed score matches the
        // recorded scorePct: the first N (by score) are correct, the rest wrong.
        const answeredCount = summary.inProgress ? summary.questionsAnswered : questions.length;
        const correctTarget = Math.round((summary.scorePct / 100) * questions.length);
        const answers: Record<string, OptKey> = {};
        const submitted: Record<string, true> = {};
        questions.forEach((q, i) => {
          if (i >= answeredCount) return; // unanswered (in-progress tail)
          if (i < correctTarget) {
            answers[q.id] = q.correctKey;
          } else {
            const wrong = (q.options.find((o) => o.key !== q.correctKey)?.key ?? q.correctKey) as OptKey;
            answers[q.id] = wrong;
          }
          if (!summary.inProgress || i < summary.questionsAnswered) submitted[q.id] = true;
        });

        const session: ActiveSession = {
          id: sessionId,
          bankId: summary.bankId,
          bankName: bank?.name ?? summary.bankName,
          mode: summary.mode,
          questionIds: questions.map((q) => q.id),
          answers,
          submitted,
          bookmarked: {},
          startedAt: summary.completedAt,
        };
        set({ sessions: { ...get().sessions, [sessionId]: session }, questions: qMap });
        return true;
      },
      selectAnswer: (sessionId, qid, key) => {
        const s = get().sessions[sessionId];
        if (!s || s.submitted[qid]) return;
        set({ sessions: { ...get().sessions, [sessionId]: { ...s, answers: { ...s.answers, [qid]: key } } } });
      },
      submitAnswer: (sessionId, qid) => {
        const s = get().sessions[sessionId];
        if (!s) return;
        if (!s.answers[qid]) return;
        set({ sessions: { ...get().sessions, [sessionId]: { ...s, submitted: { ...s.submitted, [qid]: true } } } });
      },
      toggleBookmark: (sessionId, qid) => {
        const s = get().sessions[sessionId];
        if (!s) return;
        const next = { ...s.bookmarked };
        if (next[qid]) delete next[qid];
        else next[qid] = true;
        set({ sessions: { ...get().sessions, [sessionId]: { ...s, bookmarked: next } } });
      },
      finishSession: (sessionId) => {
        // For mock purposes we simply mark all answered questions as submitted.
        const s = get().sessions[sessionId];
        if (!s) return;
        const submitted: Record<string, true> = { ...s.submitted };
        for (const qid of s.questionIds) if (s.answers[qid]) submitted[qid] = true;
        set({ sessions: { ...get().sessions, [sessionId]: { ...s, submitted } } });
      },
    }),
    { name: "medinova-sessions" },
  ),
);
