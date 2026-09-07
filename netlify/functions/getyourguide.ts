import express from "express";
import helmet from "helmet";
import serverless from "serverless-http";
import { registerGetYourGuideSupplierApiRoutes } from "../../server/lib/getyourguide-supplier";
import { requestIdMiddleware } from "../../server/middleware/requestId";

// Keep supplier requests independent of the dashboard, sessions, email and
// reporting modules: loading the full app exceeded GYG's cold-start deadline.
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(requestIdMiddleware);
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Netlify-CDN-Cache-Control", "no-store");
  res.set("X-Dzaleka-Supplier-Runtime", "dedicated");
  next();
});
app.use(express.json({ limit: "8mb" }));
registerGetYourGuideSupplierApiRoutes(app);

export const handler = serverless(app);
