import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Flag,
  Folder,
  GraduationCap,
  Key,
  LayoutDashboard,
  Library,
  LogOut,
  Plus,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Tag,
  UploadCloud,
  UserCog,
  Users,
  MonitorPlay,
  TrendingUp,
  Globe2,
  Layers,
  Bell,
  NotebookText,
  ShieldAlert,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useBranding } from "@/hooks/useBranding";
import { useClickOutside } from "@/hooks/useClickOutside";
import { NotificationsBell } from "@/components/layout/header/NotificationsBell";
import { HeaderSearch, type SearchItem } from "@/components/layout/header/HeaderSearch";
import { AvatarMenu } from "@/components/layout/header/AvatarMenu";
import { useAdminBanks } from "@/api/banks.api";
import { useAdminUsers } from "@/api/admin-users.api";

const sectionPlatform = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
  { to: "/admin/traffic", label: "Traffic & Geography", icon: Globe2 },
  { to: "/admin/quiz-analytics", label: "Quiz Analytics", icon: TrendingUp },
] as const;

const sectionContent = [
  { to: "/admin/banks", label: "Question Banks", icon: Library },
  { to: "/admin/questions", label: "Questions", icon: BookOpen },
  { to: "/admin/categories", label: "Categories & Subjects", icon: Tag },
  { to: "/admin/exam-types", label: "Exam Types", icon: GraduationCap },
  { to: "/admin/notes", label: "High-Yield Notes", icon: NotebookText },
  { to: "/admin/uploads", label: "Bulk Uploads", icon: UploadCloud },
  { to: "/admin/flags", label: "Flagged Questions", icon: Flag },
] as const;

const sectionUsers = [
  { to: "/admin/users", label: "All Users", icon: Users },
  { to: "/admin/sessions", label: "Session Management", icon: MonitorPlay },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, superOnly: true },
] as const;

const sectionBilling = [
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/subscriptions/plans", label: "Subscription Plans", icon: Folder, superOnly: true },
  { to: "/admin/settings/features", label: "Feature Catalog", icon: Layers, superOnly: true },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/reports", label: "Revenue Reports", icon: FileText },
] as const;

const sectionSystem = [
  { to: "/admin/settings/system", label: "System Settings", icon: Settings, superOnly: true },
  { to: "/admin/restrictions", label: "Restrictions", icon: ShieldAlert, superOnly: true },
  { to: "/admin/api", label: "API Keys", icon: Key, superOnly: true },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/audit-logs", label: "Activity Logs", icon: Activity },
] as const;

const allItems = [
  ...sectionPlatform,
  ...sectionContent,
  ...sectionUsers,
  ...sectionBilling,
  ...sectionSystem,
];

