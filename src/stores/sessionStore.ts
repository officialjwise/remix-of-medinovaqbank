import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveSession, Question, QuizMode } from "@/types";
import { getQuestionsForBank } from "@/data/questions";
import { questionBanks } from "@/data/banks";

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
  selectAnswer: (sessionId: string, qid: string, key: "A" | "B" | "C" | "D" | "E") => void;
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
