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
/align  → confirm scope (to-be vs as-is + unverified assumptions vs tension) → lock scope
/draft  → iterate mockup → confirm surface → resolve constraints → lock target
          compile → apply → validate → close
```

### What happens at each step

| Step | Input | Output | Who decides |
|------|-------|--------|-------------|
| **Brief** | 변경 목적, 대상 사용자, 기대 결과 | `inputs/brief.md` | PO |
| **Align** | 소스 스캔 결과 + constraint 발견 | Align Packet (to-be vs as-is + tensions) | PO approves |
| **Draft** | Surface mockup + deep constraint discovery | Draft Packet (constraint별 결정 요청) | PO decides |
| **Compile** | 확정된 결정 + brownfield 분석 | Build Spec + delta-set.json + validation-plan.md | System |
| **Apply** | delta-set의 변경 사항 | 실제 코드 수정 | Builder |
| **Validate** | validation-plan의 검증 시나리오 | pass/fail 결과 | Builder |

## Entrypoints

- `/start` — begin a new scope (2-phase: brief template → grounding)
- `/align` — Align (scope confirmation: approve / revise / reject / redirect / review)
- `/draft` — Draft (surface iteration + constraint resolution + compile)

## Compile Defense

Compile 출력의 정합성을 3단계로 검증합니다.

| Layer | 성격 | 규칙 수 | 실패 시 |
|-------|------|---------|---------|
| **L1 Checklist** | 모든 constraint가 Build Spec에 참조되는지 | 1 | compile 차단 |
| **L2 Audit Pass** | inject/defer/override 반영, 추적 체인, edge case | 8 | compile 차단 |
| **L3 Evidence Warnings** | 미검증 가정, 정책 변경, 상태 누락, 공유 리소스, brownfield 교차 | 6 | 경고만 (비차단) |

원칙: "탐지는 코드(compile-defense), 판정은 에이전트(프로토콜)."

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
src/
  kernel/       event store, reducer, state machine, gate guard, types
  config/       .sprint-kit.yaml loading, source merging
  scanners/     source scanning (local, tarball, figma, vault), patterns
  parsers/      brief.md parsing
  commands/     /start, /align, /draft entrypoints
  renderers/    scope.md, Align Packet, Draft Packet
  compilers/    compile, compile-defense (3-layer)
  validators/   validation execution
  logger.ts     scope event logging

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
| `docs/blueprint.md` | System definition — ontology, state machine, module structure, trust model |
| `docs/architecture.md` | System design, flow, storage, state machine |
| `docs/event-state-contract.md` | Event classification, State × Event matrix, Reducer rules |
| `docs/constraint-discovery.md` | 3-Perspective exploration, Constraint lifecycle, evidence status |
| `docs/align-draft-templates.md` | Align/Draft Packet templates, rendering rules |
| `docs/build-spec-compile.md` | Build Spec template, delta-set schema, Compile Defense (L1/L2/L3) |
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

# apply_enabled: true  # uncomment to allow apply stage (code modification)
```

`usage_hint` controls when sources are loaded into agent context:
- `grounding_only` (default) — read once during grounding
- `context` — re-inject at surface generation and compile
- `full` — always available

## Stats

- **Source files**: 45+ | **Test files**: 44 | **Tests**: 947 passing
- **States**: 14 | **Event types**: 40 | **Compile Defense rules**: 15 (L1:1 + L2:8 + L3:6)

## License

ISC