export function AdminShell({ children }: { children: ReactNode }) {
  useBranding();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isSuper = user?.role === "SUPER_ADMIN";

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/login" });
  }

  function NavItem({
    to,
    label,
    icon: Icon,
    collapsed,
  }: {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    collapsed: boolean;
  }) {
    const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? label : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? "justify-center" : ""
        } ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"}`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary"
          />
        )}
        <Icon
          className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  type NavSpec = { to: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean };

  function Section({
    title,
    items,
    collapsed,
  }: {
    title: string;
    items: readonly NavSpec[];
    collapsed: boolean;
  }) {
    const list = items.filter((i) => isSuper || !i.superOnly);
    if (!list.length) return null;
    return (
      <div className="mb-5">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
            {title}
          </p>
        )}
        <div className="space-y-0.5">
          {list.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>
    );
  }

  const initials = (user?.name ?? "AD")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  const SidebarBody = ({ collapsed }: { collapsed: boolean }) => (
    <>
      <div
        className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}
      >
        <Logo size={30} markOnly={collapsed} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="-mr-1 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!collapsed && (
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name ?? "Administrator"}
              </p>
              <span className="mt-0.5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                {isSuper ? "Super Admin" : "Admin"}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <Section title="Platform" items={sectionPlatform} collapsed={collapsed} />
        <Section title="Content" items={sectionContent} collapsed={collapsed} />
        <Section title="People" items={sectionUsers} collapsed={collapsed} />
        <Section title="Billing & Subscriptions" items={sectionBilling} collapsed={collapsed} />
        <Section title="System" items={sectionSystem} collapsed={collapsed} />
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed ? (
          <>
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
          </>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-error/10 hover:text-error ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-[15px] w-[15px]" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </>
  );

  const currentLabel =
    allItems.find(
      (n) => pathname === n.to || (n.to !== "/admin/dashboard" && pathname.startsWith(n.to)),
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-2xl">
            <SidebarBody collapsed={false} />
          </aside>
        </div>
      )}

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}
      >
        <AdminHeader
          breadcrumb={currentLabel}
          onMenu={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
          isSuper={isSuper}
          onLogout={handleLogout}
          userName={user?.name ?? "Administrator"}
          userEmail={user?.email ?? ""}
          userAvatar={user?.avatarUrl}
        />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-in fade-in duration-300">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminHeader({
  breadcrumb,
  onMenu,
  onToggleCollapse,
  collapsed,
  isSuper,
  onLogout,
  userName,
  userEmail,
  userAvatar,
}: {
  breadcrumb: string;
  onMenu: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  isSuper: boolean;
  onLogout: () => void;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}) {
  const navigate = useNavigate();
  const ai = useSettingsStore((s) => s.settings.ai.status);
  const payment = useSettingsStore((s) => s.settings.payment.status);
  const systemHealthy = ai !== "error" && payment !== "error";

  const { data: usersData } = useAdminUsers({ limit: 40 });
  const { data: banksData } = useAdminBanks({ limit: 100 });

  const searchItems: SearchItem[] = [
    ...(usersData?.users ?? []).map((u) => ({
      id: u.id,
      label: u.name,
      sublabel: u.email,
      group: "Users",
      onSelect: () => navigate({ to: "/admin/users/$userId", params: { userId: u.id } }),
    })),
    ...(banksData?.banks ?? []).map((b) => ({
      id: b.id,
      label: b.name,
      sublabel: `${b.subject} · ${b.questionCount} questions`,
      group: "Question Banks",
      onSelect: () => navigate({ to: "/admin/banks" }),
    })),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="-ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
          <Link
            to="/admin/dashboard"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-semibold text-foreground">{breadcrumb}</span>
        </nav>
        <h1 className="truncate text-base font-bold text-foreground sm:hidden">{breadcrumb}</h1>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderSearch placeholder="Search users, banks, questions…" items={searchItems} />
          <QuickActionsMenu />
          <SystemStatus healthy={systemHealthy} />
          <NotificationsBell audience="admin" viewAllHref="/admin/notifications" />
          <ThemeToggle />
          <AvatarMenu
            name={userName}
            email={userEmail}
            avatarUrl={userAvatar}
            roleLabel={isSuper ? "Super Admin" : "Admin"}
            items={[
              { label: "Profile", icon: UserCog, to: "/admin/profile" },
              { label: "System Settings", icon: Settings, to: "/admin/settings/system" },
              { label: "Activity Logs", icon: Activity, to: "/admin/audit-logs" },
            ]}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}

function QuickActionsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const actions: { label: string; to: string; icon: typeof Plus }[] = [
    { label: "Add Question Bank", to: "/admin/banks/create", icon: Library },
    { label: "Add Question", to: "/admin/questions/create", icon: BookOpen },
    { label: "Bulk Upload", to: "/admin/uploads", icon: UploadCloud },
    { label: "Create Plan", to: "/admin/settings/plans/create", icon: Folder },
    { label: "Add Exam Type", to: "/admin/exam-types", icon: GraduationCap },
  ];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 sm:px-3"
        aria-label="Quick actions"
      >
        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[var(--shadow-card-hover)]">
          {actions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-alt"
            >
              <a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemStatus({ healthy }: { healthy: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="hidden items-center gap-2 rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground md:inline-flex"
        aria-label="System status"
      >
        <span className="relative flex h-2.5 w-2.5">
          {healthy && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${healthy ? "bg-success" : "bg-error"}`}
          />
        </span>
        <span className="hidden lg:inline">
          {healthy ? "All systems operational" : "System issue"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card-hover)]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            System health
          </p>
          {[
            { label: "API & Web", ok: true },
            { label: "AI Provider (Gemini)", ok: healthy },
            { label: "Payments (Paystack)", ok: healthy },
            { label: "Database", ok: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1 text-sm">
              <span className="text-foreground">{row.label}</span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${row.ok ? "text-success" : "text-error"}`}
              >
                <span className={`h-2 w-2 rounded-full ${row.ok ? "bg-success" : "bg-error"}`} />{" "}
                {row.ok ? "Operational" : "Error"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
