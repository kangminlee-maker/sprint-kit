export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// Default implementation using console
export const defaultLogger: Logger = {
  debug: (msg, ctx) => { /* noop in production */ },
  info: (msg, ctx) => console.info(`[sprint-kit] ${msg}`, ctx ?? ""),
  warn: (msg, ctx) => console.warn(`[sprint-kit] ${msg}`, ctx ?? ""),
  error: (msg, ctx) => console.error(`[sprint-kit] ${msg}`, ctx ?? ""),
};

// Silent logger for tests
export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Module-level logger (can be replaced)
let currentLogger: Logger = defaultLogger;

export function setLogger(logger: Logger): void {
  currentLogger = logger;
}

export function getLogger(): Logger {
  return currentLogger;
}
