/**
 * 온톨로지 자동 생성 파이프라인 오케스트레이터
 *
 * GeneratorInput → ParsedModule[] → CodeStructureExtract → GeneratedYaml
 * 모든 Stage 1 단계를 일괄 실행합니다.
 */

import type { GeneratorInput, GeneratorConfigFile } from "./types.js";
import type { GeneratedYaml } from "./yaml-generator.js";
import { TsMorphAdapter } from "./parsers/ts-morph-adapter.js";
import { detectEntryPoints, detectAuxiliaryServiceMethods } from "./entry-point-detector.js";
import { buildCallGraph } from "./call-graph-builder.js";
import { extractStructure } from "./structure-extractor.js";
import { generateYaml } from "./yaml-generator.js";

export interface PipelineResult {
  yaml: GeneratedYaml;
  meta: {
    total_files: number;
    parsed_files: number;
    skipped_files: number;
    entry_points_found: number;
    auxiliary_entry_points: number;
    unsupported_files: string[];
  };
}

export function runGeneratorPipeline(input: GeneratorInput): PipelineResult {
  const adapter = new TsMorphAdapter();
  const supportedExtensions = [".ts", ".tsx", ".js", ".jsx"];

  // 1. Parse all supported files
  const parsedModules = [];
  const unsupportedFiles: string[] = [];

  for (const file of input.files) {
    const ext = file.path.substring(file.path.lastIndexOf("."));
    if (!supportedExtensions.includes(ext)) {
      unsupportedFiles.push(file.path);
      continue;
    }
    try {
      parsedModules.push(adapter.parse(file.content, file.path));
    } catch {
      // graceful degradation: skip unparseable files
      unsupportedFiles.push(file.path);
    }
  }

  // 2. Detect entry points from file contents
  const allEntryPoints = [];
  for (const file of input.files) {
    const ext = file.path.substring(file.path.lastIndexOf("."));
    if (!supportedExtensions.includes(ext)) continue;
    const eps = detectEntryPoints(file.content, file.path);
    allEntryPoints.push(...eps);
  }

  // 3. Build call graph (1st pass)
  const callGraph = buildCallGraph(allEntryPoints, parsedModules);

  // 4. Detect auxiliary service methods (2nd pass)
  const reachedSymbols = new Set<string>();
  for (const ep of allEntryPoints) reachedSymbols.add(ep.symbol);
  for (const site of callGraph) {
    reachedSymbols.add(site.caller);
    reachedSymbols.add(site.callee);
  }

  const fileContentMap = new Map<string, string>();
  for (const file of input.files) {
    fileContentMap.set(file.path, file.content);
  }

  const auxiliaryEPs = detectAuxiliaryServiceMethods(fileContentMap, reachedSymbols);
  const allEntryPointsCombined = [...allEntryPoints, ...auxiliaryEPs];

  // 5. Rebuild call graph with auxiliary entry points
  const fullCallGraph = auxiliaryEPs.length > 0
    ? buildCallGraph(allEntryPointsCombined, parsedModules)
    : callGraph;

  // 6. Extract structure (with policy constants)
  const extract = extractStructure(
    parsedModules,
    allEntryPointsCombined,
    fullCallGraph,
    fileContentMap,
    input.config_files,
  );

  // 7. Generate YAML
  const yaml = generateYaml(extract);

  return {
    yaml,
    meta: {
      total_files: input.files.length,
      parsed_files: parsedModules.length,
      skipped_files: unsupportedFiles.length,
      entry_points_found: allEntryPoints.length,
      auxiliary_entry_points: auxiliaryEPs.length,
      unsupported_files: unsupportedFiles,
    },
  };
}
