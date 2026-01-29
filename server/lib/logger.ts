/**
 * Structured Logger for Visit Dzaleka
 * 
 * Provides JSON-formatted logs for production use with log aggregation services.
 * In development, logs are human-readable.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  meta?: LogMeta;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

const isProduction = process.env.NODE_ENV === "production";
const LOG_LEVEL = (process.env.LOG_LEVEL || "info") as LogLevel;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

function formatTime(): string {
  return new Date().toISOString();
}

function formatForConsole(entry: LogEntry): string {
  const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const color = levelColors[entry.level];

  let output = `${time} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

  if (entry.meta?.requestId) {
    output = `${time} ${color}[${entry.level.toUpperCase()}]${reset} [${entry.meta.requestId}] ${entry.message}`;
  }

  if (entry.error) {
    output += ` :: ${entry.error.message}`;
    if (entry.error.stack && entry.level === "error") {
      output += `\n${entry.error.stack}`;
    }
  }

  return output;
}

function writeLog(entry: LogEntry): void {
  if (isProduction) {
    // JSON output for log aggregation (CloudWatch, Datadog, etc.)
    const output = entry.level === "error" ? console.error : console.log;
    output(JSON.stringify(entry));
  } else {
    // Human-readable output for development
    const output = entry.level === "error" ? console.error : console.log;
    output(formatForConsole(entry));
  }
}

function createLogEntry(
  level: LogLevel,
  message: string,
  meta?: LogMeta,
  error?: Error | unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: formatTime(),
    level,
    message,
    service: "dzaleka-visit",
  };

  if (meta && Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  if (error) {
    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    } else {
      entry.error = {
        message: String(error),
      };
    }
  }

  return entry;
}

export const logger = {
  debug(message: string, meta?: LogMeta): void {
    if (shouldLog("debug")) {
      writeLog(createLogEntry("debug", message, meta));
    }
  },

  info(message: string, meta?: LogMeta): void {
    if (shouldLog("info")) {
      writeLog(createLogEntry("info", message, meta));
    }
  },

  warn(message: string, meta?: LogMeta, error?: Error | unknown): void {
    if (shouldLog("warn")) {
      writeLog(createLogEntry("warn", message, meta, error));
    }
  },

  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    if (shouldLog("error")) {
      writeLog(createLogEntry("error", message, meta, error));
    }
  },

  /**
   * Log with request context - extracts requestId automatically
   */
  withRequest(requestId?: string) {
    return {
      debug: (message: string, meta?: Omit<LogMeta, "requestId">) =>
        logger.debug(message, { ...meta, requestId }),
      info: (message: string, meta?: Omit<LogMeta, "requestId">) =>
        logger.info(message, { ...meta, requestId }),
      warn: (message: string, meta?: Omit<LogMeta, "requestId">, error?: Error | unknown) =>
        logger.warn(message, { ...meta, requestId }, error),
      error: (message: string, error?: Error | unknown, meta?: Omit<LogMeta, "requestId">) =>
        logger.error(message, error, { ...meta, requestId }),
    };
  },
};

export type { LogLevel, LogMeta, LogEntry };
