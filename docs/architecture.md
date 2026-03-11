# Architecture

## Product Definition

Sprint Kit is a `constraint-aware translation runtime`.

The system actively surfaces constraints from multiple perspectives to improve human judgment,
then translates the improved judgment into an executable delta.

It is not a document factory.
It is not an approval rubber-stamp.
It is not a universal multi-agent orchestrator.

The system exists to:

1. ground a scope in current system reality by scanning sources from 3 perspectives
2. discover constraints that the human would not see from their own perspective alone
3. present those constraints so the human makes a better-informed decision
4. translate the decided target into an executable delta

Human judgment is not always correct.
The system's job is to make it more correct by revealing what is invisible.

## Roles

| Role | Who | Responsibility |
|------|-----|----------------|
| **Product Owner** | Domain expert (non-developer) | Provides intent, confirms scope at Align, defines to-be at Draft, makes constraint decisions |
| **Builder** | Developer or AI agent | Implements from Build Spec. Escalates uncovered edge cases |
| **System** | Sprint Kit runtime | Scans sources, discovers constraints, generates surfaces, compiles, validates |

In v1, one person may hold multiple roles.

## 3 Perspectives

Every system can be observed from three perspectives.
Each reveals different information. Each hides different things.

| Perspective | What it reveals | What it hides |
|-------------|-----------------|---------------|
| **Experience** | What users see and do. Screens, flows, interactions, API contracts (for service consumers) | Internal implementation, policy rationale |
| **Code** | What machines execute. API endpoints, DB schemas, state machines, module dependencies | User experience, business rule rationale |
| **Policy** | What rules constrain. Business rules, regulations, terms of service, design norms | Implementation details, user experience |

These are not theoretical constructs.
They are practical search directions: "where to look for constraints the human hasn't seen yet."

## Source Access

The system scans external sources to build its understanding of current reality.
Four access methods are supported:

| Method | What it accesses |
|--------|-----------------|
| `--add-dir` | Any local directory |
| GitHub tarball | Any remote GitHub repository (`gh api tarball/HEAD`) |
| Figma MCP | Live design data — screens, components, tokens, service flows |
| Obsidian vault | Knowledge base — domain knowledge, policies, meeting notes, terminology |

Access method does NOT determine perspective.
The same source can contain information relevant to multiple perspectives.
The user declares WHERE data is. The system scans content and classifies findings by perspective.

## Entrypoints

Three commands:

- `/start` — begin a new scope
- `/align` — Align (Gate 1)
- `/draft` — Draft (work zone + Gate 2)

## Core Flow

```text
Brief → Align → Draft → Compile
          ↑          ↑
        Gate 1     Gate 2
```

### /start (Brief)

```text
/start {description or inputs}
  -> frame intent
  -> scan sources from 3 perspectives
  -> build Reality Snapshot
  -> render Align Packet (scan results embedded)
```

### /align (Gate 1 — Align)

Align confronts the user's intent with reality and locks the scope.

```text
/align
  -> human reviews: To-be (intent) → As-is (reality) → Tension (collision points)
  -> verdict: approve / revise / reject / redirect
  -> [on approve] lock intent, direction, scope boundaries
```

**Align Packet structure:**

1. **To-be** — what the user asked for. System's interpretation of the intent. Proposed direction. Scope in/out (each requires user agreement).
2. **As-is** — current reality from 3 perspectives. Experience: what users see today. Policy: current rules. System: what the system can and can't do (technical facts translated to business impact, detail collapsed).
3. **Tension** — where intent and reality collide. Direction-level constraints with business impact. Scale indicator (how large is this change).

For `interface` scopes, Align also locks policy decisions:
public/internal scope, breaking change tolerance, versioning policy.

### /draft (Work Zone + Gate 2 — Draft)

Draft has two phases: surface iteration (work zone) and final confirmation (Gate 2).

**Phase 1: Surface Iteration (work zone)**

```text
experience scope:
  -> system generates initial stateful mockup (React + MSW)
  -> user interacts with mockup
  -> user gives feedback → system updates mockup
  -> lightweight constraint hints surfaced during iteration
  -> repeat until user confirms: "this is what I want"

interface scope:
  -> policy decisions already locked at Align
  -> system prepares technical implementation context
  -> full brownfield scan results provided
  -> guardrails (constraints developers must follow) defined
```

The mockup is not a preview for approval.
It is the user's tool for defining to-be in Experience language.

