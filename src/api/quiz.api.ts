/**
 * QUIZ RUNTIME domain — self-contained API module.
 *
 * Backend wire types + boundary mappers + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions.
 *
 * CRITICAL anti-extraction contract:
 *   - Questions are NEVER shipped with their correct answer pre-submission. The
 *     backend strips `isCorrect` from options in the active session payload
 *     (QuestionResponseDto.fromEntity(_, false)). The frontend serves ONE
 *     question at a time by indexing into the ordered list and only learns the
 *     correct option from the SUBMIT response (tutor mode) or from review/results
 *     after completion (quiz mode). There is no client-side correctKey.
 *
 * Endpoints (all under /api/v1):
 *   POST   /quiz-sessions                  — create session (returns SessionState)
 *   GET    /quiz-sessions                  — list sessions (paginated)
 *   GET    /quiz-sessions/:id              — session state (questions, answers hidden)
 *   POST   /quiz-sessions/:id/answers      — submit an answer for one question
 *   POST   /quiz-sessions/:id/complete     — finalize the session
 *   GET    /quiz-sessions/:id/results      — owner results summary
 *   GET    /quiz-sessions/:id/review       — per-question review (answers revealed)
 *   DELETE /quiz-sessions/:id              — abandon an in-progress session
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { QuizMode } from "@/types";

// ── Option labels used across the runtime (A–E). ──
export type OptionLabel = "A" | "B" | "C" | "D" | "E";

// ── Backend wire shapes ──────────────────────────────────────────────────────

export type BackendSessionMode = "tutor" | "quiz";
export type BackendSessionStatus = "in_progress" | "completed" | "abandoned" | "expired";

interface BackendQuestionOption {
  id: string;
  label: string;
  text: string;
  imageUrl: string | null;
  /** Only present in answered/review payloads — never pre-submission. */
  isCorrect?: boolean;
}

interface BackendQuestion {
  id: string;
  bankId: string;
  text: string;
  imageUrl: string | null;
  difficulty: string;
  subject: string;
  topic: string | null;
  tags: string[];
  orderIndex: number | null;
  options: BackendQuestionOption[];
  explanation?: string | null;
}

