import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MoreHorizontal, Search, ShieldOff, UserCheck, X, Eye, ToggleLeft, CreditCard, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "Active" | "Trial" | "Suspended";
  joined: string;
}

const seed: AdminUserRow[] = [
  { id: "u-1", name: "Akua Mensah", email: "akua@example.com", specialty: "Cardiology", role: "USER", status: "Active", joined: "2025-08-12" },
  { id: "u-2", name: "Kwame Boateng", email: "kwame@example.com", specialty: "Neurology", role: "USER", status: "Trial", joined: "2026-01-04" },
  { id: "u-3", name: "Adjoa Owusu", email: "adjoa@example.com", specialty: "Surgery", role: "USER", status: "Active", joined: "2025-11-22" },
  { id: "u-4", name: "Yaw Asante", email: "yaw@example.com", specialty: "Internal Medicine", role: "ADMIN", status: "Active", joined: "2025-04-18" },
  { id: "u-5", name: "Ama Darko", email: "ama@example.com", specialty: "Paediatrics", role: "USER", status: "Suspended", joined: "2025-02-09" },
  { id: "u-6", name: "Kojo Annan", email: "kojo@example.com", specialty: "OB/GYN", role: "USER", status: "Active", joined: "2025-10-30" },
  { id: "u-7", name: "Efua Asare", email: "efua@example.com", specialty: "Psychiatry", role: "USER", status: "Trial", joined: "2026-02-14" },
  { id: "u-8", name: "Kofi Adu", email: "kofi@example.com", specialty: "Anaesthesia", role: "USER", status: "Active", joined: "2025-06-21" },
  { id: "u-9", name: "Esi Quaye", email: "esi@example.com", specialty: "Radiology", role: "USER", status: "Active", joined: "2025-09-03" },
  { id: "u-10", name: "Nana Appiah", email: "nana@example.com", specialty: "Family Medicine", role: "USER", status: "Active", joined: "2025-07-15" },
];

function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"All" | AdminUserRow["role"]>("All");
  const [status, setStatus] = useState<"All" | AdminUserRow["status"]>("All");

  const rows = useMemo(() => {
    return seed.filter((r) => {
      if (role !== "All" && r.role !== role) return false;
      if (status !== "All" && r.status !== status) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
      }
      return true;
    });
  }, [q, role, status]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} of {seed.length} accounts</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select label="Role" value={role} onChange={(v) => setRole(v as typeof role)} options={["All", "USER", "ADMIN", "SUPER_ADMIN"]} />
        <Select label="Status" value={status} onChange={(v) => setStatus(v as typeof status)} options={["All", "Active", "Trial", "Suspended"]} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.5fr_1fr_120px_120px_110px_60px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>User</span>
          <span>Specialty</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span></span>
        </div>
        {rows.map((u) => (
          <div key={u.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.5fr_1fr_120px_120px_110px_60px] md:items-center md:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <span className="text-sm text-foreground">{u.specialty}</span>
            <span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                u.role === "SUPER_ADMIN" ? "bg-primary text-primary-foreground" :
                u.role === "ADMIN" ? "bg-accent text-accent-foreground" : "bg-surface-alt text-muted-foreground"
              }`}>
                {u.role.replace("_", " ")}
              </span>
            </span>
            <span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                u.status === "Active" ? "bg-success-light text-success" :
                u.status === "Trial" ? "bg-warning-light text-warning" : "bg-error-light text-error"
              }`}>
                {u.status === "Active" ? <UserCheck className="h-3 w-3" /> : u.status === "Suspended" ? <ShieldOff className="h-3 w-3" /> : null}
                {u.status}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{u.joined}</span>
            <UserActionsMenu user={u} />
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">No users match those filters.</div>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function UserActionsMenu({ user }: { user: AdminUserRow }) {
  const [open, setOpen] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative ml-auto">
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
            <MenuItem
              icon={<Eye className="h-4 w-4" />}
              label="View Profile"
              onClick={() => {
                setOpen(false);
                navigate({ to: "/admin/users/$userId", params: { userId: user.id } });
              }}
            />
            <MenuItem icon={<ToggleLeft className="h-4 w-4" />} label={user.status === "Suspended" ? "Activate" : "Suspend"} onClick={() => { toast.success(`${user.name} ${user.status === "Suspended" ? "activated" : "suspended"}`); setOpen(false); }} />
            <MenuItem icon={<CreditCard className="h-4 w-4" />} label="Override Subscription" onClick={() => { setShowOverride(true); setOpen(false); }} />
            <MenuItem icon={<Shield className="h-4 w-4" />} label="Change Role" onClick={() => { setShowRole(true); setOpen(false); }} />
            <div className="border-t border-border" />
            <MenuItem icon={<Trash2 className="h-4 w-4" />} label="Delete User" destructive onClick={() => { setShowDelete(true); setOpen(false); }} />
          </div>
        </>
      )}

      {showOverride && (
        <OverrideSubscriptionModal user={user} onClose={() => setShowOverride(false)} />
      )}

      {showRole && (
        <ChangeRoleModal user={user} onClose={() => setShowRole(false)} />
      )}

      {showDelete && (
        <UserModal title="Delete user?" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-muted-foreground">
            Permanently delete <span className="font-semibold text-foreground">{user.name}</span> and all their session data. This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setShowDelete(false)} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
            <button onClick={() => { toast.success("User deleted"); setShowDelete(false); }} className="inline-flex h-10 items-center rounded-lg bg-error px-4 text-sm font-semibold text-white hover:bg-error/90">
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </button>
          </div>
        </UserModal>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, destructive }: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt ${destructive ? "text-error" : "text-foreground"}`}>
      {icon}
      {label}
    </button>
  );
}

function UserModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function OverrideSubscriptionModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [plan, setPlan] = useState("3 Months");
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  return (
    <UserModal title={`Override subscription · ${user.name}`} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm">
            {["Monthly", "3 Months", "6 Months", "12 Months"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">End Date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
        <button onClick={() => { toast.success(`Subscription updated for ${user.name}`); onClose(); }} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save</button>
      </div>
    </UserModal>
  );
}

function ChangeRoleModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [role, setRole] = useState<AdminUserRow["role"]>(user.role);
  return (
    <UserModal title={`Change role · ${user.name}`} onClose={onClose}>
      <div className="space-y-2">
        {(["USER", "ADMIN", "SUPER_ADMIN"] as const).map((r) => (
          <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${role === r ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-surface-alt"}`}>
            <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
            <span className="text-sm font-semibold text-foreground">{r.replace("_", " ")}</span>
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
        <button onClick={() => { toast.success(`Role changed to ${role.replace("_", " ")}`); onClose(); }} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save</button>
      </div>
    </UserModal>
  );
}
