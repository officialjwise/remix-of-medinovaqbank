import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Loader2,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useSessions, type SessionListItem } from "@/api/quiz.api";
import { usePublicBanks } from "@/api/banks.api";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({
    meta: [{ title: "My Sessions — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data, isLoading, isError } = useSessions();
  const { data: banksResult } = usePublicBanks({ limit: 100 });

  const sessions = data ?? [];
  const inProgress = sessions.filter((s) => s.inProgress);
  const past = sessions.filter((s) => !s.inProgress);

  // Resolve a friendly bank title; fall back to a generic label (mirrors the
  // dashboard) for banks that are no longer listed publicly.
  const bankName = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of banksResult?.banks ?? []) map.set(b.id, b.name);
    return (s: SessionListItem) => map.get(s.bankId) ?? `${s.totalQuestions}-question session`;
  }, [banksResult]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
            My Sessions
          </h1>
          <p className="mt-2 text-[15px] font-medium text-muted-foreground">
            Resume an unfinished quiz, or review the answers from a past attempt.
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ShieldCheck className="h-4 w-4" /> Active devices
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-16 text-[15px] font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your sessions…
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-[15px] font-medium text-error">
          Could not load your sessions. Please try again.
        </div>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-[15px] font-semibold text-foreground">No quiz sessions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a quiz to track your progress and review your answers here.
          </p>
          <Link
            to="/banks"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            <Play className="h-4 w-4" /> Browse question banks
          </Link>
        </div>
      )}

      {!isLoading && !isError && inProgress.length > 0 && (
        <Section title="In progress" count={inProgress.length}>
          {inProgress.map((s) => (
            <SessionRow key={s.id} session={s} title={bankName(s)} />
          ))}
        </Section>
      )}

      {!isLoading && !isError && past.length > 0 && (
        <Section title="Past sessions" count={past.length}>
          {past.map((s) => (
            <SessionRow key={s.id} session={s} title={bankName(s)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-foreground">
          {count}
        </span>
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)]">
        {children}
      </div>
    </div>
  );
}

function StatusPill({ session }: { session: SessionListItem }) {
  if (session.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-warning">
        <Clock className="h-3 w-3" /> In progress
      </span>
    );
  }
  if (session.status === "abandoned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <XCircle className="h-3 w-3" /> Abandoned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
}

function SessionRow({ session, title }: { session: SessionListItem; title: string }) {
  const when = session.completedAt ?? session.startedAt;
  const reviewable = !session.inProgress && session.answeredCount > 0;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-alt/30 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{title}</span>
            <span className="inline-flex items-center rounded-md border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {session.mode === "TUTOR" ? "Tutor" : "Quiz"}
            </span>
            <StatusPill session={session} />
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {session.answeredCount}/{session.totalQuestions} answered
            {!session.inProgress && session.answeredCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-foreground">{session.scorePct}%</span> score
              </>
            )}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {session.completedAt ? "Completed" : "Started"} {new Date(when).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:justify-end">
        {session.inProgress ? (
          <Link
            to="/quiz/$sessionId"
            params={{ sessionId: session.id }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-bold text-accent-foreground transition hover:bg-accent/90"
          >
            <Play className="h-4 w-4" /> Resume
          </Link>
        ) : (
          <>
            {reviewable && (
              <Link
                to="/quiz/$sessionId/review"
                params={{ sessionId: session.id }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] font-semibold text-foreground transition hover:bg-surface-alt"
              >
                <Eye className="h-4 w-4" /> Review
              </Link>
            )}
            {session.status === "completed" && (
              <Link
                to="/quiz/$sessionId/results"
                params={{ sessionId: session.id }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] font-semibold text-foreground transition hover:bg-surface-alt"
              >
                <BarChart3 className="h-4 w-4" /> Results
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
