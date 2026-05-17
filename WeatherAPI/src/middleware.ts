import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { isAppError, isOperationalError } from "./errors";

// Augment Express Request so req.requestId is typed everywhere
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global { namespace Express { interface Request { requestId: string; } } }

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Stamp every request with a correlation ID; echo it in the response header. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers["x-request-id"];
  req.requestId = (Array.isArray(raw) ? raw[0] : raw) || generateId();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

/** Structured request log on response finish. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("request completed", {
      requestId: req.requestId,
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
}

/** Structured JSON 404 for any unmatched route. */
export function notFound(req: Request, res: Response): void {
  logger.warn("route not found", { requestId: req.requestId, method: req.method, path: req.path });
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`,
    code:  "NOT_FOUND",
    requestId: req.requestId,
  });
}

/**
 * Global error handler — must have exactly 4 params so Express treats it as an error handler.
 *
 * Operational errors (AppError.isOperational = true):
 *   - Expected: bad input, not found, rate-limit, etc.
 *   - Safe to surface the message to the client.
 *
 * Programmer errors (isOperational = false or unknown Error):
 *   - Bugs that should never happen; client gets a generic message.
 *   - In production, process exits after responding so the process manager restarts it.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const isProd       = process.env.NODE_ENV === "production";
  const isOperational = isOperationalError(err);
  const statusCode   = isAppError(err) ? err.statusCode : 500;
  const code         = isAppError(err) ? err.code : "INTERNAL_ERROR";

  logger.errorObj(err.message, err, {
    requestId: req.requestId,
    method:    req.method,
    path:      req.path,
    statusCode,
    isOperational,
  });

  res.status(statusCode).json({
    error:     isOperational ? err.message : "Internal server error",
    code,
    requestId: req.requestId,
    ...(isProd ? {} : { detail: err.message, stack: err.stack }),
  });

  // Non-operational (programmer) error in production → restart via process manager
  if (!isOperational && isProd) {
    setImmediate(() => process.exit(1));
  }
}
