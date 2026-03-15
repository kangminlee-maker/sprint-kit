import { describe, it, expect } from "vitest";
import { sourceKey, toGroundingSource, isScanSkipped, type SourceEntry, type ScanResult, type ScanError, type ScanSkipped } from "./types.js";

describe("sourceKey", () => {
  it("add-dir", () => {
    expect(sourceKey({ type: "add-dir", path: "./src" })).toBe("add-dir:./src");
  });
  it("github-tarball", () => {
    expect(sourceKey({ type: "github-tarball", url: "https://github.com/org/repo" }))
      .toBe("github-tarball:https://github.com/org/repo");
  });
  it("figma-mcp", () => {
    expect(sourceKey({ type: "figma-mcp", file_key: "abc" })).toBe("figma-mcp:abc");
  });
  it("obsidian-vault", () => {
    expect(sourceKey({ type: "obsidian-vault", path: "/vaults/docs" }))
      .toBe("obsidian-vault:/vaults/docs");
  });
});

describe("toGroundingSource", () => {
  it("normalizes add-dir", () => {
    expect(toGroundingSource({ type: "add-dir", path: "./src" }))
      .toEqual({ type: "add-dir", path_or_url: "./src" });
  });
  it("normalizes github-tarball", () => {
    expect(toGroundingSource({ type: "github-tarball", url: "https://github.com/org/repo" }))
      .toEqual({ type: "github-tarball", path_or_url: "https://github.com/org/repo" });
  });
  it("normalizes figma-mcp", () => {
    expect(toGroundingSource({ type: "figma-mcp", file_key: "abc" }))
      .toEqual({ type: "figma-mcp", path_or_url: "abc" });
  });
  it("normalizes obsidian-vault", () => {
    expect(toGroundingSource({ type: "obsidian-vault", path: "/vaults" }))
      .toEqual({ type: "obsidian-vault", path_or_url: "/vaults" });
  });
});

describe("isScanSkipped", () => {
  const source: SourceEntry = { type: "github-tarball", url: "https://github.com/a/b" };

  it("returns true for ScanSkipped", () => {
    const skipped: ScanSkipped = { skipped: true, source, previous_hash: "abc123" };
    expect(isScanSkipped(skipped)).toBe(true);
  });

  it("returns false for ScanResult", () => {
    const result: ScanResult = {
      source,
      scanned_at: new Date().toISOString(),
      files: [],
      content_hashes: {},
      dependency_graph: [],
      api_patterns: [],
      schema_patterns: [],
      config_patterns: [],
      doc_structure: [],
    };
    expect(isScanSkipped(result)).toBe(false);
  });

  it("returns false for ScanError", () => {
    const err: ScanError = { source, error_type: "network", message: "fail" };
    expect(isScanSkipped(err)).toBe(false);
  });
});
