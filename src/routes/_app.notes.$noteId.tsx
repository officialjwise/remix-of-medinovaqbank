import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Star,
} from "lucide-react";
import { useNote, notesApi, type NoteDetail } from "@/api/notes.api";
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
  const { data: note, isLoading, isError } = useNote(noteId);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading note…
        </span>
      </div>
    );
  }

  // Not found / hidden / inactive, or a load error → not available.
  if (isError || !note) {
    return <NotAvailable />;
  }

  // Whole-note locked for this tier (e.g. paid_only opened by a trial user).
  if (note.locked) {
    return <PremiumWall note={note} />;
  }

  return <Reader note={note} />;
}

function Reader({ note }: { note: NoteDetail }) {
  const total = note.pageCount;

  // Per-page lock flags come straight from the backend tier decision.
  const lockedPages = useMemo(() => {
    const set = new Set<number>();
    for (const p of note.pages) if (p.locked) set.add(p.pageNumber);
    return set;
  }, [note.pages]);

  const [page, setPage] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fit, setFit] = useState(true); // zoom-to-fit toggle

  const isLocked = lockedPages.has(page);

  // Next/prev page the user is allowed to view (skips locked pages).
  const nextViewable = useMemo(() => {
    for (let p = page + 1; p <= total; p++) if (!lockedPages.has(p)) return p;
    return null;
  }, [page, total, lockedPages]);
  const prevViewable = useMemo(() => {
    for (let p = page - 1; p >= 1; p--) if (!lockedPages.has(p)) return p;
    return null;
  }, [page, lockedPages]);

  // Fetch a fresh, short-lived signed URL for the CURRENT page only — one page
  // at a time, never the source PDF. A locked page is never requested.
  useEffect(() => {
    if (isLocked) {
      setImageUrl(null);
      setLoading(false);
      setError(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    setImageUrl(null);
    notesApi
      .getPageUrl(note.id, page)
      .then((res) => {
        if (alive) {
          setImageUrl(res.url);
          // The <img> onLoad clears `loading`; keep it true until the bytes land.
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [note.id, page, isLocked]);

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
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
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
              {note.tier === "paid_only" ? "Premium" : "High-Yield Notes"}
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
            style={{ width: `${(page / Math.max(total, 1)) * 100}%` }}
          />
        </div>
      </header>

      {/* Page stage */}
      <div className="flex flex-1 items-start justify-center px-3 py-6 sm:px-6 sm:py-10">
        <div
          className={`w-full ${fit ? "max-w-3xl" : "max-w-xl"} transition-[max-width] duration-300`}
        >
          <ProtectedSurface
            context="high_yield_note"
            contextId={note.id}
            page={page}
            className="overflow-hidden rounded-2xl shadow-[0_8px_30px_-12px_rgba(15,43,76,0.35)]"
          >
            {isLocked ? (
              <LockedPage onUpgrade={openUpgrade} onSkip={goNext} canSkip={nextViewable != null} />
            ) : error ? (
              <PageError onRetry={() => setPage((p) => p)} />
            ) : (
              <PageImage
                url={imageUrl}
                page={page}
                loading={loading}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
              />
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

/**
 * The protected page surface: a watermarked PNG served from a short-lived signed
 * URL. The image is non-draggable/non-selectable; ProtectedSurface adds the
 * per-user watermark overlay + capture-blur on top.
 */
function PageImage({
  url,
  page,
  loading,
  onLoad,
  onError,
}: {
  url: string | null;
  page: number;
  loading: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <div className="relative min-h-[60vh] bg-[#fdfdfb]">
      {(loading || !url) && (
        <div className="absolute inset-0 z-10">
          <PageShimmer />
        </div>
      )}
      {url && (
        <img
          key={`${page}-${url}`}
          src={url}
          alt={`Page ${page}`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onLoad={onLoad}
          onError={onError}
          className="block w-full select-none animate-in fade-in duration-300"
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
        />
      )}
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

/* Page load / signed-URL failure. */
function PageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#fdfdfb] px-7 py-16 text-center">
      <h3 className="text-lg font-bold text-[#1a2430]">Could not load this page</h3>
      <p className="mt-1 max-w-sm text-sm text-[#5b636d]">
        The secure page link may have expired. Try again to refresh it.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        Retry
      </button>
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

/* Full-page premium wall for a locked note opened by a non-entitled user. */
function PremiumWall({ note }: { note: NoteDetail }) {
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
          Premium high-yield notes are available on any paid plan. Subscribe to read this note in
          full.
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
