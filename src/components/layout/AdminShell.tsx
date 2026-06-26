import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Flag,
  Folder,
  Key,
  LayoutDashboard,
  Library,
  LogOut,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Tag,
  UserCog,
  Users,
  UploadCloud,
  MonitorPlay,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";

const sectionPlatform = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
  { to: "/admin/quiz-analytics", label: "Quiz Analytics", icon: TrendingUp },
] as const;

const sectionContent = [
  { to: "/admin/banks", label: "Question Banks", icon: Library },
  { to: "/admin/questions", label: "Questions", icon: BookOpen },
  { to: "/admin/categories", label: "Categories & Subjects", icon: Tag },
  { to: "/admin/uploads", label: "Bulk Uploads", icon: UploadCloud },
  { to: "/admin/flags", label: "Flagged Questions", icon: Flag },
] as const;

const sectionUsers = [
  { to: "/admin/users", label: "All Users", icon: Users },
  { to: "/admin/sessions", label: "Session Management", icon: MonitorPlay },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, superOnly: true },
] as const;

const sectionRevenue = [
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/reports", label: "Revenue Reports", icon: FileText },
  { to: "/admin/settings/plans", label: "Pricing Plans", icon: Folder, superOnly: true },
] as const;

const sectionSystem = [
  { to: "/admin/settings/system", label: "System Settings", icon: Settings, superOnly: true },
  { to: "/admin/api", label: "API Keys", icon: Key, superOnly: true },
  { to: "/admin/audit-logs", label: "Activity Logs", icon: Activity },
] as const;

const allItems = [
  ...sectionPlatform,
  ...sectionContent,
  ...sectionUsers,
  ...sectionRevenue,
  ...sectionSystem,
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/login" });
  }

  const isSuper = user?.role === "SUPER_ADMIN";
  const initials = (user?.name ?? "AD").split(" ").map((s) => s[0]).slice(0, 2).join("");

  function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
    const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"
        }`}
      >
        {active && (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary" />
        )}
        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`} />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  type NavSpec = { to: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean };

  function Section({ title, items }: { title: string; items: readonly NavSpec[] }) {
    const list = items.filter((i) => isSuper || !i.superOnly);
    if (!list.length) return null;
    return (
      <div className="mb-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
          {title}
        </p>
        <div className="space-y-0.5">
          {list.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </div>
      </div>
    );
  }

  const SidebarBody = () => (
    <>
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
        <Logo size={30} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="-mr-1 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Administrator"}</p>
            <span className="mt-0.5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {isSuper ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <Section title="Platform" items={sectionPlatform} />
        <Section title="Content" items={sectionContent} />
        <Section title="People" items={sectionUsers} />
        <Section title="Revenue" items={sectionRevenue} />
        <Section title="System" items={sectionSystem} />
      </nav>

      <div className="border-t border-border p-3">
        <Link
          to="/admin/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
        >
          <UserCog className="h-[15px] w-[15px]" /> Profile Settings
        </Link>
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
        >
          <ScrollText className="h-[15px] w-[15px]" /> Exit to App
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Logout
        </button>
      </div>
    </>
  );

  const currentLabel = allItems.find((n) => pathname === n.to || (n.to !== "/admin/dashboard" && pathname.startsWith(n.to)))?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-2xl">
            <SidebarBody />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-base font-bold tracking-tight text-foreground">{currentLabel}</h1>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary sm:inline-flex">
                {isSuper ? "Super Admin" : "Admin"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
