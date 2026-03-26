/**
 * Go 파서 어댑터 (정규식 기반 경량 파서)
 *
 * Go 소스 코드에서 struct, interface, func, const, import, 호출을 추출합니다.
 * Go는 어노테이션이 없으므로, struct tag와 임베딩 패턴으로 엔티티를 탐지합니다.
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

const IMPORT_SINGLE_RE = /^import\s+"([^"]+)"/;
const IMPORT_BLOCK_START_RE = /^import\s*\(/;
const IMPORT_BLOCK_LINE_RE = /^\s*(?:(\w+)\s+)?"([^"]+)"/;
const STRUCT_RE = /^type\s+(\w+)\s+struct\s*\{/;
const INTERFACE_RE = /^type\s+(\w+)\s+interface\s*\{/;
const TYPE_ALIAS_RE = /^type\s+(\w+)\s+(?!struct|interface)(\w+)/;
const FUNC_RE = /^func\s+(\w+)\s*\(/;
const METHOD_RE = /^func\s+\(\s*\w+\s+\*?(\w+)\s*\)\s+(\w+)\s*\(/;
const CONST_BLOCK_START_RE = /^const\s*\(/;
const CONST_SINGLE_RE = /^const\s+([A-Z][A-Z_0-9]*)\s*(?:\w+\s*)?=\s*(.+)/;
const FIELD_RE = /^\s+(\w+)\s+(\w+(?:\.\w+)?)/;
const EMBEDDED_FIELD_RE = /^\s+(\w+(?:\.\w+)?)\s*$/;
const STATE_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/;
const CALL_RE = /(\w+(?:\.\w+)*)\s*\(/g;
const STRUCT_TAG_RE = /`[^`]*(?:gorm|db|json|bson):"([^"]*)"[^`]*`/;

/** Go에서 엔티티로 간주하는 임베딩/태그 패턴 */
const ENTITY_MARKERS = ["gorm.Model", "bson.ObjectID", "primitive.ObjectID"];

const CALL_SKIP_KEYWORDS = new Set([
  "if", "for", "range", "switch", "return", "go", "defer", "select",
  "case", "func", "type", "var", "const", "package", "import",
]);

export class GoAdapter implements ParserAdapter {
  languages: SupportedLanguage[] = ["go"];

