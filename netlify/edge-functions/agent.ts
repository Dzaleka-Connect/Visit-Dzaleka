/**
 * Content negotiation and discovery headers at the CDN edge.
 *
 * Netlify serves the built site as static assets, which cannot vary on a request
 * header by themselves. This edge function sits in front of every response and:
 *
 *  1. Serves the markdown representation of a page when the caller sends
 *     `Accept: text/markdown` (acceptmarkdown.com). Markdown bodies are produced
 *     at build time by `script/prerender.ts` and live under `/md/`.
 *  2. Adds `Vary: Accept` to every response, so the CDN keeps the markdown and
 *     HTML variants in separate cache entries. Without it whichever variant is
 *     cached first would be served to everyone.
 *  3. Adds the `Link` discovery header, mirroring `server/agent.ts`, so an agent
 *     landing on any URL can find the spec, the llms.txt and the docs.
 *
 * Runs on Deno. Keep it dependency-free.
 */

import type { Config, Context } from "@netlify/edge-functions";

const SITE_URL = "https://visit.dzaleka.com";

const MARKDOWN_TYPES = ["text/markdown", "text/x-markdown", "application/markdown"];

const DISCOVERY_LINKS = [
  `</llms.txt>; rel="describedby"; type="text/plain"`,
  `</openapi.json>; rel="service-desc"; type="application/openapi+json"`,
  `</developers>; rel="service-doc"; type="text/html"`,
  `</sitemap.xml>; rel="index"; type="application/xml"`,
  `</.well-known/api-catalog>; rel="api-catalog"`,
].join(", ");

const NOT_FOUND_MARKDOWN = `# 404 Not Found

That page does not exist on Visit Dzaleka.

## Where to look instead

- [/llms.txt](${SITE_URL}/llms.txt) — what this site is for and when to use it
- [/sitemap.xml](${SITE_URL}/sitemap.xml) — every published page
- [/openapi.json](${SITE_URL}/openapi.json) — the public API specification
- [/developers](${SITE_URL}/developers) — developer portal and quickstart
- [/api](${SITE_URL}/api) — machine-readable index of public endpoints
`;

/** Quality value for one media type within an Accept header. */
function qualityOf(accept: string, mediaType: string): number {
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().split(";");
    if (type.trim() !== mediaType) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    return q ? Number.parseFloat(q.slice(2)) || 0 : 1;
  }
  return 0;
}

/** True when the caller asked for markdown at least as strongly as HTML. */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const lowered = accept.toLowerCase();
  if (!MARKDOWN_TYPES.some((type) => lowered.includes(type))) return false;
  const html = qualityOf(lowered, "text/html");
  const markdown = Math.max(...MARKDOWN_TYPES.map((type) => qualityOf(lowered, type)));
  return markdown >= html;
}

/** Append a field to Vary without discarding existing values. */
function appendVary(headers: Headers, field: string) {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", field);
    return;
  }
  const values = existing
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!values.some((v) => v.toLowerCase() === field.toLowerCase())) {
    values.push(field);
  }
  headers.set("Vary", values.join(", "));
}

/** Path of the prebuilt markdown variant for a page route. */
function markdownPathFor(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  if (trimmed === "") return "/md/index.md";
  return `/md${trimmed}.md`;
}

export default async (request: Request, context: Context): Promise<Response> => {
  const url = new URL(request.url);
  const accept = request.headers.get("accept");
  const wantsMarkdown = prefersMarkdown(accept);

  // The API function already negotiates and sets its own headers.
  if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
    return context.next();
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  appendVary(headers, "Accept");
  if (!headers.has("Link")) headers.set("Link", DISCOVERY_LINKS);

  if (!wantsMarkdown) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // A missing page gets the markdown 404 that points at the machine-readable index.
  if (response.status === 404) {
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    return new Response(NOT_FOUND_MARKDOWN, { status: 404, headers });
  }

  // Serve the prebuilt markdown twin when one exists for this route.
  const contentType = response.headers.get("content-type") || "";
  if (response.ok && contentType.includes("text/html")) {
    const markdownUrl = new URL(markdownPathFor(url.pathname), url.origin);
    const markdown = await fetch(markdownUrl, { headers: { accept: "text/plain" } });
    if (markdown.ok) {
      const body = await markdown.text();
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      headers.set("Link", `${DISCOVERY_LINKS}, <${url.pathname}>; rel="canonical"`);
      return new Response(body, { status: 200, headers });
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config: Config = {
  path: "/*",
  // Never let a fault in content negotiation take the site down: on error,
  // Netlify serves the origin response as if this function were not here.
  onError: "bypass",
  // Static assets never need negotiation; skipping them keeps the function cheap.
  excludedPath: [
    "/assets/*",
    "/images/*",
    "/md/*",
    "/*.js",
    "/*.css",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.webp",
    "/*.svg",
    "/*.ico",
    "/*.woff",
    "/*.woff2",
  ],
};
