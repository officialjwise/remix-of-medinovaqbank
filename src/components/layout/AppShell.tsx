import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  ChevronLeft,
  CreditCard,
  HelpCircle,
  Home,
  Library,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ScrollText,
  Settings,
  Trophy,
  User as UserIcon,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";
import { useBranding } from "@/hooks/useBranding";
import { NotificationsBell } from "@/components/layout/header/NotificationsBell";
import { HeaderSearch, type SearchItem } from "@/components/layout/header/HeaderSearch";
import { AvatarMenu } from "@/components/layout/header/AvatarMenu";
import { SubscriptionChip, TrialBanner } from "@/components/shared/SubscriptionStatus";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { usePublicBanks } from "@/api/banks.api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/banks", label: "Question Banks", icon: Library },
  { to: "/notes", label: "High Yield Notes", icon: BookOpen },
  { to: "/sessions", label: "My Sessions", icon: ScrollText },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
] as const;

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/banks": "Question Banks",
  "/notes": "High Yield Notes",
  "/sessions": "My Sessions",
  "/bookmarks": "Bookmarks",
  "/leaderboard": "Leaderboard",
  "/analytics": "Analytics",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/subscription": "Subscription",
};

export function AppShell({ children }: { children: ReactNode }) {
  useBranding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titleMap[pathname] ?? "Medinovaqbank";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <SidebarInner collapsed={collapsed} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
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
      <div
        className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-60"}`}
      >
        <Topbar
          title={title}
          onMenu={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-10">
          <TrialBanner />
          {children}
        </main>
      </div>

      <UpgradeModal />
    </div>
  );
}

function SidebarInner({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, subscription, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/" });
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link
          to="/"
          className="flex items-center"
          onClick={onNavigate}
          aria-label="Medinovaqbank home"
        >
          <Logo size={34} markOnly={collapsed} />
        </Link>
      </div>

      {!collapsed && (
        <div className="border-y border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                (user?.name ?? "U").slice(0, 1)
              )}
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
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground ${
              collapsed ? "justify-center" : ""
            }`}
            activeProps={{
              className: `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold bg-accent-light text-accent ${
                collapsed ? "justify-center" : ""
              }`,
            }}
          >
            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-error-light hover:text-error ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

function Topbar({
  title,
  onMenu,
  onToggleCollapse,
  collapsed,
}: {
  title: string;
  onMenu: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: banksData } = usePublicBanks({ limit: 50 });

  function handleLogout() {
    logout();
    localStorage.removeItem("accessToken");
    navigate({ to: "/" });
  }

  const searchItems: SearchItem[] = [
    ...(banksData?.banks ?? []).map((b) => ({
      id: b.id,
      label: b.name,
      sublabel: `${b.subject} · ${b.questionCount} questions`,
      group: "Question Banks",
      onSelect: () => navigate({ to: "/banks" }),
    })),
    ...nav.map((n) => ({
      id: n.to,
      label: n.label,
      group: "Pages",
      onSelect: () => navigate({ to: n.to }),
    })),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-muted-foreground hover:bg-surface-alt lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
          <Link to="/dashboard" className="font-medium text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground/50" />
          <span className="font-semibold text-foreground">{title}</span>
        </nav>
        <h1 className="text-base font-semibold text-foreground sm:hidden">{title}</h1>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderSearch placeholder="Search question banks, topics…" items={searchItems} />
          <SubscriptionChip />
          <NotificationsBell audience="user" viewAllHref="/notifications" />
          <Link
            to="/help"
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground sm:inline-flex"
            aria-label="Help & support"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </Link>
          <ThemeToggle />
          <AvatarMenu
            name={user?.name ?? "Practitioner"}
            email={user?.email ?? ""}
            avatarUrl={user?.avatarUrl}
            items={[
              { label: "Profile", icon: UserIcon, to: "/profile" },
              { label: "Subscription", icon: CreditCard, to: "/subscription" },
              { label: "Settings", icon: Settings, to: "/profile" },
            ]}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
