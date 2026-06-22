import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CreditCard, HelpCircle, LifeBuoy, MessageSquare, ShieldCheck } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Medinovaqbank" },
      { name: "description", content: "Guides, troubleshooting, and answers for Medinovaqbank users." },
      { property: "og:title", content: "Help Center — Medinovaqbank" },
      { property: "og:description", content: "Guides, troubleshooting, and answers for Medinovaqbank users." },
    ],
  }),
  component: Help,
});

const topics = [
  { icon: BookOpen, title: "Using the quiz", text: "Tutor vs Quiz mode, timing, flags, and reviewing answers." },
  { icon: CreditCard, title: "Billing & plans", text: "Plan comparison, upgrades, refunds, and Paystack receipts." },
  { icon: ShieldCheck, title: "Account & security", text: "Sign-in, account recovery, and securing your account." },
  { icon: MessageSquare, title: "Flag a question", text: "Report typos, outdated guidelines, or ambiguous wording." },
  { icon: LifeBuoy, title: "Troubleshooting", text: "Stuck on loading, missing sessions, or sync issues." },
  { icon: HelpCircle, title: "Frequently asked", text: "Quick answers to the most common questions." },
];

function Help() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">Help Center</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">How can we help?</h1>
          <p className="mt-3 text-base text-muted-foreground">Browse guides or reach the team directly.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <div key={t.title} className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link to="/faq" className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt">Read FAQ</Link>
          <Link to="/contact" className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Contact support</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
