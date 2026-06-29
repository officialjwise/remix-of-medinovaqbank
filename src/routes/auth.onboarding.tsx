import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isAdminRole } from "@/lib/roles";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, GraduationCap, Stethoscope, Target } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { authApi, establishSession } from "@/api/auth.api";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

/**
 * New Google users are redirected here by the backend with a resumable
 * onboarding token in the URL FRAGMENT (#onboardingToken=…) — kept out of the
 * query string/logs/Referer. Read it once on the client, then scrub the hash.
 */
function readOnboardingToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    new URLSearchParams(window.location.hash.replace(/^#/, "")).get("onboardingToken") ?? undefined
  );
}

export const Route = createFileRoute("/auth/onboarding")({
  head: () => ({
    meta: [{ title: "Welcome — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const specialties = [
  "General Practice",
  "Surgery",
  "Cardiology",
  "Neurology",
  "Pharmacology",
  "Pathology",
  "Radiology",
  "Obstetrics & Gynaecology",
  "Paediatrics",
  "Psychiatry",
  "Internal Medicine",
  "Other",
];
const goals = [
  "MBChB / Final exams",
  "MRCP / MRCS",
  "USMLE",
  "Continuing education",
  "Pre-internship review",
];

function Onboarding() {
  const navigate = useNavigate();
  const [onboardingToken] = useState(readOnboardingToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ specialty: "", institution: "", goal: "", country: "Ghana" });
  const [saving, setSaving] = useState(false);

  // Scrub the onboarding token from the URL once read.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // No onboarding session and not signed in → nothing to set up; start at register.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!onboardingToken && !isAuthenticated) {
      navigate({ to: "/register" });
      return;
    }
    // Resume an existing session to prefill what was already entered.
    if (onboardingToken) {
      void authApi
        .onboardingResume(onboardingToken)
        .then((state) => {
          const d = (state.data ?? {}) as Record<string, string>;
          setData((prev) => ({
            specialty: d.specialty ?? prev.specialty,
            institution: d.institution ?? prev.institution,
            country: d.country ?? prev.country,
            goal: d.goal ?? prev.goal,
          }));
        })
        .catch(() => {
          /* expired/invalid token — let the user proceed; complete will surface it */
        });
    }
  }, [onboardingToken, isAuthenticated, navigate]);

  function next() {
    setStep((s) => Math.min(s + 1, 2));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    // Authenticated user without a session (post-register profile step) — the
    // account already exists; profile can be refined later from /profile.
    if (!onboardingToken) {
      toast.success("Profile set up. Let's go!");
      navigate({ to: "/dashboard" });
      return;
    }

    setSaving(true);
    try {
      await authApi.onboardingSaveStep(onboardingToken, {
        step: "profile",
        data: {
          specialty: data.specialty,
          institution: data.institution,
          country: data.country,
        },
      });
      await authApi.onboardingSaveStep(onboardingToken, {
        step: "preferences",
        data: { preferences: { goal: data.goal } },
      });
      const tokens = await authApi.onboardingComplete(onboardingToken);
      const user = await establishSession(tokens);
      toast.success("Welcome to Medinovaqbank!");
      navigate({ to: isAdminRole(user.role) ? "/admin/dashboard" : "/dashboard" });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not finish setting up your account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center">
          <Logo size={36} />
        </div>
      </header>

      <main className="container-page max-w-2xl py-12">
        <Stepper step={step} />

        <div className="mt-8 rounded-2xl border border-border bg-surface p-7 shadow-sm">
          {step === 0 && (
            <Step
              icon={<Stethoscope className="h-6 w-6" />}
              title="What's your specialty?"
              subtitle="We'll personalise your dashboard around it."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {specialties.map((s) => (
                  <button
                    key={s}
                    onClick={() => setData((d) => ({ ...d, specialty: s }))}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${data.specialty === s ? "border-accent bg-accent/5 text-accent" : "border-border bg-background text-foreground hover:border-accent/50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step
              icon={<GraduationCap className="h-6 w-6" />}
              title="Where do you study or practise?"
              subtitle="Used for leaderboard groupings only — kept private otherwise."
            >
              <div className="space-y-3">
                <Field
                  label="Institution / Hospital"
                  value={data.institution}
                  onChange={(v) => setData((d) => ({ ...d, institution: v }))}
                  placeholder="e.g. Korle Bu Teaching Hospital"
                />
                <Field
                  label="Country"
                  value={data.country}
                  onChange={(v) => setData((d) => ({ ...d, country: v }))}
                />
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              icon={<Target className="h-6 w-6" />}
              title="What's your main goal?"
              subtitle="We'll prioritise the most relevant banks first."
            >
              <div className="space-y-2">
                {goals.map((g) => (
                  <button
                    key={g}
                    onClick={() => setData((d) => ({ ...d, goal: g }))}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${data.goal === g ? "border-accent bg-accent/5 text-accent" : "border-border bg-background text-foreground hover:border-accent/50"}`}
                  >
                    {g}
                    {data.goal === g && <CheckCircle2 className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </Step>
          )}

          <div className="mt-7 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                onClick={next}
                disabled={(step === 0 && !data.specialty) || (step === 1 && !data.institution)}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={!data.goal || saving}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? "Finishing…" : "Go to dashboard"} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 block w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function Step({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
        {icon}
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
