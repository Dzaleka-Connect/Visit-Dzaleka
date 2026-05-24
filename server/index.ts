import { createApp, log } from "./app";
import { serveStatic } from "./static";
import { type Request, Response, NextFunction } from "express";
import { startReminderScheduler } from "./lib/reminder-scheduler";
import { ReportScheduler } from "./lib/report-scheduler";
import { logger } from "./lib/logger";

(async () => {
  const { app, httpServer } = await createApp();

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction && status >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";
    const requestId = req.requestId;

    logger.withRequest(requestId).error("Unhandled request error", err, {
      method: req.method,
      path: req.path,
      status,
    });

    res.status(status).json({ message, requestId });
    // Don't throw here - response already sent, would cause unhandled rejection
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      // Start booking reminder scheduler
      startReminderScheduler();

      // Start scheduled reports engine
      ReportScheduler.init();
    },
  );
})();
