import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  Activity,
  UserPlus,
  Hourglass,
  CreditCard,
  UserMinus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  ToggleLeft,
  Smartphone,
  Mail,
  Ban,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Flag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { VirtualRows } from "@/components/shared/VirtualRows";
import { useDebounce } from "@/hooks/useDebounce";
import { adminUsers, type AdminUser } from "@/data/adminData";
import { EditUserModal, ComposeEmailModal, FlagAccountModal } from "@/components/admin/UserActionModals";

export const Route = createFileRoute("/admin/users/")({
  head: () => ({ meta: [{ title: "Admin · Users — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ROW_HEIGHT = 64;
const GRID = "grid-cols-[40px_minmax(220px,2fr)_140px_120px_110px_130px_minmax(140px,1fr)_120px_120px_90px_56px]";

function deviceType(device: string): "Desktop" | "Mobile" | "Tablet" {
  if (/ipad/i.test(device)) return "Tablet";
  if (/ios|iphone|android/i.test(device)) return "Mobile";
  return "Desktop";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const DAY = 86_400_000;

type SortKey = "name" | "specialty" | "role" | "status" | "city" | "registeredAt" | "lastActiveAt" | "lifetimeQuestions";

function StatusPill({ status }: { status: AdminUser["status"] }) {
  const tone =
    status === "active"
      ? "bg-success/10 text-success border border-success/20"
      : status === "trial"
        ? "bg-warning/10 text-warning border border-warning/20"
        : status === "expired" || status === "suspended"
          ? "bg-error/10 text-error border border-error/20"
          : "bg-surface-alt text-muted-foreground border border-border";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

function RolePill({ role }: { role: AdminUser["role"] }) {
  const tone =
    role === "SUPER_ADMIN"
      ? "bg-primary/10 text-primary border border-primary/20"
      : role === "ADMIN"
        ? "bg-accent/10 text-accent border border-accent/20"
        : "bg-surface-alt text-muted-foreground border border-border";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {role.replace("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminUsers() {
  const navigate = useNavigate();

  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 250);

  const [role, setRole] = useState<"All" | AdminUser["role"]>("All");
  const [status, setStatus] = useState<"All" | AdminUser["status"]>("All");
  const [specialty, setSpecialty] = useState("All");
  const [country, setCountry] = useState("All");
  const [device, setDevice] = useState<"All" | "Desktop" | "Mobile" | "Tablet">("All");

  const [sortKey, setSortKey] = useState<SortKey>("registeredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  /* ---- summary metrics ---- */
  const summary = useMemo(() => {
    const now = Date.now();
    return {
      total: adminUsers.length,
      activeToday: adminUsers.filter((u) => now - new Date(u.lastActiveAt).getTime() < DAY).length,
      newThisWeek: adminUsers.filter((u) => now - new Date(u.registeredAt).getTime() < 7 * DAY).length,
      trial: adminUsers.filter((u) => u.status === "trial").length,
      paid: adminUsers.filter((u) => u.status === "active").length,
      churned: adminUsers.filter((u) => u.status === "expired").length,
    };
  }, []);

  const specialties = useMemo(() => Array.from(new Set(adminUsers.map((u) => u.specialty))).sort(), []);
  const countries = useMemo(() => Array.from(new Set(adminUsers.map((u) => u.country))).sort(), []);

  /* ---- filter + sort ---- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = adminUsers.filter((u) => {
      if (role !== "All" && u.role !== role) return false;
      if (status !== "All" && u.status !== status) return false;
      if (specialty !== "All" && u.specialty !== specialty) return false;
      if (country !== "All" && u.country !== country) return false;
      if (device !== "All" && deviceType(u.device) !== device) return false;
      if (q) {
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.institution.toLowerCase().includes(q)
        );
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortKey) {
        case "city":
          av = a.city;
          bv = b.city;
          break;
        case "lifetimeQuestions":
          av = a.lifetimeQuestions;
          bv = b.lifetimeQuestions;
          break;
        case "registeredAt":
        case "lastActiveAt":
          av = new Date(a[sortKey]).getTime();
          bv = new Date(b[sortKey]).getTime();
          break;
        default:
          av = a[sortKey];
          bv = b[sortKey];
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [search, role, status, specialty, country, device, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const allOnPageSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  function toggleAll() {
    if (allOnPageSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildCsv(rows: AdminUser[]) {
    const header = [
      "name",
      "email",
      "role",
      "status",
      "plan",
      "country",
      "registeredAt",
      "lastActiveAt",
      "lifetimeQuestions",
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = rows.map((u) =>
      [u.name, u.email, u.role, u.status, u.plan, u.country, u.registeredAt, u.lastActiveAt, u.lifetimeQuestions]
        .map(esc)
        .join(","),
    );
    return [header.join(","), ...lines].join("\n");
  }

  function download(rows: AdminUser[], name: string) {
    const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    download(filtered, `medinova-users-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${filtered.length} user${filtered.length === 1 ? "" : "s"} to CSV`);
  }

  function handleExportSelected() {
    const rows = filtered.filter((u) => selected.has(u.id));
    download(rows, `medinova-users-selected-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${rows.length} selected user${rows.length === 1 ? "" : "s"}`);
  }

  const listHeight = Math.min(filtered.length * ROW_HEIGHT, 640);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} matching accounts</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={Users} label="Total users" value={summary.total} />
        <SummaryCard icon={Activity} label="Active today" value={summary.activeToday} tone="success" />
        <SummaryCard icon={UserPlus} label="New this week" value={summary.newThisWeek} tone="accent" />
        <SummaryCard icon={Hourglass} label="Trial users" value={summary.trial} tone="warning" />
        <SummaryCard icon={CreditCard} label="Paid users" value={summary.paid} tone="success" />
        <SummaryCard icon={UserMinus} label="Churned" value={summary.churned} tone="error" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search name, email or institution…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Advanced filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <FilterSelect label="Role" value={role} onChange={(v) => setRole(v as typeof role)} options={["All", "USER", "ADMIN", "SUPER_ADMIN"]} />
        <FilterSelect label="Status" value={status} onChange={(v) => setStatus(v as typeof status)} options={["All", "active", "trial", "expired", "none"]} />
        <FilterSelect label="Specialty" value={specialty} onChange={setSpecialty} options={["All", ...specialties]} />
        <FilterSelect label="Country" value={country} onChange={setCountry} options={["All", ...countries]} />
        <FilterSelect label="Device" value={device} onChange={(v) => setDevice(v as typeof device)} options={["All", "Desktop", "Mobile", "Tablet"]} />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 animate-in fade-in">
          <span className="text-sm font-bold text-accent">{selected.size} selected</span>
          <span className="flex-1" />
          <BulkBtn onClick={() => { toast.success(`${selected.size} users activated`); setSelected(new Set()); }} tone="success">
            Activate
          </BulkBtn>
          <BulkBtn onClick={() => { toast.success(`${selected.size} users deactivated`); setSelected(new Set()); }} tone="warning">
            Deactivate
          </BulkBtn>
          <BulkBtn onClick={handleExportSelected} tone="default">
            Export selected
          </BulkBtn>
          <BulkBtn onClick={() => toast.success(`Email queued for ${selected.size} users`)} tone="default">
            Send email
          </BulkBtn>
          <button onClick={() => setSelected(new Set())} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            {/* Header row */}
            <div className={`grid ${GRID} items-center gap-3 border-b border-border bg-surface-alt/40 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground`}>
              <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground" aria-label="Select all">
                {allOnPageSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
              </button>
              <SortHead label="User" k="name" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Specialty" k="specialty" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Role" k="role" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Status" k="status" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <span>Plan</span>
              <SortHead label="Location" k="city" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Registered" k="registeredAt" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Last active" k="lastActiveAt" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead label="Lifetime Qs" k="lifetimeQuestions" sortKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
              <span className="text-right">·</span>
            </div>

            {/* Body */}
            {filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-semibold text-foreground">No users found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <VirtualRows
                items={filtered}
                rowHeight={ROW_HEIGHT}
                height={listHeight}
                renderRow={(u) => (
                  <UserRow
                    user={u}
                    selected={selected.has(u.id)}
                    onToggle={() => toggleOne(u.id)}
                    onView={() => navigate({ to: "/admin/users/$userId", params: { userId: u.id } })}
                    onDelete={() => setDeleteTarget(u)}
                  />
                )}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this user?"
        description={
          deleteTarget ? (
            <span>
              This deletes <strong>{deleteTarget.name}</strong>'s account, quiz sessions and subscription history. This
              cannot be undone.
            </span>
          ) : undefined
        }
        variant="destructive"
        typedConfirmation={deleteTarget?.name}
        confirmLabel="Delete account"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          toast.success(`${deleteTarget?.name} deleted`);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

function UserRow({
  user: u,
  selected,
  onToggle,
  onView,
  onDelete,
}: {
  user: AdminUser;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`grid ${GRID} h-16 items-center gap-3 border-b border-border px-4 transition-colors ${
        selected ? "bg-accent/5" : "hover:bg-surface-alt/40"
      }`}
    >
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label="Select row">
        {selected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
          {u.initials}
        </span>
        <div className="min-w-0">
          <button onClick={onView} className="block truncate text-left text-sm font-semibold text-foreground hover:text-accent">
            {u.name}
          </button>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </div>
      </div>

      <span className="truncate text-sm text-muted-foreground">{u.specialty}</span>
      <span><RolePill role={u.role} /></span>
      <span><StatusPill status={u.status} /></span>
      <span className="truncate text-xs font-semibold text-foreground">{u.plan === "—" ? <span className="text-muted-foreground">—</span> : u.plan}</span>
      <span className="truncate text-sm text-muted-foreground">
        {u.city}, {u.country}
      </span>
      <span className="text-xs text-muted-foreground">{fmtDate(u.registeredAt)}</span>
      <span className="text-xs text-muted-foreground">{relTime(u.lastActiveAt)}</span>
      <span className="text-right text-sm font-semibold tabular-nums text-foreground">{u.lifetimeQuestions.toLocaleString()}</span>

      <div className="flex justify-end">
        <RowActions user={u} onView={onView} onDelete={onDelete} />
      </div>
    </div>
  );
}

function RowActions({ user, onView, onDelete }: { user: AdminUser; onView: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | "edit" | "email" | "flag" | "clearLock">(null);
  const [flagged, setFlagged] = useState(false);

  function act(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 text-left">
      {flagged && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning" title="Flagged for review">
          <Flag className="h-3 w-3" /> Flagged
        </span>
      )}
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-xl">
            <MenuItem icon={Eye} onClick={() => act(onView)}>View profile</MenuItem>
            <MenuItem icon={Pencil} onClick={() => act(() => setModal("edit"))}>Edit profile</MenuItem>
            <MenuItem icon={ToggleLeft} onClick={() => act(() => toast("Override subscription panel opened"))}>Override subscription</MenuItem>
            <MenuItem icon={Smartphone} onClick={() => act(() => setModal("clearLock"))}>Clear device lock</MenuItem>
            <MenuItem icon={Mail} onClick={() => act(() => setModal("email"))}>Send email</MenuItem>
            <MenuItem icon={Flag} onClick={() => act(() => setModal("flag"))}>Flag account</MenuItem>
            <div className="my-1 border-t border-border" />
            <MenuItem icon={Ban} onClick={() => act(() => toast.success(`${user.name} deactivated`))}>Deactivate</MenuItem>
            <MenuItem icon={Trash2} tone="error" onClick={() => act(onDelete)}>Delete</MenuItem>
          </div>
        </>
      )}

      {modal === "edit" && <EditUserModal user={user} onClose={() => setModal(null)} onSave={() => {}} />}
      {modal === "email" && <ComposeEmailModal user={user} onClose={() => setModal(null)} />}
      {modal === "flag" && <FlagAccountModal user={user} onClose={() => setModal(null)} onFlag={() => setFlagged(true)} />}
      <ConfirmDialog
        open={modal === "clearLock"}
        title="Clear device lock?"
        description={<span>This lets <strong>{user.name}</strong> sign in from a new device. Their current bound device ({user.device}) will be released.</span>}
        confirmLabel="Clear device lock"
        onCancel={() => setModal(null)}
        onConfirm={() => { setModal(null); toast.success("Device lock cleared — user can re-bind on next login"); }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI bits                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "error" | "accent";
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : tone === "error"
          ? "bg-error/10 text-error"
          : tone === "accent"
            ? "bg-accent/10 text-accent"
            : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-tight tabular-nums text-foreground">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? "All" : o.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortHead({
  label,
  k,
  sortKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      className={`group flex items-center gap-1 font-bold uppercase tracking-widest hover:text-foreground ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {label}
      <span className={`flex flex-col ${active ? "text-accent" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`}>
        <ChevronUp className={`-mb-1 h-2.5 w-2.5 ${active && dir === "asc" ? "opacity-100" : "opacity-40"}`} />
        <ChevronDown className={`h-2.5 w-2.5 ${active && dir === "desc" ? "opacity-100" : "opacity-40"}`} />
      </span>
    </button>
  );
}

function BulkBtn({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "default" | "success" | "warning" | "error";
}) {
  const cls =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
        : tone === "error"
          ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
          : "border-border bg-surface text-foreground hover:bg-surface-alt";
  return (
    <button onClick={onClick} className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${cls}`}>
      {children}
    </button>
  );
}

function MenuItem({
  icon: Icon,
  children,
  onClick,
  tone = "default",
}: {
  icon: typeof Eye;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "error";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt ${
        tone === "error" ? "text-error" : "text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}