**Phase 2: Final Confirmation (Gate 2)**

```text
  -> deep constraint discovery from all 3 perspectives against confirmed surface
  -> render Draft Packet (confirmed surface + all constraints)
  -> human reviews all constraints
  -> decide on each: inject / defer / override / clarify / modify-direction
  -> verdict: approve / revise / reject / redirect-to-align
  -> [on approve] lock surface + all constraint decisions
```

Constraints should NOT appear for the first time at Gate 2.
Lightweight hints during Phase 1 ensure that Gate 2 is a final check, not a surprise.
If a major undiscovered constraint appears at Gate 2, it is a process failure.

### Compile

```text
  -> translate confirmed to-be into code delta (no new product decisions)
  -> produce Build Spec + delta-set.json + validation-plan.md
  -> apply
  -> validate
```

## Constraint Discovery

Constraint discovery is the core mechanism, not a side feature.
Details are defined in `docs/constraint-discovery.md`.

### Discovery Lifecycle

```text
Discover → Present → Decide → Inject → Verify
```

Each constraint receives a unique ID (`CST-001`, `CST-002`, ...) at discovery time.
This ID flows through all artifacts: Align Packet → Draft Packet → Build Spec → delta-set.json → validation-plan.md.

| Phase | Who | What happens |
|-------|-----|--------------|
| **Discover** | System | Scans sources from 3 perspectives. Finds constraints the human hasn't seen. Assigns constraint_id |
| **Present** | System | Shows each constraint with: which perspective found it, business impact, options for handling |
| **Decide** | Human | For each constraint: inject / defer / override / clarify / modify-direction |
| **Inject** | System | Incorporates decided constraints into Build Spec |
| **Verify** | System | Validates that injected constraints are correctly reflected in implementation |

### Constraint Decisions

| Decision | Meaning | Effect |
|----------|---------|--------|
| **inject** | Apply this constraint to the build | Reflected in Build Spec. Verified in validation |
| **defer** | Not handling in current scope (judgment complete — choosing not to act) | Explicitly excluded. Recorded for future reference |
| **override** | Ignore this constraint (with risk acknowledgment) | Risk recorded. Proceeds without applying |
| **clarify** | Cannot decide yet — need more information | Blocks compile until resolved. System prompts for resolution if stalled |
| **modify-direction** | This constraint changes the direction itself | Decision recorded, then redirect to Align |

`defer` = "I understand but won't address it now" (judgment complete).
`clarify` = "I don't have enough information to judge" (judgment pending).

Note: `constraint.invalidated`는 사용자 결정이 아닌 시스템 이벤트입니다.
re-discovery에서 방향 변경으로 더 이상 관련 없는 constraint를 시스템이 자동으로 제외합니다.
상세는 `docs/constraint-discovery.md`의 Invalidation 섹션 참조.

### Discovery Timing

| Stage | Discovery scope | Depth |
|-------|----------------|-------|
| Grounding (before Align) | All 3 perspectives | Direction-level. Broad scan for major conflicts |
| Draft Phase 1 (mockup iteration) | Relevant perspectives | Lightweight hints. Surface immediately when discovered |
| Draft Phase 2 (after surface confirmed) | All 3 perspectives | Target-level. Deep scan against confirmed surface |

## Surface Types

| Scope type | Surface | Format | Judgment method |
|------------|---------|--------|-----------------|
| `experience` | Stateful Mockup | React + MSW app in `surface/preview/`. Run with `npm run dev` | Human clicks through scenarios, defines to-be by interacting |
| `interface` | Contract Diff | API contract before/after comparison | Policy decisions at Align. Technical implementation delegated with guardrails |

For `experience` scopes, the stateful mockup is mandatory.
The human must interact with the mockup to define what they want.
The confirmed mockup IS the Experience to-be — the input to compile.

For `interface` scopes, the system provides:
- All brownfield scan results (nothing withheld)
- Guardrails (constraints developers must follow)
- Policy decisions already locked at Align
Technical implementation decisions are delegated to Builder.

## Feedback Model

### At Align (Gate 1)

| Action | Meaning | System response |
|--------|---------|-----------------|
| **Approve** | Scope + direction confirmed | Lock intent, direction, scope boundaries |
| **Revise** + feedback | Scope needs adjustment | Classify → targeted fix or regeneration → re-render Align Packet |
| **Reject** | Wrong direction entirely | Scope becomes `rejected` or `deferred` |
| **Redirect** | Input is insufficient | Return to grounding |

