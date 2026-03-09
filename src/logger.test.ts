import { describe, it, expect, afterEach } from "vitest";
import {
  defaultLogger,
  silentLogger,
  setLogger,
  getLogger,
  type Logger,
} from "./logger.js";

describe("logger", () => {
  afterEach(() => {
    // Reset to default after each test
    setLogger(defaultLogger);
  });

  it("getLogger returns defaultLogger initially", () => {
    expect(getLogger()).toBe(defaultLogger);
  });

  it("setLogger replaces the current logger", () => {
    setLogger(silentLogger);
    expect(getLogger()).toBe(silentLogger);
  });

  it("setLogger accepts a custom logger", () => {
    const calls: string[] = [];
    const custom: Logger = {
      debug: (msg) => calls.push(`debug:${msg}`),
      info: (msg) => calls.push(`info:${msg}`),
      warn: (msg) => calls.push(`warn:${msg}`),
      error: (msg) => calls.push(`error:${msg}`),
    };

    setLogger(custom);
    const logger = getLogger();

    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(calls).toEqual(["debug:d", "info:i", "warn:w", "error:e"]);
  });

  it("silentLogger does not throw", () => {
    expect(() => {
      silentLogger.debug("x", { key: "val" });
      silentLogger.info("x");
      silentLogger.warn("x");
      silentLogger.error("x");
    }).not.toThrow();
  });

  it("defaultLogger.debug is a noop (does not throw)", () => {
    expect(() => {
      defaultLogger.debug("test", { key: "val" });
    }).not.toThrow();
  });
});
