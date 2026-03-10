# Changelog

## 0.1.0 (2026-03-10)

Initial npm release.

### Features

- **Full sprint lifecycle**: /start → /align → /draft → compile → apply → validate → close
- **Event sourcing kernel**: immutable event stream, reducer, gate-guard, state machine (14 states, 29 transitions)
- **3-Perspective constraint discovery**: Experience, Code, Policy — grounding + deep discovery
- **Compile Defense**: 2-layer validation (structural + semantic) with edge case enforcement
- **Renderers**: Align Packet, Draft Packet, scope.md (pure functions)
- **Source scanning**: local directories, GitHub tarball, Figma MCP, Obsidian vault
- **Stale detection**: content hash comparison with snapshot.marked_stale recovery
- **Brief parser**: structured extraction from markdown brief template
- **Convergence safety**: 3/5/7 revision limits with warning → diagnosis → blocked escalation

### AI Tool Support

- **Claude Code**: hooks (SessionStart, PostToolUse), permissions (events.ndjson protection), skills (/start, /align, /draft)
- **Usage hint**: `grounding_only` / `context` / `full` source tagging for stage-specific context injection
- **Target stack**: `.sprint-kit.yaml` records project tech stack for surface generation guidance
- **Visual QA**: `scripts/visual-qa.ts` build verification (exit 0=pass/skip, 1=fail)

### Agent Protocol

- **Source injection**: `usage_hint: context` sources re-injected at surface generation (ontology full text required)
- **Approve confirmation**: mandatory confirmation before align.locked to prevent verdict misclassification
- **Number selection**: Align Packet presents choices as numbered list (1~4) for reliable parsing
- **PO-friendly resume**: all states display Korean guidance with undecided constraint count

### Public API

- `src/index.ts` exports: executeStart, executeAlign, executeDraft, executeApply, executeClose, compile, validate, renderers, scope management, config loading
- npm package: `dist/` (compiled JS + types), `docs/`, `sources/`

### Bug Fixes

- `compile.started` snapshot_revision hardcoded to 1 → now uses `state.snapshot_revision`
- `handleLockTarget` filter mismatch with gate-guard → unified to `c.status === "decided"`
- `scan-tarball.ts` 403 rate limit vs auth distinction + GITHUB_TOKEN guidance message
- `z.record()` Zod v4 signature fix (2 args required)
- `ontology-index.ts` unknown type casting for strict mode

### Internal

- 45 source files, 44 test files, 878 tests passing
- TypeScript strict mode build (`tsc`) verified
- `ScopeState.snapshot_revision` field added (reducer preserves grounding.completed revision)
- `ScopeState.surface_path` field added (reducer preserves surface.confirmed path)
- `DiscoveryStage` extended with `draft_surface_gen`
- `SurfaceGeneratedPayload.ontology_sections_used` for audit trail
- figma-adapter.ts stale delegation documented
- stale-check.ts figma-mcp skip reason documented
