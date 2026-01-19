import puppeteer from 'puppeteer';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { createApp } from "../server/app";
import { serveStatic } from "../server/static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    "/friends-of-dzaleka",
    "/support-our-work",
    "/contact",
    "/faq",
    "/life-in-dzaleka",
    "/destinations",
    "/visitor-essentials",
    "/financial-framework",
    "/marketing-strategy",
    "/impact-report",
    "/cookie-notice",
    "/disclaimer",
];

async function prerender() {
    console.log("Starts pre-rendering...");

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

    // 2. Fetch dynamic routes (blog posts)
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

    // Combine static and dynamic routes
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

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
                waitUntil: "networkidle0",
                timeout: 30000,
            });

            // Wait for react-helmet to update the head tags
            // This ensures SEO meta tags are properly captured
            await page.waitForFunction(() => {
                const title = document.querySelector('title');
                // Check if helmet has updated the title (won't be just the default)
                return title && !title.textContent?.includes('Visit Dzaleka - Cultural Tours & Experiences') ||
                    // Or if it's the landing page, the default is fine
                    window.location.pathname === '/' || window.location.pathname === '/landing';
            }, { timeout: 5000 }).catch(() => {
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

            await page.close();
        } catch (err) {
            console.error(`Failed to prerender ${route}:`, err);
        }
    }

    // 4. Cleanup
    await browser.close();
    httpServer.close();
    console.log("Pre-rendering complete.");
    process.exit(0);
}

prerender().catch(err => {
    console.error("Prerendering failed:", err);
    process.exit(1);
});

