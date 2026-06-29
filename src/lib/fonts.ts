/**
 * Font registry — the single source of truth for the admin-selectable app fonts
 * (Branding → Typography). Each entry maps a stored font NAME (what's saved in
 * branding.fontHeading / branding.fontBody) to:
 *   - `stack`: the full CSS font-family applied to the --font-* CSS variable
 *     (so we control the fallback chain, incl. serif vs sans), and
 *   - `google`: the exact Google-Fonts `family=…:wght@…` spec to load so it
 *     actually renders. OMITTED for system fonts (e.g. system-ui, Georgia) —
 *     loading those from Google Fonts 400s and breaks the whole stylesheet.
 *
 * Note on Cambria: it's a proprietary Microsoft font (not on Google Fonts), so
 * it can't be web-loaded. We render it first where installed (Windows / Office)
 * and load Gelasio — its metrically-compatible free twin — as the web fallback.
 *
 * All `google` specs are verified to return HTTP 200 from the css2 API.
 */
const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = 'Georgia, "Times New Roman", ui-serif, serif';
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export interface FontDef {
  /** Stored value + dropdown label. */
  name: string;
  /** CSS font-family applied to the --font-* variable. */
  stack: string;
  /** Google-Fonts family spec to load (family + weights); omit for system fonts. */
  google?: string;
}

export const FONTS: FontDef[] = [
  // ── Sans-serif ──
  { name: "Inter", stack: `"Inter", ${SANS}`, google: "Inter:wght@400;500;600;700;800" },
  { name: "Roboto", stack: `"Roboto", ${SANS}`, google: "Roboto:wght@400;500;700" },
  {
    name: "Open Sans",
    stack: `"Open Sans", ${SANS}`,
    google: "Open+Sans:wght@400;500;600;700;800",
  },
  { name: "Lato", stack: `"Lato", ${SANS}`, google: "Lato:wght@400;700" },
  {
    name: "Montserrat",
    stack: `"Montserrat", ${SANS}`,
    google: "Montserrat:wght@400;500;600;700;800",
  },
  { name: "Poppins", stack: `"Poppins", ${SANS}`, google: "Poppins:wght@400;500;600;700;800" },
  { name: "Nunito", stack: `"Nunito", ${SANS}`, google: "Nunito:wght@400;500;600;700;800" },
  {
    name: "Work Sans",
    stack: `"Work Sans", ${SANS}`,
    google: "Work+Sans:wght@400;500;600;700;800",
  },
  { name: "system-ui", stack: SANS },
  // ── Serif ──
  {
    name: "Cambria",
    stack: `"Cambria", "Gelasio", ${SERIF}`,
    google: "Gelasio:wght@400;500;600;700",
  },
  { name: "Gelasio", stack: `"Gelasio", ${SERIF}`, google: "Gelasio:wght@400;500;600;700" },
  { name: "Merriweather", stack: `"Merriweather", ${SERIF}`, google: "Merriweather:wght@400;700" },
  { name: "Lora", stack: `"Lora", ${SERIF}`, google: "Lora:wght@400;500;600;700" },
  {
    name: "Playfair Display",
    stack: `"Playfair Display", ${SERIF}`,
    google: "Playfair+Display:wght@400;500;600;700;800",
  },
  { name: "PT Serif", stack: `"PT Serif", ${SERIF}`, google: "PT+Serif:wght@400;700" },
  { name: "Georgia", stack: SERIF },
  // ── Monospace ──
  {
    name: "JetBrains Mono",
    stack: `"JetBrains Mono", ${MONO}`,
    google: "JetBrains+Mono:wght@400;500;600;700",
  },
];

export const FONT_BY_NAME = new Map(FONTS.map((f) => [f.name, f]));

/** Names for the admin Typography dropdowns. */
export const FONT_NAMES: string[] = FONTS.map((f) => f.name);

/** Resolve a stored font name to its full CSS stack (with a safe fallback). */
export function fontStack(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return FONT_BY_NAME.get(name)?.stack ?? `"${name}", ${SANS}`;
}

/** The Google-Fonts spec to load for a stored font name, or undefined (system font). */
export function fontGoogleSpec(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return FONT_BY_NAME.get(name)?.google;
}
