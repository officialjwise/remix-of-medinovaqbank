import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CreditCard,
  Home,
  Library,
  LogOut,
  Menu,
  ScrollText,
  Trophy,
  User as UserIcon,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/stores/authStore";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/banks", label: "Question Banks", icon: Library },
  { to: "/sessions", label: "My Sessions", icon: ScrollText },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
] as const;

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/banks": "Question Banks",
  "/sessions": "My Sessions",
  "/leaderboard": "Leaderboard",
  "/analytics": "Analytics",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/subscription": "Subscription",
};

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titleMap[pathname] ?? "Medinovaqbank";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <SidebarInner />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarInner onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-60">
        <Topbar title={title} onMenu={() => setMobileOpen(true)} />
        <main className="px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, subscription, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/" });
  }

  const trial =
    subscription?.status === "TRIAL"
      ? `Free Trial: ${10 - (subscription.trialQuestionsLeft ?? 0)}/${
          subscription.trialQuestionsTotal ?? 10
        } used`
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/" className="flex items-center" onClick={onNavigate} aria-label="Medinovaqbank home">
          <Logo size={36} />
        </Link>
      </div>

      <div className="border-y border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {(user?.name ?? "U").slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Practitioner"}
            </p>
            {user?.specialty && (
              <span className="mt-0.5 inline-flex rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {user.specialty}
              </span>
            )}
          </div>
        </div>
        {subscription?.status === "ACTIVE" ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
            ✓ Active until Jan 2026
          </p>
        ) : trial ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">
            ⚠ {trial}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold bg-accent-light text-accent",
            }}
          >
            <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-error-light hover:text-error"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}

function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { subscription, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/" });
  }

  const chip =
    subscription?.status === "ACTIVE" ? (
      <span className="hidden items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success sm:inline-flex">
        ✓ Active
      </span>
    ) : subscription?.status === "TRIAL" ? (
      <span className="hidden items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning sm:inline-flex">
        ⚠ Trial: {subscription.trialQuestionsLeft ?? 0} left
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-3">
          {chip}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              aria-label="Account menu"
            >
              {(user?.name ?? "U").slice(0, 1)}
            </button>
            {open && (
              <div
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)]"
                onMouseLeave={() => setOpen(false)}
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-alt"
                >
                  Profile
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-alt"
                >
                  Subscription
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error-light"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
