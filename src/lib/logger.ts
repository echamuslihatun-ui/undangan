/**
 * Logger utility untuk development & production.
 * Di production, console.log tetap jalan tapi bisa diganti dengan service seperti Sentry.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${
    entry.data ? " " + JSON.stringify(entry.data) : ""
  }`;
}

function createEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    const entry = createEntry("info", message, data);
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog(entry));
    } else {
      // Di production, bisa kirim ke logging service
      console.log(formatLog(entry));
    }
  },

  warn(message: string, data?: Record<string, unknown>) {
    const entry = createEntry("warn", message, data);
    if (process.env.NODE_ENV !== "production") {
      console.warn(formatLog(entry));
    } else {
      console.warn(formatLog(entry));
    }
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    const entry = createEntry("error", message, {
      ...data,
      ...(error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { error }),
    });
    console.error(formatLog(entry));
    // TODO: Integrasi dengan Sentry atau service monitoring lainnya
  },

  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      const entry = createEntry("debug", message, data);
      console.debug(formatLog(entry));
    }
  },
};