interface BackendSession {
  id: string;
  userId: string;
  bankId: string;
  mode: BackendSessionMode;
  status: BackendSessionStatus;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number | null;
  timeLimitMinutes: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface BackendSessionState {
  session: BackendSession;
  questions: BackendQuestion[];
  answeredQuestionIds: string[];
  currentIndex: number;
}

interface BackendAnswerResult {
  answerId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  mode: BackendSessionMode;
  answeredCount: number;
  totalQuestions: number;
  /** Tutor mode only. */
  correctOptionId?: string;
  explanationAvailable?: boolean;
}

interface BackendResultsBucket {
  key: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  scorePct: number;
}

interface BackendTimelineEntry {
  questionId: string;
  answerId: string | null;
  correct: boolean | null;
  skipped: boolean;
  timeSpentSeconds: number | null;
  answeredAt: string | null;
}

interface BackendResults {
  sessionId: string;
  bankId: string;
  mode: BackendSessionMode;
  status: BackendSessionStatus;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scorePct: number;
  durationSec: number | null;
  startedAt: string;
  completedAt: string | null;
  bySubject: BackendResultsBucket[];
  byDifficulty: BackendResultsBucket[];
  timeline: BackendTimelineEntry[];
}

interface BackendReviewAnswer {
  answerId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  explanationAvailable: boolean;
}

interface BackendReviewItem {
  question: BackendQuestion;
  answer: BackendReviewAnswer | null;
}

interface BackendReview {
  session: BackendSession;
  items: BackendReviewItem[];
}

// ── Frontend domain shapes (what the UI consumes) ────────────────────────────

export interface QuizOption {
  id: string;
  label: OptionLabel;
  text: string;
  imageUrl: string | null;
  /** Only set in review/results payloads. Undefined during an active question. */
  isCorrect?: boolean;
}

/** A single question as served to the runtime — NO correct answer attached. */
export interface QuizQuestion {
  id: string;
  bankId: string;
  stem: string;
  imageUrl: string | null;
  difficulty: string;
  subject: string;
  topic: string;
  tags: string[];
  options: QuizOption[];
  /** Admin base explanation — only present in review payloads. */
  explanation?: string | null;
}

export interface QuizSession {
  id: string;
  bankId: string;
  mode: QuizMode;
  status: BackendSessionStatus;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number | null;
  timeLimitMinutes: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface QuizSessionState {
  session: QuizSession;
  questions: QuizQuestion[];
  answeredQuestionIds: string[];
  /** Index of the first unanswered question (== total when all answered). */
  currentIndex: number;
}

export interface AnswerResult {
  answerId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  mode: QuizMode;
  answeredCount: number;
  totalQuestions: number;
  /** Tutor mode: id of the correct option, revealed on submit. */
  correctOptionId?: string;
  explanationAvailable: boolean;
}

export interface ResultsBucket {
  /** Subject or difficulty label. */
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  pct: number;
}

export interface ResultsTimelineEntry {
  questionId: string;
  answerId: string | null;
  correct: boolean | null;
  skipped: boolean;
  seconds: number;
}

export interface SessionResults {
  sessionId: string;
  bankId: string;
  mode: QuizMode;
  status: BackendSessionStatus;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  scorePct: number;
  durationSec: number;
  startedAt: string;
  completedAt: string | null;
  bySubject: ResultsBucket[];
  byDifficulty: ResultsBucket[];
  timeline: ResultsTimelineEntry[];
}

export interface ReviewAnswer {
  answerId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  seconds: number | null;
  explanationAvailable: boolean;
}

export interface ReviewItem {
  question: QuizQuestion;
  answer: ReviewAnswer | null;
  /** Convenience: label of the correct option (review reveals isCorrect). */
  correctLabel: OptionLabel | null;
}

export interface SessionReview {
  session: QuizSession;
  items: ReviewItem[];
}

/** Lightweight summary for the history list. */
export interface SessionListItem {
  id: string;
  bankId: string;
  mode: QuizMode;
  status: BackendSessionStatus;
  scorePct: number;
  answeredCount: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
  inProgress: boolean;
}

// ── Mode / status mapping (backend lower_snake ↔ FE upper) ───────────────────

function mapMode(mode: BackendSessionMode): QuizMode {
  return mode === "tutor" ? "TUTOR" : "QUIZ";
}

function toBackendMode(mode: QuizMode): BackendSessionMode {
  return mode === "TUTOR" ? "tutor" : "quiz";
}

const LABELS: OptionLabel[] = ["A", "B", "C", "D", "E"];

/** Coerce an arbitrary backend label into the A–E union (fallback by position). */
function normalizeLabel(label: string, index: number): OptionLabel {
  const upper = label.trim().toUpperCase();
  if ((LABELS as string[]).includes(upper)) return upper as OptionLabel;
  return LABELS[index] ?? "A";
}

// ── Boundary mappers ─────────────────────────────────────────────────────────

function mapOption(o: BackendQuestionOption, index: number): QuizOption {
  return {
    id: o.id,
    label: normalizeLabel(o.label, index),
    text: o.text,
    imageUrl: o.imageUrl,
    isCorrect: o.isCorrect,
  };
}

export function mapQuestion(q: BackendQuestion): QuizQuestion {
  return {
    id: q.id,
    bankId: q.bankId,
    stem: q.text,
    imageUrl: q.imageUrl,
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic ?? q.subject ?? "General",
    tags: q.tags ?? [],
    options: (q.options ?? []).map(mapOption),
    explanation: q.explanation,
  };
}

function mapSession(s: BackendSession): QuizSession {
  return {
    id: s.id,
    bankId: s.bankId,
    mode: mapMode(s.mode),
    status: s.status,
    totalQuestions: s.totalQuestions,
    answeredCount: s.answeredCount,
    correctCount: s.correctCount,
    scorePercentage: s.scorePercentage,
    timeLimitMinutes: s.timeLimitMinutes,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    createdAt: s.createdAt,
  };
}

function mapSessionState(s: BackendSessionState): QuizSessionState {
  return {
    session: mapSession(s.session),
    questions: (s.questions ?? []).map(mapQuestion),
    answeredQuestionIds: s.answeredQuestionIds ?? [],
    currentIndex: s.currentIndex,
  };
}

function mapAnswerResult(r: BackendAnswerResult): AnswerResult {
  return {
    answerId: r.answerId,
    questionId: r.questionId,
    selectedOptionId: r.selectedOptionId,
    isCorrect: r.isCorrect,
    mode: mapMode(r.mode),
    answeredCount: r.answeredCount,
    totalQuestions: r.totalQuestions,
    correctOptionId: r.correctOptionId,
    explanationAvailable: r.explanationAvailable ?? false,
  };
}

function mapBucket(b: BackendResultsBucket): ResultsBucket {
  return {
    name: b.key,
    total: b.total,
    correct: b.correct,
    incorrect: b.incorrect,
    skipped: b.skipped,
    pct: Math.round(b.scorePct),
  };
}

function mapResults(r: BackendResults): SessionResults {
  return {
    sessionId: r.sessionId,
    bankId: r.bankId,
    mode: mapMode(r.mode),
    status: r.status,
    total: r.totalQuestions,
    answered: r.answeredCount,
    correct: r.correctCount,
    incorrect: r.incorrectCount,
    skipped: r.skippedCount,
    scorePct: Math.round(r.scorePct),
    durationSec: r.durationSec ?? 0,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    bySubject: (r.bySubject ?? []).map(mapBucket),
    byDifficulty: (r.byDifficulty ?? []).map(mapBucket),
    timeline: (r.timeline ?? []).map((t) => ({
      questionId: t.questionId,
      answerId: t.answerId,
      correct: t.correct,
      skipped: t.skipped,
      seconds: t.timeSpentSeconds ?? 0,
    })),
  };
}

function mapReviewItem(item: BackendReviewItem): ReviewItem {
  const question = mapQuestion(item.question);
  const correct = question.options.find((o) => o.isCorrect === true) ?? null;
  return {
    question,
    answer: item.answer
      ? {
          answerId: item.answer.answerId,
          selectedOptionId: item.answer.selectedOptionId,
          isCorrect: item.answer.isCorrect,
          seconds: item.answer.timeSpentSeconds,
          explanationAvailable: item.answer.explanationAvailable,
        }
      : null,
    correctLabel: correct ? correct.label : null,
  };
}

function mapReview(r: BackendReview): SessionReview {
  return {
    session: mapSession(r.session),
    items: (r.items ?? []).map(mapReviewItem),
  };
}

function mapListItem(s: BackendSession): SessionListItem {
  return {
    id: s.id,
    bankId: s.bankId,
    mode: mapMode(s.mode),
    status: s.status,
    scorePct: Math.round(s.scorePercentage ?? 0),
    answeredCount: s.answeredCount,
    totalQuestions: s.totalQuestions,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    inProgress: s.status === "in_progress",
  };
}

// ── Request bodies ───────────────────────────────────────────────────────────

export interface CreateSessionInput {
  bankId: string;
  mode: QuizMode;
  questionCount: number;
  timeLimitMinutes?: number;
}

export interface SubmitAnswerInput {
  questionId: string;
  /** Omit to skip the question. */
  selectedOptionId?: string;
  timeSpentSeconds?: number;
}

// ── Endpoint functions ───────────────────────────────────────────────────────

export const quizApi = {
  async createSession(input: CreateSessionInput): Promise<QuizSessionState> {
    const data = await apiClient.post<BackendSessionState>("/quiz-sessions", {
      bankId: input.bankId,
      mode: toBackendMode(input.mode),
      questionCount: input.questionCount,
      ...(input.timeLimitMinutes ? { timeLimitMinutes: input.timeLimitMinutes } : {}),
    });
    return mapSessionState(data);
  },

  async getState(sessionId: string): Promise<QuizSessionState> {
    const data = await apiClient.get<BackendSessionState>(`/quiz-sessions/${sessionId}`);
    return mapSessionState(data);
  },

  async submitAnswer(sessionId: string, input: SubmitAnswerInput): Promise<AnswerResult> {
    const data = await apiClient.post<BackendAnswerResult>(`/quiz-sessions/${sessionId}/answers`, {
      questionId: input.questionId,
      ...(input.selectedOptionId ? { selectedOptionId: input.selectedOptionId } : {}),
      ...(input.timeSpentSeconds !== undefined ? { timeSpentSeconds: input.timeSpentSeconds } : {}),
    });
    return mapAnswerResult(data);
  },

  async complete(sessionId: string): Promise<QuizSession> {
    const data = await apiClient.post<BackendSession>(`/quiz-sessions/${sessionId}/complete`);
    return mapSession(data);
  },

  async getResults(sessionId: string): Promise<SessionResults> {
    const data = await apiClient.get<BackendResults>(`/quiz-sessions/${sessionId}/results`);
    return mapResults(data);
  },

  async getReview(sessionId: string): Promise<SessionReview> {
    const data = await apiClient.get<BackendReview>(`/quiz-sessions/${sessionId}/review`);
    return mapReview(data);
  },

  async list(): Promise<SessionListItem[]> {
    const { data } = await apiClient.getPaginated<BackendSession>("/quiz-sessions", {
      params: { limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    });
    return data.map(mapListItem);
  },

  async abandon(sessionId: string): Promise<QuizSession> {
    const data = await apiClient.delete<BackendSession>(`/quiz-sessions/${sessionId}`);
    return mapSession(data);
  },
};

// ── Query keys ───────────────────────────────────────────────────────────────

export const quizKeys = {
  all: ["quiz-sessions"] as const,
  list: () => [...quizKeys.all, "list"] as const,
  state: (id: string) => [...quizKeys.all, "state", id] as const,
  results: (id: string) => [...quizKeys.all, "results", id] as const,
  review: (id: string) => [...quizKeys.all, "review", id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Active session state (the ordered question list with answers hidden).
 * `staleTime: Infinity` + no refetch — the runtime mutates this cache locally as
 * answers are recorded; it never silently re-fetches mid-quiz.
 */
export function useSessionState(
  sessionId: string,
  options?: Partial<UseQueryOptions<QuizSessionState>>,
) {
  return useQuery({
    queryKey: quizKeys.state(sessionId),
    queryFn: () => quizApi.getState(sessionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useSessionResults(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: quizKeys.results(sessionId),
    queryFn: () => quizApi.getResults(sessionId),
    enabled,
    staleTime: 60_000,
  });
}

export function useSessionReview(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: quizKeys.review(sessionId),
    queryFn: () => quizApi.getReview(sessionId),
    enabled,
    staleTime: 60_000,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: quizKeys.list(),
    queryFn: quizApi.list,
    staleTime: 15_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) => quizApi.createSession(input),
    onSuccess: (state) => {
      // Seed the state cache so the runtime can read it without a round-trip.
      qc.setQueryData(quizKeys.state(state.session.id), state);
      void qc.invalidateQueries({ queryKey: quizKeys.list() });
    },
  });
}

export function useSubmitAnswer(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAnswerInput) => quizApi.submitAnswer(sessionId, input),
    onSuccess: (result) => {
      // Reflect the new answered count in the cached state without refetching
      // (refetching would re-shuffle nothing but is an extra round-trip).
      qc.setQueryData<QuizSessionState>(quizKeys.state(sessionId), (prev) => {
        if (!prev) return prev;
        if (prev.answeredQuestionIds.includes(result.questionId)) return prev;
        const answeredQuestionIds = [...prev.answeredQuestionIds, result.questionId];
        const answeredSet = new Set(answeredQuestionIds);
        const order = prev.questions.map((q) => q.id);
        const nextIdx = order.findIndex((id) => !answeredSet.has(id));
        return {
          ...prev,
          answeredQuestionIds,
          currentIndex: nextIdx === -1 ? order.length : nextIdx,
          session: {
            ...prev.session,
            answeredCount: result.answeredCount,
          },
        };
      });
    },
  });
}

export function useCompleteSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => quizApi.complete(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quizKeys.list() });
      void qc.invalidateQueries({ queryKey: quizKeys.results(sessionId) });
      void qc.invalidateQueries({ queryKey: quizKeys.review(sessionId) });
    },
  });
}
