# Architecture

## Product Definition

Sprint Kit is a `judgment-to-delta runtime`.

It is not a document factory.
It is not a BMad workflow shell.
It is not a universal multi-agent orchestrator.

The system exists to:

1. ground a change request in current system reality
2. collect human judgment at two concrete gates
3. compile the approved target into an executable delta

## User-Facing Surface

Only three entrypoints are exposed:

- `/sprint-kit`
- `/jp1`
- `/jp2`

Internal modes still exist, but they are not user-facing routes:

- `discovery`
- `structured`
- `direct_change`

## Core Flow

```text
/sprint-kit
-> frame
-> ground
-> propose-direction
-> render JP1 packet

/jp1
-> direction verdict
-> design-surface
-> collect gaps
-> render JP2 packet

/jp2
-> target verdict
-> resolve gaps
-> compile-delta
-> apply
-> validate
```

`Constraint Gate` is not a separate command.
It is absorbed into the `JP2` packet as hidden requirements, risk, and decision-required items.

## Storage Model

Each change case lives under:

```text
cases/{change-id}/
  inputs/
  events.ndjson
  case.md
  surface/
  build/
```

Rules:

- `events.ndjson` is the canonical source of truth
- `case.md` is a rendered current view
- `surface/` contains the concrete judgment artifact
- `build/` contains derived compile and validation outputs

## Core Domain Objects

The runtime keeps these canonical objects, but does not explode them into separate documents:

- `Change Case`
- `Intent Card`
- `Reality Snapshot`
- `Evidence Record`
- `Gap Register`
- `Verdict Log`
- `Delta Set`
- `Execution Pack`

## Execution Pack Contract

`Execution Pack` is not just an implementation checklist.
It is the final pre-development decision bundle.

Its job is to remove first-order design ambiguity before coding starts.
A developer should be able to implement from the pack without having to invent missing error behavior, policy handling, or edge-case rules on the fly.

The pack must include:

- the approved target baseline
- the delta summary
- the expected happy-path behavior
- the relevant edge cases and the expected system behavior for each
- code-level guard conditions and failure handling expectations
- policy and constraint decisions that must be preserved during implementation
- fallback or alternative decisions when the primary path is invalid
- validation steps, stop conditions, and rollback notes

In other words:

- `Delta Set` answers: "what must change?"
- `Execution Pack` answers: "how do we change it correctly and safely without re-designing during implementation?"

Compile is incomplete if the pack only contains the happy path, or if a developer would still need to guess how boundary cases, policy constraints, or failure paths should behave.

## Bounded Contexts

- `Intake Context`
- `Grounding Context`
- `Direction Context`
- `Target/Translation Context`
- `Execution Context`

## State Machine

```text
draft
-> grounded
-> direction_proposed
-> direction_approved
-> target_proposed
-> target_approved
-> gaps_resolved
-> compiled
-> applied
-> validated
-> closed
```

Additional terminal states:

- `deferred`
- `rejected`

## Blocking Rules

- no `JP1` before `grounded`
- no `JP2` before `direction_approved`
- no `JP2` without a concrete surface
- no `compile` with blocking gaps
- no `compile` with missing required evidence
- no `compile` with a stale snapshot
- no `compile complete` if implementation-critical edge cases are still ambiguous
- no `compile complete` if policy-preserving behavior is still ambiguous
- no `compile complete` without explicit failure handling and fallback notes
- no `close` before validation passes

## v1 Scope

In scope:

- `experience_change`
- `interface_change`
- `preview`
- `contract_diff`
- single planner
- single executor
- deterministic validator

Out of scope:

- BMad runtime integration
- full planning artifact cascade
- always-on multi-agent execution
- `data_change`
- `policy_change`
- `runtime_change`
