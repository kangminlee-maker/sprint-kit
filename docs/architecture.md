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
| **Product Owner** | Product expert (non-developer) | Provides intent, reviews DR/TR Packets, makes constraint decisions, approves direction and target |
| **Builder** | Developer or AI agent | Implements from Build Spec. Escalates uncovered edge cases back to TR |
| **System** | Sprint Kit runtime | Scans sources, discovers constraints, generates surfaces, compiles, validates |

In v1, one person may hold multiple roles.
Product Owner and Builder may be the same person.

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

A constraint found in Code perspective (e.g. "existing API breaks if this field changes")
enables the human to make a better decision than they would from Experience perspective alone.
Whether the human accepts the constraint, overrides it, or changes direction —
the decision is better because the constraint was visible.

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

```yaml
# scopes/{scope-id}/inputs/sources.yaml

sources:
  - type: local
    path: /path/to/backend-repo
  - type: local
    path: /path/to/client-repo
  - type: github
    url: https://github.com/org/domain-ontology
  - type: github
    url: https://github.com/org/terms-and-policies
  - type: figma
    url: https://figma.com/design/xxxxx
  - type: figma
    url: https://figma.com/board/yyyyy
  - type: obsidian
    path: /path/to/vault
```

After scanning, the system presents classified findings.
The user reviews scan results to confirm no sources are missing.
Scan results are embedded in the DR Packet (no separate confirmation step).

## User-Facing Entrypoints

Three commands:

- `/start` — begin a new scope
- `/dr` — Direction Resolution
- `/tr` — Target Resolution

## Core Flow

```text
/start {description or inputs}
  -> frame intent
  -> scan sources from 3 perspectives
  -> build Reality Snapshot + initial Constraint Pool
  -> propose direction
  -> surface direction-level constraints
  -> render DR Packet (scan results embedded)

/dr
  -> human reviews direction + constraints
  -> direction verdict (approve / revise / reject / redirect)
  -> [on approve] lock direction. begin target design
  -> design target surface
     experience scope: generate stateful mockup (React + MSW)
     interface scope: generate contract diff
  -> deep constraint discovery from all 3 perspectives
  -> render TR Packet

/tr
  -> human reviews target + all constraints
  -> decide on each constraint (inject / defer / override / clarify / modify-direction)
  -> target verdict (approve / revise / reject / redirect-to-dr)
  -> [on approve] lock target + all constraint decisions
  -> compile: translate target into delta (no new product decisions)
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
This ID flows through all artifacts: DR Packet → TR Packet → Build Spec → delta-set.json → validation-plan.md.

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
| **modify-direction** | This constraint changes the direction itself | Redirect to DR |

`defer` = "I understand but won't address it now" (judgment complete).
`clarify` = "I don't have enough information to judge" (judgment pending).

### Discovery Timing

| Stage | Discovery scope | Depth |
|-------|----------------|-------|
| Grounding | All 3 perspectives | Direction-level. Broad scan for major conflicts |
| After DR approval | All 3 perspectives | Target-level. Deep scan against concrete surface |

Detailed discovery rules, perspective-specific search patterns,
and business impact translation rules are defined in `docs/constraint-discovery.md`.

## Surface Types

The judgment artifact at TR depends on scope type:

| Scope type | Surface | Format | Judgment method |
|------------|---------|--------|-----------------|
| `experience` | Stateful Mockup | React + MSW app in `surface/preview/`. Run with `npm run dev` | Human clicks through scenarios, experiences the change directly |
| `interface` | Contract Diff | API contract before/after comparison | Human reads the diff and decides |

For `experience` scopes, the stateful mockup is mandatory.
Text-only preview is insufficient for experience judgment.
The human must interact with the mockup to discover experience-level constraints.

The mockup also serves as the Experience perspective's "to-be" state —
the input to translation during compile.

## Feedback Model

### At DR (Direction Resolution)

| Action | Meaning | System response |
|--------|---------|-----------------|
| **Approve** | Direction + constraint awareness confirmed | Lock direction. Start target design |
| **Revise** + feedback | Direction needs adjustment | Classify feedback → targeted fix or regeneration → re-render DR Packet |
| **Reject** | Wrong direction entirely | Scope becomes `rejected` or `deferred` |
| **Redirect** | Input is insufficient | Return to grounding |

### At TR (Target Resolution)

| Action | Meaning | System response |
|--------|---------|-----------------|
| **Approve** + constraint decisions | Target + all constraint decisions confirmed | Lock target. Compile (no new product decisions) |
| **Revise** + feedback | Target or constraint handling needs adjustment | Classify feedback by scope (see below) |
| **Reject** | This target is wrong | Scope becomes `rejected` or `deferred` |
| **Redirect to DR** | Direction itself needs re-examination (including any scope change) | Return to DR with context preserved |
| **Redirect to Grounding** | Reality information is stale or insufficient | Return to grounding |

All scope changes (expansion AND reduction) require Redirect to DR.
Direction immutability is strict — scope boundaries are part of the locked direction.

### Revise Feedback Classification

The system classifies revise feedback to determine the minimum rework scope.
Classification is confidence-based: high confidence → immediate execution,
low confidence (boundary cases) → ask human before processing.

| Feedback scope | Example | System response |
|----------------|---------|-----------------|
| **Surface-only** | "Move confirm button higher", "Show block date on result screen" | Update mockup/contract only. TR Packet unchanged. Human re-checks |
| **Constraint decision** | "Change block limit from 5 to 10" | Update Decision-Required Items in TR Packet |
| **Target change** | "Add an undo flow after blocking" | Regenerate surface + re-run constraint discovery |
| **Direction change** | "Switch from blocking to preference-based matching" | Redirect to DR |

Surface-only fixes apply targeted changes (not full regeneration) in v1.

### Convergence Safety

| Revise count | System action |
|--------------|---------------|
| **3 times** | Pattern summary — categorize feedback history, suggest whether direction or target is the issue |
| **5 times** | Diagnosis report — identify oscillation patterns, present 3 choices: (1) manual write (2) scope reduce via DR (3) direction redirect |
| **7 times** | Hard block — must choose one of the 3 options before continuing |

## Storage Model

Sprint Kit uses a hybrid event-sourced storage model.

### Two Layers

| Layer | Contents | Role |
|-------|----------|------|
| **Event Layer** | `events.ndjson` (append-only) | Source of truth for state transitions, verdicts, constraint decisions |
| **Artifact Layer** | `surface/`, `build/` | Source of truth for generated files (mockups, specs). Events record artifact path + content-hash but not file contents |

Events record THAT an artifact was generated and its integrity (content-hash).
Artifacts contain the actual content that events cannot reproduce.

### Materialized Views

`scope.md` and `state/` files are derived from events — never edited directly.

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
  surface/                     ← artifact layer
    preview/                   #   experience: React + MSW app
    contract-diff/             #   interface: API diff
  build/                       ← artifact layer
    dr-packet.md
    tr-packet.md
    build-spec.md
    delta-set.json
    validation-plan.md
```

