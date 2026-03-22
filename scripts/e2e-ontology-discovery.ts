/**
 * E2E Test: Ontology-Guided Constraint Discovery
 *
 * 실제 podo-backend + podo-ontology v3로 전체 파이프라인 검증.
 * npx tsx scripts/e2e-ontology-discovery.ts
 */

import { buildOntologyIndex } from "../src/scanners/ontology-index.js";
import { queryOntology } from "../src/scanners/ontology-query.js";
import { resolveCodeLocations } from "../src/scanners/ontology-resolve.js";
import { collectRelevantChunks } from "../src/scanners/code-chunk-collector.js";
import { scanLocal } from "../src/scanners/scan-local.js";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rlmTestDir = "/tmp/rlm-test";

// ─── podo-backend ───
const backendDirs = readdirSync(rlmTestDir).filter((d) => d.startsWith("re-speak-podo-backend-"));
if (backendDirs.length === 0) { console.error("podo-backend 없음"); process.exit(1); }
const targetDir = resolve(rlmTestDir, backendDirs[0]);

// ─── podo-ontology v3 ───
const ontoDirs = readdirSync(rlmTestDir).filter((d) => d.startsWith("re-speak-podo-ontology-"));
if (ontoDirs.length === 0) { console.error("podo-ontology 없음"); process.exit(1); }
const ontoDir = resolve(rlmTestDir, ontoDirs[0]);

console.log("=== Ontology-Guided Constraint Discovery E2E (v3) ===\n");

// ─── Step 1: 소스 스캔 ───
console.log("Step 1: podo-backend 소스 스캔...");
const scanResult = scanLocal({ type: "add-dir", path: targetDir });
console.log(`  파일: ${scanResult.files.length}, API: ${scanResult.api_patterns.length}, 스키마: ${scanResult.schema_patterns.length}, 의존성: ${scanResult.dependency_graph.length}\n`);

// ─── Step 2: v3 온톨로지 로드 ───
console.log("Step 2: podo-ontology v3 로드...");
const glossaryYaml = readFileSync(resolve(ontoDir, "code-mapping.yaml"), "utf-8");
const actionsYaml = readFileSync(resolve(ontoDir, "behavior.yaml"), "utf-8");
const transitionsYaml = readFileSync(resolve(ontoDir, "model.yaml"), "utf-8");

const index = buildOntologyIndex(glossaryYaml, actionsYaml, transitionsYaml);
console.log(`  glossary: ${index.glossary.size}개, actions: ${index.actions.size}개, transitions: ${index.transitions.size}개`);

// v3 확장 필드 검증
const actionsWithPreconditions = [...index.actions.values()].filter((a) => a.preconditions && a.preconditions.length > 0).length;
const transitionsWithGuards = [...index.transitions.values()].flat().filter((t) => t.guards && t.guards.length > 0).length;
console.log(`  v3 확장: preconditions ${actionsWithPreconditions}건, guards ${transitionsWithGuards}건\n`);

// ─── Step 3: queryOntology ───
console.log("Step 3: queryOntology...");
const keywords = ["체험", "수업", "무료", "수강권", "결제"];
console.log(`  keywords: ${JSON.stringify(keywords)}`);

const queryResult = queryOntology(index, keywords);
console.log(`  matched: ${JSON.stringify(queryResult.matched_entities)}`);
console.log(`  code_locations: ${queryResult.code_locations.length}개`);
console.log(`  value_filters: ${queryResult.value_filters.length}개`);
for (const vf of queryResult.value_filters) {
  console.log(`    → ${vf.entity}: ${vf.column}='${vf.value}'`);
}
console.log();

// ─── Step 4: resolve ───
console.log("Step 4: resolveCodeLocations...");
const resolved = resolveCodeLocations(queryResult.code_locations, scanResult.files);
const resolvedOk = resolved.filter((r) => r.resolution_method === "filename").length;
const unresolvedN = resolved.filter((r) => r.resolution_method === "unresolved").length;
console.log(`  resolved: ${resolvedOk}건, unresolved: ${unresolvedN}건`);
for (const r of resolved.slice(0, 8)) {
  const s = r.resolution_method === "filename" ? "✓" : "✗";
  const f = r.resolved_files.length > 0 ? r.resolved_files.map((p) => p.split("/").pop()).join(", ") : "(없음)";
  console.log(`  ${s} ${r.reference.slice(0, 50)} → ${f}`);
}
if (resolved.length > 8) console.log(`  ... 외 ${resolved.length - 8}건`);
console.log();

// ─── Step 5: 6관점 수집 ───
console.log("Step 5: collectRelevantChunks (6관점)...");
const chunks = collectRelevantChunks(resolved, queryResult, scanResult, keywords);
console.log(`  total_chunks: ${chunks.total_chunks}`);
console.log(`  tokens_estimate: ${chunks.total_tokens_estimate}`);
console.log(`  confidence: ${chunks.search_confidence.method} (매칭 ${chunks.search_confidence.ontology_match_count}건)`);
if (chunks.search_confidence.warning) console.log(`  ⚠️ ${chunks.search_confidence.warning}`);
console.log();

const viewpoints = ["semantics", "dependency", "logic", "structure", "pragmatics", "evolution"] as const;
for (const vp of viewpoints) {
  const vpChunks = chunks.by_viewpoint[vp];
  console.log(`--- ${vp} (${vpChunks.length}건) ---`);
  for (const c of vpChunks.slice(0, 3)) {
    console.log(`  ${c.file_path.split("/").pop()}: ${c.context.slice(0, 80)}`);
  }
  if (vpChunks.length > 3) console.log(`  ... 외 ${vpChunks.length - 3}건`);
  console.log();
}

// ─── 검증 ───
console.log("=== 검증 결과 ===\n");
const checks = [
  { name: "v3 glossary 파싱 (8개)", pass: index.glossary.size === 8 },
  { name: "v3 actions 파싱 (>= 70개)", pass: index.actions.size >= 70 },
  { name: "v3 transitions 파싱 (>= 5개 엔티티)", pass: index.transitions.size >= 5 },
  { name: "v3 preconditions 파싱", pass: actionsWithPreconditions > 0 },
  { name: "v3 guards 파싱", pass: transitionsWithGuards > 0 },
  { name: "TrialLesson 매칭", pass: queryResult.matched_entities.includes("TrialLesson") },
  { name: "value_filters PODO_TRIAL", pass: queryResult.value_filters.some((vf) => vf.value === "PODO_TRIAL") },
  { name: "resolve >= 5건", pass: resolvedOk >= 5 },
  { name: "semantics 청크 >= 1", pass: chunks.by_viewpoint.semantics.length >= 1 },
  { name: "logic 청크에 PODO_TRIAL", pass: chunks.by_viewpoint.logic.some((c) => c.context.includes("PODO_TRIAL")) },
  { name: "total_chunks >= 10", pass: chunks.total_chunks >= 10 },
  { name: "coverage_gaps 빈 배열 (에이전트 위임)", pass: chunks.coverage_gaps.length === 0 },
];

let allPassed = true;
for (const check of checks) {
  const mark = check.pass ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${check.name}`);
  if (!check.pass) allPassed = false;
}
console.log(`\n${allPassed ? "모든 검증 통과" : "일부 검증 실패"}`);
process.exit(allPassed ? 0 : 1);
