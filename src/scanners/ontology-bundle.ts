import { basename } from "node:path";
import type { SourceEntry } from "../kernel/types.js";
import type { ScanResult } from "./types.js";

export interface ResolvedOntologyFiles {
  code_mapping: string;
  behavior: string;
  model: string;
}

export interface OntologyBundleSelection {
  scanResult: ScanResult;
  mode: "explicit";
  status: "ready" | "missing_files" | "invalid";
  files?: ResolvedOntologyFiles;
  warnings: string[];
}

const REQUIRED_ONTOLOGY_FILES: Array<keyof ResolvedOntologyFiles> = [
  "code_mapping",
  "behavior",
  "model",
];

const ONTOLOGY_BASENAMES: Record<keyof ResolvedOntologyFiles, string> = {
  code_mapping: "code-mapping.yaml",
  behavior: "behavior.yaml",
  model: "model.yaml",
};

export function selectOntologyBundle(
  scanResults: ScanResult[],
): OntologyBundleSelection | null {
  const explicit = scanResults.filter((result) => isExplicitOntologyBundle(result.source));
  if (explicit.length === 0) {
    return null;
  }

  const warnings = explicit.length > 1
    ? [`[ontology] content_role=ontology_bundle source가 ${explicit.length}개입니다. 첫 번째 source만 사용합니다.`]
    : [];
  return resolveOntologyBundle(explicit[0], "explicit", warnings);
}

export function isExplicitOntologyBundle(source: SourceEntry): boolean {
  return (source.type === "add-dir" || source.type === "github-tarball")
    && source.content_role === "ontology_bundle";
}

function resolveOntologyBundle(
  scanResult: ScanResult,
  mode: OntologyBundleSelection["mode"],
  warnings: string[],
): OntologyBundleSelection {
  const resolution = resolveOntologyFiles(scanResult.source, scanResult.files.map((file) => file.path));
  if (!resolution.files) {
    return {
      scanResult,
      mode,
      status: resolution.status,
      warnings: [...warnings, ...resolution.warnings],
    };
  }

  return {
    scanResult,
    mode,
    status: "ready",
    files: resolution.files,
    warnings: [...warnings, ...resolution.warnings],
  };
}

function resolveOntologyFiles(
  source: SourceEntry,
  availablePaths: string[],
): {
  status: "ready" | "missing_files" | "invalid";
  files?: ResolvedOntologyFiles;
  warnings: string[];
} {
  if (source.type !== "add-dir" && source.type !== "github-tarball") {
    return {
      status: "invalid",
      warnings: [`[ontology] source type ${source.type}는 ontology bundle로 사용할 수 없습니다.`],
    };
  }

  const override = source.ontology_files;
  const resolved: Partial<ResolvedOntologyFiles> = {};
  const warnings: string[] = [];
  let hasAmbiguity = false;

  for (const key of REQUIRED_ONTOLOGY_FILES) {
    const overridePath = override?.[key];
    if (overridePath) {
      if (availablePaths.includes(overridePath)) {
        resolved[key] = overridePath;
      } else {
        warnings.push(`[ontology] ${key} override path를 찾지 못했습니다: ${overridePath}`);
      }
      continue;
    }

    const matches = availablePaths.filter((path) => basename(path) === ONTOLOGY_BASENAMES[key]);
    if (matches.length === 1) {
      resolved[key] = matches[0];
      continue;
    }
    if (matches.length === 0) {
      warnings.push(`[ontology] ${ONTOLOGY_BASENAMES[key]} 파일을 찾지 못했습니다.`);
      continue;
    }

    hasAmbiguity = true;
    warnings.push(`[ontology] ${ONTOLOGY_BASENAMES[key]} 후보가 ${matches.length}개입니다. ontology_files로 경로를 명시하세요.`);
  }

  if (REQUIRED_ONTOLOGY_FILES.every((key) => resolved[key])) {
    return { status: "ready", files: resolved as ResolvedOntologyFiles, warnings };
  }

  return {
    status: hasAmbiguity ? "invalid" : "missing_files",
    warnings,
  };
}
