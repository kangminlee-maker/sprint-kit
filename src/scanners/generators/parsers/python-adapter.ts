/**
 * Python 파서 어댑터 (정규식 기반 경량 파서)
 *
 * Python 소스 코드에서 클래스, 함수, enum, import, 호출, 상태 할당을 추출합니다.
 * Django Model, Pydantic BaseModel, dataclass도 엔티티 후보로 탐지합니다.
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

const IMPORT_FROM_RE = /^from\s+([\w.]+)\s+import\s+(.+)/;
const IMPORT_RE = /^import\s+([\w.]+)/;
const CLASS_RE = /^class\s+(\w+)(?:\(([^)]*)\))?:/;
const DEF_RE = /^(?:async\s+)?def\s+(\w+)\s*\(/;
const DECORATOR_RE = /^@(\w+(?:\.\w+)*)(?:\(([^)]*)\))?/;
const FIELD_TYPED_RE = /^\s+(\w+)\s*:\s*(\w+)/;
const FIELD_ASSIGN_RE = /^\s+(\w+)\s*=\s*models\.(\w+)/;
const CONST_RE = /^([A-Z][A-Z_0-9]{2,})\s*(?::\s*\w+\s*)?=\s*(.+?)(?:$)/;
const STATE_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/;
const CALL_RE = /(\w+(?:\.\w+)*)\s*\(/g;
const ENUM_MEMBER_RE = /^\s+(\w+)\s*=\s*/;

const CALL_SKIP_KEYWORDS = new Set([
  "if", "for", "while", "return", "import", "from", "class", "def",
  "raise", "except", "with", "assert", "print", "super",
]);

/** Python의 엔티티 기반 클래스. 이 클래스를 상속하면 @Entity와 동등하게 취급합니다. */
const ENTITY_BASE_CLASSES = [
  "Model", "models.Model",  // Django
  "BaseModel",              // Pydantic
  "Base",                   // SQLAlchemy declarative
  "db.Model",              // Flask-SQLAlchemy
];

export class PythonAdapter implements ParserAdapter {
  languages: SupportedLanguage[] = ["python"];

  parse(content: string, filePath: string): ParsedModule {
    const lines = content.split("\n");
    const exports: ExportedSymbol[] = [];
    const imports: ImportedSymbol[] = [];
    const callSites: CallSite[] = [];
    const typeDeclarations: TypeDecl[] = [];
    const stateAssignments: StateAssignment[] = [];

    let currentClass: string | null = null;
    let currentClassBases: string[] = [];
    let currentDecorators: string[] = [];
    let currentFields: FieldDecl[] = [];
    let currentFunction: string | null = null;
    let classIndent = 0;
    let currentEnumName: string | null = null;
    let currentEnumValues: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;
      const indent = line.length - line.trimStart().length;

      if (!trimmed || trimmed.startsWith("#")) continue;

      // 클래스/함수가 같은 레벨 이하로 돌아가면 종료
      if (currentClass && indent <= classIndent && trimmed && !trimmed.startsWith("@") && !trimmed.startsWith("#")) {
        finalizeClass(currentClass, currentFields, currentDecorators, currentClassBases,
          typeDeclarations, filePath, lineNum, currentEnumName, currentEnumValues);
        if (currentEnumName) { currentEnumName = null; currentEnumValues = []; }
        currentClass = null;
        currentFields = [];
        currentDecorators = [];
        currentClassBases = [];
        currentFunction = null;
      }

      // decorator
      const decoMatch = trimmed.match(DECORATOR_RE);
      if (decoMatch) {
        currentDecorators.push(`@${decoMatch[1]}`);
        continue;
      }

      // import from
      const importFromMatch = trimmed.match(IMPORT_FROM_RE);
      if (importFromMatch) {
        const source = importFromMatch[1];
        const names = importFromMatch[2].split(",").map((n) => n.trim().split(" as ")[0].trim());
        for (const name of names) {
          if (name && name !== "*") {
            imports.push({ name, source, source_kind: "module", file_path: filePath });
          }
        }
        currentDecorators = [];
        continue;
      }

      // import
      const importMatch = trimmed.match(IMPORT_RE);
      if (importMatch) {
        const fqn = importMatch[1];
        const parts = fqn.split(".");
        const name = parts[parts.length - 1];
        imports.push({ name, source: fqn, source_kind: "module", file_path: filePath });
        currentDecorators = [];
        continue;
      }

      // class
      const classMatch = trimmed.match(CLASS_RE);
      if (classMatch) {
        const name = classMatch[1];
        const bases = classMatch[2] ? classMatch[2].split(",").map((b) => b.trim()) : [];
        currentClass = name;
        currentClassBases = bases;
        classIndent = indent;
        currentFields = [];

        // Enum 클래스 탐지
        const isEnum = bases.some((b) => b === "Enum" || b === "StrEnum" || b === "IntEnum");
        if (isEnum) {
          currentEnumName = name;
          currentEnumValues = [];
          exports.push({
            name, kind: "enum", file_path: filePath, line: lineNum, type_decl_ref: name,
          });
        } else {
          // 엔티티 기반 클래스 확인
          const isEntity = bases.some((b) => ENTITY_BASE_CLASSES.includes(b));
          const annotations: string[] = [...currentDecorators];
          if (isEntity) annotations.push("@Entity");
          if (currentDecorators.some((d) => d === "@dataclass")) annotations.push("data_class");

          exports.push({
            name, kind: "class", file_path: filePath, line: lineNum,
            type_decl_ref: name,
            annotations: annotations.length > 0 ? annotations : undefined,
          });
        }
        currentDecorators = [];
        continue;
      }

      // enum 값 수집 (Enum 클래스 내부)
      if (currentEnumName && indent > classIndent) {
        const memberMatch = trimmed.match(ENUM_MEMBER_RE);
        if (memberMatch && !trimmed.startsWith("def ") && !trimmed.startsWith("@")) {
          currentEnumValues.push(memberMatch[1]);
        }
        continue;
      }

      // 클래스 내부 필드 (타입 힌트)
      if (currentClass && indent > classIndent && !currentEnumName) {
        const fieldTypedMatch = trimmed.match(FIELD_TYPED_RE);
        if (fieldTypedMatch && !trimmed.startsWith("def ") && !trimmed.startsWith("self.")) {
          currentFields.push({
            name: fieldTypedMatch[1], type_name: fieldTypedMatch[2], is_fk: false,
          });
        }
        // Django model field
        const djangoMatch = trimmed.match(FIELD_ASSIGN_RE);
        if (djangoMatch) {
          const isFk = djangoMatch[2] === "ForeignKey" || djangoMatch[2] === "OneToOneField";
          currentFields.push({
            name: djangoMatch[1], type_name: djangoMatch[2],
            is_fk: isFk, referenced_entity: isFk ? extractDjangoFkTarget(trimmed) : undefined,
          });
        }
      }

      // def (function/method)
      const defMatch = trimmed.match(DEF_RE);
      if (defMatch) {
        const funcName = defMatch[1];
        if (currentClass && indent > classIndent) {
          currentFunction = `${currentClass}.${funcName}`;
        } else if (!currentClass) {
          currentFunction = funcName;
          exports.push({
            name: funcName, kind: "function", file_path: filePath, line: lineNum,
            annotations: currentDecorators.length > 0 ? [...currentDecorators] : undefined,
          });
        }
        currentDecorators = [];
        continue;
      }

      // 상태 할당
      const stateMatch = trimmed.match(STATE_ASSIGN_RE);
      if (stateMatch && currentFunction) {
        const entity = stateMatch[1];
        const fieldName = stateMatch[2];
        const to = stateMatch[4];
        const from = findPythonGuardValue(lines, i, fieldName);
        stateAssignments.push({
          id: makeStateAssignmentId(entity, fieldName, from, to),
          entity, field_name: fieldName, from, to,
          file_path: filePath, line: lineNum,
        });
      }

      // call site
      if (currentFunction) {
        detectPythonCallSites(trimmed, currentFunction, currentClass, filePath, lineNum, callSites);
      }

      // 상수 (top-level)
      if (!currentClass && !currentFunction) {
        currentDecorators = [];
      }
    }

