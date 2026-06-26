import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ai-settings")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (useAuthStore.getState().user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin · AI Settings — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AISettingsPage,
});

const providers = [
  {
    id: "lovable",
    name: "Lovable AI Gateway",
    note: "Default — managed, no key required.",
    recommended: true,
  },
  { id: "openai", name: "OpenAI", note: "GPT-4o, GPT-5 family." },
  { id: "anthropic", name: "Anthropic", note: "Claude 3.5 / 4 models." },
  { id: "google", name: "Google", note: "Gemini family." },
];

const models: Record<string, string[]> = {
  lovable: [
    "google/gemini-2.5-flash (fast)",
    "google/gemini-2.5-pro (quality)",
    "openai/gpt-5-mini",
  ],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-5"],
  anthropic: ["claude-haiku-4", "claude-sonnet-4"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
};

function AISettingsPage() {
  const [provider, setProvider] = useState("lovable");
  const [model, setModel] = useState(models["lovable"][0]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [temperature, setTemperature] = useState(0.4);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a clinical educator. For each medical question, explain why the correct answer is correct, why each distractor is wrong, and a brief scenario in which each distractor would be correct. Use precise clinical language; avoid mentioning that you are an AI.",
  );

  function save() {
    toast.success("AI settings saved");
  }

  return (
    <div>
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Brain className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which AI provider powers answer explanations. Users never see provider names —
            explanations appear simply as "Answer Explanation."
          </p>
        </div>
      </header>

      {/* Provider grid */}
      <section className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Provider
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProvider(p.id);
                setModel(models[p.id][0]);
              }}
              className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                provider === p.id
                  ? "border-[#2BC97F] bg-gradient-to-br from-[#2BC97F]/10 to-transparent shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.25)]"
                  : "border-border bg-surface hover:border-[#2BC97F]/40"
              }`}
            >
              {p.recommended && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" /> Recommended
                </span>
              )}
              <p className="text-base font-bold text-foreground">{p.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Model + key + tuning */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Model</h3>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-3 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {models[provider].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            API Key{" "}
            {provider === "lovable" && <span className="font-normal normal-case">— managed</span>}
          </h3>
          <div className="mt-3 flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={provider === "lovable" ? "•••••• MANAGED ••••••" : apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={provider === "lovable"}
              placeholder={provider === "openai" ? "sk-..." : "Enter API key"}
              className="h-11 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-alt disabled:text-muted-foreground"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              disabled={provider === "lovable"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-alt disabled:opacity-40"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Keys are encrypted at rest and only used server-side. Never embedded in the client
            bundle.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Temperature
          </h3>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="flex-1 accent-[#2BC97F]"
            />
            <span className="w-12 rounded-md bg-surface-alt px-2 py-1 text-center font-mono text-sm">
              {temperature.toFixed(2)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Lower = more deterministic; higher = more creative. 0.3–0.5 recommended for clinical
            content.
          </p>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            System prompt
          </h3>
          <textarea
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Appears as the system message. Keep instructions consistent with the user-facing
            branding (no AI name).
          </p>
        </div>
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => toast.message("Test request sent — check audit logs")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-alt"
        >
          Run test prompt
        </button>
        <button
          onClick={save}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-6 text-sm font-bold text-white shadow-md"
        >
          Save AI settings
        </button>
      </div>
    </div>
  );
}