### During Draft Phase 1 (mockup iteration)

No formal gate. User gives feedback freely. System updates surface.
Lightweight constraint hints are surfaced as discovered.

### At Draft Gate 2 (final confirmation)

| Action | Meaning | System response |
|--------|---------|-----------------|
| **Approve** + constraint decisions | Surface + all constraint decisions confirmed | Lock target. Compile |
| **Revise** + feedback | Surface or constraint handling needs adjustment | Classify feedback by scope (see below) |
| **Reject** | This target is wrong | Scope becomes `rejected` or `deferred` |
| **Redirect to Align** | Direction itself needs re-examination (including any scope change) | Return to Align with context preserved |
| **Redirect to Grounding** | Reality information is stale or insufficient | Return to grounding |

All scope changes (expansion AND reduction) require Redirect to Align.

### Revise Feedback Classification

Classification is confidence-based: high confidence → immediate execution,
low confidence (boundary cases) → ask human before processing.

| Feedback scope | Example | System response |
|----------------|---------|-----------------|
| **Surface-only** | "Move confirm button higher" | Update mockup only. Constraint decisions unchanged |
| **Constraint decision** | "Change block limit from 5 to 10" | Update constraint decision |
| **Target change** | "Add an undo flow" | Regenerate surface + re-run constraint discovery |
| **Direction change** | "Switch from blocking to preferences" | Redirect to Align |

Surface-only fixes apply targeted changes (not full regeneration) in v1.

### Convergence Safety

| Revise count | System action |
|--------------|---------------|
| **3 times** | Pattern summary — categorize feedback, suggest whether direction or surface is the issue |
| **5 times** | Diagnosis report — identify patterns, present 3 choices: (1) manual write (2) scope reduce via Align (3) redirect to Align |
| **7 times** | Hard block — must choose one of the 3 options before continuing |

During Draft Phase 1 (mockup iteration), 3+ iterations without convergence
triggers a suggestion to return to Align and re-examine scope.

## Storage Model

Sprint Kit uses a hybrid event-sourced storage model.

### Three Layers

| Layer | Contents | Role |
|-------|----------|------|
| **Event Layer** | `events.ndjson` (append-only) | Source of truth for state transitions, verdicts, constraint decisions |
| **Input Layer** | `inputs/` | 사용자 제공 원본 자료. 시스템이 수정하지 않음. 변경 시 grounding 재실행 필요 |
| **Artifact Layer** | `surface/`, `build/` | Source of truth for generated files. Events record artifact path + content-hash but not file contents |

### Directory Structure

```text
scopes/{scope-id}/
  inputs/
    sources.yaml
    {user-provided materials}
  events.ndjson                 ← event layer (source of truth)
  scope.md                     ← rendered current view (derived, read-only)
  state/                       ← materialized views (derived, read-only)
    reality-snapshot.json
    constraint-pool.json
    verdict-log.json
  surface/                     ← artifact layer
    preview/                   #   experience: React + MSW app
    contract-diff/             #   interface: API diff
  build/                       ← artifact layer
    align-packet.md
    draft-packet.md
    build-spec.md
    brownfield-detail.md
    delta-set.json
    validation-plan.md
```

Rules:

- `events.ndjson` is append-only. Past events are never modified
- `scope.md` and `state/constraint-pool.json`, `state/verdict-log.json` are regenerated from events by the reducer
- `state/reality-snapshot.json` is written by commands/ layer (contains scan results not in event payloads). Recoverable via re-grounding
- `surface/` and `build/` artifacts have corresponding events that record path + content-hash
- Artifacts must not be modified without a corresponding event

Inconsistency resolution (two layers):

| Layer | Scope | Rule |
|-------|-------|------|
| **Materialized View** (`scope.md`, `state/constraint-pool.json`, `state/verdict-log.json`) | Events에서 재생성 가능 | 불일치 시 이벤트 기준으로 재생성 |
| **Reality Snapshot** (`state/reality-snapshot.json`) | Events에서 재생성 불가 (스캔 결과 포함) | 불일치 시 re-grounding으로 재스캔 |
| **Input** (`inputs/`) | 사용자 제공 원본 | 시스템 수정 불가. 변경 시 grounding 재실행 |
| **Artifact** (`surface/`, `build/`) | Events에서 재생성 불가 (hybrid storage) | content hash로 무결성 검증. 불일치 시 해당 단계부터 재실행 |