Rules:

- `events.ndjson` is append-only. Past events are never modified
- `scope.md` and `state/` are regenerated from events by the reducer
- `surface/` and `build/` artifacts have corresponding events that record path + content-hash
- If events and materialized views disagree, events win — views are regenerated
- Artifacts must not be modified without a corresponding event

## Domain Objects

| Object | Level | Role | Owner module |
|--------|-------|------|-------------|
| **Scope** | Container | The unit of work. Contains all other objects | `commands/` |
| **Intent** | Why | Why this scope exists. Problem, beneficiary, success conditions | `commands/` |
| **Reality Snapshot** | What is | Current system state from all 3 perspectives. Auto-classified scan results | `kernel/` |
| **Constraint Pool** | What constrains | All discovered constraints with IDs, organized by perspective and severity | `kernel/` |
| **Verdict Log** | What was decided | Human decisions at DR and TR, including per-constraint decisions | `kernel/` |
| **Delta Set** | What changes | The diff between current state and target state | `compilers/` |
| **Build Spec** | How to build | Complete implementation specification. No ambiguity remains | `compilers/` |

Note: `Scope` is the container for the other 6 objects.
They are not peers — Scope is a higher-level category.

Each constraint in the Constraint Pool has a unique `constraint_id` (e.g. `CST-001`).
This ID is the traceability key across all artifacts.

## Compile Boundary

Compile translates the approved target into Build Spec.

**Compile MUST NOT make new product decisions.**

If compile encounters an ambiguity that requires a product decision,
it means TR did not surface all constraints.
Compile must block and redirect to TR with the newly discovered constraint.

### Compile Defense (two layers)

| Layer | Mechanism | What it catches |
|-------|-----------|----------------|
| **Checklist** | Every TR constraint decision must be referenced in Build Spec. Missing reference = compile failure | Omissions |
| **Audit pass** | Separate verification pass compares Build Spec content against TR decisions. Flags unreferenced or contradicted decisions | Distortions |

When compile discovers a new constraint: `compile.constraint_gap_found` event is recorded,
scope transitions from `target_locked` → `target_proposed`, and the new constraint enters TR.

### Compile I/O

Compile inputs and outputs are defined in `docs/build-spec.md`.

## Immutability Boundaries

Each gate locks a specific scope of decisions:

| Gate | What becomes immutable | What remains mutable |
|------|----------------------|---------------------|
| **DR approval** | Direction, scope boundaries, in/out decisions | Target details, constraint decisions, surface design |
| **TR approval** | Target, all constraint decisions, surface | Implementation order, code-level structure |

All scope changes (expansion and reduction) require DR redirect.

After DR approval, the system detects if subsequent TR work
drifts from the approved direction. If drift is detected,
the system flags it and asks: "This changes the approved direction. Redirect to DR?"

After TR approval, compile must not alter any decided constraint.
If a new constraint is discovered during compile,
compile blocks and returns to TR.

### Stale Override

Immutability holds while the Reality Snapshot is valid.

