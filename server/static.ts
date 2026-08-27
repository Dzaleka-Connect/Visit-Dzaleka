import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { isKnownAppPath } from "../shared/routes";
import { appendVary, notFoundMarkdown, prefersJson, prefersMarkdown, buildApiError } from "./agent";

export function serveStatic(app: Express) {
  // Use process.cwd() for compatibility with both ESM and CJS build outputs
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve the SPA shell only for paths the router actually has a route for.
  // Anything else must return a real 404 — answering 200 with the app shell
  // makes an agent probing for resources conclude that every path exists.
  app.use("*", (req: Request, res: Response) => {
    const requestedPath = req.originalUrl.split(/[?#]/)[0];

    if (isKnownAppPath(requestedPath)) {
      return res.sendFile(path.resolve(distPath, "index.html"));
    }

    sendNotFound(req, res, distPath, requestedPath);
  });
}

/**
 * 404 in whichever representation the caller asked for.
 *
 * `Vary: Accept` is set on every branch so a CDN keeps the markdown and HTML
 * variants in separate cache entries (acceptmarkdown.com).
 */
export function sendNotFound(
  req: Request,
  res: Response,
  distPath: string,
  requestedPath: string
) {
  appendVary(res, "Accept");
  res.status(404);

  if (prefersMarkdown(req)) {
    return res.type("text/markdown; charset=utf-8").send(notFoundMarkdown(requestedPath));
  }

  if (prefersJson(req)) {
    return res.json(
      buildApiError(404, "not_found", `${requestedPath} does not exist on Visit Dzaleka.`, {
        hint: "See /sitemap.xml for published pages, or /openapi.json for the public API.",
        requestId: req.requestId,
      })
    );
  }

  const notFoundPage = path.resolve(distPath, "404.html");
  if (fs.existsSync(notFoundPage)) {
    return res.sendFile(notFoundPage);
  }

  res.type("text/markdown; charset=utf-8").send(notFoundMarkdown(requestedPath));
}
