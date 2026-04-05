import { describe, expect, it } from "vitest";
import { selectOntologyBundle } from "./ontology-bundle.js";
import type { ScanResult, SourceEntry } from "./types.js";

function makeScanResult(source: SourceEntry, files: string[]): ScanResult {
  return {
    source,
    scanned_at: new Date().toISOString(),
    files: files.map((path) => ({
      path,
      category: "doc" as const,
      size_bytes: 1,
    })),
    content_hashes: {},
    dependency_graph: [],
    api_patterns: [],
    schema_patterns: [],
    config_patterns: [],
    doc_structure: [],
  };
}

describe("selectOntologyBundle", () => {
  it("prefers explicitly declared ontology bundle sources", () => {
    const explicit = makeScanResult(
      {
        type: "add-dir",
        path: "/tmp/domain-bundle",
        content_role: "ontology_bundle",
      },
      [
        "bundle/code-mapping.yaml",
        "bundle/behavior.yaml",
        "bundle/model.yaml",
      ],
    );
    const heuristic = makeScanResult(
      { type: "add-dir", path: "/tmp/legacy-ontology" },
      [
        "code-mapping.yaml",
        "behavior.yaml",
        "model.yaml",
      ],
    );

    const result = selectOntologyBundle([heuristic, explicit]);

    expect(result).not.toBeNull();
    expect(result?.mode).toBe("explicit");
    expect(result?.status).toBe("ready");
    expect(result?.files).toEqual({
      code_mapping: "bundle/code-mapping.yaml",
      behavior: "bundle/behavior.yaml",
      model: "bundle/model.yaml",
    });
  });

  it("returns null when no explicit ontology bundle is declared", () => {
    const result = selectOntologyBundle([
      makeScanResult(
        { type: "add-dir", path: "/tmp/customer-ontology" },
        ["code-mapping.yaml", "behavior.yaml", "model.yaml"],
      ),
    ]);

    expect(result).toBeNull();
  });

  it("uses ontology_files overrides for nested YAML locations", () => {
    const result = selectOntologyBundle([
      makeScanResult(
        {
          type: "github-tarball",
          url: "https://github.com/acme/platform",
          content_role: "ontology_bundle",
          ontology_files: {
            code_mapping: "config/domain/code-mapping.yaml",
            behavior: "config/domain/behavior.yaml",
            model: "config/domain/model.yaml",
          },
        },
        [
          "config/domain/code-mapping.yaml",
          "config/domain/behavior.yaml",
          "config/domain/model.yaml",
        ],
      ),
    ]);

    expect(result?.status).toBe("ready");
    expect(result?.files?.code_mapping).toBe("config/domain/code-mapping.yaml");
  });

  it("marks ambiguous exact filename matches as invalid", () => {
    const result = selectOntologyBundle([
      makeScanResult(
        {
          type: "add-dir",
          path: "/tmp/domain-bundle",
          content_role: "ontology_bundle",
        },
        [
          "a/code-mapping.yaml",
          "b/code-mapping.yaml",
          "behavior.yaml",
          "model.yaml",
        ],
      ),
    ]);

    expect(result?.status).toBe("invalid");
    expect(result?.warnings.join("\n")).toContain("후보가 2개");
  });
});
