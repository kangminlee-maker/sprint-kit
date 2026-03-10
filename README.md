# Sprint Kit

[![npm version](https://img.shields.io/npm/v/sprint-kit.svg)](https://www.npmjs.com/package/sprint-kit)

Sprint Kit is a constraint-aware translation runtime.

The system surfaces constraints from 3 perspectives (Experience, Code, Policy)
to improve human judgment, then translates the improved judgment into an executable delta.

The user is a domain expert — not a developer.
The user decides direction, defines the target through a working model, and resolves constraints.
The system does everything else.

## Install

```bash
npm install sprint-kit
```

## Usage

```typescript
import {
  executeStart,
  executeAlign,
  executeDraft,
  resolveScopePaths,
  loadProjectConfig,
} from "sprint-kit";
```

## Core Flow

```text
Brief → Align → Draft → Compile → Apply → Validate → Close
          ↑          ↑
        Gate 1     Gate 2

/start  → describe intent + scan sources → Align Packet
/align  → confirm scope (to-be vs as-is vs tension) → lock scope
/draft  → iterate mockup → confirm surface → resolve constraints → lock target
          compile → apply → validate → close
```

## Entrypoints

- `/start` — begin a new scope
- `/align` — Align (scope confirmation)
- `/draft` — Draft (surface iteration + constraint resolution + compile)

## AI Tool Support

Sprint Kit is designed to work with AI coding agents. Currently optimized for:

| Tool | Status | Adapter |
|------|--------|---------|
| **Claude Code** | Production | Built-in (hooks, skills, MCP) |
| **Codex (OpenAI)** | Planned | AGENTS.md + protocol docs |
| **Cursor** | Planned | .cursorrules + protocol docs |

Core workflow and kernel are tool-independent. Only agent protocol documents and hook configurations differ per tool.

## Repository Layout

```text
src/           kernel, commands, compilers, renderers, validators, scanners
docs/          architecture, blueprint, agent-protocol, design contracts
scripts/       tool-independent helper scripts (visual-qa, etc.)
scopes/        scope workspaces (ephemeral, per-project)
sources/       local reference materials (design ontology, terms of service)
.claude/       Claude Code settings and hooks
.sprint-kit.yaml   project configuration (sources, target_stack)
```

## Key Documents

| Document | Content |
|----------|---------|
| `docs/blueprint.md` | System definition — ontology, state machine, module structure |
| `docs/architecture.md` | System design, flow, storage, state machine |
| `docs/event-state-contract.md` | Event classification, State × Event matrix, Reducer rules |
| `docs/constraint-discovery.md` | 3-Perspective exploration, Constraint lifecycle |
| `docs/align-draft-templates.md` | Align/Draft Packet templates, rendering rules |
| `docs/build-spec-compile.md` | Build Spec template, delta-set schema, Compile Defense |
| `docs/agent-protocol/` | Agent execution protocols (start, align, draft) |
| `docs/golden-example.md` | Complete example — tutor block feature |

## Configuration

### `.sprint-kit.yaml`

```yaml
target_stack:
  framework: "Next.js 15"
  styling: "Tailwind CSS v3 + CVA"
  # ... project-specific tech stack

default_sources:
  - type: github-tarball
    url: https://github.com/org/app
    usage_hint: context    # re-inject at surface generation
  - type: add-dir
    path: ./sources
    usage_hint: context
```

`usage_hint` controls when sources are loaded into agent context:
- `grounding_only` (default) — read once during grounding
- `context` — re-inject at surface generation and compile
- `full` — always available

## License

ISC
