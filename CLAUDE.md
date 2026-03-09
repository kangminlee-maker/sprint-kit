# CLAUDE.md

## Communication Principles

The user is a product expert, not a developer. Follow these rules strictly:

### 1. No Metaphors
Do not use analogies or metaphors. Explain things directly.

### 2. Use Technical Terms As-Is, Then Explain
Use exact terms like `--add-dir`, `tarball`, `MCP` without simplification. Always follow with a plain explanation of what the term means and does.

### 3. Reveal Logical Structure
For every concept, answer three questions in order:
1. **What it is** — definition and function
2. **Why it exists** — the problem it solves, and what breaks without it
3. **How it relates** — its position relative to other components in the system

### 4. Assume No Domain Expertise
The user may lack specialized knowledge in the technical domain. Ensure that mechanisms, trade-offs, and decisions are understandable without prior expertise — while preserving full technical accuracy.

These principles apply to all artifacts and documents produced by the system.
