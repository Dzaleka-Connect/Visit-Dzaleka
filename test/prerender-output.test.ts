import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const DIST = join(process.cwd(), "dist", "public");
const built = existsSync(join(DIST, "index.html"));

/** Strip tags and inline script/style, leaving what a JS-less crawler reads. */
function visibleText(html: string): string {
  const withoutCode = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ");
  return withoutCode.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const read = (relative: string) => readFileSync(join(DIST, relative), "utf-8");

// These assert on build output, so they only run once `npm run build` has been
// executed. In CI the build step precedes the test step.
describe.skipIf(!built)("prerendered output", () => {
  describe("homepage", () => {
    const html = built ? read("index.html") : "";

    // The audit found 63 characters of text and no <h1>: the snapshot had been
    // taken while the router was still showing a loading skeleton.
    it("contains an h1 in the raw HTML", () => {
      expect(html).toMatch(/<h1[\s>]/);
    });

    it("contains well over 500 characters of text without JavaScript", () => {
      const text = visibleText(html);
      expect(text.length).toBeGreaterThan(500);
    });

    it("is not a bare app shell", () => {
      expect(html.length).toBeGreaterThan(20000);
      expect(visibleText(html)).toMatch(/Dzaleka/);
    });

    it("carries the four metadata signals", () => {
      expect(html).toMatch(/<html[^>]*\blang=/);
      expect(html).toMatch(/<link[^>]*rel="canonical"/);
      expect(html).toMatch(/<meta[^>]*property="og:image"/);
      expect(html).toMatch(/<meta[^>]*property="og:type"/);
    });

    it("carries Organization JSON-LD with contactPoint and address", () => {
      const blocks = Array.from(
        html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
      ).map((match) => JSON.parse(match[1]));

      const nodes = blocks.flatMap((block) => block["@graph"] ?? [block]);
      const organization = nodes.find((node: any) => node["@type"] === "Organization");

      expect(organization).toBeTruthy();
      expect(organization.contactPoint?.length).toBeGreaterThan(0);
      expect(organization.address?.["@type"]).toBe("PostalAddress");
      expect(organization.url).toBeTruthy();
    });
  });

  describe("trust anchor pages", () => {
    // Agents check these before recommending a business; each needs real content.
    for (const [label, file] of [
      ["about", "about-us/index.html"],
      ["contact", "contact/index.html"],
      ["privacy", "privacy/index.html"],
    ] as const) {
      it(`${label} has an h1 and at least 500 characters`, () => {
        expect(existsSync(join(DIST, file)), `${file} was prerendered`).toBe(true);
        const html = read(file);
        expect(html).toMatch(/<h1[\s>]/);
        expect(visibleText(html).length).toBeGreaterThan(500);
      });
    }
  });

  describe("developer portal", () => {
    it("is prerendered with the endpoint reference visible", () => {
      expect(existsSync(join(DIST, "developers/index.html"))).toBe(true);
      const text = visibleText(read("developers/index.html"));
      expect(text).toMatch(/openapi\.json/);
      expect(text).toMatch(/api\/public\/pricing/);
      expect(text.length).toBeGreaterThan(1000);
    });
  });

  describe("machine-readable files reach the published directory", () => {
    for (const file of ["llms.txt", "openapi.json", ".well-known/api-catalog", "404.html", "404.md", "robots.txt", "sitemap.xml", "_redirects"]) {
      it(`ships ${file}`, () => {
        expect(existsSync(join(DIST, file)), file).toBe(true);
      });
    }

    it("ships a parseable OpenAPI document", () => {
      const spec = JSON.parse(read("openapi.json"));
      expect(spec.openapi).toMatch(/^3\.1/);
    });
  });

  describe("_redirects", () => {
    const table = built && existsSync(join(DIST, "_redirects")) ? read("_redirects") : "";

    it("ends in a 404 catch-all, not a 200 app-shell rule", () => {
      const rows = table
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      const last = rows[rows.length - 1].split(/\s+/);
      expect(last[0]).toBe("/*");
      expect(last[2]).toBe("404");
    });

    it("routes the public API to the function", () => {
      expect(table).toMatch(/^\/api\/\*\s+\/\.netlify\/functions\/api\/:splat\s+200$/m);
    });
  });

  describe("markdown twins", () => {
    it("generates a markdown representation of the homepage", () => {
      expect(existsSync(join(DIST, "md", "index.md"))).toBe(true);
      const md = read("md/index.md");
      expect(md.startsWith("# ")).toBe(true);
      expect(md).toContain("Source: https://visit.dzaleka.com");
      expect(md.length).toBeGreaterThan(500);
    });

    it("generates one for the developer portal", () => {
      expect(existsSync(join(DIST, "md", "developers.md"))).toBe(true);
    });
  });
});
