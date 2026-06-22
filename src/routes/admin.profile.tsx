import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Admin · Profile — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "Administrator");
  const [email] = useState(user?.email ?? "admin@medinovaqbank.com");
  const [twoFA, setTwoFA] = useState(true);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center gap-5">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-2xl font-bold text-white shadow-lg">
          {initials}
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>
          <span className="mt-2 inline-flex rounded-full bg-gradient-to-r from-[#0E7C7B]/15 to-[#2BC97F]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0E7C7B] ring-1 ring-[#2BC97F]/30">
            {user?.role ?? "ADMIN"}
          </span>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Profile details</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              disabled
              className="h-10 w-full rounded-lg border border-border bg-surface-alt px-3 text-sm text-muted-foreground"
            />
          </Field>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Security</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Two-factor authentication</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Required for all admin accounts.</p>
            </div>
            <button
              onClick={() => setTwoFA((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${twoFA ? "bg-[#2BC97F]" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  twoFA ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => toast.message("Sending password reset to your email…")}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
          >
            Change password
          </button>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => toast.success("Profile saved")}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-6 text-sm font-bold text-white shadow-md"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
