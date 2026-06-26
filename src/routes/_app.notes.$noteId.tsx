import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minimize2,
  Star,
} from "lucide-react";
import {
  useNotesStore,
  fetchNotePage,
  trialHiddenPages,
  type AdminNote,
  type NotePageContent,
} from "@/stores/notesStore";
import { useTrial } from "@/hooks/useTrial";
import { useUpgradeModal } from "@/stores/upgradeModalStore";
import { ProtectedSurface } from "@/components/shared/ProtectedSurface";

export const Route = createFileRoute("/_app/notes/$noteId")({
  component: NoteReaderPage,
});

function openUpgrade() {
  useUpgradeModal.getState().show({
    title: "Unlock premium high-yield notes",
    body: "Premium high-yield notes are available on any paid plan. Subscribe to read them in full.",
  });
}

function NoteReaderPage() {
  const { noteId } = Route.useParams();
  const note = useNotesStore((s) => s.notes.find((n) => n.id === noteId));
  const { isTrial } = useTrial();

  // Not found, hidden, or deactivated → not available.
  if (!note || note.tier === "hidden" || !note.active) {
    return <NotAvailable />;
  }

  // Premium note + trial user → upsell wall instead of the reader.
  if (note.tier === "paid_only" && isTrial) {
    return <PremiumWall note={note} />;
  }

  return <Reader note={note} isTrial={isTrial} />;
}

