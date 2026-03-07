# Execution Plan

The implementation strategy is to build one end-to-end usable slice before generalizing.

## Phase 0. Lock v1 Scope

- fix in-scope and out-of-scope boundaries
- keep only three entrypoints
- keep only two supported change classes

Exit criteria:

- no unresolved scope argument remains

## Phase 1. Lock Contracts

- define event types
- define case state reducer contract
- define `case.md` render contract
- define `JP1` packet contract
- define `JP2` packet contract
- define `execution pack` contract
- define `compile_ready` rules

Exit criteria:

- state transitions and blockers are explicit
- `execution pack` is defined as a decision-complete implementation contract, not a lightweight checklist

## Phase 2. Build Event Kernel

- implement event append flow
- implement state reduction
- implement rendered case view generation
- support revision tracking and stale snapshot detection

Exit criteria:

- the current state can be rebuilt from events only

## Phase 3. Build `/sprint-kit`

- create a new case
- attach inputs
- ground current reality
- record evidence
- generate direction proposal
- render JP1 packet

Exit criteria:

- one sample case reaches the `JP1` boundary

## Phase 4. Build JP1 Loop

- record approve / revise / reject
- regenerate direction proposal on revise
- lock approved direction baseline

Exit criteria:

- JP1 loops are state-safe and repeatable

## Phase 5. Build JP2 Loop

- generate `preview` or `contract_diff`
- collect initial gaps
- render JP2 packet
- capture target and hidden requirement decisions

Exit criteria:

- JP2 loops are state-safe and repeatable

## Phase 6. Build Compile / Crystallize

- run compile preflight checks
- inject approved constraints and gap decisions
- generate `delta set`
- generate `execution pack`
- include expected happy-path behavior in the pack
- include implementation-critical edge cases and expected handling in the pack
- include code-level guard conditions and failure behavior in the pack
- include policy-preserving rules and constraint decisions in the pack
- include fallback or alternative options when a path fails
- generate validation plan

Exit criteria:

- compile produces deterministic build artifacts or a clear block reason
- `execution pack` is incomplete if a developer would still need to make first-order product, policy, or error-handling decisions while coding

## Phase 7. Build Apply / Validate

- execute a compiled pack
- record apply results
- record validation results
- verify happy-path, edge-case, and policy-preserving expectations from the pack
- block close on failed validation

Exit criteria:

- one case reaches `validated`

## Phase 8. Build Recovery and Resume

- resume from any intermediate state
- handle stale snapshots
- reopen the right stage after revisions
- support retry after compile or validation failure

Exit criteria:

- a failed case can recover without manual state surgery

## Phase 9. Cut Usable v1

- run one golden path case end-to-end
- clean up operator-facing docs
- simplify errors and logs
- freeze the first release boundary

Exit criteria:

- a new operator can start at `/sprint-kit` and finish a real case
