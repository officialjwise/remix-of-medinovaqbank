import { createFileRoute } from "@tanstack/react-router";
import { Heart, ShieldCheck, Target } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

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

const values = [
  {
    icon: Target,
    title: "Clinically accurate",
    body: "Every question is written and reviewed by practising doctors. References cite primary sources and current guidelines.",
  },
  {
    icon: Heart,
    title: "Built for the way you study",
    body: "No bloat, no marketing pop-ups. A focused interface that respects your time and your concentration.",
  },
  {
    icon: ShieldCheck,
    title: "Fair, accessible pricing",
    body: "Pricing built for African medical students first. World-class prep should not cost a month's salary.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="container-page py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Our story
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Better tools for the next generation of clinicians
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Medinovaqbank started in a Ghanaian medical school study group, with
            a simple frustration: every quality question bank was either priced
            for the US market or didn't reflect the cases we actually see. So we
            built our own — and opened it to the world.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="card-surface p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-border bg-surface p-8">
          <h2 className="text-2xl font-bold text-foreground">Our mission</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To make world-class medical exam preparation accessible to every
            student and practitioner who wants it — wherever they are in the
            world. We measure our success not in users acquired, but in
            clinicians passing the exams that change their lives.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
