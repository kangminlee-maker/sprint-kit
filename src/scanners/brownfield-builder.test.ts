import { describe, it, expect } from "vitest";
import { buildBrownfield } from "./brownfield-builder.js";
import type { ScanResult } from "./types.js";

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    source: { type: "add-dir", path: "/test" },
    scanned_at: "2026-03-09T00:00:00Z",
    files: [],
    content_hashes: {},
    dependency_graph: [],
    api_patterns: [],
    schema_patterns: [],
    config_patterns: [],
    doc_structure: [],
    ...overrides,
  };
}

describe("buildBrownfield", () => {
  it("returns empty context and detail for empty scan results", () => {
    const { context, detail } = buildBrownfield("SC-TEST", []);
    expect(context.related_files).toEqual([]);
    expect(context.module_dependencies).toEqual([]);
    expect(detail.sections).toEqual([]);
    expect(detail.scope_id).toBe("SC-TEST");
  });

  it("maps files to related_files with detail_anchor", () => {
    const result = makeScanResult({
      files: [
        { path: "src/app.ts", category: "source", language: "typescript", size_bytes: 100 },
      ],
    });
    const { context, detail } = buildBrownfield("SC-TEST", [result]);
    expect(context.related_files).toHaveLength(1);
    expect(context.related_files[0].path).toBe("src/app.ts");
    expect(context.related_files[0].detail_anchor).toBeTruthy();
    // detail has matching section
    const anchor = context.related_files[0].detail_anchor;
    expect(detail.sections.some(s => s.anchor === anchor)).toBe(true);
  });

  it("maps dependency_graph to module_dependencies", () => {
    const result = makeScanResult({
      dependency_graph: [
        { from: "app.ts", to: "./utils", kind: "import" },
      ],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    expect(context.module_dependencies).toHaveLength(1);
    expect(context.module_dependencies[0].module).toBe("app.ts");
    expect(context.module_dependencies[0].depends_on).toBe("./utils");
  });

  it("maps api_patterns to api_contracts", () => {
    const result = makeScanResult({
      api_patterns: [
        { file: "Controller.java", method: "GET", path: "/api/users", line: 10 },
      ],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    expect(context.api_contracts).toHaveLength(1);
    expect(context.api_contracts![0].endpoint).toBe("/api/users");
  });

  it("maps schema_patterns to db_schemas", () => {
    const result = makeScanResult({
      schema_patterns: [
        { file: "V1.sql", table: "users", columns: "id, name", line: 1 },
      ],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    expect(context.db_schemas).toHaveLength(1);
    expect(context.db_schemas![0].table).toBe("users");
  });

  it("maps config_patterns to config_env", () => {
    const result = makeScanResult({
      config_patterns: [
        { file: ".env", key: "DB_URL", source_type: "dotenv", line: 1 },
      ],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    expect(context.config_env).toHaveLength(1);
    expect(context.config_env![0].key).toBe("DB_URL");
  });

  it("deduplicates dependency edges", () => {
    const result = makeScanResult({
      dependency_graph: [
        { from: "a.ts", to: "b", kind: "import" },
        { from: "a.ts", to: "b", kind: "import" },
      ],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    expect(context.module_dependencies).toHaveLength(1);
  });

  it("merges multiple scan results", () => {
    const r1 = makeScanResult({
      source: { type: "add-dir", path: "/project1" },
      files: [{ path: "a.ts", category: "source", language: "typescript", size_bytes: 50 }],
    });
    const r2 = makeScanResult({
      source: { type: "add-dir", path: "/project2" },
      files: [{ path: "b.java", category: "source", language: "java", size_bytes: 80 }],
    });
    const { context, detail } = buildBrownfield("SC-TEST", [r1, r2]);
    expect(context.related_files).toHaveLength(2);
    expect(detail.sections.length).toBeGreaterThanOrEqual(2);
  });

  it("generates sanitized anchors", () => {
    const result = makeScanResult({
      files: [{ path: "src/모듈/컴포넌트.tsx", category: "source", language: "typescript", size_bytes: 100 }],
    });
    const { context } = buildBrownfield("SC-TEST", [result]);
    const anchor = context.related_files[0].detail_anchor;
    // anchor should not contain special characters that break markdown links
    expect(anchor).not.toMatch(/[<>[\]{}()|\\^`"']/);
  });

  it("omits optional fields when empty", () => {
    const { context } = buildBrownfield("SC-TEST", [makeScanResult()]);
    expect(context.api_contracts).toBeUndefined();
    expect(context.db_schemas).toBeUndefined();
    expect(context.config_env).toBeUndefined();
  });

  it("includes test category files in related_files with test role", () => {
    const result = makeScanResult({
      files: [
        { path: "src/app.ts", category: "source", language: "typescript", size_bytes: 100 },
        { path: "src/app.test.ts", category: "test", language: "typescript", size_bytes: 80 },
      ],
    });
    const { context, detail } = buildBrownfield("SC-TEST", [result]);
    expect(context.related_files).toHaveLength(2);

    const testFile = context.related_files.find(f => f.path === "src/app.test.ts")!;
    expect(testFile).toBeDefined();
    expect(testFile.role).toMatch(/^test \(/);
    expect(testFile.detail_anchor).toBeTruthy();

    const sourceFile = context.related_files.find(f => f.path === "src/app.ts")!;
    expect(sourceFile.role).not.toMatch(/^test \(/);

    // detail section exists for the test file
    expect(detail.sections.some(s => s.anchor === testFile.detail_anchor)).toBe(true);
  });
});
