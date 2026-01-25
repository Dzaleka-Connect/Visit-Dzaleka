import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, readdir, writeFile } from "fs/promises";
import { join } from "path";

async function updateServiceWorkerVersion() {
  const swPath = join("dist", "public", "sw.js");
  try {
    const swContent = await readFile(swPath, "utf-8");
    const today = new Date();
    const version = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-v${String(today.getHours()).padStart(2, "0")}${String(today.getMinutes()).padStart(2, "0")}`;

    // Replace the CACHE_VERSION line
    const newContent = swContent.replace(
      /const CACHE_VERSION = ['"].*['"];/,
      `const CACHE_VERSION = '${version}';`
    );

    await writeFile(swPath, newContent);
    console.log(`Service Worker updated with version: ${version}`);
  } catch (error) {
    console.warn("Could not update Service Worker version:", error);
  }
}

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  await updateServiceWorkerVersion();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("Build complete. Checking dist directory...");
  try {
    const distFiles = await readdir("dist");
    console.log("dist contents:", distFiles);
    if (distFiles.includes("public")) {
      const publicFiles = await readdir("dist/public");
      console.log("dist/public contents:", publicFiles);
    }
  } catch (e) {
    console.error("Error checking dist directory:", e);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
