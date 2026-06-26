import { useState } from "react";
import { Mail, Flag, UserCog, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settingsStore";

interface BaseUser {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  institution?: string;
  role?: string;
  status?: string;
}

function Shell({ title, icon, onClose, children, footer }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-bold text-foreground">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt" aria-label="Close"><X className="h-4 w-4" /></button>
        </header>
        <div className="space-y-4 p-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function EditUserModal({ user, onClose, onSave }: { user: BaseUser; onClose: () => void; onSave: (patch: Partial<BaseUser>) => void }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    specialty: user.specialty ?? "",
    institution: user.institution ?? "",
    role: user.role ?? "USER",
    status: user.status ?? "active",
  });
  const [saving, setSaving] = useState(false);

  return (
    <Shell
      title="Edit user"
      icon={<UserCog className="h-4 w-4 text-accent" />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
          <button
            disabled={saving}
            onClick={() => {
              if (!form.name.trim()) return toast.error("Name is required");
              setSaving(true);
              setTimeout(() => { onSave(form); toast.success("User updated"); onClose(); }, 400);
            }}
            className="h-10 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Labeled>
        <Labeled label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Labeled>
        <Labeled label="Specialty"><input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={inputCls} /></Labeled>
        <Labeled label="Institution"><input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className={inputCls} /></Labeled>
        <Labeled label="Role">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
            {["USER", "ADMIN", "SUPER_ADMIN"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Labeled>
        <Labeled label="Status">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
            {["active", "trial", "expired", "suspended", "none"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Labeled>
      </div>
    </Shell>
  );
}

export function ComposeEmailModal({ user, onClose }: { user: BaseUser; onClose: () => void }) {
  const templates = useSettingsStore((s) => s.settings.templates);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  function applyTemplate(key: string) {
    const t = templates.find((x) => x.key === key);
    if (!t) return;
    setSubject(t.subject.replace(/\{\{userName\}\}|\{\{name\}\}/g, user.name).replace(/\{\{platformName\}\}/g, "Medinovaqbank"));
    setBody(`(Using "${t.name}" template — the branded HTML version will be sent.)`);
  }

  return (
    <Shell
      title="Send email"
      icon={<Mail className="h-4 w-4 text-accent" />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
          <button
            disabled={sending}
            onClick={() => {
              if (!subject.trim()) return toast.error("Subject is required");
              setSending(true);
              setTimeout(() => { toast.success(`Email sent to ${user.email}`); onClose(); }, 600);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send"}
          </button>
        </>
      }
    >
      <Labeled label="To"><input readOnly value={user.email} className={`${inputCls} bg-surface-alt/60 text-muted-foreground`} /></Labeled>
      <Labeled label="Use template (optional)">
        <select onChange={(e) => e.target.value && applyTemplate(e.target.value)} className={inputCls} defaultValue="">
          <option value="">— No template —</option>
          {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </select>
      </Labeled>
      <Labeled label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} /></Labeled>
      <Labeled label="Message">
        <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </Labeled>
    </Shell>
  );
}

export function FlagAccountModal({ user, onClose, onFlag }: { user: BaseUser; onClose: () => void; onFlag: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const presets = ["Suspicious login activity", "Multiple device attempts", "Payment dispute", "Policy violation"];

  return (
    <Shell
      title="Flag account"
      icon={<Flag className="h-4 w-4 text-warning" />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
          <button
            onClick={() => {
              if (!reason.trim()) return toast.error("Add a reason");
              onFlag(reason);
              toast.success(`${user.name} flagged for review`);
              onClose();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-warning px-5 text-sm font-bold text-white hover:opacity-90"
          >
            <Flag className="h-4 w-4" /> Flag account
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">Flagging adds a review marker to <strong className="text-foreground">{user.name}</strong>'s account.</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => setReason(p)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${reason === p ? "border-warning bg-warning/10 text-warning" : "border-border text-muted-foreground hover:text-foreground"}`}>{p}</button>
        ))}
      </div>
      <Labeled label="Reason / notes">
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe why this account is being flagged…" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </Labeled>
    </Shell>
  );
}
