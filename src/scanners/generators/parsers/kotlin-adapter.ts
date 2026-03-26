/**
 * Kotlin 파서 어댑터 (정규식 기반 경량 파서)
 *
 * Kotlin 소스 코드에서 클래스, 함수, enum, import, 호출, 상태 할당을 추출합니다.
 * Stage 1의 "best-effort 추출" 원칙에 따라, 미추출 항목은 Stage 2가 보완합니다.
 */

import type {
  ParserAdapter,
  ParsedModule,
  ExportedSymbol,
  ImportedSymbol,
  CallSite,
  TypeDecl,
  StateAssignment,
  FieldDecl,
  SupportedLanguage,
} from "../types.js";
import { makeStateAssignmentId } from "../types.js";

// ── 정규식 패턴 ──

const IMPORT_RE = /^import\s+([\w.]+)(?:\.\*)?/;
const CLASS_RE = /^(?:(?:abstract|open|data|sealed|inner)\s+)*class\s+(\w+)/;
const OBJECT_RE = /^(?:companion\s+)?object\s+(\w+)/;
const INTERFACE_RE = /^interface\s+(\w+)/;
const FUN_RE = /^(?:(?:suspend|private|protected|internal|public|override|open|abstract)\s+)*fun\s+(\w+)/;
const ENUM_CLASS_RE = /^enum\s+class\s+(\w+)/;
const TYPEALIAS_RE = /^typealias\s+(\w+)\s*=/;
const FIELD_RE = /^(?:val|var)\s+(\w+)\s*:\s*(\w+)/;
const DECORATOR_RE = /@(\w+)(?:\(([^)]*)\))?/g;
const CONST_RE = /^(?:const\s+)?val\s+([A-Z][A-Z_0-9]+)\s*(?::\s*\w+\s*)?=\s*(.+?)(?:$)/;
const STATE_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/;
const CALL_RE = /(?:\w+(?:\.\w+)*)\s*\(/g;
const CALL_EXTRACT_RE = /(\w+(?:\.\w+)*)\s*\(/;
const ENUM_VALUE_RE = /^(\w+)(?:\s*\(|,|\s*$)/;
const METHOD_RE = /^(?:(?:suspend|private|protected|internal|public|override|open)\s+)*fun\s+(\w+)/;

const CALL_SKIP_KEYWORDS = new Set([
  "if", "for", "while", "when", "return", "throw", "import", "class",
  "fun", "val", "var", "object", "interface", "typealias", "package",
]);

export class KotlinAdapter implements ParserAdapter {
  languages: SupportedLanguage[] = ["kotlin"];

  parse(content: string, filePath: string): ParsedModule {
    const lines = content.split("\n");
    const exports: ExportedSymbol[] = [];
    const imports: ImportedSymbol[] = [];
    const callSites: CallSite[] = [];
    const typeDeclarations: TypeDecl[] = [];
    const stateAssignments: StateAssignment[] = [];

    let currentClass: string | null = null;
    let currentClassAnnotations: string[] = [];
    let currentFields: FieldDecl[] = [];
    let currentEnumName: string | null = null;
    let currentEnumValues: string[] = [];
    let currentFunction: string | null = null;
    let braceDepth = 0;
    let classBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      // import
      const importMatch = trimmed.match(IMPORT_RE);
      if (importMatch) {
        const fqn = importMatch[1];
        const parts = fqn.split(".");
        const name = parts[parts.length - 1];
        const source = parts.slice(0, -1).join(".");
        imports.push({ name, source, source_kind: "package", file_path: filePath });
        continue;
      }

      // enum class
      const enumMatch = trimmed.match(ENUM_CLASS_RE);
      if (enumMatch) {
        currentEnumName = enumMatch[1];
        currentEnumValues = [];
        exports.push({
          name: currentEnumName, kind: "enum", file_path: filePath,
          line: lineNum, type_decl_ref: currentEnumName,
        });
        continue;
      }

      // enum 값 수집
      if (currentEnumName) {
        if (trimmed === "}" || trimmed.startsWith(";")) {
          typeDeclarations.push({
            name: currentEnumName, kind: "enum", file_path: filePath,
            line: lineNum, enum_values: currentEnumValues,
          });
          currentEnumName = null;
          currentEnumValues = [];
          continue;
        }
        const valMatch = trimmed.match(ENUM_VALUE_RE);
        if (valMatch && !trimmed.startsWith("//")) {
          currentEnumValues.push(valMatch[1]);
        }
        continue;
      }

      // typealias
      const typealiasMatch = trimmed.match(TYPEALIAS_RE);
      if (typealiasMatch) {
        exports.push({
          name: typealiasMatch[1], kind: "type_alias", file_path: filePath,
          line: lineNum, type_decl_ref: typealiasMatch[1],
        });
        typeDeclarations.push({
          name: typealiasMatch[1], kind: "type_alias", file_path: filePath, line: lineNum,
        });
        continue;
      }

      // interface
      const ifaceMatch = trimmed.match(INTERFACE_RE);
      if (ifaceMatch && !currentClass) {
        const name = ifaceMatch[1];
        exports.push({
          name, kind: "interface", file_path: filePath, line: lineNum, type_decl_ref: name,
        });
        typeDeclarations.push({
          name, kind: "interface", file_path: filePath, line: lineNum,
          fields: collectKotlinFields(lines, i),
        });
        continue;
      }

      // class / data class / sealed class / object
      const classMatch = trimmed.match(CLASS_RE);
      const objectMatch = !classMatch ? trimmed.match(OBJECT_RE) : null;
      if (classMatch || objectMatch) {
        const name = classMatch ? classMatch[1] : objectMatch![1];
        currentClass = name;
        currentClassAnnotations = extractKotlinAnnotations(lines, i);
        currentFields = [];
        classBraceDepth = 0;
        const annotations = currentClassAnnotations.length > 0 ? currentClassAnnotations : undefined;
        // data class, sealed class 등 구조 마커를 annotations에 추가
        const markers: string[] = annotations ? [...annotations] : [];
        if (trimmed.includes("data class")) markers.push("data_class");
        if (trimmed.includes("sealed class")) markers.push("sealed");
        if (objectMatch) markers.push("object");
        exports.push({
          name, kind: "class", file_path: filePath, line: lineNum,
          type_decl_ref: name, annotations: markers.length > 0 ? markers : undefined,
        });
        continue;
      }

      // top-level function
      const funMatch = trimmed.match(FUN_RE);
      if (funMatch && !currentClass) {
        currentFunction = funMatch[1];
        exports.push({
          name: funMatch[1], kind: "function", file_path: filePath, line: lineNum,
        });
        continue;
      }

      // 클래스 내부 처리
      if (currentClass) {
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        classBraceDepth += openBraces - closeBraces;

        if (classBraceDepth <= 0 && trimmed.includes("}")) {
          typeDeclarations.push({
            name: currentClass, kind: "class", file_path: filePath,
            line: lineNum, fields: currentFields.length > 0 ? currentFields : undefined,
          });
          currentClass = null;
          currentClassAnnotations = [];
          currentFields = [];
          currentFunction = null;
          continue;
        }

        // 메서드
        const methodMatch = trimmed.match(METHOD_RE);
        if (methodMatch && classBraceDepth === 1) {
          currentFunction = `${currentClass}.${methodMatch[1]}`;
        }

        // 필드 (val/var)
        const fieldMatch = trimmed.match(FIELD_RE);
        if (fieldMatch) {
          const fieldAnnotations = extractKotlinAnnotations(lines, i);
          const isFk = fieldAnnotations.some((a) =>
            ["@JoinColumn", "@ManyToOne", "@OneToOne", "@ManyToMany", "@OneToMany"].some((fk) => a.includes(fk)),
          );
          currentFields.push({
            name: fieldMatch[1], type_name: fieldMatch[2],
            is_fk: isFk, referenced_entity: isFk ? fieldMatch[2] : undefined,
          });
        }

        // 상태 할당
        const stateMatch = trimmed.match(STATE_ASSIGN_RE);
        if (stateMatch) {
          const entity = stateMatch[1];
          const fieldName = stateMatch[2];
          const to = stateMatch[4];
          const from = findKotlinGuardValue(lines, i, fieldName);
          stateAssignments.push({
            id: makeStateAssignmentId(entity, fieldName, from, to),
            entity, field_name: fieldName, from, to,
            file_path: filePath, line: lineNum,
            guard_expression: findKotlinGuardExpression(lines, i),
          });
        }
      }

      // call site 탐지
      if (currentFunction) {
        detectKotlinCallSites(trimmed, currentFunction, currentClass, filePath, lineNum, callSites);
      }
    }

    return {
      file_path: filePath, language: "kotlin",
      exports, imports, call_sites: callSites, type_declarations: typeDeclarations,
      state_assignments: stateAssignments,
    };
  }
}

// ── 헬퍼 함수 ──

function extractKotlinAnnotations(lines: string[], currentIndex: number): string[] {
  const annotations: string[] = [];
  for (let j = currentIndex - 1; j >= 0; j--) {
    const prev = lines[j].trim();
    if (prev.startsWith("@")) {
      annotations.push(prev);
    } else if (prev && !prev.startsWith("//") && !prev.startsWith("*")) {
      break;
    }
  }
  return annotations;
}

function collectKotlinFields(lines: string[], startIndex: number): FieldDecl[] {
  const fields: FieldDecl[] = [];
  let depth = 0;
  for (let j = startIndex; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line.includes("{")) depth++;
    if (line.includes("}")) depth--;
    if (depth <= 0 && j > startIndex) break;
    const fieldMatch = line.match(FIELD_RE);
    if (fieldMatch && depth === 1) {
      fields.push({ name: fieldMatch[1], type_name: fieldMatch[2], is_fk: false });
    }
  }
  return fields;
}

function findKotlinGuardValue(lines: string[], idx: number, fieldName: string): string | null {
  for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
    const prev = lines[j].trim();
    const guardMatch = prev.match(new RegExp(`\\b${fieldName}\\s*==\\s*(?:\\w+\\.)?([A-Z_]+)`));
    if (guardMatch) return guardMatch[1];
  }
  return null;
}

function findKotlinGuardExpression(lines: string[], idx: number): string | undefined {
  for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
    const prev = lines[j].trim();
    if (prev.startsWith("if") || prev.startsWith("when")) {
      const match = prev.match(/(?:if|when)\s*\((.+)\)/);
      return match?.[1];
    }
  }
  return undefined;
}

function detectKotlinCallSites(
  trimmed: string, caller: string, currentClass: string | null,
  filePath: string, lineNum: number, callSites: CallSite[],
): void {
  if (trimmed.startsWith("import ") || trimmed.startsWith("@") || trimmed.startsWith("package ")) return;
  CALL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CALL_RE.exec(trimmed)) !== null) {
    const extractMatch = match[0].match(CALL_EXTRACT_RE);
    if (!extractMatch) continue;
    const rawCallee = extractMatch[1];
    const firstToken = rawCallee.split(".")[0];
    if (CALL_SKIP_KEYWORDS.has(firstToken)) continue;
    let callee = rawCallee;
    if (rawCallee.startsWith("this.") && currentClass) {
      callee = `${currentClass}.${rawCallee.slice(5)}`;
    }
    callSites.push({ caller, callee, file_path: filePath, line: lineNum, kind: "direct" });
  }
}
