/**
 * Production Node entry for the TanStack Start SSR build.
 *
 * The build (via @lovable.dev/vite-tanstack-config) emits a WinterCG `fetch`
 * handler at dist/server/server.js and static client assets at dist/client/ —
 * it does NOT emit a Node HTTP listener. This tiny adapter wraps the fetch
 * handler in a Node server and serves the hashed client assets directly, so the
 * whole app runs as a single Node process on the VM (no Cloudflare runtime).
 *
 * Node 20+ provides Request/Response/Headers/ReadableStream globally.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { statSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = join(rootDir, "dist", "client");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const ssr = (await import("./dist/server/server.js")).default;

// ── Branding SSR injection ───────────────────────────────────────────────────
// Bakes the admin-selected font + colors into the initial HTML <head> so the
// configured font renders on FIRST paint — even on a brand-new device with no
// client cache (the client-side BrandingProvider only helps repeat visits).
// The font map mirrors src/lib/fonts.ts (keep in sync). Best-effort: any failure
// leaves branding to the client and never blocks or breaks serving.
const API_BASE =
  process.env.VITE_API_URL || process.env.API_URL || "https://api.medinovaq.com/api/v1";
const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = 'Georgia, "Times New Roman", ui-serif, serif';
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const FONTS = {
  Inter: { stack: `"Inter", ${SANS}`, google: "Inter:wght@400;500;600;700;800" },
  Roboto: { stack: `"Roboto", ${SANS}`, google: "Roboto:wght@400;500;700" },
  "Open Sans": { stack: `"Open Sans", ${SANS}`, google: "Open+Sans:wght@400;500;600;700;800" },
  Lato: { stack: `"Lato", ${SANS}`, google: "Lato:wght@400;700" },
  Montserrat: { stack: `"Montserrat", ${SANS}`, google: "Montserrat:wght@400;500;600;700;800" },
  Poppins: { stack: `"Poppins", ${SANS}`, google: "Poppins:wght@400;500;600;700;800" },
  Nunito: { stack: `"Nunito", ${SANS}`, google: "Nunito:wght@400;500;600;700;800" },
  "Work Sans": { stack: `"Work Sans", ${SANS}`, google: "Work+Sans:wght@400;500;600;700;800" },
  "system-ui": { stack: SANS },
  Cambria: { stack: `"Cambria", "Gelasio", ${SERIF}`, google: "Gelasio:wght@400;500;600;700" },
  Gelasio: { stack: `"Gelasio", ${SERIF}`, google: "Gelasio:wght@400;500;600;700" },
  Merriweather: { stack: `"Merriweather", ${SERIF}`, google: "Merriweather:wght@400;700" },
  Lora: { stack: `"Lora", ${SERIF}`, google: "Lora:wght@400;500;600;700" },
  "Playfair Display": {
    stack: `"Playfair Display", ${SERIF}`,
    google: "Playfair+Display:wght@400;500;600;700;800",
  },
  "PT Serif": { stack: `"PT Serif", ${SERIF}`, google: "PT+Serif:wght@400;700" },
  Georgia: { stack: SERIF },
  "JetBrains Mono": {
    stack: `"JetBrains Mono", ${MONO}`,
    google: "JetBrains+Mono:wght@400;500;600;700",
  },
};
const clean = (v) => String(v ?? "").replace(/[<>]/g, "");
const fontStack = (name) => (name ? (FONTS[name]?.stack ?? `"${clean(name)}", ${SANS}`) : undefined);
const fontGoogleSpec = (name) => (name ? FONTS[name]?.google : undefined);

let brandingHead = ""; // computed <link>+<style> injected into every SSR <head>
async function refreshBrandingHead() {
  try {
    const res = await fetch(`${API_BASE}/branding`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const json = await res.json();
    const b = json?.data ?? json;
    if (!b || typeof b !== "object") return;
    const vars = [];
    const bodyStack = fontStack(b.fontBody);
    const headingStack = fontStack(b.fontHeading);
    if (bodyStack) vars.push(`--font-sans:${bodyStack};`);
    if (headingStack) vars.push(`--font-heading:${headingStack};`);
    if (b.colorPrimary)
      vars.push(`--primary:${clean(b.colorPrimary)};--primary-light:${clean(b.colorPrimary)};`);
    if (b.colorAccent) vars.push(`--accent:${clean(b.colorAccent)};`);
    if (b.colorSuccess) vars.push(`--success:${clean(b.colorSuccess)};`);
    if (b.colorWarning) vars.push(`--warning:${clean(b.colorWarning)};`);
    const specs = [
      ...new Set([fontGoogleSpec(b.fontHeading), fontGoogleSpec(b.fontBody)].filter(Boolean)),
    ];
    let out = "";
    if (specs.length > 0) {
      // id matches what the client checks, so it doesn't inject a duplicate link.
      out += `<link id="branding-fonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?${specs
        .map((s) => `family=${s}`)
        .join("&")}&display=swap">`;
    }
    if (vars.length > 0) out += `<style id="branding-ssr">:root{${vars.join("")}}</style>`;
    brandingHead = out;
  } catch {
    /* keep the previous snapshot; client BrandingProvider still applies branding */
  }
}
void refreshBrandingHead();
const brandingTimer = setInterval(() => void refreshBrandingHead(), 60_000);
brandingTimer.unref?.();

const MIME = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain",
};

/** Resolve a URL path to a real file under dist/client, or null. Prevents traversal. */
function resolveStatic(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(CLIENT_DIR, clean);
  if (filePath !== CLIENT_DIR && !filePath.startsWith(CLIENT_DIR)) return null;
  try {
    if (statSync(filePath).isFile()) return filePath;
  } catch {
    /* not a file */
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const isGet = req.method === "GET" || req.method === "HEAD";
    const filePath = isGet ? resolveStatic(req.url ?? "/") : null;
    if (filePath) {
      const ext = filePath.slice(filePath.lastIndexOf("."));
      const data = await readFile(filePath);
      res.statusCode = 200;
      res.setHeader("content-type", MIME[ext] ?? "application/octet-stream");
      if (filePath.includes(`${join("dist", "client", "assets")}`)) {
        res.setHeader("cache-control", "public, max-age=31536000, immutable");
      }
      res.end(req.method === "HEAD" ? undefined : data);
      return;
    }

    const url = `http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else if (v != null) headers.set(k, v);
    }
    const hasBody = !isGet;
    const request = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? "half" : undefined,
    });

    const response = await ssr.fetch(request, {}, {});
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    // SSR HTML/data must revalidate so a deploy's new (hashed) asset URLs are
    // picked up immediately — without this, browsers heuristically cache the
    // document and keep loading the previous build. Hashed /assets/* stay
    // immutable (set above).
    if (!res.getHeader("cache-control")) {
      res.setHeader("cache-control", "no-cache");
    }

    // Bake the admin branding into the SSR HTML <head> so the configured font
    // paints immediately on a first-ever visit. Only for GET HTML documents;
    // everything else (data/server-fn) streams unchanged.
    const contentType = response.headers.get("content-type") ?? "";
    if (
      req.method === "GET" &&
      response.status === 200 &&
      brandingHead &&
      contentType.includes("text/html")
    ) {
      let html = await response.text();
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${brandingHead}</head>`);
      }
      res.removeHeader("content-length"); // body length changed by injection
      res.end(html);
      return;
    }

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("[ssr] request failed", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/html; charset=utf-8");
    }
    res.end("<h1>500 — server error</h1>");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Frontend SSR server listening on http://${HOST}:${PORT}`);
});
