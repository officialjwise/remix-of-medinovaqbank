import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";

const LINKS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/", label: "Home", exact: true },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/help", label: "Help" },
  { to: "/contact", label: "Contact" },
];

export function PublicNav() {
  const { isAuthenticated, user } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Medinovaqbank home" className="flex-shrink-0">
          <Logo size={36} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeOptions={l.exact ? { exact: true } : undefined}
              activeProps={{ className: "text-foreground text-sm font-semibold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="hidden rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.4)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="hidden rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.4)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
              >
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="container-page flex flex-col py-3">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                activeOptions={l.exact ? { exact: true } : undefined}
                activeProps={{
                  className:
                    "rounded-lg px-3 py-2.5 text-sm font-semibold bg-accent-light text-accent",
                }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-surface-alt"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Get started — it's free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
