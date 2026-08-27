import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import {
  isApiPath,
  registerAgentRoutes,
  apiNotFoundHandler,
  apiErrorHandler,
  buildApiError,
  notFoundMarkdown,
  prefersMarkdown,
  prefersJson,
  appendVary,
} from "../server/agent";
import { isKnownAppPath } from "../shared/routes";
import { sendNotFound } from "../server/static";

/** Minimal app mirroring how createApp() wires the agent surface. */
function makeApp() {
  const app = express();
  app.use(express.json());
  registerAgentRoutes(app);
  app.get("/api/public/pricing", (_req, res) => res.json([{ groupSize: "individual", basePrice: 20000 }]));
  app.get("/api/boom", () => {
    throw new Error("kaboom");
  });
  app.get("/api/teapot", (_req, _res, next) => {
    const err: any = new Error("I refuse");
    err.status = 418;
    err.code = "im_a_teapot";
    next(err);
  });
  app.use(apiNotFoundHandler);
  // Site-level 404 for anything the SPA has no route for.
  app.use("*", (req, res) => {
    const path = req.originalUrl.split(/[?#]/)[0];
    if (isKnownAppPath(path)) return res.status(200).send("<html><body>app shell</body></html>");
    sendNotFound(req, res, "/nonexistent-dist", path);
  });
  app.use(apiErrorHandler);
  return app;
}

describe("Accept negotiation", () => {
  const req = (accept?: string, path = "/x") => ({ headers: { accept }, path }) as any;

  it("detects an explicit markdown request", () => {
    expect(prefersMarkdown(req("text/markdown"))).toBe(true);
    expect(prefersMarkdown(req("text/markdown, text/plain"))).toBe(true);
    expect(prefersMarkdown(req("application/markdown"))).toBe(true);
  });

  it("ignores a browser Accept header", () => {
    expect(prefersMarkdown(req("text/html,application/xhtml+xml,*/*;q=0.8"))).toBe(false);
    expect(prefersMarkdown(req())).toBe(false);
  });

  it("honours quality values when both types are offered", () => {
    expect(prefersMarkdown(req("text/html;q=0.9, text/markdown;q=1.0"))).toBe(true);
    expect(prefersMarkdown(req("text/html;q=1.0, text/markdown;q=0.5"))).toBe(false);
  });

  it("treats /api paths as wanting JSON", () => {
    expect(prefersJson(req("text/html", "/api/anything"))).toBe(true);
    expect(prefersJson(req("application/json", "/page"))).toBe(true);
    expect(prefersJson(req("text/html", "/page"))).toBe(false);
  });
});

describe("appendVary", () => {
  function fakeRes(initial?: string) {
    const headers: Record<string, string> = {};
    if (initial) headers.Vary = initial;
    return {
      getHeader: (k: string) => headers[k],
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      headers,
    } as any;
  }

  it("sets Vary when absent", () => {
    const res = fakeRes();
    appendVary(res, "Accept");
    expect(res.headers.Vary).toBe("Accept");
  });

  // The audit failure was `Vary: accept-encoding` with Accept missing.
  it("appends to an existing Vary without dropping it", () => {
    const res = fakeRes("Accept-Encoding");
    appendVary(res, "Accept");
    expect(res.headers.Vary).toBe("Accept-Encoding, Accept");
  });

  it("does not duplicate an existing field", () => {
    const res = fakeRes("Accept, Accept-Encoding");
    appendVary(res, "accept");
    expect(res.headers.Vary).toBe("Accept, Accept-Encoding");
  });
});

describe("structured errors", () => {
  it("builds the documented error shape", () => {
    const body = buildApiError(404, "not_found", "nope", { hint: "try /api" });
    expect(body).toMatchObject({
      error: true,
      code: "not_found",
      message: "nope",
      status: 404,
      hint: "try /api",
    });
    expect(body.documentation).toContain("/developers");
  });

  it("points an agent at the machine-readable index in the 404 markdown", () => {
    const markdown = notFoundMarkdown("/missing");
    expect(markdown).toContain("# 404 Not Found");
    expect(markdown).toContain("/missing");
    expect(markdown).toContain("/llms.txt");
    expect(markdown).toContain("/sitemap.xml");
    expect(markdown).toContain("/openapi.json");
  });
});

describe("agent endpoints", () => {
  it("serves the OpenAPI document", async () => {
    const res = await request(makeApp()).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/openapi+json");
    expect(res.body.openapi).toMatch(/^3\.1/);
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(10);
  });

  it("serves an endpoint index at /api", async () => {
    const res = await request(makeApp()).get("/api");
    expect(res.status).toBe(200);
    expect(res.body.authentication).toBe("none");
    expect(res.body.endpointCount).toBeGreaterThan(10);
    expect(res.body.endpoints[0]).toHaveProperty("operationId");
    expect(res.body.openapi).toContain("/openapi.json");
  });

  it("serves the RFC 9727 API catalogue", async () => {
    const res = await request(makeApp()).get("/.well-known/api-catalog");
    expect(res.status).toBe(200);
    expect(res.body.linkset[0]["service-desc"][0].href).toContain("/openapi.json");
  });

  it("advertises discovery links and Vary: Accept on every response", async () => {
    const res = await request(makeApp()).get("/api/public/pricing");
    expect(res.status).toBe(200);
    expect(res.headers.link).toContain('rel="service-desc"');
    expect(res.headers.link).toContain("/llms.txt");
    expect(res.headers.vary).toContain("Accept");
  });
});

describe("API errors are JSON", () => {
  it("returns the Error schema for an unknown /api path", async () => {
    const res = await request(makeApp()).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body).toMatchObject({ error: true, code: "not_found", status: 404 });
    expect(res.body.hint).toContain("openapi.json");
  });

  it("returns JSON, not HTML, when a handler throws", async () => {
    const res = await request(makeApp()).get("/api/boom");
    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe("internal_error");
    expect(res.body.hint).toBeTruthy();
  });

  it("preserves an explicit status and code", async () => {
    const res = await request(makeApp()).get("/api/teapot");
    expect(res.status).toBe(418);
    expect(res.body.code).toBe("im_a_teapot");
  });

  // The legacy channel-manager prefix runs in the same serverless function and
  // has no static layer behind it, so it needs the JSON 404 too.
  it("covers the legacy /1/ API prefix", async () => {
    const res = await request(makeApp()).get("/1/not-a-real-endpoint");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body).toMatchObject({ error: true, code: "not_found" });
  });
});

