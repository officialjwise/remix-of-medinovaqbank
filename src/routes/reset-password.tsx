import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const score = scorePassword(pwd);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (score < 2) {
      toast.error("Choose a stronger password");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast.success("Password updated. You can sign in.");
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex"><Logo size={40} /></div>
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose something strong — at least 8 characters with a mix of letters and numbers.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">New password</span>
              <input type="password" required minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              {pwd && (
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded ${i < score ? (score < 2 ? "bg-error" : score < 3 ? "bg-warning" : "bg-success") : "bg-border"}`} />
                  ))}
                </div>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Confirm password</span>
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              {confirm && pwd === confirm && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Matches</p>
              )}
            </label>
            <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
