import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
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
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";


const sectionPlatform = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
] as const;

const sectionUsers = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, superOnly: true },
] as const;

const sectionContent = [
  { to: "/admin/banks", label: "Question Banks", icon: Library },
  { to: "/admin/notes", label: "High Yield Notes", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/flags", label: "Flagged Questions", icon: Flag },
] as const;


const sectionRevenue = [
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/settings/plans", label: "Pricing Plans", icon: Folder, superOnly: true },
] as const;

const sectionSystem = [
  { to: "/admin/ai-settings", label: "AI Settings", icon: Brain, superOnly: true },
  { to: "/admin/api", label: "API Management", icon: Key, superOnly: true },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
  { to: "/admin/settings/system", label: "System Settings", icon: Settings, superOnly: true },
] as const;

const allItems = [
  ...sectionPlatform,
  ...sectionUsers,
  ...sectionContent,
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
    navigate({ to: "/admin/login" });
  }

  const isSuper = user?.role === "SUPER_ADMIN";
  const initials = (user?.name ?? "AD").split(" ").map((s) => s[0]).slice(0, 2).join("");

  function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
    const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? "bg-gradient-to-r from-[#2BC97F]/15 to-transparent text-[#7BE0B0] shadow-[inset_2px_0_0_0_#2BC97F]"
            : "text-white/65 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="h-[17px] w-[17px] flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }



  type NavSpec = { to: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean };

  function Section({ title, items }: { title: string; items: readonly NavSpec[] }) {
    const list = items.filter((i) => isSuper || !i.superOnly);
    if (!list.length) return null;
    return (
      <div className="mb-3">
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
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
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <Logo size={32} tone="light" />
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Administrator"}</p>
            <p className="mt-0.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7BE0B0]">
              {isSuper ? "Super Admin" : "Admin"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Section title="Platform" items={sectionPlatform} />
        <Section title="People" items={sectionUsers} />
        <Section title="Content" items={sectionContent} />
        <Section title="Revenue" items={sectionRevenue} />
        <Section title="System" items={sectionSystem} />
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/admin/profile"
          onClick={() => setMobileOpen(false)}
          className="mb-1.5 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/5 hover:text-white"
        >
          <UserCog className="h-4 w-4" /> Profile Settings
        </Link>
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="mb-1.5 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/5 hover:text-white"
        >
          <ScrollText className="h-4 w-4" /> Exit to App
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-error/20 hover:text-[#FF8A8A]"
        >
          <LogOut className="h-[17px] w-[17px]" />
          Logout
        </button>
      </div>
    </>
  );

  const currentLabel = allItems.find((n) => pathname === n.to || (n.to !== "/admin/dashboard" && pathname.startsWith(n.to)))?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-[#06182E] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0A1F38] lg:flex">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0A1F38]">
            <SidebarBody />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A1F38]/85 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2 rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            <h1 className="truncate text-sm font-semibold tracking-tight">{currentLabel}</h1>
            <span className="ml-auto rounded-full bg-gradient-to-r from-[#0E7C7B]/40 to-[#2BC97F]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#7BE0B0] ring-1 ring-[#2BC97F]/30">
              {isSuper ? "Super Admin" : "Admin"}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="rounded-2xl bg-background text-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.5)]">
            <div className="p-5 sm:p-6 lg:p-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
