import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LineChart,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        name: "description",
        content:
          "Professional medical question bank with tutor mode, quiz mode, detailed explanations, and analytics. Built for medical practitioners in Ghana and beyond.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: BookOpen,
    title: "10,000+ board-style questions",
    body: "Vignette-based questions written and peer-reviewed by practising clinicians, mapped to MDCG, USMLE and PLAB blueprints.",
  },
  {
    icon: GraduationCap,
    title: "Tutor & Quiz modes",
    body: "Switch between immediate explanations during practice, or simulate exam conditions with timed, blocked quizzes.",
  },
  {
    icon: LineChart,
    title: "Performance analytics",
    body: "Track accuracy by subject and system, see your percentile against peers, and find your weakest topics fast.",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    body: "Compete with thousands of medical students and doctors. Climb the ranks weekly across institutions.",
  },
  {
    icon: Activity,
    title: "Smart review",
    body: "Flagged, missed and marked questions are auto-organised so every minute of revision counts.",
  },
  {
    icon: Sparkles,
    title: "Always up to date",
    body: "New questions added every week. References updated to reflect the latest guidelines and evidence.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="container-page py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Trusted by medical students across Ghana
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Master Medicine.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Ace Every Exam.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A distraction-free, board-style question bank built for the way
              clinicians actually study. Tutor mode for learning, quiz mode for
              simulating exam day, and analytics to show you exactly where to
              focus next.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-light"
              >
                Start free trial
              </Link>
              <Link
                to="/pricing"
                className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
              >
                See pricing
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              50 free questions · No credit card required
            </p>
          </div>

          {/* Stat strip */}
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: "10K+", l: "Questions" },
              { v: "97%", l: "Pass-rate boost" },
              { v: "30+", l: "Specialties" },
              { v: "4.9★", l: "User rating" },
            ].map((s) => (
              <div key={s.l} className="card-surface px-4 py-5 text-center">
                <dt className="text-2xl font-bold text-primary">{s.v}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Why Medinovaqbank
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to walk into the exam confident
          </h2>
          <p className="mt-4 text-muted-foreground">
            Designed end-to-end for medical exam prep — not retrofitted from a
            generic learning platform.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-surface p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section className="container-page pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface relative overflow-hidden p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Tutor mode
            </span>
            <h3 className="mt-4 text-2xl font-bold text-foreground">
              Learn with every click
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Get the explanation, references, and key takeaways the moment you
              answer. Build durable understanding, not just recognition.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-foreground">
              {["Inline rationales", "Linked references", "Highlight & note tools"].map(
                (i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {i}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-primary/20 p-8 text-primary-foreground"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
            }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Quiz mode
            </span>
            <h3 className="mt-4 text-2xl font-bold">Simulate exam day</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Timed, blocked, distraction-free. The closest you'll get to the
              real thing without sitting it.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Custom block size & timer",
                "End-of-block performance breakdown",
                "Full review with rationales",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="card-surface flex flex-col items-center gap-6 px-8 py-12 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent md:inline-flex">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Ready to start studying smarter?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Join thousands of medical students preparing the right way.
              </p>
            </div>
          </div>
          <Link
            to="/signup"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
          >
            Create your free account
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
