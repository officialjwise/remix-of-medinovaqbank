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
