# Sprint Kit

Sprint Kit is a constraint-aware translation runtime.

The system surfaces constraints from 3 perspectives (Experience, Code, Policy)
to improve human judgment, then translates the improved judgment into an executable delta.

The user is a domain expert — not a developer.
The user decides direction, defines the target through a working model, and resolves constraints.
The system does everything else.

## Core Flow

```text
Brief → Align → Draft → Compile
          ↑          ↑
        Gate 1     Gate 2

/start  → describe intent + scan sources → Align Packet
/align  → confirm scope (to-be vs as-is vs tension) → lock scope
/draft  → iterate mockup → confirm surface → resolve constraints → lock target
          compile → apply → validate
```

## Entrypoints

- `/start` — begin a new scope
- `/align` — Align (scope confirmation)
- `/draft` — Draft (surface iteration + constraint resolution)

## Repository Layout

```text
docs/    architecture and design contracts
scopes/  scope bundle layout and examples
src/     future implementation modules
```

## Documents

| 문서 | 내용 |
|------|------|
| `docs/architecture.md` | 시스템 정의, 흐름, 저장소, 상태 머신 |
| `docs/event-state-contract.md` | 이벤트 분류, State × Event 매트릭스, Reducer 규칙 |
| `docs/constraint-discovery.md` | 3-Perspective 탐색, Constraint Lifecycle, Invalidation |
| `docs/align-draft-templates.md` | Align/Draft Packet 템플릿, 렌더링 규칙 |
| `docs/build-spec-compile.md` | Build Spec 템플릿, delta-set 스키마, Compile Defense |
| `docs/golden-example.md` | 완성된 예시 — 튜터 차단 기능 (Align + Draft Packet) |
| `scopes/example-tutor-block/` | end-to-end 검증용 샘플 scope (이벤트, 상태, 산출물) |

## Reference Context

This repository is a clean-room redesign of `podo-sprint-kit`.
The previous system's philosophy and design docs are referenced for implementation,
not adopted as constraints.
