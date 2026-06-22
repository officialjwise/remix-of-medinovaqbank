import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  ClipboardList,
  GraduationCap,
  Library,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  Trophy,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RotatingHero } from "@/components/brand/RotatingHero";
import { pricingPlans } from "@/data/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        name: "description",
        content:
          "Ghana's premier medical question bank. AI-powered explanations, real-time analytics, tutor and quiz modes — built for serious medical professionals.",
      },
      { property: "og:title", content: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        property: "og:description",
        content:
          "Ghana's premier medical question bank. AI-powered explanations, real-time analytics, tutor and quiz modes.",
      },
    ],
  }),
  component: LandingPage,
});

const trustBadges = [
  "10,000+ Questions",
  "AI Explanations",
  "Ghana Medical Standard",
  "Real-time Analytics",
];

const stats = [
  {
    icon: Library,
    title: "10,000+ Questions",
    body: "Across all major medical subjects, peer-reviewed by practising clinicians.",
  },
  {
    icon: Brain,
    title: "AI-Powered Explanations",
    body: "Detailed rationales for every answer choice — what's right, what's wrong, and when each option would be correct.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    body: "See exactly where you sit on the bell curve compared to your peers.",
  },
];

const features = [
  { icon: GraduationCap, title: "Tutor Mode", body: "Instant feedback after every answer. Learn as you go." },
  { icon: Timer, title: "Quiz Mode", body: "Simulate real exam conditions. Full feedback after completion." },
  { icon: Sparkles, title: "AI Explanations", body: "Know exactly why each option is right or wrong — and when it would flip." },
  { icon: BarChart3, title: "Performance Analytics", body: "See your percentile on a bell curve vs. peers." },
  { icon: Trophy, title: "Leaderboard", body: "Compete with medical professionals nationwide." },
  { icon: ClipboardList, title: "Detailed Review", body: "Revisit any past session question by question, read-only." },
];

const testimonials = [
  {
    name: "Dr. Akua Mensah",
    specialty: "Internal Medicine, KBTH",
    quote: "Best prep tool I've used. The explanations alone are worth it — every answer feels like a tutorial.",
    initials: "AM",
  },
  {
    name: "Dr. Kwame Owusu",
    specialty: "Surgery Resident, KATH",
    quote: "The tutor mode rebuilt how I study. I went from 58% to 84% on my mocks in three months.",
    initials: "KO",
  },
  {
    name: "Dr. Ama Boateng",
    specialty: "OB/GYN, UCC SMS",
    quote: "Finally a question bank that reflects the cases we actually see. The analytics are genuinely useful.",
    initials: "AB",
  },
];

function LandingPage() {
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
        {/* Glow accents */}
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

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Master Medicine.{" "}
              <span className="bg-gradient-to-r from-[#7BE0B0] to-white bg-clip-text text-transparent">
                Ace Every Exam.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Ghana's premier medical question bank. AI-powered explanations,
              real-time analytics, tutor and quiz modes — built for serious
              medical professionals.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0E7C7B] shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.4)] transition-transform hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                to="/pricing"
                className="rounded-xl border border-white/30 bg-white/0 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
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
      </section>

      {/* STATS BAR — proper spacing, no overlap */}
      <section className="container-page py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_0_rgb(15_43_76_/_0.04),0_1px_3px_0_rgb(15_43_76_/_0.06)] transition-shadow hover:shadow-[0_8px_24px_-8px_rgb(14_124_123_/_0.18)]"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-foreground">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Why Medinovaqbank</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to walk into the exam confident
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_0_rgb(15_43_76_/_0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgb(14_124_123_/_0.18)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 text-[#0E7C7B] transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple plans built for medical prep
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
          {pricingPlans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-0.5 ${
                p.popular
                  ? "border-[#2BC97F] bg-surface shadow-[0_16px_40px_-12px_rgb(43_201_127_/_0.25)]"
                  : "border-border bg-surface shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05)]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-3 py-1 text-xs font-bold text-white shadow-md">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                {p.priceMonthly === 0 ? (
                  <span className="text-3xl font-bold text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-muted-foreground">{p.currency}</span>
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {p.priceMonthly.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </>
                )}
              </div>
              <Link
                to="/pricing"
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  p.popular
                    ? "bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] text-white hover:opacity-95"
                    : "border border-border bg-surface text-foreground hover:bg-surface-alt"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Start Free Trial — 10 Questions Free.{" "}
          <Link to="/pricing" className="font-semibold text-[#0E7C7B] hover:underline">
            Compare plans →
          </Link>
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0E7C7B]">
            Loved by medical professionals
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted across hospitals and schools
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_0_rgb(0_0_0_/_0.04)]">
              <ShieldCheck className="h-5 w-5 text-[#2BC97F]" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-sm font-bold text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.specialty}</p>
                </div>
              </figcaption>
            </figure>
          ))}
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
              Create your account and get 10 free questions. No credit card required.
            </p>
          </div>
          <Link
            to="/login"
            className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0E7C7B] shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.4)] transition-transform hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
