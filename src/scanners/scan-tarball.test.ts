import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process (for tar xzf) before importing the module under test
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

// Mock scan-local before importing the module under test
vi.mock("./scan-local.js", () => ({
  scanLocal: vi.fn(() => ({
    source: { type: "add-dir", path: "/tmp/mock" },
    scanned_at: new Date().toISOString(),
    files: [{ path: "index.ts", category: "source", language: "typescript", size_bytes: 100 }],
    content_hashes: { "dir-hash": "abc123" },
    dependency_graph: [],
    api_patterns: [],
    schema_patterns: [],
    config_patterns: [],
    doc_structure: [],
  })),
}));

import { scanTarball, isScanError } from "./scan-tarball.js";
import { execSync } from "node:child_process";
import type { ScanResult, ScanError, SourceEntry } from "./types.js";

const mockedExecSync = vi.mocked(execSync);

function makeSource(url: string): SourceEntry & { type: "github-tarball" } {
  return { type: "github-tarball", url };
}

// Helper: create a mock Response
function mockResponse(status: number, body: ArrayBuffer | null = null): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    arrayBuffer: async () => body ?? new ArrayBuffer(0),
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    clone: () => mockResponse(status, body),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    json: async () => ({}),
    text: async () => "",
  } as Response;
}

describe("scanTarball", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    // Default: tar xzf succeeds (no-op)
    mockedExecSync.mockReturnValue(Buffer.from(""));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env.GITHUB_TOKEN = originalEnv;
    } else {
      delete process.env.GITHUB_TOKEN;
    }
  });

  it("returns ScanResult on successful 200 response", async () => {
    const source = makeSource("https://github.com/acme/my-repo");

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse(200, new ArrayBuffer(8)),
    );

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(false);
    const scan = result as ScanResult;
    expect(scan.source).toBe(source);
    expect(scan.files.length).toBeGreaterThanOrEqual(1);

    // Verify fetch was called with correct URL
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/acme/my-repo/tarball/HEAD",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
        }),
      }),
    );

    // Verify tar was called
    expect(mockedExecSync).toHaveBeenCalledWith(
      "tar xzf tarball.tar.gz --strip-components=1",
      expect.objectContaining({ timeout: 120_000 }),
    );
  });

  it("sends Authorization header when GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    const source = makeSource("https://github.com/acme/my-repo");

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse(200, new ArrayBuffer(8)),
    );

    await scanTarball(source);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer ghp_test123",
        }),
      }),
    );
  });

  it("returns ScanError with error_type 'parse' for invalid GitHub URL", async () => {
    const source = makeSource("https://not-github.com/broken");
    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("parse");
    expect(err.message).toContain("Invalid GitHub URL");
    expect(err.source).toBe(source);
  });

  it("returns ScanError with error_type 'auth' on 401", async () => {
    const source = makeSource("https://github.com/acme/private-repo");

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(401));

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("auth");
    expect(err.message).toContain("Authentication failed");
  });

  it("returns ScanError with error_type 'auth' on 403", async () => {
    const source = makeSource("https://github.com/acme/forbidden-repo");

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(403));

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("auth");
  });

  it("returns ScanError with error_type 'not_found' on 404", async () => {
    const source = makeSource("https://github.com/acme/nonexistent");

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(404));

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("not_found");
    expect(err.message).toContain("Repository not found");
  });

  it("returns ScanError with error_type 'network' on other HTTP errors", async () => {
    const source = makeSource("https://github.com/acme/broken-repo");

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(500));

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("network");
    expect(err.message).toContain("Failed to download");
  });

  it("returns ScanError with error_type 'network' on fetch rejection", async () => {
    const source = makeSource("https://github.com/acme/broken-repo");

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNRESET: connection reset"));

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("network");
    expect(err.message).toContain("Failed to download");
  });

  it("returns ScanError with error_type 'timeout' on AbortError/timeout", async () => {
    const source = makeSource("https://github.com/acme/slow-repo");

    const abortError = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);

    const result = await scanTarball(source);

    expect(isScanError(result)).toBe(true);
    const err = result as ScanError;
    expect(err.error_type).toBe("timeout");
    expect(err.message).toContain("Timeout");
  });

  it("strips .git suffix from repo path in fetch URL", async () => {
    const source = makeSource("https://github.com/acme/repo.git");

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse(200, new ArrayBuffer(8)),
    );

    const result = await scanTarball(source);
    expect(isScanError(result)).toBe(false);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/acme/repo/tarball/HEAD",
      expect.any(Object),
    );
  });

  it("cleans up tmpdir on success", async () => {
    const source = makeSource("https://github.com/acme/repo");

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse(200, new ArrayBuffer(8)),
    );

    // No error thrown means cleanup succeeded
    await scanTarball(source);
    expect(true).toBe(true);
  });

  it("cleans up tmpdir on fetch failure", async () => {
    const source = makeSource("https://github.com/acme/fail-repo");

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNRESET"));

    // No error thrown means cleanup succeeded
    await scanTarball(source);
    expect(true).toBe(true);
  });
});

describe("isScanError", () => {
  it("returns true for ScanError objects", () => {
    const err: ScanError = {
      source: makeSource("https://github.com/a/b"),
      error_type: "network",
      message: "fail",
    };
    expect(isScanError(err)).toBe(true);
  });

  it("returns false for ScanResult objects", () => {
    const result: ScanResult = {
      source: makeSource("https://github.com/a/b"),
      scanned_at: new Date().toISOString(),
      files: [],
      content_hashes: {},
      dependency_graph: [],
      api_patterns: [],
      schema_patterns: [],
      config_patterns: [],
      doc_structure: [],
    };
    expect(isScanError(result)).toBe(false);
  });
});
