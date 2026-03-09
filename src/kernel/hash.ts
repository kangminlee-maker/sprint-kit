import { createHash } from "node:crypto";

export function contentHash(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}
