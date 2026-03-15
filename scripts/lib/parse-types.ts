/**
 * Shared TypeScript AST parsing module.
 * Extracts exported types, interfaces, const arrays, and PayloadMap from source files.
 *
 * This module reads .ts files via file I/O (not runtime import) and uses
 * the TypeScript Compiler API for AST parsing.
 *
 * Dependency: typescript (already in devDependencies)
 * Module rule: Does NOT import from src/ — reads files as text.
 */

import ts from "typescript";
import { readFileSync } from "node:fs";

// ─── Result types ───

export interface UnionTypeInfo {
  name: string;
  values: string[];
  jsdoc?: string;
  line: number;
}

export interface ConstArrayInfo {
  name: string;
  values: string[];
  line: number;
}

export interface InterfaceField {
  name: string;
  type: string;
  optional: boolean;
}

export interface InterfaceInfo {
  name: string;
  fields: InterfaceField[];
  jsdoc?: string;
  line: number;
  extends?: string;
}

export interface PayloadMapEntry {
  eventType: string;
  payloadInterface: string;
}

export interface ParseResult {
  unionTypes: UnionTypeInfo[];
  constArrays: ConstArrayInfo[];
  interfaces: InterfaceInfo[];
  payloadMap: PayloadMapEntry[];
  functions: string[];
}

// ─── Parsing ───

export function parseTypeFile(filePath: string): ParseResult {
  const sourceText = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const unionTypes: UnionTypeInfo[] = [];
  const constArrays: ConstArrayInfo[] = [];
  const interfaces: InterfaceInfo[] = [];
  const payloadMap: PayloadMapEntry[] = [];
  const functions: string[] = [];

  ts.forEachChild(sourceFile, (node) => {
    // exported type aliases: type X = "a" | "b" | ...
    if (
      ts.isTypeAliasDeclaration(node) &&
      hasExportModifier(node)
    ) {
      const name = node.name.text;
      const values = extractUnionLiterals(node.type);
      if (values.length > 0) {
        unionTypes.push({
          name,
          values,
          jsdoc: getJSDoc(node, sourceFile),
          line: getLine(node, sourceFile),
        });
      }
    }

    // exported const arrays: const X = [...] as const
    if (
      ts.isVariableStatement(node) &&
      hasExportModifier(node)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const name = decl.name.text;
        if (decl.initializer) {
          // as const arrays
          if (ts.isArrayLiteralExpression(decl.initializer)) {
            constArrays.push({
              name,
              values: extractArrayLiterals(decl.initializer),
              line: getLine(node, sourceFile),
            });
          }
          // as const with AsExpression wrapping
          if (
            ts.isAsExpression(decl.initializer) &&
            ts.isArrayLiteralExpression(decl.initializer.expression)
          ) {
            constArrays.push({
              name,
              values: extractArrayLiterals(decl.initializer.expression),
              line: getLine(node, sourceFile),
            });
          }
          // new Set(...)
          if (
            ts.isNewExpression(decl.initializer) &&
            decl.initializer.arguments?.length
          ) {
            const arg = decl.initializer.arguments[0];
            if (ts.isArrayLiteralExpression(arg)) {
              constArrays.push({
                name,
                values: extractArrayLiterals(arg),
                line: getLine(node, sourceFile),
              });
            }
          }
        }
      }
    }

    // exported interfaces
    if (
      ts.isInterfaceDeclaration(node) &&
      hasExportModifier(node)
    ) {
      const name = node.name.text;
      const fields: InterfaceField[] = [];

      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const fieldName = member.name.getText(sourceFile);
          const fieldType = member.type
            ? member.type.getText(sourceFile)
            : "unknown";
          fields.push({
            name: fieldName,
            type: fieldType,
            optional: !!member.questionToken,
          });
        }
      }

      // Special: extract PayloadMap entries
      if (name === "PayloadMap") {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && member.name && member.type) {
            const eventType = member.name.getText(sourceFile).replace(/"/g, "");
            const payloadInterface = member.type.getText(sourceFile);
            payloadMap.push({ eventType, payloadInterface });
          }
        }
      }

      const extendsClause = node.heritageClauses?.find(
        (c) => c.token === ts.SyntaxKind.ExtendsKeyword,
      );

      interfaces.push({
        name,
        fields,
        jsdoc: getJSDoc(node, sourceFile),
        line: getLine(node, sourceFile),
        extends: extendsClause?.types[0]?.getText(sourceFile),
      });
    }

    // exported functions (names only)
    if (
      ts.isFunctionDeclaration(node) &&
      hasExportModifier(node) &&
      node.name
    ) {
      functions.push(node.name.text);
    }
  });

  return { unionTypes, constArrays, interfaces, payloadMap, functions };
}

// ─── Helpers ───

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    )
  );
}

function extractUnionLiterals(typeNode: ts.TypeNode): string[] {
  const values: string[] = [];

  if (ts.isUnionTypeNode(typeNode)) {
    for (const member of typeNode.types) {
      if (ts.isLiteralTypeNode(member)) {
        if (ts.isStringLiteral(member.literal)) {
          values.push(member.literal.text);
        }
      }
    }
  }

  return values;
}

function extractArrayLiterals(arr: ts.ArrayLiteralExpression): string[] {
  return arr.elements
    .filter(ts.isStringLiteral)
    .map((e) => e.text);
}

function getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  const fullText = node.getFullText(sourceFile);
  const match = fullText.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) return undefined;
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function getLine(node: ts.Node, sourceFile: ts.SourceFile): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}
