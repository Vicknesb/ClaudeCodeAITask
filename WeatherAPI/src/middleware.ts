import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

// Augment Express Request so req.requestId is typed everywhere
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global { namespace Express { interface Request { requestId: string; } } }

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Attach a correlation ID to every request; echo it back in the response header. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers["x-request-id"];
  req.requestId = (Array.isArray(raw) ? raw[0] : raw) || generateId();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

/** Log method, path, status, and duration for every completed request. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
}

/** Return a structured 404 for any route not matched by the router. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: "Not found", path: req.path, requestId: req.requestId });
}

/**
 * Global error handler. Must have exactly 4 params so Express treats it as an
 * error handler rather than regular middleware.
 * - Production: generic message only (no stack trace)
 * - Development: includes error detail for faster debugging
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const isProd = process.env.NODE_ENV === "production";

  logger.error(err.message, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    stack: err.stack,
  });

  res.status(500).json({
    error: "Internal server error",
    requestId: req.requestId,
    ...(isProd ? {} : { detail: err.message }),
  });
}
