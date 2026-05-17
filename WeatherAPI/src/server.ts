import express from "express";
import { Server } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./logger";
import { requestId, requestLogger, notFound, errorHandler } from "./middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down" },
}));
app.use(requestId);
app.use(requestLogger);
app.use(router);
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const server: Server = app.listen(PORT, () => {
    logger.info("server started", { port: PORT });
  });

  const shutdown = (signal: string): void => {
    logger.info("shutdown initiated", { signal });

    // Stop accepting new connections; wait for in-flight requests to finish
    server.close((err?: Error) => {
      if (err) {
        logger.error("error during shutdown", { message: err.message });
        process.exit(1);
      }
      logger.info("shutdown complete");
      process.exit(0);
    });

    // Force-kill if requests don't drain within 10 s
    setTimeout(() => {
      logger.error("shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

export default app;
