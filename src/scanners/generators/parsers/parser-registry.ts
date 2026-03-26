/**
 * 파서 어댑터 레지스트리
 *
 * 파일 확장자 → ParserAdapter 매핑을 관리합니다.
 * run-pipeline.ts는 이 레지스트리를 통해 파일별 어댑터를 조회합니다.
 *
 * 언어 추가 시 수정 지점: 이 파일의 EXTENSION_MAP에 매핑을 추가하고,
 * 해당 어댑터를 import합니다. (어댑터 + entry-point-detector 패턴 +
 * structure-extractor 조건을 함께 구현해야 합니다 — 언어별 원자적 작업)
 */

import type { ParserAdapter } from "../types.js";
import { TsJsRegexAdapter } from "./regex-adapter.js";
import { KotlinAdapter } from "./kotlin-adapter.js";
import { JavaAdapter } from "./java-adapter.js";
import { PythonAdapter } from "./python-adapter.js";
import { GoAdapter } from "./go-adapter.js";

// ── 어댑터 인스턴스 (싱글턴) ──

const tsJsAdapter = new TsJsRegexAdapter();
const kotlinAdapter = new KotlinAdapter();
const javaAdapter = new JavaAdapter();
const pythonAdapter = new PythonAdapter();
const goAdapter = new GoAdapter();

// ── 확장자 → 어댑터 매핑 ──

const EXTENSION_MAP: ReadonlyMap<string, ParserAdapter> = new Map([
  [".ts", tsJsAdapter],
  [".tsx", tsJsAdapter],
  [".js", tsJsAdapter],
  [".jsx", tsJsAdapter],
  [".kt", kotlinAdapter],
  [".kts", kotlinAdapter],
  [".java", javaAdapter],
  [".py", pythonAdapter],
  [".go", goAdapter],
]);

// ── 공개 API ──

/** 파일 경로에서 확장자를 추출하여 적절한 어댑터를 반환합니다.
 *  지원하지 않는 확장자이면 undefined를 반환합니다. */
export function getAdapterForFile(filePath: string): ParserAdapter | undefined {
  const ext = filePath.substring(filePath.lastIndexOf("."));
  return EXTENSION_MAP.get(ext);
}

/** 지원하는 파일 확장자 목록을 반환합니다. */
export function getSupportedExtensions(): string[] {
  return Array.from(EXTENSION_MAP.keys());
}
