import type { ApiPattern } from "../types.js";
import { lineNumber } from "./utils.js";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// ─── Spring Boot ───

function detectSpringBoot(content: string, filePath: string): ApiPattern[] {
  const results: ApiPattern[] = [];

  // @GetMapping("/path"), @PostMapping("/path"), etc.
  const mappingRe = /@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*"([^"]+)"\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = mappingRe.exec(content)) !== null) {
    const method = m[1].toUpperCase() as HttpMethod;
    results.push({
      file: filePath,
      method,
      path: m[2],
      line: lineNumber(content, m.index),
    });
  }

  // @RequestMapping(value = "/path", method = RequestMethod.GET)
  const reqMapRe =
    /@RequestMapping\s*\([^)]*value\s*=\s*"([^"]+)"[^)]*method\s*=\s*RequestMethod\.(\w+)/g;
  while ((m = reqMapRe.exec(content)) !== null) {
    const method = m[2].toUpperCase() as HttpMethod;
    if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      results.push({
        file: filePath,
        method,
        path: m[1],
        line: lineNumber(content, m.index),
      });
    }
  }

  // @RequestMapping(method = RequestMethod.GET, value = "/path")
  const reqMapRe2 =
    /@RequestMapping\s*\([^)]*method\s*=\s*RequestMethod\.(\w+)[^)]*value\s*=\s*"([^"]+)"/g;
  while ((m = reqMapRe2.exec(content)) !== null) {
    const method = m[1].toUpperCase() as HttpMethod;
    if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      // Avoid duplicates from the previous pattern
      const path = m[2];
      const line = lineNumber(content, m.index);
      if (!results.some((r) => r.path === path && r.method === method && r.line === line)) {
        results.push({ file: filePath, method, path, line });
      }
    }
  }

  return results;
}

// ─── Next.js App Router ───

function detectNextjsAppRouter(content: string, filePath: string): ApiPattern[] {
  // Only applies to route.ts / route.js files
  const basename = filePath.split("/").pop() ?? "";
  if (!/^route\.(ts|js|tsx|jsx)$/.test(basename)) return [];

  const results: ApiPattern[] = [];
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    // Derive route path from file path: app/api/users/route.ts → /api/users
    const routePath = deriveNextjsPath(filePath);
    results.push({
      file: filePath,
      method: m[1] as HttpMethod,
      path: routePath,
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

function deriveNextjsPath(filePath: string): string {
  // Find "app/" segment and strip /route.ts
  const appIdx = filePath.indexOf("app/");
  if (appIdx === -1) return "/";
  const relative = filePath.slice(appIdx + 4); // after "app/"
  const dir = relative.replace(/\/route\.(ts|js|tsx|jsx)$/, "");
  return "/" + dir;
}

// ─── Hono ───

function detectHono(content: string, filePath: string): ApiPattern[] {
  const results: ApiPattern[] = [];
  const re = /\bapp\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({
      file: filePath,
      method: m[1].toUpperCase() as HttpMethod,
      path: m[2],
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

// ─── Main entry ───

export function detectApiRoutes(content: string, filePath: string): ApiPattern[] {
  try {
    if (!content || content.length === 0) return [];

    const results: ApiPattern[] = [];

    // Apply all detectors; each returns only what it finds
    results.push(...detectSpringBoot(content, filePath));
    results.push(...detectNextjsAppRouter(content, filePath));
    results.push(...detectHono(content, filePath));

    return results;
  } catch {
    return [];
  }
}
