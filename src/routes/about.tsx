import { createFileRoute, Link } from "@tanstack/react-router";
import { Quote, Sparkles } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useCmsStore } from "@/stores/cmsStore";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Medinovaqbank" },
      {
        name: "description",
        content:
          "Medinovaqbank is built by clinicians for clinicians. Our mission is to make world-class medical exam prep accessible across Africa and beyond.",
      },
      { property: "og:title", content: "About — Medinovaqbank" },
      {
        property: "og:description",
        content:
          "Built by clinicians for clinicians. Making world-class medical exam prep accessible.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { cms } = useCmsStore();
  const { about } = cms;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full opacity-30 blur-3xl"
          style={{ background: "#7BE0B0" }}
        />
        <div className="container-page py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/75">Our story</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {about.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/85">{about.heroSubtitle}</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            What sets us apart
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for the way you actually study
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {about.features.map((f) => (
            <div
              key={f.id}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 text-primary transition-transform group-hover:scale-110">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      {about.testimonials.length > 0 && (
        <section className="container-page pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              In their words
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Trusted by clinicians on the wards
            </h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {about.testimonials.map((t) => (
              <figure
                key={t.id}
                className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <Quote className="h-6 w-6 text-accent" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
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
        </section>
      )}

      {/* CTA */}
      <section className="text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to start?</h2>
            <p className="mt-2 text-sm text-white/75">
              Create your account and get your free trial. No credit card required.
            </p>
          </div>
          <Link
            to="/register"
            className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.4)] transition-transform hover:-translate-y-0.5"
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