## Domain Objects

| Object | Level | Role | Owner module |
|--------|-------|------|-------------|
| **Scope** | Container | The unit of work. Contains all other objects | `commands/` |
| **Intent** | Why | Why this scope exists. Problem, beneficiary, success conditions | `commands/` |
| **Reality Snapshot** | What is | Current system state from all 3 perspectives. Auto-classified scan results | `kernel/` |
| **Constraint Pool** | What constrains | All discovered constraints with IDs, organized by perspective and severity | `kernel/` |
| **Verdict Log** | What was decided | Human decisions at Align and Draft, including per-constraint decisions | `kernel/` |
| **Delta Set** | What changes | The diff between current state and confirmed target state | `compilers/` |
| **Build Spec** | How to build | Complete implementation specification. No ambiguity remains | `compilers/` |

Each constraint has a unique `constraint_id` (e.g. `CST-001`).
This ID is the traceability key across all artifacts.

## Compile Boundary

Compile translates the confirmed target into Build Spec.

**Compile MUST NOT make new product decisions.**

If compile encounters an ambiguity that requires a product decision,
it means Draft did not surface all constraints.
Compile must block and redirect to Draft with the newly discovered constraint.

### Compile Defense (three layers)

| Layer | Mechanism | What it catches |
|-------|-----------|----------------|
| **L1 Checklist** | Every Draft constraint decision must be referenced in Build Spec. Missing reference = compile failure | Omissions |
| **L2 Audit pass** | inject/defer/override 반영 검증, CST→IMPL→CHG→VAL 추적 체인 완전성, edge case 존재 여부 | Distortions |
| **L3 Evidence Quality Warnings** | 미검증 가정, 정책 변경 전제, 상태 누락, 공유 리소스 충돌, 불변 제약 미커버, brownfield 교차 검증 (비차단, 경고만) | Quality gaps |

When compile discovers a new constraint: `compile.constraint_gap_found` event is recorded,
scope transitions backward, and the new constraint enters Draft for decision.

### Compile Output

Build Spec includes ALL brownfield scan results — nothing is withheld.
For interface scopes, this means the full technical context is provided to Builder
along with guardrails (constraints that must be followed) and policy decisions (already locked at Align).

## Immutability Boundaries

| Gate | What becomes immutable | What remains mutable |
|------|----------------------|---------------------|
| **Align (Gate 1)** | Intent, direction, scope boundaries, in/out decisions. For interface scopes: also policy decisions (public/internal, breaking change, versioning) | Surface details, constraint decisions |
| **Draft Gate 2** | Confirmed surface, all constraint decisions | Implementation order, code-level structure |

All scope changes (expansion and reduction) require redirect to Align.

### Stale Override

Immutability holds while the Reality Snapshot is valid.

When Reality Snapshot becomes stale, the system does not change decisions automatically —
it unlocks the gate so the human can re-decide with fresh information.

## State Machine

Forward transitions:

```text
draft → grounded → align_proposed → align_locked → surface_iterating → surface_confirmed → constraints_resolved → target_locked → compiled → applied → validated → closed
```

Self-transitions:

```text
align_proposed → align_proposed    (align.revised, revision counter incremented)
surface_iterating → surface_iterating  (surface.revision_applied)
constraints_resolved → constraints_resolved  (constraint decision revised)
```

Backward transitions:

```text
align_proposed → grounded              (redirect to grounding)
align_locked → align_proposed          (stale snapshot detected)
surface_iterating → align_proposed     (redirect to Align — scope change needed)
surface_confirmed → surface_iterating  (constraint found that requires surface change)
surface_confirmed → align_proposed     (modify-direction constraint decision)
constraints_resolved → surface_iterating  (constraint decision requires surface change)
constraints_resolved → align_proposed  (redirect to Align)
target_locked → constraints_resolved   (new constraint found during compile)
compiled → constraints_resolved        (apply failure due to target issue)
applied → constraints_resolved         (validation failure due to target issue)
applied → grounded                     (validation failure due to stale reality)
compiled → grounded                    (stale snapshot detected after compile)
```

Terminal states: `deferred`, `rejected`
Any state except `closed` can transition to `deferred` or `rejected`.

Complete State × Event matrix is defined in `docs/event-state-contract.md`.

## Blocking Rules

