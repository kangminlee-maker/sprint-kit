import { describe, it, expect } from "vitest";
import { contentHash } from "./hash.js";

describe("contentHash", () => {
  it("produces consistent SHA-256 hex for same input", () => {
    const a = contentHash("hello");
    const b = contentHash("hello");
    expect(a).toBe(b);
    expect(a).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  it("produces different hashes for different inputs", () => {
    expect(contentHash("a")).not.toBe(contentHash("b"));
  });

  it("handles Buffer input", () => {
    const fromStr = contentHash("hello");
    const fromBuf = contentHash(Buffer.from("hello"));
    expect(fromStr).toBe(fromBuf);
  });

  it("handles empty string", () => {
    const h = contentHash("");
    expect(h).toHaveLength(64);
  });

  it("empty string hash is known SHA-256", () => {
    expect(contentHash("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("unicode string hash is deterministic", () => {
    const a = contentHash("한글");
    const b = contentHash("한글");
    expect(a).toBe(b);
  });

  it("newline sensitivity", () => {
    expect(contentHash("a\n")).not.toBe(contentHash("a"));
  });
});
