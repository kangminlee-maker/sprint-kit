import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { scanLocal } from "./scan-local.js";
import type { ScanResult, SourceEntry, ScanError } from "./types.js";

/**
 * Download a GitHub tarball and scan its contents.
 *
 * Uses Node.js built-in `fetch` to download the tarball, extracts to a temp
 * directory with `tar xzf`, then delegates to scanLocal().
 * Temp directory is always cleaned up.
 *
 * Returns either a ScanResult or a ScanError.
 */
export async function scanTarball(
  source: SourceEntry & { type: "github-tarball" },
): Promise<ScanResult | ScanError> {
  const tmpDir = mkdtempSync(join(tmpdir(), "sprint-kit-tarball-"));

  try {
    // Extract org/repo from URL
    const match = source.url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) {
      return {
        source,
        error_type: "parse",
        message: `Invalid GitHub URL: ${source.url}`,
      };
    }
    const repoPath = match[1].replace(/\.git$/, "");

    // Validate repoPath to prevent injection into URL
    if (!/^[\w.-]+\/[\w.-]+$/.test(repoPath)) {
      return {
        source,
        error_type: "parse",
        message: `Invalid repository path: ${repoPath}`,
      };
    }

    // Build request headers
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "sprint-kit",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Download tarball via fetch
    let response: Response;
    try {
      response = await fetch(
        `https://api.github.com/repos/${repoPath}/tarball/HEAD`,
        {
          headers,
          signal: AbortSignal.timeout(120_000),
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("TimeoutError") || msg.includes("abort") || msg.includes("timeout")) {
        return { source, error_type: "timeout", message: `Timeout downloading ${repoPath}: ${msg}` };
      }
      return { source, error_type: "network", message: `Failed to download ${repoPath}: ${msg}` };
    }

    // Handle HTTP error responses
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (rateLimitRemaining === "0") {
          return { source, error_type: "auth", message: `GitHub API rate limit exceeded for ${repoPath}. GITHUB_TOKEN 환경변수를 설정하세요.` };
        }
        return { source, error_type: "auth", message: `Authentication failed for ${repoPath}: HTTP ${response.status}. Private 레포라면 GITHUB_TOKEN 환경변수를 설정하세요.` };
      }
      if (response.status === 404) {
        return { source, error_type: "not_found", message: `Repository not found: ${repoPath}` };
      }
      return { source, error_type: "network", message: `Failed to download ${repoPath}: HTTP ${response.status}` };
    }

    // Write tarball to temp file and extract
    const arrayBuffer = await response.arrayBuffer();
    const tarballPath = join(tmpDir, "tarball.tar.gz");
    writeFileSync(tarballPath, Buffer.from(arrayBuffer));

    execSync("tar xzf tarball.tar.gz --strip-components=1", {
      cwd: tmpDir,
      timeout: 120_000,
      stdio: "pipe",
    });

    // Scan the extracted directory
    const localSource = { type: "add-dir" as const, path: tmpDir, description: source.description };
    const result = scanLocal(localSource);

    // Return with original source entry
    return { ...result, source };
  } finally {
    // Always clean up
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}

/** Type guard for ScanError */
export function isScanError(result: ScanResult | ScanError): result is ScanError {
  return "error_type" in result;
}
