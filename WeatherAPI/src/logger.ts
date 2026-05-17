type Level = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: Level;
  message: string;
  [key: string]: unknown;
}

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, message, ...meta };
  const line = JSON.stringify(entry) + "\n";
  if (level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  info:  (message: string, meta?: Record<string, unknown>) => write("info",  message, meta),
  warn:  (message: string, meta?: Record<string, unknown>) => write("warn",  message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
