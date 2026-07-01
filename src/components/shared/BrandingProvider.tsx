import { useEffect } from "react";
import { usePublicBranding } from "@/api/branding.api";
import { fontStack, fontGoogleSpec } from "@/lib/fonts";

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

    // Fonts — apply the registry's full CSS stack to the variables styles.css
    // consumes (--font-sans body, --font-heading headings). The stack controls
    // the serif/sans fallback chain (e.g. Cambria -> Gelasio -> serif).
    const bodyStack = fontStack(b.fontBody);
    if (bodyStack) root.style.setProperty("--font-sans", bodyStack);
    const headingStack = fontStack(b.fontHeading);
    if (headingStack) root.style.setProperty("--font-heading", headingStack);

    // Load ONLY the real web fonts the selection needs (deduped). System fonts
    // (system-ui, Georgia) have no spec and are skipped — requesting them from
    // Google Fonts 400s and would break the whole stylesheet. Cambria maps to
    // its Gelasio web fallback here.
    const specs = Array.from(
      new Set([fontGoogleSpec(b.fontHeading), fontGoogleSpec(b.fontBody)].filter(Boolean)),
    );
    const fontHref =
      specs.length > 0
        ? `https://fonts.googleapis.com/css2?${specs
            .map((s) => `family=${s}`)
            .join("&")}&display=swap`
        : "";
    if (fontHref) {
      let link = document.getElementById("branding-fonts") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "branding-fonts";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== fontHref) link.href = fontHref;
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

    // Cache the COMPUTED branding so the inline <head> script (see __root's
    // RootShell) can apply the admin's font + colors synchronously on the next
    // load — before first paint — eliminating the flash of the default font.
    try {
      window.localStorage.setItem(
        "medinova-branding",
        JSON.stringify({
          fontSans: bodyStack ?? "",
          fontHeading: headingStack ?? "",
          fontHref,
          primary: b.colorPrimary ?? "",
          accent: b.colorAccent ?? "",
          success: b.colorSuccess ?? "",
          warning: b.colorWarning ?? "",
        }),
      );
    } catch {
      /* storage unavailable — the runtime effect above still applies branding */
    }
  }, [b]);

  return null;
}
