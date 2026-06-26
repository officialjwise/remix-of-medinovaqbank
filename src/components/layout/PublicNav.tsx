import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/stores/authStore";

export function PublicNav() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" aria-label="Medinovaqbank home">
          <Logo size={36} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            Home
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            About
          </Link>
          <Link
            to="/faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            FAQ
          </Link>
          <Link
            to="/help"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            Help
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground text-sm font-semibold" }}
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user?.name}
              </span>
              <Link
                to="/dashboard"
                className="rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.4)] transition-transform hover:-translate-y-0.5"
              >
                Open dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.4)] transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
