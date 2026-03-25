/**
 * TypeScript/JavaScript 파서 어댑터 (ts-morph 기반)
 *
 * ParsedModule을 출력합니다. 후속 처리는 ParsedModule만 소비하므로,
 * 파서 추가 시 어댑터만 구현하면 됩니다.
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

// ── 어노테이션/데코레이터 패턴 ──

const ENTITY_ANNOTATIONS = [
  "@Entity",
  "@Table",
  "@Document",
  "@Model",
];

const FK_ANNOTATIONS = [
  "@JoinColumn",
  "@ManyToOne",
  "@OneToOne",
  "@ManyToMany",
  "@OneToMany",
];

const EMBEDDED_ANNOTATIONS = [
  "@Embedded",
  "@Embeddable",
];

const INHERITANCE_ANNOTATIONS = [
  "@Inheritance",
  "@MappedSuperclass",
  "@DiscriminatorColumn",
];

// ── 정규식 패턴 ──

const EXPORT_FUNCTION_RE = /^export\s+(?:async\s+)?function\s+(\w+)/;
const EXPORT_CLASS_RE = /^export\s+(?:abstract\s+)?class\s+(\w+)/;
const EXPORT_INTERFACE_RE = /^export\s+interface\s+(\w+)/;
const EXPORT_ENUM_RE = /^export\s+(?:const\s+)?enum\s+(\w+)/;
const EXPORT_TYPE_RE = /^export\s+type\s+(\w+)\s*=/;
const IMPORT_RE = /^import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/;
const AS_CONST_RE = /^export\s+const\s+(\w+)\s*=\s*\[([^\]]*)\]\s*as\s+const/;
const CONST_DECL_RE = /^(?:export\s+)?const\s+([A-Z][A-Z_0-9]+)\s*(?::\s*\w+\s*)?=\s*(.+?)(?:;|$)/;
const STATE_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/;
const DECORATOR_RE = /@(\w+)(?:\(([^)]*)\))?/g;
const FIELD_RE = /^(?:readonly\s+)?(\w+)(?:\??):\s*(\w+)/;
const ENUM_VALUE_RE = /^(\w+)(?:\s*=|,|\s*$)/;
const TABLE_NAME_RE = /@Table\(\s*name\s*=\s*["'](\w+)["']/;

// ── call site 탐지 패턴 ──

const METHOD_DECL_RE = /^(?:async\s+)?(\w+)\s*\(/;
const STANDALONE_FUNC_RE = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
const ARROW_FUNC_RE = /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(?/;
const CALL_RE = /(?:await\s+)?(\w+(?:\.\w+)*)\s*\(/g;
const CALL_SKIP_KEYWORDS = new Set([
  "if", "for", "while", "switch", "return", "new", "import", "require",
  "typeof", "instanceof", "catch", "throw", "super", "class", "function",
  "const", "let", "var", "export", "console",
]);

export class TsMorphAdapter implements ParserAdapter {
  languages: SupportedLanguage[] = ["typescript", "javascript"];

  parse(content: string, filePath: string): ParsedModule {
    const lines = content.split("\n");
    const language = filePath.endsWith(".js") || filePath.endsWith(".jsx")
      ? "javascript" as const
      : "typescript" as const;

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
    let functionBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // 빈 줄/주석 건너뜀
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      // import 추출
      const importMatch = trimmed.match(IMPORT_RE);
      if (importMatch) {
        const names = importMatch[1]
          ? importMatch[1].split(",").map((n) => n.trim().split(" as ")[0].trim())
          : [importMatch[2]];
        const source = importMatch[3];
        for (const name of names) {
          if (name) {
            imports.push({ name, source, file_path: filePath });
          }
        }
        continue;
      }

      // as const 배열 (개선안 J)
      const asConstMatch = trimmed.match(AS_CONST_RE);
      if (asConstMatch) {
        const name = asConstMatch[1];
        const valuesStr = asConstMatch[2];
        const values = valuesStr
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        if (values.length > 0) {
          typeDeclarations.push({
            name,
            kind: "enum",
            file_path: filePath,
            line: lineNum,
            enum_values: values,
          });
        }
        continue;
      }

      // 상수 선언 (정책 상수 후보)
      // — 별도 추출기에서 처리하므로 여기서는 ParsedModule에 포함하지 않음

      // arrow function (const fn = ...)
      const arrowMatch = trimmed.match(ARROW_FUNC_RE);
      if (arrowMatch && !currentClass) {
        currentFunction = arrowMatch[1];
        functionBraceDepth = 0;
      }

      // export function
      const funcMatch = trimmed.match(EXPORT_FUNCTION_RE);
      if (funcMatch) {
        currentFunction = funcMatch[1];
        functionBraceDepth = 0;
        exports.push({
          name: funcMatch[1],
          kind: "function",
          file_path: filePath,
          line: lineNum,
        });
        continue;
      }

      // export class
      const classMatch = trimmed.match(EXPORT_CLASS_RE);
      if (classMatch) {
        currentClass = classMatch[1];
        currentClassAnnotations = extractDecorators(lines, i);
        currentFields = [];
        braceDepth = 0;
        exports.push({
          name: currentClass,
          kind: "class",
          file_path: filePath,
          line: lineNum,
          type_decl_ref: currentClass,
          annotations: currentClassAnnotations.length > 0 ? currentClassAnnotations : undefined,
        });
        continue;
      }

      // export interface
      const ifaceMatch = trimmed.match(EXPORT_INTERFACE_RE);
      if (ifaceMatch) {
        const name = ifaceMatch[1];
        const fields = collectFields(lines, i);
        exports.push({
          name,
          kind: "interface",
          file_path: filePath,
          line: lineNum,
          type_decl_ref: name,
        });
        typeDeclarations.push({
          name,
          kind: "interface",
          file_path: filePath,
          line: lineNum,
          fields,
        });
        continue;
      }

      // export enum
      const enumMatch = trimmed.match(EXPORT_ENUM_RE);
      if (enumMatch) {
        currentEnumName = enumMatch[1];
        currentEnumValues = [];
        exports.push({
          name: currentEnumName,
          kind: "enum",
          file_path: filePath,
          line: lineNum,
          type_decl_ref: currentEnumName,
        });
        continue;
      }

      // export type
      const typeMatch = trimmed.match(EXPORT_TYPE_RE);
      if (typeMatch) {
        exports.push({
          name: typeMatch[1],
          kind: "type_alias",
          file_path: filePath,
          line: lineNum,
          type_decl_ref: typeMatch[1],
        });
        typeDeclarations.push({
          name: typeMatch[1],
          kind: "type_alias",
          file_path: filePath,
          line: lineNum,
        });
        continue;
      }

      // enum 값 수집
      if (currentEnumName) {
        if (trimmed === "}") {
          typeDeclarations.push({
            name: currentEnumName,
            kind: "enum",
            file_path: filePath,
            line: lineNum,
            enum_values: currentEnumValues,
          });
          currentEnumName = null;
          currentEnumValues = [];
        } else {
          const valMatch = trimmed.match(ENUM_VALUE_RE);
          if (valMatch) {
            currentEnumValues.push(valMatch[1]);
          }
        }
        continue;
      }

      // 클래스 내부 필드 수집
      if (currentClass) {
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        braceDepth += openBraces - closeBraces;

        if (braceDepth <= 0 && trimmed.includes("}")) {
          // 클래스 종료
          typeDeclarations.push({
            name: currentClass,
            kind: "class",
            file_path: filePath,
            line: lineNum,
            fields: currentFields.length > 0 ? currentFields : undefined,
          });
          currentClass = null;
          currentClassAnnotations = [];
          currentFields = [];
          currentFunction = null;
          continue;
        }

        // 메서드 선언 탐지 (클래스 내부)
        const methodMatch = trimmed.match(METHOD_DECL_RE);
        if (methodMatch && braceDepth === 1 && !trimmed.startsWith("@")) {
          currentFunction = `${currentClass}.${methodMatch[1]}`;
        }

        // 필드 추출
        const fieldMatch = trimmed.match(FIELD_RE);
        if (fieldMatch) {
          const fieldAnnotations = extractDecorators(lines, i);
          const isFk = fieldAnnotations.some((a) =>
            FK_ANNOTATIONS.some((fk) => a.startsWith(fk)),
          );
          const referencedEntity = isFk ? fieldMatch[2] : undefined;
          currentFields.push({
            name: fieldMatch[1],
            type_name: fieldMatch[2],
            is_fk: isFk,
            referenced_entity: referencedEntity,
          });
        }

        // 상태 할당 탐지
        const stateMatch = trimmed.match(STATE_ASSIGN_RE);
        if (stateMatch) {
          const entity = stateMatch[1];
          const fieldName = stateMatch[2];
          const to = stateMatch[4];
          const from = findGuardValue(lines, i, fieldName);
          stateAssignments.push({
            id: makeStateAssignmentId(entity, fieldName, from, to),
            entity,
            field_name: fieldName,
            from,
            to,
            file_path: filePath,
            line: lineNum,
            guard_expression: findGuardExpression(lines, i),
          });
        }
      }

      // 비클래스 함수의 brace depth 추적
      if (!currentClass && currentFunction) {
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        functionBraceDepth += openBraces - closeBraces;
        if (functionBraceDepth <= 0 && closeBraces > 0) {
          currentFunction = null;
        }
      }

      // call site 탐지
      if (currentFunction) {
        detectCallSites(trimmed, currentFunction, currentClass, filePath, lineNum, callSites);
      }
    }

    return {
      file_path: filePath,
      language,
      exports,
      imports,
      call_sites: callSites,
      type_declarations: typeDeclarations,
      state_assignments: stateAssignments,
    };
  }
}

// ── 헬퍼 함수 ──

function extractDecorators(lines: string[], currentIndex: number): string[] {
  const decorators: string[] = [];
  for (let j = currentIndex - 1; j >= 0; j--) {
    const prev = lines[j].trim();
    if (prev.startsWith("@")) {
      decorators.push(prev);
    } else if (prev && !prev.startsWith("//") && !prev.startsWith("*")) {
      break;
    }
  }
  return decorators;
}

function collectFields(lines: string[], startIndex: number): FieldDecl[] {
  const fields: FieldDecl[] = [];
  let depth = 0;
  for (let j = startIndex; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line.includes("{")) depth++;
    if (line.includes("}")) depth--;
    if (depth <= 0 && j > startIndex) break;

    const fieldMatch = line.trim().match(FIELD_RE);
    if (fieldMatch && depth === 1) {
      fields.push({
        name: fieldMatch[1],
        type_name: fieldMatch[2],
        is_fk: false,
      });
    }
  }
  return fields;
}

function findGuardValue(
  lines: string[],
  assignmentIndex: number,
  fieldName: string,
): string | null {
  for (let j = assignmentIndex - 1; j >= Math.max(0, assignmentIndex - 5); j--) {
    const prev = lines[j].trim();
    const guardMatch = prev.match(
      new RegExp(`\\b${fieldName}\\s*===?\\s*(?:\\w+\\.)?([A-Z_]+)`),
    );
    if (guardMatch) return guardMatch[1];
  }
  return null;
}

function findGuardExpression(
  lines: string[],
  assignmentIndex: number,
): string | undefined {
  for (let j = assignmentIndex - 1; j >= Math.max(0, assignmentIndex - 5); j--) {
    const prev = lines[j].trim();
    if (prev.startsWith("if")) {
      const match = prev.match(/if\s*\((.+)\)/);
      return match?.[1];
    }
  }
  return undefined;
}

function detectCallSites(
  trimmed: string,
  caller: string,
  currentClass: string | null,
  filePath: string,
  lineNum: number,
  callSites: CallSite[],
): void {
  // Skip lines that are imports, decorators, or type annotations
  if (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("type ") ||
    trimmed.startsWith("interface ")
  ) {
    return;
  }

  CALL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CALL_RE.exec(trimmed)) !== null) {
    const rawCallee = match[1];
    const firstToken = rawCallee.split(".")[0];

    // Skip language keywords
    if (CALL_SKIP_KEYWORDS.has(firstToken)) continue;

    // Resolve this.method → ClassName.method
    let callee = rawCallee;
    if (rawCallee.startsWith("this.") && currentClass) {
      callee = `${currentClass}.${rawCallee.slice(5)}`;
    }

    // Determine kind: computed property access (bracket notation) → unresolved
    const kind: "direct" | "unresolved" = rawCallee.includes("[")
      ? "unresolved"
      : "direct";

    callSites.push({
      caller,
      callee,
      file_path: filePath,
      line: lineNum,
      kind,
    });
  }
}