When Reality Snapshot becomes stale, the decisions based on that snapshot
may no longer be sound. The system does not change decisions automatically —
it unlocks the gate so the human can re-decide with fresh information.

This is not an exception to immutability.
It is a protection mechanism for the premise on which immutability rests.

## State Machine

Forward transitions:

```text
draft → grounded → direction_proposed → direction_locked → target_proposed → target_locked → compiled → applied → validated → closed
```

Self-transitions (revise loops):

```text
direction_proposed → direction_proposed  (direction.revised, revision counter incremented)
target_proposed → target_proposed        (target.revised, revision counter incremented)
```

Backward transitions:

```text
direction_proposed → grounded            (redirect to grounding)
direction_locked → direction_proposed    (stale snapshot detected)
target_proposed → direction_proposed     (redirect to DR, including scope changes)
target_proposed → grounded               (redirect to grounding)
target_locked → target_proposed          (new constraint found during compile)
compiled → target_proposed               (apply failure due to target issue)
applied → target_proposed                (validation failure due to target issue)
applied → grounded                       (validation failure due to stale reality)
compiled → grounded                      (stale snapshot detected after compile)
```

Terminal states: `deferred`, `rejected`
Any state except `closed` can transition to `deferred` or `rejected`.

State names use `_locked` instead of `_approved`
to emphasize that decisions become immutable at that point.

Complete State × Event matrix is defined in `docs/event-state-contract.md`.

## Blocking Rules

| Rule | Enforced at | Enforcement type |
|------|-------------|-----------------|
| No DR before grounded | `draft → direction_proposed` transition | State guard |
| No TR before direction locked | `direction_locked → target_proposed` transition | State guard |
| No TR without concrete surface | `target_proposed` state entry | Content validator |
| No compile with unresolved constraints | `target_locked → compiled` transition | Constraint pool validator |
| No compile with `clarify` constraints | `target_locked → compiled` transition | Constraint pool validator |
| No compile with stale snapshot | `target_locked → compiled` transition | Snapshot freshness validator |
| No compile if new product decision needed | Compile execution | Compile boundary audit |
| No close before validation passes | `applied → validated` transition | Validation result check |

Each rule specifies WHERE it is enforced and HOW (state guard vs content validator).
Enforcement details are defined in `docs/event-state-contract.md`.

## Stale Propagation

When a Reality Snapshot becomes stale (source system changed after scan):

| Current state | Effect | System action |
|---------------|--------|---------------|
| `grounded` or `direction_proposed` | Direction may be based on outdated reality | Re-scan sources. Flag changes. Re-render DR Packet |
| `direction_locked` | Locked direction may conflict with new reality | Unlock direction → `direction_proposed`. Require re-DR |
| `target_proposed` | Surface may be based on outdated reality | Re-scan. Re-run constraint discovery. Re-render TR Packet |
| `target_locked` | Locked decisions may conflict with new reality | Block compile. Redirect to TR with new constraints |
| `compiled` or later | Build Spec may be outdated | Block apply. Redirect to TR |

### Stale Detection Timing

| When | Scope | Result |
|------|-------|--------|
| **Gate transitions** (mandatory) | All sources | Stale → transition blocked |
| **Command start** (lightweight) | Local sources only | Stale → warning displayed |

Stale detection: compare source content hashes at scan time vs current.

## Module Structure

Implementation modules are defined in `src/`:

| Module | Responsibility | Owns |
|--------|---------------|------|
| `kernel/` | Event store, reducers, state machine, constraint pool, stale detection | Reality Snapshot, Constraint Pool, Verdict Log |
| `commands/` | `/start`, `/dr`, `/tr` entrypoints | Scope, Intent |
| `renderers/` | `scope.md`, DR Packet, TR Packet, concrete surface views | — |
| `compilers/` | Compile, crystallize, Build Spec generation | Delta Set, Build Spec |
| `validators/` | Apply and validation runners | — |

Each contract document specifies its owner module.

## Terminology Mapping

Terms changed from the previous design iteration:

| Previous | Current | Reason |
|----------|---------|--------|
| Judgment Point 1 (JP1) | DR (Direction Resolution) | Reflects that constraints are resolved, not just judged |
| Judgment Point 2 (JP2) | TR (Target Resolution) | Same |
| Execution Pack | Build Spec | "Build" is what developers do with it |
| Change Case | Scope | "Change" excludes new development |
| Gap Register | Constraint Pool | Active discovery, not passive registration |
| `cases/{id}/` | `scopes/{id}/` | Follows naming change |
| `case.md` | `scope.md` | Follows naming change |
| `_approved` states | `_locked` states | Emphasizes immutability |
| hidden requirement | constraint | Broader — includes Code and Policy perspective findings |
| judgment-to-delta | constraint-aware translation | System improves judgment, not just executes it |

## v1 Scope

In scope:

- `experience` scopes (stateful mockup surface)
- `interface` scopes (contract diff surface)
- 3-perspective constraint discovery
- `clarify` option for constraint decisions
- surface-only apply-fix (targeted mockup/contract update without full regeneration)
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
