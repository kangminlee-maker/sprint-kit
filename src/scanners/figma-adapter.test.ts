import { describe, it, expect } from "vitest";
import { figmaSourceHashKey, figmaSourceHash } from "./figma-adapter.js";
import type { SourceEntry } from "./types.js";

function makeSource(fileKey: string): SourceEntry & { type: "figma-mcp" } {
  return { type: "figma-mcp", file_key: fileKey };
}

describe("figmaSourceHashKey", () => {
  it("returns key in 'figma-mcp:{file_key}' format", () => {
    const key = figmaSourceHashKey(makeSource("abc123"));
    expect(key).toBe("figma-mcp:abc123");
  });

  it("handles file_key with special characters", () => {
    const key = figmaSourceHashKey(makeSource("XyZ_0-9"));
    expect(key).toBe("figma-mcp:XyZ_0-9");
  });

  it("handles empty file_key", () => {
    const key = figmaSourceHashKey(makeSource(""));
    expect(key).toBe("figma-mcp:");
  });

  it("produces consistent keys across multiple calls", () => {
    const source = makeSource("consistent-key");
    const key1 = figmaSourceHashKey(source);
    const key2 = figmaSourceHashKey(source);
    expect(key1).toBe(key2);
  });
});

describe("figmaSourceHash", () => {
  it("returns correct { key, value } pair", () => {
    const source = makeSource("file123");
    const result = figmaSourceHash(source, "2024-01-15T10:30:00Z");

    expect(result).toEqual({
      key: "figma-mcp:file123",
      value: "2024-01-15T10:30:00Z",
    });
  });

  it("key matches figmaSourceHashKey output", () => {
    const source = makeSource("match-test");
    const hashResult = figmaSourceHash(source, "2024-06-01T00:00:00Z");
    const keyResult = figmaSourceHashKey(source);

    expect(hashResult.key).toBe(keyResult);
  });

  it("preserves lastModified value exactly", () => {
    const timestamp = "2025-12-31T23:59:59.999Z";
    const result = figmaSourceHash(makeSource("ts-test"), timestamp);
    expect(result.value).toBe(timestamp);
  });

  it("works with various file_key values", () => {
    const keys = ["a", "ABC", "123-456", "file_key_with_underscores", "MixedCase99"];
    for (const fk of keys) {
      const result = figmaSourceHash(makeSource(fk), "2024-01-01T00:00:00Z");
      expect(result.key).toBe(`figma-mcp:${fk}`);
      expect(result.value).toBe("2024-01-01T00:00:00Z");
    }
  });
});
