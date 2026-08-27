/**
 * Emits the static machine-readable files into `client/public/` so Vite copies
 * them into `dist/public/` and Netlify serves them as plain assets.
 *
 * Generated here rather than hand-maintained so the OpenAPI document, the API
 * catalogue and the 404 page cannot drift from `shared/openapi.ts`.
 *
 * Runs before `vite build`; see the `build` npm script.
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { openApiDocument, SITE_URL } from "../shared/openapi";

const PUBLIC_DIR = join(process.cwd(), "client", "public");

/** RFC 9727 API catalogue, as a link set. */
const apiCatalog = {
  linkset: [
    {
      anchor: SITE_URL,
      "service-desc": [
        {
          href: `${SITE_URL}/openapi.json`,
          type: "application/openapi+json",
          title: "Visit Dzaleka Public API",
        },
      ],
      "service-doc": [
        { href: `${SITE_URL}/developers`, type: "text/html", title: "Developer portal" },
      ],
      describedby: [
        { href: `${SITE_URL}/llms.txt`, type: "text/plain", title: "Agent instructions" },
      ],
    },
  ],
};

/**
 * The markdown body an agent receives for a 404. Also embedded in 404.html so
 * the same guidance is visible to a person.
 */
export const NOT_FOUND_MARKDOWN = `# 404 Not Found

That page does not exist on Visit Dzaleka.

## Where to look instead

- [/llms.txt](${SITE_URL}/llms.txt) — what this site is for and when to use it
- [/sitemap.xml](${SITE_URL}/sitemap.xml) — every published page
- [/openapi.json](${SITE_URL}/openapi.json) — the public API specification
- [/developers](${SITE_URL}/developers) — developer portal and quickstart
- [/api](${SITE_URL}/api) — machine-readable index of public endpoints
`;

const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Page not found | Visit Dzaleka</title>
<link rel="canonical" href="${SITE_URL}/404" />
<link rel="alternate" type="text/markdown" href="${SITE_URL}/404.md" />
<link rel="icon" href="/favicon.png" />
<style>
  :root { color-scheme: light dark; --bg:#ffffff; --fg:#18181b; --muted:#52525b; --line:#e4e4e7; --accent:#0e7490; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0b0b0d; --fg:#f4f4f5; --muted:#a1a1aa; --line:#27272a; --accent:#22d3ee; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px; }
  main { width:100%; max-width:34rem; }
  h1 { font-size:1.5rem; font-weight:600; margin:0 0 .375rem; }
  p { color:var(--muted); margin:0 0 1.5rem; }
  h2 { font-size:.8125rem; font-weight:600; text-transform:none; margin:0 0 .75rem; color:var(--muted); }
  ul { list-style:none; margin:0; padding:0; border-top:1px solid var(--line); }
  li { border-bottom:1px solid var(--line); }
  a { display:flex; gap:.75rem; align-items:baseline; padding:.75rem .25rem; color:inherit; text-decoration:none; }
  a:hover { background:color-mix(in srgb, var(--accent) 8%, transparent); }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em; color:var(--accent); flex:0 0 9.5rem; }
  span { color:var(--muted); }
  .home { display:inline-block; margin-top:1.5rem; color:var(--accent); text-decoration:none; font-weight:500; }
  .home:hover { text-decoration:underline; }
</style>
</head>
<body>
<main>
  <h1>Page not found</h1>
  <p>That page does not exist on Visit Dzaleka.</p>
  <h2>Where to look instead</h2>
  <ul>
    <li><a href="/sitemap.xml"><code>/sitemap.xml</code><span>Every published page</span></a></li>
    <li><a href="/llms.txt"><code>/llms.txt</code><span>What this site is for, and when to use it</span></a></li>
    <li><a href="/openapi.json"><code>/openapi.json</code><span>Public API specification</span></a></li>
    <li><a href="/developers"><code>/developers</code><span>Developer portal and quickstart</span></a></li>
    <li><a href="/api"><code>/api</code><span>Index of public endpoints</span></a></li>
  </ul>
  <a class="home" href="/">Back to Visit Dzaleka</a>
</main>
</body>
</html>
`;

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(join(PUBLIC_DIR, ".well-known"), { recursive: true });

  await writeFile(
    join(PUBLIC_DIR, "openapi.json"),
    `${JSON.stringify(openApiDocument, null, 2)}\n`
  );
  await writeFile(
    join(PUBLIC_DIR, ".well-known", "api-catalog"),
    `${JSON.stringify(apiCatalog, null, 2)}\n`
  );
  await writeFile(join(PUBLIC_DIR, "404.html"), notFoundHtml);
  await writeFile(join(PUBLIC_DIR, "404.md"), NOT_FOUND_MARKDOWN);

  const operationCount = Object.keys(openApiDocument.paths).length;
  console.log(
    `Agent files written: openapi.json (${operationCount} operations), .well-known/api-catalog, 404.html, 404.md`
  );
}

main().catch((err) => {
  console.error("Failed to generate agent files:", err);
  process.exit(1);
});
