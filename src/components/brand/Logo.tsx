import logoUrl from "@/assets/medinova-logo.jpg";
import { usePublicBranding } from "@/api/branding.api";

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
 * Brand lockup. Uses the admin-configured branding logo + app name when set
 * (falling back to the bundled Medinova asset). The default asset has a white
 * background, so it's rendered inside a white tile and scaled to fit; an
 * uploaded custom logo is shown contained, unscaled.
 */
export function Logo({ markOnly = false, size = 36, tone = "auto", className = "" }: LogoProps) {
  const { data: branding } = usePublicBranding();
  const wordTone =
    tone === "light" ? "text-white" : tone === "dark" ? "text-foreground" : "text-foreground";

  const customLogo = (tone === "light" && branding?.logoDarkUrl) || branding?.logoLightUrl || "";
  const logoSrc = customLogo || logoUrl;
  const appName = branding?.appName?.trim() || "";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_-2px_rgb(20_166_160_/_0.25)] ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <img
          src={logoSrc}
          alt={appName || "Medinova"}
          loading="lazy"
          decoding="async"
          width={size}
          height={size}
          className={customLogo ? "h-full w-full object-contain" : "h-full w-full object-cover"}
          style={customLogo ? undefined : { transform: "scale(1.85) translateX(-6%)" }}
        />
      </span>
      {!markOnly &&
        (appName ? (
          <span className={`text-base font-bold tracking-tight ${wordTone}`}>{appName}</span>
        ) : (
          <span className={`text-base font-bold tracking-tight ${wordTone}`}>
            Medi
            <span className="bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] bg-clip-text text-transparent">
              nova
            </span>
            <span className={tone === "light" ? "text-white/70" : "text-muted-foreground"}>
              qbank
            </span>
          </span>
        ))}
    </span>
  );
}
