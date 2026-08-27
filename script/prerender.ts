import puppeteer from 'puppeteer';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { createApp } from "../server/app";
import { serveStatic } from "../server/static";
import { friends } from "../client/src/data/friends";
import { buildRedirects } from "./lib/redirects";
import { htmlToMarkdown } from "./lib/html-to-markdown";
import { parseHTML } from "linkedom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Content detail pages, which carry less body text than a marketing page. */
function isDynamicDetailRoute(route: string): boolean {
    return /^\/(blog|whats-on|friends-of-dzaleka|impact-report|community-hub)\/.+/.test(route);
}

const FRIEND_ROUTES = friends.map((friend) => `/friends-of-dzaleka/${encodeURIComponent(friend.slug)}`);

// Static routes to prerender
const STATIC_ROUTES = [
    "/",
    "/landing",
    "/about-us",
    "/about-dzaleka",
    "/blog",
    "/things-to-do",
    "/things-to-do/arts-culture",
    "/things-to-do/shopping",
    "/things-to-do/sports-recreation",
    "/things-to-do/host-community",
    "/accommodation",
    "/whats-on",
    "/plan-your-trip",
    "/partner-with-us",
    "/community-hub",
    "/community-hub/guide",
    "/friends-of-dzaleka",
    ...FRIEND_ROUTES,
    "/support-our-work",
    "/contact",
    "/faq",
    "/life-in-dzaleka",
    "/destinations",
    "/plan-your-trip/visitor-essentials",
    "/impact-report",
    "/impact-report/2025",
    "/cookie-notice",
    "/disclaimer",
    "/privacy",
    "/developers",
    "/things-to-do/dzaleka-refugee-camp-guided-walking-tour",
    "/things-to-do/nature-outdoors",
    "/things-to-do/dining-nightlife",
    "/plan-your-trip/safe-travel",
    "/plan-your-trip/public-holidays",
    "/plan-your-trip/dzaleka-map",
    "/plan-your-trip/transport",
    "/newsletter",
];

function sitemapEntry(route: string) {
    const url = route === "/" ? "https://visit.dzaleka.com/" : `https://visit.dzaleka.com${route}`;
    const today = new Date().toISOString().slice(0, 10);
    const isDynamic = route.startsWith("/blog/") || route.startsWith("/whats-on/");
    const priority = route === "/"
        ? "1.0"
        : route === "/blog" || route === "/whats-on" || route === "/things-to-do"
            ? "0.8"
            : route.startsWith("/blog/") || route.startsWith("/whats-on/") || route.startsWith("/friends-of-dzaleka/")
                ? "0.7"
                : "0.6";
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${isDynamic ? "weekly" : "monthly"}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function appendRoutesToSitemap(publicDir: string, routes: string[]) {
    if (routes.length === 0) return;

    const sitemapPath = join(publicDir, "sitemap.xml");
    try {
        const current = await fs.readFile(sitemapPath, "utf-8");
        const existingUrls = new Set(
            Array.from(current.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1])
        );
        const entries = routes
            .filter((route) => {
                const url = route === "/" ? "https://visit.dzaleka.com/" : `https://visit.dzaleka.com${route}`;
                return !existingUrls.has(url);
            })
            .map(sitemapEntry);

        if (entries.length === 0) return;

        await fs.writeFile(
            sitemapPath,
            current.replace("</urlset>", `${entries.join("\n")}\n</urlset>`)
        );
        console.log(`Added ${entries.length} route(s) to sitemap.xml`);
    } catch (error) {
        console.warn("Could not update sitemap with pre-rendered routes:", error);
    }
}