    // 파일 끝에서 열린 클래스 마무리
    if (currentClass) {
      finalizeClass(currentClass, currentFields, currentDecorators, currentClassBases,
        typeDeclarations, filePath, lines.length, currentEnumName, currentEnumValues);
    }

    return {
      file_path: filePath, language: "python",
      exports, imports, call_sites: callSites, type_declarations: typeDeclarations,
      state_assignments: stateAssignments,
    };
  }
}

// ── 헬퍼 함수 ──

function finalizeClass(
  name: string, fields: FieldDecl[], decorators: string[], bases: string[],
  typeDeclarations: TypeDecl[], filePath: string, lineNum: number,
  enumName: string | null, enumValues: string[],
): void {
  if (enumName) {
    typeDeclarations.push({
      name: enumName, kind: "enum", file_path: filePath, line: lineNum,
      enum_values: enumValues,
    });
  } else {
    typeDeclarations.push({
      name, kind: "class", file_path: filePath, line: lineNum,
      fields: fields.length > 0 ? fields : undefined,
    });
  }
}

function extractDjangoFkTarget(line: string): string | undefined {
  const match = line.match(/(?:ForeignKey|OneToOneField)\s*\(\s*["']?(\w+)["']?/);
  return match?.[1];
}

function findPythonGuardValue(lines: string[], idx: number, fieldName: string): string | null {
  for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
    const prev = lines[j].trim();
    const guardMatch = prev.match(new RegExp(`\\b${fieldName}\\s*==\\s*(?:\\w+\\.)?([A-Z_]+)`));
    if (guardMatch) return guardMatch[1];
  }
  return null;
}

function detectPythonCallSites(
  trimmed: string, caller: string, currentClass: string | null,
  filePath: string, lineNum: number, callSites: CallSite[],
): void {
  if (trimmed.startsWith("import ") || trimmed.startsWith("from ") || trimmed.startsWith("@")) return;
  CALL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CALL_RE.exec(trimmed)) !== null) {
    const rawCallee = match[1];
    const firstToken = rawCallee.split(".")[0];
    if (CALL_SKIP_KEYWORDS.has(firstToken)) continue;
    let callee = rawCallee;
    if (rawCallee.startsWith("self.") && currentClass) {
      callee = `${currentClass}.${rawCallee.slice(5)}`;
    }
    callSites.push({ caller, callee, file_path: filePath, line: lineNum, kind: "direct" });
  }
}
