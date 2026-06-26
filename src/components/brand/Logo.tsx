import logoUrl from "@/assets/medinova-logo.jpg";

interface LogoProps {
  /** Mark only (square logo, no wordmark). Default false (full lockup). */
  markOnly?: boolean;
  /** Visual size in px for the mark. Default 36. */
  size?: number;
  /** Force light/dark text for the wordmark. Default "auto" → text-foreground. */
  tone?: "auto" | "light" | "dark";
  className?: string;
}

/**
 * Medinova brand lockup. The uploaded logo is rendered inside a soft white
 * tile so it sits nicely on either light or dark surfaces (the source asset
 * has a white background, so we keep it crisp by tinting the tile only).
 */
export function Logo({ markOnly = false, size = 36, tone = "auto", className = "" }: LogoProps) {
  const wordTone =
    tone === "light" ? "text-white" : tone === "dark" ? "text-foreground" : "text-foreground";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_-2px_rgb(20_166_160_/_0.25)] ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt="Medinova"
          loading="lazy"
          decoding="async"
          width={size}
          height={size}
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.85) translateX(-6%)" }}
        />
      </span>
      {!markOnly && (
        <span className={`text-base font-bold tracking-tight ${wordTone}`}>
          Medi
          <span className="bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] bg-clip-text text-transparent">
            nova
          </span>
          <span className={tone === "light" ? "text-white/70" : "text-muted-foreground"}>
            qbank
          </span>
        </span>
      )}
    </span>
  );
}