describe("isApiPath", () => {
  it("recognises both API prefixes", () => {
    expect(isApiPath("/api")).toBe(true);
    expect(isApiPath("/api/public/pricing")).toBe(true);
    expect(isApiPath("/1/book/")).toBe(true);
  });

  it("does not claim ordinary pages", () => {
    expect(isApiPath("/things-to-do")).toBe(false);
    expect(isApiPath("/")).toBe(false);
    expect(isApiPath("/1-thing")).toBe(false);
  });
});

describe("site 404s", () => {
  it("still serves the app shell for a real route", async () => {
    const res = await request(makeApp()).get("/things-to-do");
    expect(res.status).toBe(200);
  });

  // The headline failure: every unknown path used to answer 200.
  it("returns a real 404 for an unknown path", async () => {
    const res = await request(makeApp()).get("/some-path-that-does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns markdown when the caller asks for it", async () => {
    const res = await request(makeApp())
      .get("/some-path-that-does-not-exist")
      .set("Accept", "text/markdown");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("text/markdown");
    expect(res.headers.vary).toContain("Accept");
    expect(res.text).toContain("# 404 Not Found");
    expect(res.text).toContain("/sitemap.xml");
  });

  it("returns JSON when the caller asks for it", async () => {
    const res = await request(makeApp())
      .get("/some-path-that-does-not-exist")
      .set("Accept", "application/json");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: true, code: "not_found" });
  });
});
