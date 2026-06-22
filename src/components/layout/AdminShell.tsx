import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  Flag,
  Library,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/banks", label: "Question Banks", icon: Library },
  { to: "/admin/flags", label: "Flagged Questions", icon: Flag },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const settingsNav = [
  { to: "/admin/settings/plans", label: "Pricing Plans" },
  { to: "/admin/settings/system", label: "System Config" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/admin/login" });
  }

  const initials = (user?.name ?? "AD").split(" ").map((s) => s[0]).slice(0, 2).join("");
  const isSuper = user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#06182E] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0A1F38] lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">Medinovaqbank</p>
            <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Admin Console
            </p>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name ?? "Administrator"}</p>
              <p className="mt-0.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {isSuper ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}

          <div className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-wide text-white/40">
            Settings
          </div>
          <Link
            to="/admin/settings/pricing"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/admin/settings")
                ? "text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
          <div className="ml-7 mt-0.5 space-y-0.5">
            {settingsNav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-accent/15 text-accent" : "text-white/60 hover:text-white"
                  }`}
                >
                  └ {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            to="/dashboard"
            className="mb-1.5 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white"
          >
            ← Exit Admin
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-error/20 hover:text-error"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A1F38]/80 backdrop-blur">
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-sm font-semibold tracking-tight">
              {nav.find((n) => n.to === pathname)?.label ??
                settingsNav.find((n) => n.to === pathname)?.label ??
                "Admin"}
            </h1>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              {isSuper ? "Super Admin" : "Admin"}
            </span>
          </div>
        </header>
        <main className="px-6 py-8 lg:px-10">
          <div className="rounded-2xl bg-background text-foreground shadow-[var(--shadow-card)]">
            <div className="p-6 lg:p-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
