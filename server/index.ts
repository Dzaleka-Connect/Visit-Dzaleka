import { createApp, log } from "./app";
import { serveStatic } from "./static";
import { apiErrorHandler } from "./agent";
import { startReminderScheduler } from "./lib/reminder-scheduler";
import { ReportScheduler } from "./lib/report-scheduler";

(async () => {
  const { app, httpServer } = await createApp();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Express only looks for error handlers registered *after* the middleware that
  // failed, so the copy inside createApp() cannot catch a fault in the static
  // layer above. Registering it again here closes that gap; it is a no-op unless
  // something throws.
  app.use(apiErrorHandler);

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
