import express from "express";
import { Server } from "http";
import { Socket } from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./logger";
import { requestId, requestLogger, notFound, errorHandler } from "./middleware";

const app = express();
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

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
    logger.info("server started", {
      port:    PORT,
      nodeEnv: process.env.NODE_ENV || "development",
      pid:     process.pid,
    });
  });

  // Track open sockets so graceful shutdown can destroy idle ones immediately
  const connections = new Set<Socket>();
  server.on("connection", (socket: Socket) => {
    connections.add(socket);
    socket.on("close", () => connections.delete(socket));
  });

  const shutdown = (signal: string): void => {
    logger.info("shutdown initiated", { signal, openConnections: connections.size });

    // Phase 1 — stop accepting new connections
    server.close((err?: Error) => {
      if (err) {
        logger.errorObj("error during server close", err);
        process.exit(1);
      }
      logger.info("shutdown complete", { signal });
      process.exit(0);
    });

    // Phase 2 — destroy idle sockets so server.close() resolves promptly
    for (const socket of connections) {
      socket.destroy();
    }

    // Phase 3 — force-kill if drain exceeds timeout
    setTimeout(() => {
      logger.error("shutdown timed out — forcing exit", { openConnections: connections.size });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  // Catch unhandled promise rejections — log and exit in production
  process.on("unhandledRejection", (reason: unknown) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.errorObj("unhandledRejection", err);
    if (process.env.NODE_ENV === "production") {
      setTimeout(() => process.exit(1), 500).unref();
    }
  });

  // Catch synchronous programmer errors that escape all try/catch
  process.on("uncaughtException", (err: Error) => {
    logger.errorObj("uncaughtException — process will exit", err);
    // Allow stderr to flush before exiting
    setTimeout(() => process.exit(1), 500).unref();
  });

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

export default app;
