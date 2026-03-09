import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanVault } from "./scan-vault.js";
import type { SourceEntry } from "./types.js";

const TMP = join(import.meta.dirname ?? ".", ".tmp-scanvault-test");

function makeSource(path: string): SourceEntry & { type: "obsidian-vault" } {
  return { type: "obsidian-vault", path };
}

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe("scanVault", () => {
  it("scans a vault directory and returns ScanResult", () => {
    writeFileSync(join(TMP, "note.md"), "# Hello\n\nSome content here.");
    writeFileSync(join(TMP, "idea.md"), "# Idea\n\n## Sub-heading\n\nDetails.");

    const result = scanVault(makeSource(TMP));

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.scanned_at).toBeTruthy();
    expect(result.source.type).toBe("obsidian-vault");
    expect(Object.keys(result.content_hashes).length).toBeGreaterThan(0);
  });

  it("excludes .obsidian/ directory", () => {
    mkdirSync(join(TMP, ".obsidian"), { recursive: true });
    writeFileSync(join(TMP, ".obsidian", "app.json"), '{"key": "value"}');
    writeFileSync(join(TMP, ".obsidian", "workspace.json"), "{}");
    writeFileSync(join(TMP, "note.md"), "# Note\n\nContent.");

    const result = scanVault(makeSource(TMP));

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("note.md");
    expect(paths.every((p) => !p.includes(".obsidian"))).toBe(true);
  });

  it("extracts doc_structure from markdown files", () => {
    writeFileSync(
      join(TMP, "structured.md"),
      "# Title\n\n## Section A\n\n## Section B\n\nParagraph text.",
    );

    const result = scanVault(makeSource(TMP));

    expect(result.doc_structure.length).toBeGreaterThan(0);
    const doc = result.doc_structure.find(
      (d) => d.file === "structured.md",
    );
    expect(doc).toBeDefined();
    expect(doc!.format).toBe("markdown");
    expect(doc!.headings).toBeDefined();
    expect(doc!.headings!.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty ScanResult for non-existent path", () => {
    const result = scanVault(makeSource(join(TMP, "does-not-exist")));

    expect(result.files).toEqual([]);
    expect(result.dependency_graph).toEqual([]);
    expect(result.api_patterns).toEqual([]);
    expect(result.schema_patterns).toEqual([]);
    expect(result.config_patterns).toEqual([]);
    expect(result.doc_structure).toEqual([]);
  });

  it("returns empty ScanResult when path points to a file (not a directory)", () => {
    const filePath = join(TMP, "single-file.md");
    writeFileSync(filePath, "# Just a file");

    const result = scanVault(makeSource(filePath));

    expect(result.files).toEqual([]);
    expect(result.dependency_graph).toEqual([]);
  });

  it("also excludes .git and node_modules like scanLocal", () => {
    mkdirSync(join(TMP, ".git"), { recursive: true });
    writeFileSync(join(TMP, ".git", "config"), "git config");
    mkdirSync(join(TMP, "node_modules", "pkg"), { recursive: true });
    writeFileSync(join(TMP, "node_modules", "pkg", "index.js"), "code");
    writeFileSync(join(TMP, "note.md"), "# Note");

    const result = scanVault(makeSource(TMP));

    const paths = result.files.map((f) => f.path);
    expect(paths).toEqual(["note.md"]);
  });

  it("scans nested directories inside vault", () => {
    mkdirSync(join(TMP, "projects"), { recursive: true });
    mkdirSync(join(TMP, "daily"), { recursive: true });
    writeFileSync(join(TMP, "projects", "project-a.md"), "# Project A");
    writeFileSync(join(TMP, "daily", "2024-01-01.md"), "# Daily Note");
    writeFileSync(join(TMP, "index.md"), "# Index");

    const result = scanVault(makeSource(TMP));

    expect(result.files.length).toBe(3);
    const paths = result.files.map((f) => f.path).sort();
    expect(paths).toContain("index.md");
    expect(paths).toContain("projects/project-a.md");
    expect(paths).toContain("daily/2024-01-01.md");
  });
});
