import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Applies admin-configured branding colours to the document at runtime by
 * overriding the CSS custom properties the theme reads from. Hex values are
 * valid wherever the theme uses the oklch tokens, so this "just works".
 */
export function useBranding() {
  const branding = useSettingsStore((s) => s.settings.branding);

  useEffect(() => {
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty("--primary", branding.primaryColor);
      root.style.setProperty("--primary-light", branding.primaryColor);
      root.style.setProperty("--ring", branding.accentColor || branding.primaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty("--accent", branding.accentColor);
    }
  }, [branding.primaryColor, branding.accentColor]);
}
