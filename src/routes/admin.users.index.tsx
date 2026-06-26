import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MoreHorizontal, Search, ShieldOff, UserCheck, Eye, ToggleLeft, CreditCard, Shield, Trash2, Download, ChevronUp, ChevronDown, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export const Route = createFileRoute("/admin/users/")({
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
  
  const [sortKey, setSortKey] = useState<keyof AdminUserRow>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAndSorted = useMemo(() => {
    let result = seed.filter((r) => {
      if (role !== "All" && r.role !== role) return false;
      if (status !== "All" && r.status !== status) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
      }
      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [q, role, status, sortKey, sortDir]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, page, perPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage);

  function handleSort(key: keyof AdminUserRow) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll() {
    if (selectedIds.size === paginatedRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRows.map(r => r.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleExport() {
    toast.success(`Exported ${filteredAndSorted.length} users to CSV`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">All Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">{filteredAndSorted.length} matching accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name or email…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select label="Role" value={role} onChange={(v) => { setRole(v as typeof role); setPage(1); }} options={["All", "USER", "ADMIN", "SUPER_ADMIN"]} />
          <Select label="Status" value={status} onChange={(v) => { setStatus(v as typeof status); setPage(1); }} options={["All", "Active", "Trial", "Suspended"]} />
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-sm font-semibold text-accent">{selectedIds.size} selected</span>
            <button onClick={() => toast.success("Selected users suspended")} className="h-8 rounded border border-warning/30 bg-warning/10 px-3 text-xs font-semibold text-warning hover:bg-warning/20">Suspend</button>
            <button onClick={() => toast.success("Selected users deleted")} className="h-8 rounded border border-error/30 bg-error/10 px-3 text-xs font-semibold text-error hover:bg-error/20">Delete</button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm text-foreground">
          <thead className="bg-surface-alt/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-3">
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size > 0 && selectedIds.size === paginatedRows.length ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <SortableHeader label="User" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Specialty" sortKey="specialty" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Role" sortKey="role" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Joined" sortKey="joined" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((u) => (
                <tr key={u.id} className="hover:bg-surface-alt/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(u.id)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(u.id) ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white shadow-sm">
                        {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.specialty}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      u.role === "SUPER_ADMIN" ? "bg-primary/10 text-primary border border-primary/20" :
                      u.role === "ADMIN" ? "bg-accent/10 text-accent border border-accent/20" :
                      "bg-surface-alt text-muted-foreground border border-border"
                    }`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.status === "Active" ? "bg-success/10 text-success border border-success/20" :
                      u.status === "Trial" ? "bg-warning/10 text-warning border border-warning/20" : 
                      "bg-error/10 text-error border border-error/20"
                    }`}>
                      {u.status === "Active" ? <UserCheck className="h-3 w-3" /> : u.status === "Suspended" ? <ShieldOff className="h-3 w-3" /> : null}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3 text-right">
                    <UserActionsMenu user={u} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 rounded-md border border-border bg-surface px-2 focus:border-accent focus:outline-none"
            >
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50">
              &lt;
            </button>
            <span className="px-3 font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50">
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableHeader({ label, sortKey, currentKey, dir, onSort }: { label: string; sortKey: string; currentKey: string; dir: "asc" | "desc"; onSort: (k: any) => void }) {
  const isActive = sortKey === currentKey;
  return (
    <th className="px-4 py-3">
      <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 hover:text-foreground font-semibold group">
        {label}
        <span className={`flex flex-col ${isActive ? "text-accent" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`}>
          <ChevronUp className={`h-2.5 w-2.5 -mb-1 ${isActive && dir === "asc" ? "opacity-100" : "opacity-40"}`} />
          <ChevronDown className={`h-2.5 w-2.5 ${isActive && dir === "desc" ? "opacity-100" : "opacity-40"}`} />
        </span>
      </button>
    </th>
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
  const [showDelete, setShowDelete] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
            <button
              onClick={() => { setOpen(false); navigate({ to: "/admin/users/$userId", params: { userId: user.id } }); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt text-foreground"
            >
              <Eye className="h-4 w-4" /> View Profile
            </button>
            <div className="border-t border-border" />
            <button
              onClick={() => { setOpen(false); setShowDelete(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt text-error"
            >
              <Trash2 className="h-4 w-4" /> Delete User
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete user?"
        description={`Permanently delete ${user.name} and all their session data. This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onCancel={() => setShowDelete(false)}
        onConfirm={() => {
          toast.success("User deleted");
          setShowDelete(false);
        }}
      />
    </div>
  );
}
