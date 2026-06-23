import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Medinovaqbank" },
      { name: "description", content: "Frequently asked questions about Medinovaqbank." },
      { property: "og:title", content: "FAQ — Medinovaqbank" },
      { property: "og:description", content: "Frequently asked questions about Medinovaqbank." },
    ],
  }),
  component: Faq,
});

const groups = [
  {
    title: "Getting started",
    items: [
      { q: "How does the free trial work?", a: "Sign in with Google and you immediately get 10 free questions across any bank. No card required. When you're ready, pick a plan from /pricing." },
      { q: "Which devices are supported?", a: "Any modern browser on desktop, tablet, or mobile. Sessions sync across devices when you sign in." },
    ],
  },
  {
    title: "Subscriptions & billing",
    items: [
      { q: "Is pricing in GHS?", a: "Yes — all prices are in Ghana Cedis and billed through Paystack." },
      { q: "Can I cancel anytime?", a: "Yes. Your subscription remains active until the end of the current billing period." },
      { q: "Do I get access to all question banks?", a: "All paid plans include every published bank, including future additions during your subscription." },
    ],
  },
  {
    title: "Content & quizzes",
    items: [
      { q: "How are questions written?", a: "Authored by practising clinicians and reviewed by a content editorial board. Every question has a detailed explanation." },
      { q: "How does the answer explanation work?", a: "When you answer, you see why the correct option is right, why your distractor was wrong, and the clinical scenario in which each other option would be correct." },
      { q: "Can I flag a question?", a: "Yes — every question has a flag button. Flags are reviewed by our content team within 48 hours." },
    ],
  },
];

function Faq() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Support</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Frequently asked questions</h1>
        <p className="mt-3 text-base text-muted-foreground">Can't find what you're looking for? <a className="text-accent hover:underline" href="/contact">Contact us</a>.</p>

        <div className="mt-12 space-y-10">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{g.title}</h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {g.items.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-surface-alt"
      >
        {q}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
}
