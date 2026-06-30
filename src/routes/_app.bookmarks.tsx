import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, BookmarkX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyFlags, useRemoveFlag } from "@/api/questions.api";

export const Route = createFileRoute("/_app/bookmarks")({
  head: () => ({
    meta: [
      { title: "My Bookmarks — Medinovaqbank" },
      { name: "description", content: "Questions you've bookmarked to revisit." },
    ],
  }),
  component: BookmarksPage,
});

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Accra",
});

function BookmarksPage() {
  const { data: flags, isLoading } = useMyFlags();
  const removeFlag = useRemoveFlag({ type: "bookmark" });
  const bookmarks = (flags ?? []).filter((f) => f.type === "bookmark");

  const remove = (questionId: string) =>
    removeFlag.mutate(
      { questionId },
      {
        onSuccess: () => toast.success("Bookmark removed"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Could not remove bookmark"),
      },
    );

  return (
    <div>
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Bookmark className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My bookmarks</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Questions you bookmarked during a quiz, saved here to revisit.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="mt-10 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">No bookmarks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            While taking a quiz, tap the bookmark icon on any question to save it here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {bookmarks.length} bookmarked question{bookmarks.length === 1 ? "" : "s"}
          </p>
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  {b.questionText ?? "(Question unavailable)"}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                  Bookmarked {DATE_FMT.format(new Date(b.createdAt))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(b.questionId)}
                disabled={removeFlag.isPending}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-error/40 hover:bg-error/5 hover:text-error disabled:opacity-50"
              >
                <BookmarkX className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
