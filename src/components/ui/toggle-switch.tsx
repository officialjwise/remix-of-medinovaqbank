import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
  /** Accessible label when no visible text is associated. */
  ariaLabel?: string;
}

/**
 * The single, consistent switch used across the app. Accessible (role=switch,
 * aria-checked, keyboard operable as a button), with visible on/off states and
 * a smooth thumb animation. Persisting + toasting is the caller's job.
 *
 * Geometry note: the thumb is sized + offset so that in BOTH states its circle
 * is concentric with the track's rounded end-cap, leaving an even clearance all
 * around. That clearance is what stops the thumb (and its ring/shadow) from
 * spilling past the rounded edge — the bug that made earlier toggles look like
 * the knob was poking out the side.
 */
export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  size = "md",
  label,
  ariaLabel,
}: ToggleSwitchProps) {
  const dims =
    size === "sm"
      ? { track: "h-5 w-9", thumb: "h-3.5 w-3.5", base: "left-0.5", on: "translate-x-4" }
      : { track: "h-6 w-11", thumb: "h-4 w-4", base: "left-[3px]", on: "translate-x-5" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "relative shrink-0 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        dims.track,
        checked
          ? "border-accent bg-accent"
          : "border-zinc-400 bg-zinc-300 dark:border-zinc-500 dark:bg-zinc-600",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-transform duration-200",
          dims.base,
          dims.thumb,
          checked ? dims.on : "translate-x-0",
        )}
      />
    </button>
  );
}
