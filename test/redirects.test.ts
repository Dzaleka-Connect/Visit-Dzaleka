import { describe, it, expect } from "vitest";
import { buildRedirects, DYNAMIC_CONTENT_PREFIXES } from "../script/lib/redirects";

const table = buildRedirects({
  prerenderedRoutes: [
    "/",
    "/about-us",
    "/blog",
    "/blog/where-to-stay-near-dzaleka",
    "/blog/24-hours-in-dzaleka",
    "/whats-on/ubuntu-on-stage-open-mic",
    "/friends-of-dzaleka/some-friend",
  ],
});

/** Parse the generated file into [from, to, status] rows. */
function rows(text: string) {
  return text
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => line.trim().split(/\s+/))
    .map(([from, to, status]) => ({ from, to, status: Number(status) }));
}

const parsed = rows(table);
const find = (from: string) => parsed.find((row) => row.from === from);

describe("buildRedirects", () => {
  it("keeps both supplier URL forms on the dedicated runtime before the catch-all", () => {
    for (const from of ["/1/1/*", "/1/*"]) {
      expect(find(from)).toMatchObject({ to: "/.netlify/functions/getyourguide/1/:splat", status: 200 });
      expect(parsed.indexOf(find(from)!)).toBeLessThan(parsed.findIndex(row => row.from === "/*"));
    }
  });
  it("routes the API to the serverless function first", () => {
    const api = find("/api/*");
    expect(api).toBeTruthy();
    expect(api!.to).toBe("/.netlify/functions/api/:splat");
    expect(api!.status).toBe(200);
    // Must precede the catch-all, since Netlify applies the first match.
    expect(parsed.indexOf(api!)).toBeLessThan(parsed.findIndex((r) => r.from === "/*"));
  });

  it("ends with a real 404 catch-all rather than the app shell", () => {
    const last = parsed[parsed.length - 1];
    expect(last.from).toBe("/*");
    expect(last.to).toBe("/404.html");
    expect(last.status).toBe(404);
  });

  it("serves the app shell for known application routes", () => {
    expect(find("/things-to-do")?.status).toBe(200);
    expect(find("/things-to-do/*")?.status).toBe(200);
    expect(find("/developers")?.status).toBe(200);
    expect(find("/privacy")?.status).toBe(200);
    expect(find("/")?.status).toBe(200);
  });

  it("enumerates published content items instead of wildcarding them", () => {
    // A wildcard under /blog would make /blog/anything answer 200, which is the
    // soft-404 behaviour this whole change removes.
    expect(find("/blog/where-to-stay-near-dzaleka")?.status).toBe(200);
    expect(find("/blog/24-hours-in-dzaleka")?.status).toBe(200);
    expect(find("/blog/*")).toBeUndefined();
    expect(find("/whats-on/*")).toBeUndefined();
    expect(find("/friends-of-dzaleka/*")).toBeUndefined();
  });

  it("still resolves the section index pages themselves", () => {
    for (const prefix of DYNAMIC_CONTENT_PREFIXES) {
      expect(find(prefix)?.status, prefix).toBe(200);
    }
  });

  it("protects the machine-readable files from the catch-all", () => {
    expect(find("/llms.txt")?.status).toBe(200);
    expect(find("/openapi.json")?.status).toBe(200);
    expect(find("/sitemap.xml")?.status).toBe(200);
    expect(find("/.well-known/api-catalog")?.status).toBe(200);
  });

  it("emits no duplicate source rules", () => {
    const froms = parsed.map((row) => row.from);
    expect(new Set(froms).size).toBe(froms.length);
  });

  it("produces a parseable table with three columns per row", () => {
    for (const line of table.split("\n")) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      expect(line.trim().split(/\s+/)).toHaveLength(3);
    }
  });

  it("works when nothing was prerendered", () => {
    const empty = rows(buildRedirects({ prerenderedRoutes: [] }));
    expect(empty[empty.length - 1]).toMatchObject({ from: "/*", status: 404 });
    expect(empty.some((row) => row.from === "/api/*")).toBe(true);
  });
});
