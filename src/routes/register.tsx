import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Check, UserPlus, Loader2 } from "lucide-react";
import { AuthSplit, AuthDivider, GoogleButton } from "@/components/auth/AuthSplit";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { authApi, establishSession } from "@/api/auth.api";
import { ApiError } from "@/api/client";
import { useGeneralSettings } from "@/stores/settingsStore";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Medinovaqbank" },
      {
        name: "description",
        content:
          "Create your free Medinovaqbank account and start practising with detailed clinical explanations.",
      },
    ],
  }),
  component: RegisterPage,
});

const SPECIALTIES = [
  "Medical Student",
  "General Practice",
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Emergency Medicine",
  "Anesthesia",
  "Psychiatry",
  "Radiology",
  "Pathology",
  "Family Medicine",
  "Other",
];

function RegisterPage() {
  const navigate = useNavigate();
  const { trialDays, trialQuestionLimit } = useGeneralSettings();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGoogle() {
    // Full-page redirect to the backend OAuth entry point (new users land in onboarding).
    window.location.href = authApi.googleUrl();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the Terms of Service and Privacy Policy.");

    setLoading(true);
    try {
      const tokens = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        specialty,
      });
      const user = await establishSession(tokens);
      navigate({ to: user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard" });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit
      brandHeadline="Start Free."
      brandSubline="Pass with Confidence."
      brandHighlight={
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm font-semibold text-white">Your free trial includes</p>
          {[
            `${trialQuestionLimit} practice questions, on us`,
            "Detailed clinical explanations on every answer",
            `${trialDays}-day full access — no card required`,
          ].map((perk) => (
            <p key={perk} className="flex items-start gap-2.5 text-sm text-white/85">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              {perk}
            </p>
          ))}
        </div>
      }
    >
      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <UserPlus className="h-6 w-6" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Join thousands of practitioners preparing the smart way.
      </p>

      <div className="mt-8">
        <GoogleButton onClick={handleGoogle} label="Sign up with Google" />
      </div>

      <AuthDivider />

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Dr. Ama Owusu"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="specialty">
            Specialty / level
          </label>
          <select
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 pr-11 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Re-enter your password"
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent accent-accent focus:ring-accent/30"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="font-medium text-foreground hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-foreground hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating your account…
            </>
          ) : (
            "Create free account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-light">
          Sign in
        </Link>
      </p>
    </AuthSplit>
  );
}
