import puppeteer from 'puppeteer';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { createApp } from "../server/app";
import { serveStatic } from "../server/static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROUTES = [
    "/",
    "/landing",
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

    // 2. Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const baseUrl = `http://localhost:${port}`;
    const publicDir = join(__dirname, "../dist/public");

    for (const route of ROUTES) {
        try {
            const page = await browser.newPage();

            // Set viewport to standard desktop
            await page.setViewport({ width: 1280, height: 1024 });

            console.log(`Crawling ${route}...`);
            await page.goto(`${baseUrl}${route}`, {
                waitUntil: "networkidle0",
                timeout: 30000,
            });

            // Get HTML content
            const content = await page.content();

            // Determine output path with proper nesting
            // e.g. / -> dist/public/index.html
            // e.g. /community -> dist/public/community/index.html
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

    // 3. Cleanup
    await browser.close();
    httpServer.close();
    console.log("Pre-rendering complete.");
    process.exit(0);
}

prerender().catch(err => {
    console.error("Prerendering failed:", err);
    process.exit(1);
});
