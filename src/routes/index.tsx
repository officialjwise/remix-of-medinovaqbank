import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  GraduationCap,
  LineChart,
  Quote,
  Sparkles,
  Star,
  Stethoscope,
  Timer,
  Trophy,
  UserPlus,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RotatingHero } from "@/components/brand/RotatingHero";
import { usePaidPlans, useTrialPlan } from "@/stores/plansStore";
import { useCmsStore } from "@/stores/cmsStore";
import { useExamTypesStore } from "@/stores/examTypesStore";
import { questionBanks } from "@/data/banks";

const institutions = [
  "Korle Bu Teaching Hospital",
  "KNUST School of Medicine",
  "University of Ghana Medical School",
  "Komfo Anokye Teaching Hospital",
  "37 Military Hospital",
  "Tamale Teaching Hospital",
];

const heroAvatars = ["AM", "KO", "EA", "YB", "AD"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        name: "description",
        content:
          "Ghana's premier medical question bank. Detailed clinical explanations, real-time analytics, tutor and quiz modes — built for serious medical professionals.",
      },
      { property: "og:title", content: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        property: "og:description",
        content:
          "Ghana's premier medical question bank. Detailed clinical explanations, real-time analytics, tutor and quiz modes.",
      },
    ],
  }),
  component: LandingPage,
});

const trustBadges = [
  "5,000+ Questions",
  "Clinical Breakdowns",
  "Ghana Medical Standard",
  "Real-time Analytics",
];

const stats = [
  { value: "6,000+", label: "Practitioners studying" },
  { value: "5,000+", label: "Board-style questions" },
  { value: "9", label: "Question banks" },
  { value: "88%", label: "Median pass confidence" },
];

const howItWorks = [
  {
    icon: UserPlus,
    title: "Sign in & start free",
    body: "Sign in with Google and get an instant free trial — sample questions across every bank, no card required.",
  },
  {
    icon: Brain,
    title: "Practise with guided tutoring",
    body: "Answer board-style vignettes. Every answer comes with a detailed clinical breakdown of why it's right and the others wrong.",
  },
  {
    icon: LineChart,
    title: "Track & climb",
    body: "Watch your percentile rise on the bell curve, then top the leaderboard as you close your weak spots.",
  },
];

