import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ tone = "default" }: { tone?: "default" | "dark" }) {
  const { theme, toggle } = useTheme();
  const base =
    tone === "dark"
      ? "rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
      : "rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground";
  return (
    <button
      type="button"
      onClick={toggle}
      className={base}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