function Reader({ note, isTrial }: { note: AdminNote; isTrial: boolean }) {
  const total = note.pageCount;

  // Pages a trial user must NOT see for a Trial+Paid note.
  const lockedPages = useMemo(
    () => (isTrial && note.tier === "trial_paid" ? trialHiddenPages(note) : new Set<number>()),
    [isTrial, note],
  );

  const [page, setPage] = useState(1);
  const [content, setContent] = useState<NotePageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fit, setFit] = useState(true); // zoom-to-fit toggle

  const isLocked = lockedPages.has(page);

  // Next/prev page that the user is actually allowed to view (skips locked pages).
  const nextViewable = useMemo(() => {
    for (let p = page + 1; p <= total; p++) if (!lockedPages.has(p)) return p;
    return null;
  }, [page, total, lockedPages]);
  const prevViewable = useMemo(() => {
    for (let p = page - 1; p >= 1; p--) if (!lockedPages.has(p)) return p;
    return null;
  }, [page, lockedPages]);

  // Fetch the current page ONE at a time (never the whole note). A locked page
  // is never fetched — we show the upgrade overlay instead.
  useEffect(() => {
    if (isLocked) {
      setContent(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchNotePage(note, page).then((c) => {
      if (alive) {
        setContent(c);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [note, page, isLocked]);

  // Prefetch ONLY the immediately adjacent next viewable page (fire-and-forget).
  useEffect(() => {
    if (isLocked || nextViewable == null) return;
    void fetchNotePage(note, nextViewable);
  }, [note, nextViewable, isLocked]);

  const goPrev = useCallback(() => {
    if (prevViewable != null) setPage(prevViewable);
  }, [prevViewable]);
  const goNext = useCallback(() => {
    if (nextViewable != null) setPage(nextViewable);
  }, [nextViewable]);

  // Keyboard arrows for prev/next (ignore while typing in inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-alt/40 shadow-[var(--shadow-card)]">
      {/* Top bar */}
      <header className="sticky top-[4.5rem] z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            to="/notes"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Library</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{note.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {note.category} · {note.examType}
            </p>
          </div>
          <span className="hidden rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground sm:inline-flex">
            Page {page} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFit((f) => !f)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
              aria-label={fit ? "Actual size" : "Fit to width"}
              title={fit ? "Actual size" : "Fit to width"}
            >
              {fit ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={prevViewable == null}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={nextViewable == null}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-surface-alt sm:hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${(page / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Page stage */}
      <div className="flex flex-1 items-start justify-center px-3 py-6 sm:px-6 sm:py-10">
        <div className={`w-full ${fit ? "max-w-3xl" : "max-w-xl"} transition-[max-width] duration-300`}>
          <ProtectedSurface
            context="high_yield_note"
            contextId={note.id}
            page={page}
            className="overflow-hidden rounded-2xl shadow-[0_8px_30px_-12px_rgba(15,43,76,0.35)]"
          >
            {isLocked ? (
              <LockedPage onUpgrade={openUpgrade} onSkip={goNext} canSkip={nextViewable != null} />
            ) : loading || !content ? (
              <PageShimmer />
            ) : (
              <PageDocument content={content} key={page} />
            )}
          </ProtectedSurface>

          {/* Bottom pager (mobile-friendly) */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={prevViewable == null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground shadow-[var(--shadow-card)]">
              {page} / {total}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={nextViewable == null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The "document page" surface — white, serif, generous padding, real-page feel. */
function PageDocument({ content }: { content: NotePageContent }) {
  return (
    <div className="bg-[#fdfdfb] px-7 py-10 text-[#1a2430] sm:px-12 sm:py-14 animate-in fade-in duration-300">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0E7C7B]">
        {content.topicName}
      </p>
      <h2 className="mt-2 font-serif text-xl font-bold leading-snug sm:text-2xl">
        {content.heading}
      </h2>
      <div className="mt-5 space-y-4 font-serif text-[15px] leading-7 text-[#27313d] sm:text-base sm:leading-8">
        {content.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-10 flex items-center justify-between border-t border-[#e7e4dc] pt-4 text-[11px] text-[#8a9099]">
        <span>Medinovaqbank · High-Yield Notes</span>
        <span className="tabular-nums">Page {content.page}</span>
      </div>
    </div>
  );
}

/* Loading shimmer shaped like the document page. */
function PageShimmer() {
  return (
    <div className="bg-[#fdfdfb] px-7 py-10 sm:px-12 sm:py-14">
      <div className="h-3 w-28 animate-pulse rounded bg-black/10" />
      <div className="mt-3 h-7 w-3/4 animate-pulse rounded bg-black/10" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 animate-pulse rounded bg-black/[0.07]"
            style={{ width: `${88 - (i % 4) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* Trial-locked (premium topic) page overlay. */
function LockedPage({
  onUpgrade,
  onSkip,
  canSkip,
}: {
  onUpgrade: () => void;
  onSkip: () => void;
  canSkip: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#fdfdfb] px-7 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-warning/30 bg-warning/10">
        <Lock className="h-6 w-6 text-warning" />
      </span>
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
        <Star className="h-3 w-3" /> Premium topic
      </span>
      <h3 className="mt-3 text-lg font-bold text-[#1a2430]">Upgrade to view this section</h3>
      <p className="mt-1 max-w-sm text-sm text-[#5b636d]">
        This topic is part of the premium content. Subscribe to any paid plan to unlock every page.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Star className="h-4 w-4" /> Upgrade to unlock
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
          >
            Skip to next page <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* Full-page premium wall for a paid_only note opened by a trial user. */
function PremiumWall({ note }: { note: AdminNote }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="card-surface flex w-full flex-col items-center p-8">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-warning/30 bg-warning/10">
          <Lock className="h-7 w-7 text-warning" />
        </span>
        <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
          <Star className="h-3 w-3" /> Premium
        </span>
        <h1 className="mt-3 text-xl font-bold text-foreground">{note.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Premium high-yield notes are available on any paid plan. Subscribe to read this note in full.
        </p>
        <button
          type="button"
          onClick={openUpgrade}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Star className="h-4 w-4" /> Upgrade to read
        </button>
        <Link
          to="/notes"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to notes
        </Link>
      </div>
    </div>
  );
}

/* Not found / hidden / inactive. */
function NotAvailable() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="card-surface flex w-full flex-col items-center p-8">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-alt">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">Note not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This note may have been removed or is not currently published.
        </p>
        <Link
          to="/notes"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to notes
        </Link>
      </div>
    </div>
  );
}
