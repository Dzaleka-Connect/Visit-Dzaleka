import express from "express";
import serverless from "serverless-http";
import { registerGetYourGuideSupplierApiRoutes } from "../../server/lib/getyourguide-supplier";
import { getGygStore } from "../../server/lib/getyourguide-store";
import { requestIdMiddleware } from "../../server/middleware/requestId";

// Keep supplier requests independent of the dashboard, sessions, email and
// reporting modules: loading the full app exceeded GYG's cold-start deadline.
const app = express();
app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use((req, res, next) => {
  (req as express.Request & { gygStartedAt?: number }).gygStartedAt = Date.now();
  res.set("Cache-Control", "no-store");
  res.set("Netlify-CDN-Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Dzaleka-Supplier-Runtime", "dedicated");
  res.set("X-Dzaleka-Supplier-Region", process.env.AWS_REGION || "local");
  next();
});
app.use(express.json({ limit: "8mb" }));
registerGetYourGuideSupplierApiRoutes(app);

const serverlessHandler = serverless(app);

export const handler = (event: any, context: any) => {
  // Return as soon as the HTTP response is ready. Telemetry inserts must not
  // keep the Lambda running for GetYourGuide's availability timing check.
  if (context) context.callbackWaitsForEmptyEventLoop = false;
  return serverlessHandler(event, context);
};

try {
  const store = getGygStore() as { ping?: () => Promise<unknown> };
  if (typeof store.ping === "function") void store.ping().catch(() => {});
} catch {
  // Tests and builds without DATABASE_URL skip the pooler handshake.
}
