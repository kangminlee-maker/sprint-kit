/**
 * Java 파서 어댑터 (정규식 기반 경량 파서)
 *
 * Java 소스 코드에서 클래스, 인터페이스, 메서드, enum, import, 호출, 상태 할당을 추출합니다.
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

const IMPORT_RE = /^import\s+(?:static\s+)?([\w.]+)(?:\.\*)?;/;
const CLASS_RE = /^(?:(?:public|private|protected|abstract|final|static)\s+)*class\s+(\w+)/;
const INTERFACE_RE = /^(?:(?:public|private|protected|sealed)\s+)*interface\s+(\w+)/;
const ENUM_RE = /^(?:(?:public|private|protected)\s+)*enum\s+(\w+)/;
const METHOD_RE = /^(?:(?:public|private|protected|static|final|synchronized|abstract|native|default|override)\s+)*(?:<[\w<>,\s?]+>\s+)?(\w+)\s+(\w+)\s*\(/;
const FIELD_RE = /^(?:(?:private|protected|public|static|final|transient|volatile)\s+)*(\w+)\s+(\w+)\s*[;=]/;
const STATE_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/;
const CALL_RE = /(?:\w+(?:\.\w+)*)\s*\(/g;
const CALL_EXTRACT_RE = /(\w+(?:\.\w+)*)\s*\(/;
const ENUM_VALUE_RE = /^(\w+)(?:\s*\(|,|\s*;|\s*$)/;
const RECORD_RE = /^(?:(?:public|private|protected)\s+)*record\s+(\w+)/;

const CALL_SKIP_KEYWORDS = new Set([
  "if", "for", "while", "switch", "return", "new", "import", "throw",
  "catch", "class", "interface", "enum", "package", "synchronized",
]);

export class JavaAdapter implements ParserAdapter {
  languages: SupportedLanguage[] = ["java"];

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

      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

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

      // enum
      const enumMatch = trimmed.match(ENUM_RE);
      if (enumMatch && !currentClass) {
        currentEnumName = enumMatch[1];
        currentEnumValues = [];
        const annotations = extractJavaAnnotations(lines, i);
        exports.push({
          name: currentEnumName, kind: "enum", file_path: filePath,
          line: lineNum, type_decl_ref: currentEnumName,
          annotations: annotations.length > 0 ? annotations : undefined,
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
          if (trimmed === "}") { currentEnumName = null; currentEnumValues = []; }
          continue;
        }
        const valMatch = trimmed.match(ENUM_VALUE_RE);
        if (valMatch && !trimmed.startsWith("//") && !trimmed.startsWith("@")) {
          currentEnumValues.push(valMatch[1]);
        }
        continue;
      }

      // interface
      const ifaceMatch = trimmed.match(INTERFACE_RE);
      if (ifaceMatch && !currentClass) {
        const name = ifaceMatch[1];
        const annotations = extractJavaAnnotations(lines, i);
        exports.push({
          name, kind: "interface", file_path: filePath, line: lineNum,
          type_decl_ref: name, annotations: annotations.length > 0 ? annotations : undefined,
        });
        typeDeclarations.push({ name, kind: "interface", file_path: filePath, line: lineNum });
        continue;
      }

      // record
      const recordMatch = trimmed.match(RECORD_RE);
      if (recordMatch && !currentClass) {
        const name = recordMatch[1];
        const annotations = extractJavaAnnotations(lines, i);
        const markers = annotations.length > 0 ? [...annotations, "record"] : ["record"];
        exports.push({
          name, kind: "class", file_path: filePath, line: lineNum,
          type_decl_ref: name, annotations: markers,
        });
        typeDeclarations.push({ name, kind: "class", file_path: filePath, line: lineNum });
        continue;
      }

      // class
      const classMatch = trimmed.match(CLASS_RE);
      if (classMatch && !currentClass) {
        currentClass = classMatch[1];
        currentClassAnnotations = extractJavaAnnotations(lines, i);
        currentFields = [];
        classBraceDepth = 0;
        exports.push({
          name: currentClass, kind: "class", file_path: filePath, line: lineNum,
          type_decl_ref: currentClass,
          annotations: currentClassAnnotations.length > 0 ? currentClassAnnotations : undefined,
        });
        continue;
      }

      // 클래스 내부
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
        if (methodMatch && classBraceDepth === 1 && !trimmed.startsWith("@")) {
          currentFunction = `${currentClass}.${methodMatch[2]}`;
        }

        // 필드
        const fieldMatch = trimmed.match(FIELD_RE);
        if (fieldMatch && classBraceDepth === 1) {
          const fieldAnnotations = extractJavaAnnotations(lines, i);
          const isFk = fieldAnnotations.some((a) =>
            ["@JoinColumn", "@ManyToOne", "@OneToOne", "@ManyToMany", "@OneToMany"].some((fk) => a.includes(fk)),
          );
          currentFields.push({
            name: fieldMatch[2], type_name: fieldMatch[1],
            is_fk: isFk, referenced_entity: isFk ? fieldMatch[1] : undefined,
          });
        }

        // 상태 할당
        const stateMatch = trimmed.match(STATE_ASSIGN_RE);
        if (stateMatch) {
          const entity = stateMatch[1];
          const fieldName = stateMatch[2];
          const to = stateMatch[4];
          const from = findJavaGuardValue(lines, i, fieldName);
          stateAssignments.push({
            id: makeStateAssignmentId(entity, fieldName, from, to),
            entity, field_name: fieldName, from, to,
            file_path: filePath, line: lineNum,
          });
        }
      }

      // call site
      if (currentFunction) {
        detectJavaCallSites(trimmed, currentFunction, currentClass, filePath, lineNum, callSites);
      }
    }

    return {
      file_path: filePath, language: "java",
      exports, imports, call_sites: callSites, type_declarations: typeDeclarations,
      state_assignments: stateAssignments,
    };
  }
}

// ── 헬퍼 함수 ──

function extractJavaAnnotations(lines: string[], currentIndex: number): string[] {
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

function findJavaGuardValue(lines: string[], idx: number, fieldName: string): string | null {
  for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
    const prev = lines[j].trim();
    const guardMatch = prev.match(new RegExp(`\\b${fieldName}\\s*==\\s*(?:\\w+\\.)?([A-Z_]+)`));
    if (guardMatch) return guardMatch[1];
  }
  return null;
}

function detectJavaCallSites(
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
