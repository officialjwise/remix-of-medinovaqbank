import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, GraduationCap, Stethoscope, Target } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/onboarding")({
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
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ specialty: "", institution: "", goal: "", country: "Ghana" });

  function next() {
    setStep((s) => Math.min(s + 1, 2));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function finish() {
    toast.success("Profile set up. Let's go!");
    navigate({ to: "/dashboard" });
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
                disabled={!data.goal}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
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
