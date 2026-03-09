import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  loadProjectConfig,
  resolveSources,
  writeSourcesYaml,
  readSourcesYaml,
  parseStartInput,
} from "./project-config.js";
import { setLogger, silentLogger } from "../logger.js";
import type { SourceEntry } from "../scanners/types.js";

const TMP = join(import.meta.dirname ?? ".", ".tmp-config-test");

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  setLogger(silentLogger);
});
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

// ─── loadProjectConfig ───

describe("loadProjectConfig", () => {
  it("returns empty when no config file", () => {
    expect(loadProjectConfig(TMP).default_sources).toEqual([]);
  });

  it("loads sources from .sprint-kit.yaml", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: add-dir\n    path: ./src\n    description: code\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toHaveLength(1);
    expect(config.default_sources[0]).toEqual({ type: "add-dir", path: "./src", description: "code" });
  });

  it("returns empty for invalid yaml", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"), "other_key: value\n");
    expect(loadProjectConfig(TMP).default_sources).toEqual([]);
  });

  it("returns empty for empty file", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"), "");
    expect(loadProjectConfig(TMP).default_sources).toEqual([]);
  });
});

// ─── resolveSources ───

describe("resolveSources", () => {
  it("merges defaults and additional", () => {
    const d: SourceEntry[] = [{ type: "add-dir", path: "./src" }];
    const a: SourceEntry[] = [{ type: "github-tarball", url: "https://github.com/org/repo" }];
    expect(resolveSources(d, a)).toHaveLength(2);
  });

  it("deduplicates, additional wins", () => {
    const d: SourceEntry[] = [{ type: "add-dir", path: "./src", description: "old" }];
    const a: SourceEntry[] = [{ type: "add-dir", path: "./src", description: "new" }];
    const result = resolveSources(d, a);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("new");
  });

  it("handles empty inputs", () => {
    expect(resolveSources([], [{ type: "add-dir", path: "./src" }])).toHaveLength(1);
    expect(resolveSources([{ type: "add-dir", path: "./src" }], [])).toHaveLength(1);
  });
});

// ─── sources.yaml roundtrip ───

describe("sources.yaml", () => {
  it("write then read preserves entries", () => {
    const sources: SourceEntry[] = [
      { type: "add-dir", path: "./src", description: "code" },
      { type: "figma-mcp", file_key: "xyz" },
    ];
    const filePath = join(TMP, "sources.yaml");
    writeSourcesYaml(filePath, sources);
    expect(readSourcesYaml(filePath)).toEqual(sources);
  });

  it("returns empty for missing file", () => {
    expect(readSourcesYaml(join(TMP, "nope.yaml"))).toEqual([]);
  });
});

// ─── parseStartInput ───

describe("parseStartInput", () => {
  it("description only", () => {
    const r = parseStartInput("튜터 차단 기능 추가");
    expect(r.description).toBe("튜터 차단 기능 추가");
    expect(r.sources).toEqual([]);
  });

  it("--add-dir", () => {
    const r = parseStartInput("튜터 차단 --add-dir /projects/app/src");
    expect(r.description).toBe("튜터 차단");
    expect(r.sources).toEqual([{ type: "add-dir", path: "/projects/app/src" }]);
  });

  it("--github", () => {
    const r = parseStartInput("기능 추가 --github https://github.com/org/repo");
    expect(r.description).toBe("기능 추가");
    expect(r.sources).toEqual([{ type: "github-tarball", url: "https://github.com/org/repo" }]);
  });

  it("--figma", () => {
    const r = parseStartInput("화면 --figma abc123");
    expect(r.description).toBe("화면");
    expect(r.sources).toEqual([{ type: "figma-mcp", file_key: "abc123" }]);
  });

  it("--obsidian", () => {
    const r = parseStartInput("정책 --obsidian /vaults/co");
    expect(r.description).toBe("정책");
    expect(r.sources).toEqual([{ type: "obsidian-vault", path: "/vaults/co" }]);
  });

  it("multiple flags", () => {
    const r = parseStartInput("차단 --add-dir /app --figma xyz --github https://g.com/r");
    expect(r.description).toBe("차단");
    const types = r.sources.map(s => s.type).sort();
    expect(types).toEqual(["add-dir", "figma-mcp", "github-tarball"]);
  });

  it("--add-dir with quoted path containing spaces", () => {
    const r = parseStartInput('튜터 차단 --add-dir "/path with spaces"');
    expect(r.description).toBe("튜터 차단");
    expect(r.sources).toEqual([{ type: "add-dir", path: "/path with spaces" }]);
  });

  it("--add-dir without quotes still works", () => {
    const r = parseStartInput("튜터 차단 --add-dir /simple/path");
    expect(r.description).toBe("튜터 차단");
    expect(r.sources).toEqual([{ type: "add-dir", path: "/simple/path" }]);
  });

  it("--github with quoted url", () => {
    const r = parseStartInput('기능 --github "https://github.com/org/my repo"');
    expect(r.description).toBe("기능");
    expect(r.sources).toEqual([{ type: "github-tarball", url: "https://github.com/org/my repo" }]);
  });

  it("--figma with quoted key", () => {
    const r = parseStartInput('화면 --figma "key with space"');
    expect(r.description).toBe("화면");
    expect(r.sources).toEqual([{ type: "figma-mcp", file_key: "key with space" }]);
  });

  it("--obsidian with quoted path", () => {
    const r = parseStartInput('정책 --obsidian "/vault path/notes"');
    expect(r.description).toBe("정책");
    expect(r.sources).toEqual([{ type: "obsidian-vault", path: "/vault path/notes" }]);
  });
});

// ─── Zod validation ───

describe("loadProjectConfig — Zod validation", () => {
  it("rejects invalid source type and returns empty", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: invalid-type\n    path: ./src\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toEqual([]);
  });

  it("rejects missing required field (path for add-dir) and returns empty", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: add-dir\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toEqual([]);
  });

  it("rejects missing required field (url for github-tarball) and returns empty", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: github-tarball\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toEqual([]);
  });

  it("rejects missing required field (file_key for figma-mcp) and returns empty", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: figma-mcp\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toEqual([]);
  });

  it("logs warning on validation failure", () => {
    const warnings: string[] = [];
    setLogger({
      debug: () => {},
      info: () => {},
      warn: (msg) => { warnings.push(msg); },
      error: () => {},
    });

    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n  - type: unknown-type\n    path: ./src\n`);
    loadProjectConfig(TMP);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("검증 실패");

    setLogger(silentLogger);
  });

  it("accepts valid config with all source types", () => {
    writeFileSync(join(TMP, ".sprint-kit.yaml"),
      `default_sources:\n` +
      `  - type: add-dir\n    path: ./src\n    description: code\n` +
      `  - type: github-tarball\n    url: https://github.com/org/repo\n` +
      `  - type: figma-mcp\n    file_key: abc\n` +
      `  - type: obsidian-vault\n    path: /vault\n`);
    const config = loadProjectConfig(TMP);
    expect(config.default_sources).toHaveLength(4);
  });
});
