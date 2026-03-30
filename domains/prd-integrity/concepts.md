---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Concept Dictionary and Interpretation Rules

## Core Terms

### constraint
A restriction discovered during product change analysis. Each constraint has a `severity` (required or recommended), a `perspective` (experience, code, or policy), and a `decision_owner` (product_owner or builder). The PO or Builder resolves each constraint by choosing one of four decisions:
- **inject**: Include this constraint in the current scope. Generates IMPL → CHG → VAL chain.
- **defer**: Postpone this constraint. Must document what happens if not addressed and under what conditions it should be revisited.
- **override**: Discard this constraint with explicit rationale. The rationale must not contradict any inject decision.
- **clarify**: Request more information before deciding. Transitions to `clarify_pending` status.

A fifth decision, **modify-direction**, redirects the entire scope direction rather than resolving a single constraint.

### CST / IMPL / CHG / VAL chain
The traceability chain linking a constraint decision to its verification:
- **CST** (Constraint): The discovered restriction with its decision.
- **IMPL** (Implementation Item): A unit of work derived from one or more inject decisions. Contains summary, target, detail, and optional assumptions.
- **CHG** (Change Item): A file-level modification (create/modify/delete) linked to one or more IMPL entries.
- **VAL** (Validation Item): A test case with pass criteria and fail action, linked back to the originating CST.

Every inject constraint must produce at least one complete CST → IMPL → CHG → VAL chain in the Traceability Matrix.

### PRD
Product Requirements Document. A 14-section integrated document that summarizes all scope decisions, constraint resolutions, functional requirements, user journeys, and verification criteria. Generated after Pre-Apply Review passes. Source of truth for the apply phase.

### brownfield
Existing codebase context that the product change must account for. Represented in code as `BrownfieldContext` (summary: files, dependencies, APIs, schemas, configs) and `BrownfieldDetail` (full content per section, enums, invariants). Features that already exist in the current system are tagged with `[BROWNFIELD]` in the PRD.

### brief
The initial product change description provided by PO. Contains the change purpose, expected results, and success criteria. Stored as `inputs/brief.md` within the scope directory.

### scope
A single product change unit tracked via event sourcing. Each scope progresses through states (draft → grounded → ... → closed) and accumulates events in `events.ndjson`. One scope produces one PRD.

### surface
A visual mockup that serves as a PO judgment tool. Confirmed surfaces become the reference point for User Journeys and Functional Requirements in the PRD. Referenced by `surface_hash` after `target.locked`.

### compile defense
The structural integrity verification performed during the compile phase. Operates at three levels:
- **L1**: Checklist verification (required fields present).
- **L2**: Audit verification (cross-references valid).
- **L3**: Semantic warnings (e.g., `L3-shared-resource`, `L3-policy-change-required`).

Compile defense verifies the build spec structure. PRD integrity verification is a separate, subsequent process.

### conformance vs quality
Two distinct verification axes:
- **Conformance**: Whether decisions align with external criteria (policy documents, brownfield invariants, logic rules). Verified by Pre-Apply Review before PRD generation.
- **Quality**: Whether the PRD document itself is internally consistent, complete, and structurally correct. Verified by PRD Review after PRD generation.

### judgment fitness
The third verification axis. Measures whether the PRD provides sufficient, clear, and actionable information for PO to make correct decisions about proceeding with the apply phase. A PRD can be structurally complete (high quality) but still fail judgment fitness if trade-offs are hidden or risks are unclear.

## Homonyms Requiring Attention

- **perspective**: In Pre-Apply Review, refers to the 3 review angles (policy, brownfield, logic). In PRD Review, refers to the 8 verification perspectives (`prd_logic`, `prd_structure`, `prd_dependency`, `prd_semantics`, `prd_pragmatics`, `prd_evolution`, `prd_coverage`, `prd_conciseness`). These are different classification systems applied at different stages.
- **review**: Pre-Apply Review (conformance check before PRD) vs PRD Review (quality + judgment fitness check after PRD). Both produce event payloads but verify different things.
- **scope**: Product change unit (sprint-kit domain) vs verification scope (this document's coverage area). Context determines meaning.

## Interpretation Principles

- If the PRD's YAML front matter and body content conflict, the YAML front matter is the source of truth for metadata (scope_id, version, dates, hashes). Body content is the source of truth for requirements.
- If a constraint appears in the Traceability Matrix but not in the constraint pool, the constraint pool is authoritative. The PRD must be corrected.
- `[BROWNFIELD]` tags in Functional Requirements are assertions about the existing system. They must be verifiable against `BrownfieldDetail`.

## Related Documents

- domain_scope.md — Domain definition where these terms are used
- structure_spec.md — PRD structural requirements
- logic_rules.md — Constraint-to-constraint logical rules