  parse(content: string, filePath: string): ParsedModule {
    const lines = content.split("\n");
    const exports: ExportedSymbol[] = [];
    const imports: ImportedSymbol[] = [];
    const callSites: CallSite[] = [];
    const typeDeclarations: TypeDecl[] = [];
    const stateAssignments: StateAssignment[] = [];

    let currentStruct: string | null = null;
    let currentStructFields: FieldDecl[] = [];
    let currentStructAnnotations: string[] = [];
    let hasEntityMarker = false;
    let currentInterface: string | null = null;
    let currentFunction: string | null = null;
    let inImportBlock = false;
    let inConstBlock = false;
    let constBlockValues: string[] = [];
    let constBlockName: string | null = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (!trimmed || trimmed.startsWith("//")) continue;

      // import block
      if (inImportBlock) {
        if (trimmed === ")") {
          inImportBlock = false;
          continue;
        }
        const importLineMatch = trimmed.match(IMPORT_BLOCK_LINE_RE);
        if (importLineMatch) {
          const alias = importLineMatch[1];
          const path = importLineMatch[2];
          const parts = path.split("/");
          const name = alias || parts[parts.length - 1];
          imports.push({ name, source: path, source_kind: "package", file_path: filePath });
        }
        continue;
      }

      const importBlockMatch = trimmed.match(IMPORT_BLOCK_START_RE);
      if (importBlockMatch) {
        inImportBlock = true;
        continue;
      }

      // single import
      const importSingleMatch = trimmed.match(IMPORT_SINGLE_RE);
      if (importSingleMatch) {
        const path = importSingleMatch[1];
        const parts = path.split("/");
        const name = parts[parts.length - 1];
        imports.push({ name, source: path, source_kind: "package", file_path: filePath });
        continue;
      }

      // const block
      if (inConstBlock) {
        if (trimmed === ")") {
          if (constBlockName && constBlockValues.length > 0) {
            typeDeclarations.push({
              name: constBlockName, kind: "enum", file_path: filePath,
              line: lineNum, enum_values: constBlockValues,
            });
            exports.push({
              name: constBlockName, kind: "enum", file_path: filePath,
              line: lineNum, type_decl_ref: constBlockName,
            });
          }
          inConstBlock = false;
          constBlockValues = [];
          constBlockName = null;
          continue;
        }
        // const 값 수집 (iota 패턴)
        const constValMatch = trimmed.match(/^(\w+)(?:\s+(\w+))?\s*=?\s*/);
        if (constValMatch) {
          if (!constBlockName && constValMatch[2]) {
            constBlockName = constValMatch[2];
          }
          constBlockValues.push(constValMatch[1]);
        }
        continue;
      }

      const constBlockMatch = trimmed.match(CONST_BLOCK_START_RE);
      if (constBlockMatch) {
        inConstBlock = true;
        constBlockValues = [];
        constBlockName = null;
        continue;
      }

      // single const
      const constSingleMatch = trimmed.match(CONST_SINGLE_RE);
      if (constSingleMatch) {
        // 정책 상수로 처리 (structure-extractor가 수집)
        continue;
      }

      // struct
      const structMatch = trimmed.match(STRUCT_RE);
      if (structMatch) {
        currentStruct = structMatch[1];
        currentStructFields = [];
        currentStructAnnotations = ["struct"];
        hasEntityMarker = false;
        braceDepth = 1;
        continue;
      }

      // struct 내부
      if (currentStruct) {
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        braceDepth += openBraces - closeBraces;

        if (braceDepth <= 0) {
          if (hasEntityMarker) {
            currentStructAnnotations.push("@Entity");
          }
          const isExported = currentStruct[0] === currentStruct[0].toUpperCase();
          if (isExported) {
            exports.push({
              name: currentStruct, kind: "class", file_path: filePath,
              line: lineNum, type_decl_ref: currentStruct,
              annotations: currentStructAnnotations,
            });
          }
          typeDeclarations.push({
            name: currentStruct, kind: "class", file_path: filePath,
            line: lineNum, fields: currentStructFields.length > 0 ? currentStructFields : undefined,
          });
          currentStruct = null;
          currentStructFields = [];
          currentStructAnnotations = [];
          continue;
        }

        // 임베딩 필드 (엔티티 마커)
        const embeddedMatch = trimmed.match(EMBEDDED_FIELD_RE);
        if (embeddedMatch && ENTITY_MARKERS.includes(embeddedMatch[1])) {
          hasEntityMarker = true;
          currentStructAnnotations.push(embeddedMatch[1]);
        }

        // struct tag 확인
        const tagMatch = trimmed.match(STRUCT_TAG_RE);
        if (tagMatch) {
          hasEntityMarker = true;
        }

        // 일반 필드
        const fieldMatch = trimmed.match(FIELD_RE);
        if (fieldMatch && !embeddedMatch) {
          currentStructFields.push({
            name: fieldMatch[1], type_name: fieldMatch[2], is_fk: false,
          });
        }
        continue;
      }

      // interface
      const ifaceMatch = trimmed.match(INTERFACE_RE);
      if (ifaceMatch) {
        const name = ifaceMatch[1];
        const isExported = name[0] === name[0].toUpperCase();
        if (isExported) {
          exports.push({
            name, kind: "interface", file_path: filePath, line: lineNum, type_decl_ref: name,
          });
        }
        typeDeclarations.push({ name, kind: "interface", file_path: filePath, line: lineNum });
        continue;
      }

      // type alias
      const typeAliasMatch = trimmed.match(TYPE_ALIAS_RE);
      if (typeAliasMatch) {
        const name = typeAliasMatch[1];
        const isExported = name[0] === name[0].toUpperCase();
        if (isExported) {
          exports.push({
            name, kind: "type_alias", file_path: filePath, line: lineNum, type_decl_ref: name,
          });
        }
        typeDeclarations.push({ name, kind: "type_alias", file_path: filePath, line: lineNum });
        continue;
      }

      // method (receiver function)
      const methodMatch = trimmed.match(METHOD_RE);
      if (methodMatch) {
        currentFunction = `${methodMatch[1]}.${methodMatch[2]}`;
        continue;
      }

      // top-level function
      const funcMatch = trimmed.match(FUNC_RE);
      if (funcMatch) {
        currentFunction = funcMatch[1];
        const isExported = funcMatch[1][0] === funcMatch[1][0].toUpperCase();
        if (isExported) {
          exports.push({
            name: funcMatch[1], kind: "function", file_path: filePath, line: lineNum,
          });
        }
        continue;
      }

      // 상태 할당
      const stateMatch = trimmed.match(STATE_ASSIGN_RE);
      if (stateMatch && currentFunction) {
        const entity = stateMatch[1];
        const fieldName = stateMatch[2];
        const to = stateMatch[4];
        const from = findGoGuardValue(lines, i, fieldName);
        stateAssignments.push({
          id: makeStateAssignmentId(entity, fieldName, from, to),
          entity, field_name: fieldName, from, to,
          file_path: filePath, line: lineNum,
        });
      }

      // call site
      if (currentFunction) {
        detectGoCallSites(trimmed, currentFunction, filePath, lineNum, callSites);
      }
    }

    return {
      file_path: filePath, language: "go",
      exports, imports, call_sites: callSites, type_declarations: typeDeclarations,
      state_assignments: stateAssignments,
    };
  }
}

// ── 헬퍼 함수 ──

function findGoGuardValue(lines: string[], idx: number, fieldName: string): string | null {
  for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
    const prev = lines[j].trim();
    const guardMatch = prev.match(new RegExp(`\\b${fieldName}\\s*==\\s*(?:\\w+\\.)?([A-Z_]\\w*)`));
    if (guardMatch) return guardMatch[1];
  }
  return null;
}

function detectGoCallSites(
  trimmed: string, caller: string,
  filePath: string, lineNum: number, callSites: CallSite[],
): void {
  if (trimmed.startsWith("import ") || trimmed.startsWith("package ") || trimmed.startsWith("type ")) return;
  CALL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CALL_RE.exec(trimmed)) !== null) {
    const rawCallee = match[1];
    const firstToken = rawCallee.split(".")[0];
    if (CALL_SKIP_KEYWORDS.has(firstToken)) continue;
    callSites.push({ caller, callee: rawCallee, file_path: filePath, line: lineNum, kind: "direct" });
  }
}
