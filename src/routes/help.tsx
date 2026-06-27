import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useCmsStore } from "@/stores/cmsStore";
import type { HelpArticle } from "@/stores/cmsStore";
import { useCmsHelp } from "@/api/cms.api";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Medinovaqbank" },
      {
        name: "description",
        content: "Guides, troubleshooting, and answers for Medinovaqbank users.",
      },
      { property: "og:title", content: "Help Center — Medinovaqbank" },
      {
        property: "og:description",
        content: "Guides, troubleshooting, and answers for Medinovaqbank users.",
      },
    ],
  }),
  component: Help,
});

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ");
}

function Help() {
  const { cms } = useCmsStore();
  const [query, setQuery] = useState("");
  // Live help articles from the CMS (grouped by category). Fall back to the
  // local seed while loading or if the backend returns nothing.
  const { data: liveGroups } = useCmsHelp();

  const articles: HelpArticle[] = useMemo(() => {
    if (liveGroups && liveGroups.length > 0) {
      return liveGroups.flatMap((g) =>
        g.articles.map((a) => ({
          id: a.id,
          category: a.category,
          title: a.title,
          body: a.body,
        })),
      );
    }
    return cms.helpArticles;
  }, [liveGroups, cms.helpArticles]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            stripHtml(a.body).toLowerCase().includes(q),
        )
      : articles;

    const map = new Map<string, HelpArticle[]>();
    for (const a of filtered) {
      const list = map.get(a.category) ?? [];
      list.push(a);
      map.set(a.category, list);
    }
    return Array.from(map.entries());
  }, [articles, query]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">Help Center</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            How can we help?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Browse guides or reach the team directly.
          </p>

          <div className="relative mt-8">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground shadow-[var(--shadow-card)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          {groups.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No articles match "{query}". Try a different search or{" "}
              <Link to="/contact" className="text-accent hover:underline">
                contact support
              </Link>
              .
            </p>
          ) : (
            groups.map(([category, articles]) => (
              <section key={category}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h2>
                <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {articles.map((a) => (
                    <ArticleItem key={a.id} article={a} defaultOpen={query.trim().length > 0} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/faq"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Read FAQ
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Contact support
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function ArticleItem({ article, defaultOpen }: { article: HelpArticle; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-surface-alt"
        aria-expanded={open}
      >
        {article.title}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none px-5 pb-5 text-sm leading-relaxed text-muted-foreground [&_a]:text-accent [&_a]:underline [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      )}
    </div>
  );
}
