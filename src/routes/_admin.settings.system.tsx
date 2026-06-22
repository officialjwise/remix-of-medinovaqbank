import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_admin/settings/system")({
  head: () => ({ meta: [{ title: "Admin · System — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSystem,
});

function AdminSystem() {
  const [trialQuestions, setTrialQuestions] = useState(10);
  const [aiModel, setAiModel] = useState("gemini-3-flash-preview");
  const [paystack, setPaystack] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">System Configuration</h2>
      <p className="mt-1 text-sm text-muted-foreground">Platform-wide flags. Changes apply on next session refresh.</p>

      <div className="mt-6 space-y-3">
        <Row title="Free Trial Question Limit" desc="Number of free questions a new user gets across all banks.">
          <input
            type="number"
            value={trialQuestions}
            onChange={(e) => setTrialQuestions(Number(e.target.value))}
            className="h-9 w-24 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Row>
        <Row title="AI Explanation Model" desc="Model used to power answer explanations.">
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="gemini-3-flash-preview">Gemini 3 Flash (default)</option>
            <option value="gemini-3-pro">Gemini 3 Pro</option>
            <option value="claude-haiku">Claude Haiku</option>
          </select>
        </Row>
        <Row title="Paystack Payments" desc="Toggle live Paystack checkout. Off ⇒ test sandbox only.">
          <Toggle value={paystack} onChange={setPaystack} />
        </Row>
        <Row title="Maintenance Mode" desc="Show a maintenance banner and pause new sessions.">
          <Toggle value={maintenance} onChange={setMaintenance} />
        </Row>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        {saved && <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">✓ Saved</span>}
        <button
          type="button"
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-[14rem] max-w-md">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-accent" : "bg-surface-alt border border-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}