async function prerender() {
    console.log("Starts pre-rendering...");

    // The crawler must be able to execute the app's own scripts, or every page is
    // captured as an unhydrated shell. The generated HTML is served by the CDN,
    // which applies the real security headers.
    process.env.PRERENDER_DISABLE_CSP = "1";

    // 1. Start the server
    // We need to serve from dist/public, assuming build is done.
    const { app, httpServer } = await createApp();
    // Ensure we serve static files for the crawler
    serveStatic(app);

    const port = 5001 + Math.floor(Math.random() * 1000); // Random port to avoid collision
    await new Promise<void>((resolve) => {
        httpServer.listen(port, "0.0.0.0", () => resolve());
    });
    console.log(`Server started on port ${port} for pre-rendering`);

    const baseUrl = `http://localhost:${port}`;
    const publicDir = join(__dirname, "../dist/public");

    // 2. Fetch dynamic routes (blog posts and event detail pages)
    let dynamicRoutes: string[] = [];
    try {
        console.log("Fetching blog posts for pre-rendering...");
        const response = await fetch(`${baseUrl}/api/blog`);
        if (response.ok) {
            const posts = await response.json() as Array<{ slug: string; published: boolean }>;
            dynamicRoutes = posts
                .filter(p => p.published)
                .map(p => `/blog/${p.slug}`);
            console.log(`Found ${dynamicRoutes.length} blog posts to pre-render`);
        }
    } catch (err) {
        console.warn("Could not fetch blog posts for pre-rendering:", err);
    }

    try {
        console.log("Fetching events for pre-rendering...");
        const response = await fetch(`${baseUrl}/api/community/events`);
        if (response.ok) {
            const eventsResponse = await response.json() as { data?: { events?: Array<{ id: string }> } };
            const eventRoutes = (eventsResponse.data?.events || [])
                .filter((event) => event.id)
                .map((event) => `/whats-on/${encodeURIComponent(event.id)}`);
            dynamicRoutes = [...dynamicRoutes, ...eventRoutes];
            console.log(`Found ${eventRoutes.length} event pages to pre-render`);
        }
    } catch (err) {
        console.warn("Could not fetch events for pre-rendering:", err);
    }

    // Combine static and dynamic routes
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
    const failedRoutes: string[] = [];
    // Routes that rendered but produced too little text to be useful to a
    // crawler. Reported at the end so a regression is visible in the build log.
    const contentThin: string[] = [];

    // 3. Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const route of allRoutes) {
        try {
            const page = await browser.newPage();

            // Set viewport to standard desktop
            await page.setViewport({ width: 1280, height: 1024 });

            console.log(`Crawling ${route}...`);
            await page.goto(`${baseUrl}${route}`, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            await page.waitForFunction(() => {
                const root = document.querySelector("#root");
                return document.readyState !== "loading" && !!root;
            }, { timeout: 10000 }).catch(() => {
                console.log(`  Note: App root was not confirmed for ${route}`);
            });

            // Wait for the page to actually render its content, not just mount.
            //
            // The previous condition short-circuited on `pathname === '/'`, so the
            // homepage was snapshotted while `useAuth()` was still pending and the
            // router was showing a loading skeleton. The result was a ~7KB shell
            // with no <h1> — which is what made the homepage look empty to
            // crawlers that do not execute JavaScript.
            // Event and blog detail pages are legitimately short, so they get a
            // lower bar than the marketing pages. The homepage is held to the
            // highest bar because it is what most crawlers sample.
            const minimumText = route === "/" ? 800 : isDynamicDetailRoute(route) ? 250 : 500;

            // textContent, not innerText: innerText forces a full layout pass on
            // every poll, which on these long image-heavy pages cost seconds per
            // check and dominated the build. textContent needs no layout, and for
            // a length threshold the difference does not matter.
            const rendered = await page.waitForFunction((minChars: number) => {
                const main = document.querySelector("main") || document.querySelector("#root");
                if (!main) return false;
                const text = (main.textContent ?? "").trim();
                return !!document.querySelector("h1") && text.length > minChars;
            }, { timeout: 12000, polling: 500 }, minimumText).then(() => true).catch(() => false);

            if (!rendered) {
                console.warn(`  Warning: ${route} rendered no <h1> or under 500 characters.`);
                contentThin.push(route);
            }

            // Wait for react-helmet to settle the head tags so per-page SEO is captured.
            await page.waitForFunction(() => {
                const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute("content");
                const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
                return !!ogUrl || !!canonical;
            }, { timeout: 10000 }).catch(() => {
                console.log(`  Note: Using default SEO for ${route}`);
            });

            // Additional wait for any async helmet updates
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get HTML content
            const content = await page.content();

            // Determine output path with proper nesting
            // e.g. / -> dist/public/index.html
            // e.g. /blog/my-post -> dist/public/blog/my-post/index.html
            let outputPath = "";
            if (route === "/") {
                outputPath = join(publicDir, "index.html");
            } else {
                const routeDir = join(publicDir, route);
                await fs.mkdir(routeDir, { recursive: true });
                outputPath = join(routeDir, "index.html");
            }

            await fs.writeFile(outputPath, content);
            console.log(`Generated ${outputPath}`);

            // Markdown twin, served by the Netlify edge function when a caller
            // sends `Accept: text/markdown`.
            const meta = await page.evaluate(() => ({
                title: document.title || "",
                description:
                    document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
                main: (document.querySelector("main") || document.body)?.outerHTML || "",
            }));

            if (meta.main) {
                const { document: parsed } = parseHTML(`<body>${meta.main}</body>`);
                const rootEl = parsed.querySelector("main") || parsed.body;
                const markdown = htmlToMarkdown(rootEl as any, {
                    title: meta.title.replace(/\s*\|\s*Visit Dzaleka\s*$/, "").trim() || "Visit Dzaleka",
                    description: meta.description,
                    canonicalUrl: `https://visit.dzaleka.com${route === "/" ? "" : route}`,
                });
                const markdownPath = route === "/"
                    ? join(publicDir, "md", "index.md")
                    : join(publicDir, "md", `${route.replace(/^\//, "")}.md`);
                await fs.mkdir(dirname(markdownPath), { recursive: true });
                await fs.writeFile(markdownPath, markdown);
            }

            await page.close();
        } catch (err) {
            console.error(`Failed to prerender ${route}:`, err);
            failedRoutes.push(route);
        }
    }

    // 4. Cleanup
    await browser.close();
    httpServer.close();

    if (failedRoutes.length > 0) {
        console.error(`Pre-rendering failed for ${failedRoutes.length} route(s): ${failedRoutes.join(", ")}`);
        process.exit(1);
    }

    if (contentThin.length > 0) {
        console.warn(`Thin content on ${contentThin.length} route(s): ${contentThin.join(", ")}`);
        // The homepage carrying real text is the difference between an AI crawler
        // seeing the site and seeing an empty shell, so treat it as fatal.
        if (contentThin.includes("/")) {
            console.error("The homepage prerendered without meaningful content. Failing the build.");
            process.exit(1);
        }
    }

    await appendRoutesToSitemap(publicDir, allRoutes);

    // Netlify routing table. Written here because only now do we know every
    // published blog post and event, which decides what may answer 200.
    await fs.writeFile(join(publicDir, "_redirects"), buildRedirects({ prerenderedRoutes: allRoutes }));
    console.log(`Wrote _redirects for ${allRoutes.length} known route(s).`);

    console.log("Pre-rendering complete.");
    process.exit(0);
}

prerender().catch(err => {
    console.error("Prerendering failed:", err);
    process.exit(1);
});
