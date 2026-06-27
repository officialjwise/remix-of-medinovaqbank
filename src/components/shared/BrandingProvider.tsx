import { useEffect } from "react";
import { usePublicBranding } from "@/api/branding.api";

/**
 * Applies the admin-configured branding to the whole app at runtime: brand
 * colors (CSS variables), heading/body fonts (CSS variables + a dynamically
 * loaded Google-Fonts stylesheet so non-default families actually render), and
 * the favicon. Mounted once at the root so it runs for every visitor — not just
 * while an admin is editing. Renders nothing.
 */
export function BrandingProvider() {
  const { data: b } = usePublicBranding();

  useEffect(() => {
    if (!b || typeof document === "undefined") return;
    const root = document.documentElement;
    const set = (name: string, value: string) => {
      if (value) root.style.setProperty(name, value);
    };

    // Colors (match the variables the shells/Tailwind tokens read).
    set("--primary", b.colorPrimary);
    set("--primary-light", b.colorPrimary);
    set("--accent", b.colorAccent);
    set("--success", b.colorSuccess);
    set("--warning", b.colorWarning);

    // Fonts — apply as CSS variables (styles.css consumes --font-sans / --font-heading).
    if (b.fontBody)
      root.style.setProperty(
        "--font-sans",
        `"${b.fontBody}", ui-sans-serif, system-ui, sans-serif`,
      );
    if (b.fontHeading)
      root.style.setProperty(
        "--font-heading",
        `"${b.fontHeading}", ui-sans-serif, system-ui, sans-serif`,
      );

    // Load the chosen font families from Google Fonts (deduped) so they render.
    const families = Array.from(new Set([b.fontHeading, b.fontBody].filter(Boolean)));
    if (families.length > 0) {
      const href = `https://fonts.googleapis.com/css2?${families
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`)
        .join("&")}&display=swap`;
      let link = document.getElementById("branding-fonts") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "branding-fonts";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
    }

    // Favicon.
    if (b.faviconUrl) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.href = b.faviconUrl;
    }
  }, [b]);

  return null;
}
