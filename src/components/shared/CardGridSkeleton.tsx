import { Skeleton } from "@/components/ui/skeleton";
import { viewGridClass } from "@/components/shared/ViewToggle";
import type { ViewMode } from "@/hooks/useViewMode";

/** Shimmer placeholder cards in the same grid as the real content, so switching
 *  from loading → loaded doesn't shift layout (and never flashes "no data"). */
export function CardGridSkeleton({
  count = 6,
  mode = "grid",
}: {
  count?: number;
  mode?: ViewMode;
}) {
  return (
    <div className={viewGridClass(mode)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={mode === "list" ? "h-20 rounded-2xl" : "h-44 rounded-2xl"} />
      ))}
    </div>
  );
}
