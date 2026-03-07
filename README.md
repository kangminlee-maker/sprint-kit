# Sprint Kit

Sprint Kit is a constraint-aware translation runtime.

The system surfaces constraints from 3 perspectives (Experience, Code, Policy)
to improve human judgment, then translates the improved judgment into an executable delta.

The user is a domain expert — not a developer.
The user decides direction, defines the target through a working model, and resolves constraints.
The system does everything else.

## Communication Principles

1. **있는 그대로 쓴다** — 비유로 바꾸지 않는다. 기술 용어는 그대로 쓰되 쉬운 말로 뜻을 붙인다.
2. **판단 재료를 빠뜨리지 않는다** — 선택지, 각 선택의 결과, 영향 범위, 되돌림 비용을 함께 보여준다.
3. **짧게 쓴다. 필요하면 펼친다** — 핵심만 먼저. 세부는 요청 시.

이 원칙은 시스템이 생산하는 모든 산출물과 문서에 적용됩니다.

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

## Current Documents

- `docs/architecture.md` — system definition, flow, storage, state machine
- `docs/golden-example.md` — complete Align/Draft Packet example (Tutor Block case)

## Reference Context

This repository is a clean-room redesign of `podo-sprint-kit`.
The previous system's philosophy and design docs are referenced for implementation,
not adopted as constraints.
