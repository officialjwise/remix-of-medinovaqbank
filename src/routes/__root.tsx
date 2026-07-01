import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { refreshSession } from "@/api/auth.api";
import { Toaster } from "@/components/ui/sonner";
import { AccountStatusWatcher } from "@/components/shared/AccountStatusWatcher";
import { BrandingProvider } from "@/components/shared/BrandingProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        name: "description",
        content:
          "Professional medical question bank and quiz platform for Ghanaian and international medical practitioners.",
      },
      { name: "author", content: "Medinovaqbank" },
      { property: "og:title", content: "Medinovaqbank — Master Medicine. Ace Every Exam." },
      {
        property: "og:description",
        content:
          "Professional medical question bank with tutor and quiz modes, detailed explanations, and performance analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Set the theme class before first paint to avoid a light-mode flash
            (FOUC) on refresh. Mirrors useTheme's key + prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('medinova-theme');var d=s==='dark'||(!s&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* Apply the admin's cached branding font + colors before first paint so
            the configured font renders immediately (no flash of the default
            font). BrandingProvider refreshes this cache from the API. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var b=JSON.parse(localStorage.getItem('medinova-branding')||'null');if(!b)return;var r=document.documentElement;if(b.fontSans)r.style.setProperty('--font-sans',b.fontSans);if(b.fontHeading)r.style.setProperty('--font-heading',b.fontHeading);if(b.primary){r.style.setProperty('--primary',b.primary);r.style.setProperty('--primary-light',b.primary);}if(b.accent)r.style.setProperty('--accent',b.accent);if(b.success)r.style.setProperty('--success',b.success);if(b.warning)r.style.setProperty('--warning',b.warning);if(b.fontHref&&!document.getElementById('branding-fonts')){var l=document.createElement('link');l.id='branding-fonts';l.rel='stylesheet';l.href=b.fontHref;document.head.appendChild(l);}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Re-sync role/permissions from /auth/me once on load so permission-gated UI
  // is correct after a role change and older persisted sessions get upgraded.
  // If anything changed, invalidate the router so guarded routes re-evaluate
  // against the fresh permissions (avoids a stale redirect on hard-refresh).
  useEffect(() => {
    void refreshSession().then((changed) => {
      if (changed) void router.invalidate();
    });
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider />
      <Outlet />
      <AccountStatusWatcher />
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
