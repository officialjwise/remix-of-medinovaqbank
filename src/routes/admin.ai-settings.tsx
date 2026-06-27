import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Eye, EyeOff, Loader2, Sparkles, TestTube2, Radio } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { ApiError, BASE_URL } from "@/api/client";
import {
  useSettingsMap,
  useUpdateSettings,
  useRevealSecret,
  useTestAiPrompt,
  settingValue,
  type AiTestPromptResult,
} from "@/api/settings.api";

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

// Backend AI provider is Google Gemini (REST). The catalog keys are
// integration.gemini.apiKey + integration.gemini.model.
const KEY_API = "integration.gemini.apiKey";
const KEY_MODEL = "integration.gemini.model";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

function AISettingsPage() {
  const settingsQuery = useSettingsMap();
  const update = useUpdateSettings();
  const reveal = useRevealSecret();
  const testPrompt = useTestAiPrompt();

  // Masked value / configured flag come from the resolved settings map.
  const map = settingsQuery.data;
  const apiKeySetting = map?.[KEY_API];
  const maskedKey = apiKeySetting?.value ?? "";
  const keyConfigured = apiKeySetting?.isConfigured ?? false;

  const [model, setModel] = useState("gemini-2.5-flash");
  const [showKey, setShowKey] = useState(false);
  // The key field is empty unless the admin is entering a new one or has
  // explicitly revealed the stored secret (never persisted to storage).
  const [keyDraft, setKeyDraft] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState(false);
  const [result, setResult] = useState<AiTestPromptResult | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  // Hydrate the model select from the resolved settings once loaded.
  useEffect(() => {
    if (map) setModel(settingValue(map, KEY_MODEL, "gemini-2.5-flash"));
  }, [map]);

  function handleReveal() {
    if (revealedKey !== null) {
      // Toggle back to masked.
      setRevealedKey(null);
      setShowKey(false);
      return;
    }
    reveal.mutate(KEY_API, {
      onSuccess: (res) => {
        setRevealedKey(res.value ?? "");
        setShowKey(true);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not reveal key"),
    });
  }

  function save() {
    const updates: Array<{ key: string; value: string }> = [{ key: KEY_MODEL, value: model }];
    // Only write the API key when the admin actually typed a new one.
    if (editingKey && keyDraft.trim()) updates.push({ key: KEY_API, value: keyDraft.trim() });

    update.mutate(updates, {
      onSuccess: () => {
        setKeyDraft("");
        setEditingKey(false);
        setRevealedKey(null);
        setShowKey(false);
        toast.success("AI settings saved");
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not save AI settings"),
    });
  }

  function runTest() {
    setResult(null);
    testPrompt.mutate(undefined, {
      onSuccess: (res) => {
        setResult(res);
        if (res.success) toast.success(res.message);
        else toast.error(res.message);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Test prompt failed"),
    });
  }

  /** Stream a live Gemini completion and render it token-by-token as it arrives. */
  async function runStreamTest() {
    setStreaming(true);
    setStreamText("");
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${BASE_URL}/admin/settings/ai/test-stream`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Stream failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setStreamText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not stream from Gemini");
    } finally {
      setStreaming(false);
    }
  }

  // The visible value: a freshly-typed key, the revealed secret, or the mask.
  const keyFieldValue = editingKey ? keyDraft : (revealedKey ?? maskedKey);

  return (
    <div>
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Brain className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The platform uses Google Gemini to generate answer explanations. Users never see the
            provider name — explanations appear simply as "Answer Explanation."
          </p>
        </div>
      </header>

      {/* Provider — single managed provider (Gemini). */}
      <section className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Provider
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="relative rounded-2xl border-2 border-[#2BC97F] bg-gradient-to-br from-[#2BC97F]/10 to-transparent p-5 text-left shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.25)]">
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Sparkles className="h-3 w-3" /> Active
            </span>
            <p className="text-base font-bold text-foreground">Google Gemini</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {keyConfigured ? "API key configured" : "API key not configured"} · server-side only.
            </p>
          </div>
        </div>
      </section>

      {/* Model + key */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Model</h3>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={settingsQuery.isLoading}
            className="mt-3 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            API Key
          </h3>
          <div className="mt-3 flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={keyFieldValue}
              onChange={(e) => {
                setEditingKey(true);
                setKeyDraft(e.target.value);
              }}
              onFocus={() => {
                if (!editingKey) {
                  setEditingKey(true);
                  setKeyDraft("");
                }
              }}
              placeholder={keyConfigured ? "•••• stored — type to replace" : "AIza…"}
              className="h-11 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-alt"
              aria-label={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleReveal}
              disabled={!keyConfigured || reveal.isPending || editingKey}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-40"
            >
              {reveal.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : revealedKey !== null ? (
                "Hide"
              ) : (
                "Reveal"
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Keys are encrypted at rest and only used server-side. The stored key is shown masked;
            use Reveal to view it on demand. It is never embedded in the client bundle or saved to
            this browser.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Test prompt
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runStreamTest}
                disabled={streaming}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-60"
              >
                {streaming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Radio className="h-3.5 w-3.5" />
                )}
                Watch it type
              </button>
              <button
                onClick={runTest}
                disabled={testPrompt.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-60"
              >
                {testPrompt.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <TestTube2 className="h-3.5 w-3.5" />
                )}
                Run test prompt
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            "Watch it type" streams a live answer token-by-token so you can see the model respond in
            real-time. "Run test prompt" runs Gemini against a sample MCQ end-to-end and shows the
            structured clinical breakdown — proving the key + model actually answer.
          </p>

          {(streaming || streamText) && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" /> Live Gemini output
                {streaming && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {streamText}
                {streaming && <span className="ml-0.5 animate-pulse">▋</span>}
              </p>
            </div>
          )}

          {result && (
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                result.success ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
              }`}
            >
              <p className="font-semibold text-foreground">{result.message}</p>
              {result.model && (
                <p className="mt-0.5 text-xs text-muted-foreground">Model: {result.model}</p>
              )}
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sample question
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{result.sampleQuestion}</p>
              {result.breakdown && (
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">Why correct</p>
                    <p className="text-xs text-muted-foreground">{result.breakdown.whyCorrect}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Why others are wrong</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {result.breakdown.whyOthersAreWrong.map((o) => (
                        <li key={o.label} className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{o.label}:</span>{" "}
                          {o.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Key learning point</p>
                    <p className="text-xs text-muted-foreground">
                      {result.breakdown.keyLearningPoint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={save}
          disabled={update.isPending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-6 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          {update.isPending ? "Saving…" : "Save AI settings"}
        </button>
      </div>
    </div>
  );
}
