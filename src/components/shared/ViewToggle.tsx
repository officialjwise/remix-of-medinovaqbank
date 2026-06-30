import { Grid3x3, LayoutGrid, List, Square } from "lucide-react";
import type { ViewMode } from "@/hooks/useViewMode";

/** Tailwind grid container class per view mode (column density). */
export const VIEW_GRID_CLASS: Record<ViewMode, string> = {
  list: "grid grid-cols-1 gap-3",
  grid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  tiles: "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  large: "grid gap-6 sm:grid-cols-1 lg:grid-cols-2",
};

export function viewGridClass(mode: ViewMode): string {
  return VIEW_GRID_CLASS[mode];
}

const OPTIONS: { mode: ViewMode; label: string; Icon: typeof List }[] = [
  { mode: "list", label: "List", Icon: List },
  { mode: "grid", label: "Grid", Icon: LayoutGrid },
  { mode: "tiles", label: "Small tiles", Icon: Grid3x3 },
  { mode: "large", label: "Large", Icon: Square },
];

/** Segmented control to switch a card grid between list / grid / tiles / large. */
export function ViewToggle({
  value,
  onChange,
  options,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  /** Optional subset/ordering of modes to show. */
  options?: ViewMode[];
}) {
  const shown = options ? OPTIONS.filter((o) => options.includes(o.mode)) : OPTIONS;
  return (
    <div className="inline-flex h-10 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      {shown.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          title={label}
          aria-label={label}
          aria-pressed={value === mode}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            value === mode
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