function LandingPage() {
  const paid = usePaidPlans();
  const trial = useTrialPlan();
  const { cms } = useCmsStore();
  const examTypes = useExamTypesStore((s) => s.examTypes);
  const activeExams = examTypes.filter((e) => e.active);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #06302E 0%, #0E7C7B 45%, #1A9F7A 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: "#2BC97F" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
          style={{ background: "#7BE0B0" }}
        />

        <div className="container-page grid items-center gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur">
              <Stethoscope className="h-3.5 w-3.5 text-[#7BE0B0]" />
              Built for medical practitioners
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              {cms.about.heroTitle}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              {cms.about.heroSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0E7C7B] shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.4)] transition-transform hover:-translate-y-0.5"
              >
                Start free trial
              </Link>
              <Link
                to="/pricing"
                className="rounded-xl border border-white/30 bg-white/0 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2.5">
                {heroAvatars.map((a, i) => (
                  <span
                    key={a}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0E7C7B] bg-gradient-to-br from-white/90 to-white/70 text-[11px] font-bold text-[#0E7C7B]"
                    style={{ zIndex: heroAvatars.length - i }}
                  >
                    {a}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-[#FFD66B]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-0.5 text-xs font-medium text-white/75">Join 6,000+ practitioners preparing smarter</p>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {trustBadges.map((b) => (
                <div
                  key={b}
                  className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/65"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2BC97F]" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <RotatingHero />
          </div>
        </div>

        {/* TRUST / STATS BAND */}
        <div className="border-t border-white/10 bg-black/10">
          <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <p className="text-2xl font-bold tracking-tight md:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/65">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTITUTIONS TRUST BAND */}
      <section className="border-b border-border bg-surface py-10">
        <div className="container-page">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by students &amp; doctors at
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {institutions.map((name) => (
              <span key={name} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground/80">
                <Stethoscope className="h-4 w-4 text-[#0E7C7B]" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS — from cms.about.features */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Why Medinovaqbank</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to walk into the exam confident
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cms.about.features.map((f, i) => {
            const Icon = [Brain, BarChart3, GraduationCap][i % 3];
            return (
              <div
                key={f.id}
                className="group rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 text-[#0E7C7B] transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-surface-alt/40">
        <div className="container-page py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From sign-in to top of the leaderboard
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                <span className="absolute right-6 top-6 text-4xl font-bold text-border">{i + 1}</span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TUTOR VS QUIZ */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Two ways to study</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Learn in Tutor mode, prove it in Quiz mode
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#0E7C7B]/30 bg-surface p-7 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E7C7B]/10 text-[#0E7C7B]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">Tutor mode</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Instant feedback after every answer. The clinical breakdown appears the moment you commit — perfect for
              learning a topic from scratch and locking in the reasoning.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Explanation after each question</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> No timer pressure</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Build understanding fast</li>
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-[#2BC97F]/30 bg-surface p-7 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#2BC97F]/15 text-[#1FA968]">
              <Timer className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">Quiz mode</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Simulate real exam conditions. Answers are hidden until you finish, then a full review walks you
              through every question — exactly like sitting the real thing.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Timed, exam-style sessions</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Full review at the end</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Benchmark your readiness</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CLINICAL BREAKDOWN HIGHLIGHT */}
      <section className="border-y border-border bg-surface-alt/40">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2BC97F]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#1FA968]">
              <Sparkles className="h-3.5 w-3.5" /> Clinical Breakdowns
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Every answer, explained like a consultant on call
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every breakdown doesn't just mark you right or wrong. It explains why the correct option wins, why each
              distractor fails, the single key learning point, and the clinical scenario where another option would
              flip to correct.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" /> Distractor-by-distractor rationale</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" /> Key learning point on every question</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" /> Links to related concepts</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card-hover)]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white">
                <Brain className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold text-foreground">Clinical breakdown</p>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-success/30 bg-success-light/40 p-3">
                <p className="font-semibold text-foreground">B · Aortic dissection — correct</p>
                <p className="mt-1 text-muted-foreground">Tearing pain radiating to the back with an inter-arm BP differential is the classic presentation.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
                <p className="font-semibold text-foreground">A · Myocardial infarction — why not</p>
                <p className="mt-1 text-muted-foreground">Would not explain the &gt;20 mmHg inter-arm differential or the tearing quality.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
                <p className="font-semibold text-foreground">Key learning point</p>
                <p className="mt-1 text-muted-foreground">Always check both arms in sudden severe chest pain.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS / PERCENTILE + LEADERBOARD */}
      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 text-[#0E7C7B]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">Gaussian performance analytics</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              See exactly where you sit on the bell curve against the cohort. Percentile ranking, topic-by-topic
              accuracy, and a trend line that tracks your trajectory to exam day.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-4">
              <p className="text-3xl font-bold text-foreground">88th</p>
              <p className="text-sm text-muted-foreground">percentile — you scored higher than 88% of peers this week.</p>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-warning/15 to-warning/10 text-warning">
              <Trophy className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">National leaderboard</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Compete with medical professionals nationwide. Weekly rankings keep you accountable and turn revision
              into a habit you actually look forward to.
            </p>
            <div className="mt-5 space-y-2">
              {[
                { r: 1, n: "Dr. Akua M.", s: "96%" },
                { r: 2, n: "Dr. Kwame O.", s: "94%" },
                { r: 3, n: "You", s: "91%", you: true },
              ].map((row) => (
                <div
                  key={row.r}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 text-sm ${
                    row.you ? "border-accent/40 bg-accent-light/40" : "border-border bg-surface-alt/40"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-xs font-bold text-white">{row.r}</span>
                  <span className={`flex-1 font-semibold ${row.you ? "text-foreground" : "text-muted-foreground"}`}>{row.n}</span>
                  <span className="font-mono font-bold text-foreground">{row.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALTIES / QUESTION BANKS */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Question banks</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {questionBanks.length} specialties, thousands of vignettes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Board-style cases across every core rotation — each with clinical breakdowns and analytics.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questionBanks.map((b) => (
            <div
              key={b.id}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: b.accentHex }}
              >
                <GraduationCap className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-foreground">{b.subject}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {b.questionCount.toLocaleString()} questions · {b.topics.length} topics
                </p>
              </div>
              {b.isFree && (
                <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  Free
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* EXAM COVERAGE */}
      {activeExams.length > 0 && (
        <section className="border-y border-border bg-surface-alt/40">
          <div className="container-page py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Exam coverage</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              One bank, every exam that matters
            </h2>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
              {activeExams.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                  {e.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRICING — mapped from paid plans + trial callout */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple plans built for medical prep
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {paid.map((p) => {
            const isPopular = !!p.badgeLabel;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-0.5 ${
                  isPopular
                    ? "border-2 border-[#2BC97F] bg-surface shadow-[var(--shadow-card-hover)]"
                    : "border-border bg-surface shadow-[var(--shadow-card)]"
                }`}
              >
                {p.badgeLabel && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    {p.badgeLabel}
                  </span>
                )}
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">GHS</span>
                  <span className="text-3xl font-bold tracking-tight text-foreground">{p.price.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.durationLabel}</p>

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.bullets.filter((b) => b.included).slice(0, 4).map((b) => (
                    <li key={b.id} className="flex items-start gap-2 text-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{b.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    isPopular
                      ? "bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] text-white hover:opacity-95"
                      : "border border-border bg-surface text-foreground hover:bg-surface-alt"
                  }`}
                >
                  Choose plan
                </Link>
              </div>
            );
          })}
        </div>

        {trial && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {trial.name}: {trial.durationLabel} — {trial.badgeLabel}.{" "}
            <Link to="/pricing" className="font-semibold text-[#0E7C7B] hover:underline">
              Compare plans →
            </Link>
          </p>
        )}
      </section>

      {/* TESTIMONIALS — from cms.about.testimonials */}
      {cms.about.testimonials.length > 0 && (
        <section className="border-y border-border bg-surface-alt/40">
          <div className="container-page py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">
                Loved by medical professionals
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted across hospitals and schools
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cms.about.testimonials.map((t) => (
                <figure key={t.id} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                  <Quote className="h-5 w-5 text-[#2BC97F]" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-sm font-bold text-white">
                      {initials(t.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — from cms.faqs */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions, answered
            </h2>
          </div>
          <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-surface">
            {cms.faqs.map((f) => (
              <FaqItem key={f.id} q={f.question} a={f.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section
        className="text-white"
        style={{
          background:
            "linear-gradient(135deg, #06302E 0%, #0E7C7B 50%, #1A9F7A 100%)",
        }}
      >
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to start?</h2>
            <p className="mt-2 text-sm text-white/75">
              Create your account and get your free trial. No credit card required.
            </p>
          </div>
          <Link
            to="/login"
            className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0E7C7B] shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.4)] transition-transform hover:-translate-y-0.5"
          >
            Start free trial
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="flex w-full flex-col items-stretch px-5 py-4 text-left"
      aria-expanded={open}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
      {open && <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</span>}
    </button>
  );
}
