import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Stethoscope, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
  brandHeadline?: string;
  brandSubline?: string;
  brandHighlight?: ReactNode;
}

// Honest, non-numeric product props — no fabricated counts or ratings.
const STATS = [
  { value: "Tutor + Quiz", label: "Study modes" },
  { value: "Expert", label: "Clinical breakdowns" },
  { value: "Live", label: "Performance analytics" },
];

export function AuthSplit({
  children,
  brandHeadline = "Master Medicine.",
  brandSubline = "Ace Every Exam.",
  brandHighlight,
}: Props) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-5">
      {/* Left brand panel — the cover */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:col-span-2 lg:flex"
        style={{ background: "linear-gradient(160deg, var(--primary) 0%, #0A1F38 100%)" }}
      >
        {/* Decorative layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Medinova<span className="text-accent">qbank</span>
          </span>
        </Link>

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Ghana's #1 medical question bank
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {brandHeadline}
            <br />
            <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
              {brandSubline}
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Detailed clinical explanations, real-time analytics, tutor and quiz modes — built for
            serious medical professionals.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
              >
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-white/60">{s.label}</p>
              </div>
            ))}
          </div>

          {brandHighlight ?? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-white">Built for serious exam prep</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Detailed clinical breakdowns, tutor and quiz modes, and real-time analytics — so
                every question doubles as a lesson.
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/40">
          <span>© {new Date().getFullYear()} Medinovaqbank</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure &amp; encrypted
          </span>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 lg:col-span-3">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Medinova<span className="text-accent">qbank</span>
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

export function GoogleButton({
  onClick,
  label = "Sign in with Google",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.4-4.6 2.3-7.5 2.3-5.4 0-10-3.5-11.6-8.3l-6.6 5.1C9.4 39.5 16.1 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.5 5.3C40.9 35.5 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"
        />
      </svg>
      {label}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
