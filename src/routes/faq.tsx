import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useCmsStore } from "@/stores/cmsStore";
import type { FaqEntry } from "@/stores/cmsStore";

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

function Faq() {
  const { cms } = useCmsStore();

  const groups = useMemo(() => {
    const map = new Map<string, FaqEntry[]>();
    for (const f of cms.faqs) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries());
  }, [cms.faqs]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Support</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Can't find what you're looking for?{" "}
          <a className="text-accent hover:underline" href="/contact">
            Contact us
          </a>
          .
        </p>

        <div className="mt-12 space-y-10">
          {groups.map(([category, items]) => (
            <section key={category}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {items.map((item) => (
                  <FaqItem key={item.id} q={item.question} a={item.answer} />
                ))}
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
        aria-expanded={open}
      >
        {q}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
}
