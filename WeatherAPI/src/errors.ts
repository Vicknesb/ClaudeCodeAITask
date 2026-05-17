/**
 * AppError separates operational errors (bad input, not found — expected, safe to surface)
 * from programmer errors (bugs — should never reach a client; trigger process restart in prod).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  badRequest: (msg: string)  => new AppError(msg, 400, "BAD_REQUEST"),
  notFound:   (resource: string) => new AppError(`${resource} not found`, 404, "NOT_FOUND"),
  internal:   (msg: string)  => new AppError(msg, 500, "INTERNAL_ERROR", false),
};

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isOperationalError(err: unknown): boolean {
  return isAppError(err) && err.isOperational;
}
