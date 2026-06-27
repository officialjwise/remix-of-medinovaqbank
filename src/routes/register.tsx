import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Check, UserPlus, Loader2, ChevronDown, Search } from "lucide-react";
import { AuthSplit, AuthDivider, GoogleButton } from "@/components/auth/AuthSplit";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { authApi, establishSession } from "@/api/auth.api";
import { ApiError } from "@/api/client";
import { usePublicSettings } from "@/api/settings-public.api";
import { useSpecialties } from "@/api/specialties.api";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry } from "@/lib/countries";
import { countryFlag } from "@/lib/flags";
import { useClickOutside } from "@/hooks/useClickOutside";

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

/** Tiny inline fallback for first paint / offline, before useSpecialties() loads. */
const FALLBACK_SPECIALTIES = [
  "Medical Student",
  "General Practice",
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Other",
];

function RegisterPage() {
  const navigate = useNavigate();
  const { data: publicSettings } = usePublicSettings();
  const trialDays = publicSettings?.trialDays ?? 7;
  const trialQuestionLimit = publicSettings?.trialQuestionLimit ?? 10;

  const { data: specialtiesData } = useSpecialties();
  const specialtyOptions = useMemo(
    () => specialtiesData?.map((s) => s.name) ?? FALLBACK_SPECIALTIES,
    [specialtiesData],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The first available specialty acts as the default once the list resolves.
  const selectedSpecialty = specialty || specialtyOptions[0] || "";

  function handleGoogle() {
    // Full-page redirect to the backend OAuth entry point (new users land in onboarding).
    window.location.href = authApi.googleUrl();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email address.");
    if (!selectedSpecialty) return setError("Please select your specialty / level.");
    const country = findCountry(countryCode);
    if (!country) return setError("Please select your country.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the Terms of Service and Privacy Policy.");

    setLoading(true);
    try {
      const tokens = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        specialty: selectedSpecialty,
        country: country.name,
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
            value={selectedSpecialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {specialtyOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="country">
            Country
          </label>
          <CountryCombobox value={countryCode} onChange={setCountryCode} />
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

/** Searchable country picker (zero-dependency). Trigger shows flag + name; the
 *  popover holds a filter input and a scrollable list of flag + name options. */
function CountryCombobox({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useClickOutside<HTMLDivElement>(() => {
    setOpen(false);
    setFilter("");
  });

  const selected = findCountry(value);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [filter]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) setTimeout(() => inputRef.current?.focus(), 0);
      return next;
    });
  }

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setFilter("");
  }

  return (
    <div className="relative mt-1.5" ref={ref}>
      <button
        id="country"
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span className="text-base leading-none">{countryFlag(selected.code)}</span>
              <span className="truncate text-foreground">{selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select your country</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card-hover)]">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search countries…"
              className="block w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No countries match.</li>
            ) : (
              filtered.map((c) => {
                const active = c.code === value;
                return (
                  <li key={c.code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => pick(c.code)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-surface-alt ${
                        active ? "bg-primary/10 font-semibold text-primary" : "text-foreground"
                      }`}
                    >
                      <span className="text-base leading-none">{countryFlag(c.code)}</span>
                      <span className="truncate">{c.name}</span>
                      {active && <Check className="ml-auto h-4 w-4 flex-shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
