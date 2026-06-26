import { createFileRoute } from "@tanstack/react-router";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useCmsStore } from "@/stores/cmsStore";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Medinovaqbank" },
      { name: "description", content: "How Medinovaqbank collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Medinovaqbank" },
      { property: "og:description", content: "How Medinovaqbank collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function Privacy() {
  const { cms } = useCmsStore();
  const doc = cms.legal.privacy;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {formatDate(doc.updatedAt)}</p>

        <article
          className="prose prose-sm dark:prose-invert mt-10 max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-accent [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: doc.body }}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