| Rule | Enforced at | Enforcement type |
|------|-------------|-----------------|
| No Align before grounded | `draft → align_proposed` | State guard |
| No Draft before Align locked | `align_locked → surface_iterating` | State guard |
| No surface confirmation without concrete surface | `surface_iterating → surface_confirmed` | Content validator |
| No constraint resolution with `clarify` items | `constraints_resolved → target_locked` | Constraint pool validator |
| No compile with stale snapshot | `target_locked → compiled` | Snapshot freshness validator |
| No compile if new product decision needed | Compile execution | Compile boundary audit |
| No close before validation passes | `applied → validated` | Validation result check |

## Stale Propagation

| Current state | System action |
|---------------|---------------|
| `grounded` or `align_proposed` | Re-scan. Flag changes. Re-render Align Packet |
| `align_locked` | Unlock → `align_proposed`. Require re-Align |
| `surface_iterating` or `surface_confirmed` | Re-scan. Re-run constraint discovery. Notify user |
| `target_locked` | Block compile. Redirect to Draft |
| `compiled` or later | Block apply. Redirect to Grounding (re-scan required) |

### Stale Detection Timing

| When | Scope | Result |
|------|-------|--------|
| **Gate transitions** (mandatory) | All sources | Stale → transition blocked |
| **Command start** (lightweight) | Local sources only | Stale → warning displayed |

## Module Structure

| Module | Responsibility | Owns |
|--------|---------------|------|
| `kernel/` | Event store, reducers, state machine, constraint pool, stale detection, shared types | Reality Snapshot, Constraint Pool, Verdict Log |
| `config/` | `.sprint-kit.yaml` 로딩, 소스 병합, `/start` 플래그 파싱 | — |
| `scanners/` | 소스 스캔, 패턴 탐지, ontology 인덱스/쿼리, brownfield-builder | ScanResult |
| `commands/` | `/start`, `/align`, `/draft` entrypoints, Reality Snapshot 작성 | Scope, Intent |
| `renderers/` | `scope.md`, Align Packet, Draft Packet, surface views | — |
| `compilers/` | Compile, Build Spec generation, Brownfield Detail rendering | Delta Set, Build Spec, Brownfield Detail |
| `validators/` | Apply and validation runners | — |

### 의존 방향

```
config/ → kernel/, scanners/types (SourceEntry, sourceKey)
scanners/ → kernel/, config/
commands/ → kernel/, config/, scanners/, renderers/, compilers/, validators/
renderers/ → kernel/
compilers/ → kernel/
validators/ → kernel/
```

금지 의존: `scanners/ → compilers/`, `scanners/ → renderers/`, `kernel/ → 다른 모듈`

## Terminology Mapping

| Previous | Current | Reason |
|----------|---------|--------|
| Judgment Point 1 (JP1) | **Align** | Confronts intent with reality. Locks scope |
| Judgment Point 2 (JP2) | **Draft** | Defines to-be through surface iteration + resolves constraints |
| Direction Resolution (DR) | **Align** | "Align" = align intent with reality |
| Target Resolution (TR) | **Draft** | Work zone + final gate |
| Intent Resolution (IR) | **Align** | Simplified |
| JP1/DR/IR Packet | **Align Packet** | Follows stage name |
| JP2/TR Packet | **Draft Packet** | Follows stage name |
| Execution Pack | **Build Spec** | What developers build from |
| Change Case | **Scope** | Includes new development, not just changes |
| Gap Register | **Constraint Pool** | Active discovery, not passive registration |
| hidden requirement | **constraint** | Broader — includes all perspective findings |
| judgment-to-delta | **constraint-aware translation** | System improves judgment, not just executes it |

## v1 Scope

In scope:

- `experience` scopes (stateful mockup surface)
- `interface` scopes (technical delegation with guardrails + full brownfield info)
- 3-perspective constraint discovery (lightweight during iteration, deep after confirmation)
- `clarify` option for constraint decisions
- surface-only apply-fix (targeted update without full regeneration)
- single planner, single executor
- deterministic validator
- source access: `--add-dir`, GitHub tarball, Figma MCP, Obsidian vault
- convergence safety (3/5/7 tier)
- feedback classification (confidence-based)

Out of scope:

- BMad runtime integration
- multi-agent parallel execution
- `data` scopes, `policy` scopes, `runtime` scopes
- cost transparency (planned for v2)
- multi-scope dependency tracking (v1 treats scopes as independent)
- multi-stakeholder review workflows
