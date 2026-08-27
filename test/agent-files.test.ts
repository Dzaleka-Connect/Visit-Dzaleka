import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "client", "public");
const read = (file: string) => readFileSync(join(PUBLIC_DIR, file), "utf-8");

describe("llms.txt", () => {
  const llms = existsSync(join(PUBLIC_DIR, "llms.txt")) ? read("llms.txt") : "";

  it("exists and follows the llmstxt.org shape", () => {
    expect(llms).toBeTruthy();
    expect(llms.startsWith("# Visit Dzaleka")).toBe(true);
    // H1 followed by a blockquote summary.
    expect(llms).toMatch(/^# .+\n\n> .+/);
  });

  // The audit asked specifically for when-to-use guidance, not marketing copy.
  it("tells an agent when to reach for this site", () => {
    expect(llms).toContain("## When to use this site");
    expect(llms).toMatch(/Booking a guided tour/i);
    expect(llms).toMatch(/Quoting the current price/i);
  });

  it("says explicitly what the site is not for", () => {
    expect(llms).toMatch(/Do not use this site for/i);
    expect(llms).toMatch(/UNHCR/);
  });

  it("explains how to call the API", () => {
    expect(llms).toContain("### How to call us");
    expect(llms).toContain("/openapi.json");
    expect(llms).toContain("/api/public/pricing");
    expect(llms).toMatch(/100 requests\/minute/);
  });

  it("warns against caching prices", () => {
    expect(llms).toMatch(/rather than repeating a figure|read .*live|change/i);
  });

  it("links the trust-anchor pages", () => {
    for (const path of ["/about-us", "/contact", "/privacy", "/developers"]) {
      expect(llms, path).toContain(path);
    }
  });

  it("carries enough substance to be useful", () => {
    expect(llms.length).toBeGreaterThan(2000);
  });
});

describe("openapi.json", () => {
  it("is written to the public directory and parses", () => {
    const spec = JSON.parse(read("openapi.json"));
    expect(spec.openapi).toMatch(/^3\.1/);
    expect(Object.keys(spec.paths).length).toBeGreaterThan(10);
    expect(spec.components.schemas.Error).toBeTruthy();
  });

  it("matches the module the server serves", async () => {
    const { openApiDocument } = await import("../shared/openapi");
    expect(JSON.parse(read("openapi.json"))).toEqual(JSON.parse(JSON.stringify(openApiDocument)));
  });
});

describe(".well-known/api-catalog", () => {
  it("is a valid RFC 9727 link set", () => {
    const catalog = JSON.parse(read(".well-known/api-catalog"));
    expect(Array.isArray(catalog.linkset)).toBe(true);
    const entry = catalog.linkset[0];
    expect(entry.anchor).toBe("https://visit.dzaleka.com");
    expect(entry["service-desc"][0].type).toBe("application/openapi+json");
    expect(entry["service-doc"][0].href).toContain("/developers");
    expect(entry.describedby[0].href).toContain("/llms.txt");
  });
});

describe("404 page", () => {
  it("ships a static HTML page for the CDN to serve", () => {
    const html = read("404.html");
    expect(html).toContain("<title>Page not found | Visit Dzaleka</title>");
    expect(html).toContain('name="robots" content="noindex"');
  });

  it("points at the machine-readable index", () => {
    const html = read("404.html");
    for (const path of ["/sitemap.xml", "/llms.txt", "/openapi.json", "/developers", "/api"]) {
      expect(html, path).toContain(path);
    }
  });

  it("ships a markdown twin for agents", () => {
    const md = read("404.md");
    expect(md).toContain("# 404 Not Found");
    expect(md).toContain("/sitemap.xml");
    expect(md).toContain("/openapi.json");
  });
});

describe("homepage metadata", () => {
  const html = readFileSync(join(process.cwd(), "client", "index.html"), "utf-8");

  // The audit found only 1 of 4 signals: lang, but no canonical, og:image or og:type.
  it("declares all four entity-resolution signals in raw HTML", () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/visit\.dzaleka\.com\/"\s*\/>/);
    expect(html).toMatch(/<meta property="og:type" content="website"/);
    expect(html).toMatch(/<meta property="og:image" content="https:\/\/[^"]+"/);
  });

  it("carries a description and Open Graph title", () => {
    expect(html).toMatch(/<meta name="description"/);
    expect(html).toMatch(/<meta property="og:title"/);
    expect(html).toMatch(/<meta property="og:url"/);
  });

  it("links the agent files from the head", () => {
    expect(html).toContain('href="/llms.txt"');
    expect(html).toContain('href="/openapi.json"');
    expect(html).toContain('href="/sitemap.xml"');
  });
});

describe("Organization JSON-LD", () => {
  const html = readFileSync(join(process.cwd(), "client", "index.html"), "utf-8");
  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  const organization = jsonLd["@graph"].find((node: any) => node["@type"] === "Organization");

  it("is present and parseable", () => {
    expect(organization).toBeTruthy();
  });

  // The audit reported Organization present but missing contactPoint and address.
  it("includes contactPoint with an email and a contactType", () => {
    expect(Array.isArray(organization.contactPoint)).toBe(true);
    expect(organization.contactPoint.length).toBeGreaterThan(0);
    for (const point of organization.contactPoint) {
      expect(point["@type"]).toBe("ContactPoint");
      expect(point.contactType).toBeTruthy();
      expect(point.email).toMatch(/@/);
    }
  });

  it("includes a PostalAddress", () => {
    expect(organization.address["@type"]).toBe("PostalAddress");
    expect(organization.address.addressCountry).toBe("MW");
    expect(organization.address.addressLocality).toBeTruthy();
  });

  it("carries name, description, url, logo and sameAs", () => {
    expect(organization.name).toBe("Visit Dzaleka");
    expect(organization.description.length).toBeGreaterThan(80);
    expect(organization.url).toBe("https://visit.dzaleka.com");
    expect(organization.logo).toMatch(/^https:\/\//);
    expect(organization.sameAs.length).toBeGreaterThan(2);
  });
});

describe("SEO component schema", () => {
  const seo = readFileSync(join(process.cwd(), "client", "src", "components", "seo.tsx"), "utf-8");

  it("emits an Organization node with contactPoint and address on every page", () => {
    expect(seo).toContain('"@id": "https://visit.dzaleka.com/#organization"');
    expect(seo).toContain('"contactPoint"');
    expect(seo).toContain('"@type": "PostalAddress"');
  });

  it("still emits canonical, og:type and og:image", () => {
    expect(seo).toContain('<link rel="canonical"');
    expect(seo).toContain('property="og:type"');
    expect(seo).toContain('property="og:image"');
  });
});
