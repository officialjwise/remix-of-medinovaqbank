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
 */
export function ToggleSwitch({ checked, onChange, disabled, size = "md", label, ariaLabel }: ToggleSwitchProps) {
  const dims =
    size === "sm"
      ? { track: "h-5 w-9", thumb: "h-4 w-4", on: "translate-x-4", off: "translate-x-0.5" }
      : { track: "h-6 w-11", thumb: "h-5 w-5", on: "translate-x-5", off: "translate-x-0.5" };

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
        "relative shrink-0 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        dims.track,
        // OFF needs a clearly visible track (surface-alt is near-invisible on light cards)
        checked ? "bg-accent" : "bg-muted-foreground/35",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-black/5 transition-transform",
          dims.thumb,
          checked ? dims.on : dims.off,
        )}
      />
    </button>
  );
}
