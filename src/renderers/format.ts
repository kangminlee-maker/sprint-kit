/**
 * Shared formatting utilities for renderers.
 */

/** Format perspective value for display. */
export function formatPerspective(p: string): string {
  switch (p) {
    case "experience": return "Experience";
    case "code": return "Code";
    case "policy": return "Policy";
    default: return p;
  }
}
