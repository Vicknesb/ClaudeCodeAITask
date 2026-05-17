import os from "os";

type Level = "debug" | "info" | "warn" | "error";

const PRIORITY: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = (process.env.LOG_LEVEL as Level) || "info";

interface LogEntry {
  timestamp: string;
  level: Level;
  message: string;
  pid: number;
  hostname: string;
  [key: string]: unknown;
}

function serializeError(err: Error): Record<string, unknown> {
  return { name: err.name, message: err.message, stack: err.stack };
}

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (PRIORITY[level] < PRIORITY[MIN_LEVEL]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    pid: process.pid,
    hostname: os.hostname(),
    ...meta,
  };

  // info/debug → stdout; warn/error → stderr
  const line = JSON.stringify(entry) + "\n";
  if (level === "warn" || level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  debug:    (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info:     (message: string, meta?: Record<string, unknown>) => write("info",  message, meta),
  warn:     (message: string, meta?: Record<string, unknown>) => write("warn",  message, meta),
  error:    (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
  errorObj: (message: string, err: Error, meta?: Record<string, unknown>) =>
    write("error", message, { ...meta, error: serializeError(err) }),
};
