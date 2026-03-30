---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Dependency Rules

Rules governing how the PRD references brownfield (existing codebase) information. These rules ensure that PRD references to the existing system are accurate and complete.

## Brownfield Reference Integrity

### DR-1: Technical Requirements must reference brownfield sources
Technical Requirements (Section 8) must reference relevant brownfield entries when describing:
- **API contracts**: Must cite the corresponding `BrownfieldApiEntry` (endpoint, method) from BrownfieldContext.
- **Database schemas**: Must cite the corresponding `BrownfieldSchemaEntry` (table, columns) from BrownfieldContext.
- **Configuration and environment**: Must cite the corresponding `BrownfieldConfigEntry` (key, description) from BrownfieldContext.

If Technical Requirements describe modifications to any of these, the original brownfield entry must be referenced to establish the baseline.

### DR-2: Brownfield-tagged FRs must reference related files
Every Functional Requirement marked with `[BROWNFIELD]` must reference at least one related file from `BrownfieldContext.related_files` or a section from `BrownfieldDetail.sections`.
- The reference must be specific enough to locate the existing implementation (file path or detail_anchor).
- A `[BROWNFIELD]` tag without a file reference is incomplete.

### DR-3: Traceability Matrix must not reference nonexistent brownfield files
If a Traceability Matrix row's CHG items reference brownfield files (action: "modify" or "delete"), those files must exist in `BrownfieldContext.related_files` or `BrownfieldDetail.sections`.
- A CHG item with action "modify" targeting a file not listed in brownfield context indicates either a missing brownfield scan or an incorrect file path.

### DR-4: Brownfield invariant changes must be explicit
Changes to brownfield invariants (`BrownfieldInvariant` entries) must be explicitly listed in Technical Requirements.
- Each invariant has a `type` (schema, business_rule, api_contract, state_machine).
- If an inject decision's implementation affects an invariant, Technical Requirements must state: which invariant is affected, what the current rule is, and what the new rule will be.
- Invariant changes that are not listed in Technical Requirements but are implied by CHG items constitute a dependency rule violation.

### DR-5: New API endpoints must document relationship to existing endpoints
When Technical Requirements introduce new API endpoints, each new endpoint must document:
- Whether it extends, replaces, or coexists with existing endpoints listed in `BrownfieldContext.api_contracts`.
- If it replaces an existing endpoint, the deprecation plan for the old endpoint.
- If it coexists, how routing or versioning distinguishes old from new.

### DR-6: Database schema changes must note migration impact
When Technical Requirements describe database schema modifications (new columns, altered types, removed columns, new tables), each change must document:
- The affected table from `BrownfieldContext.db_schemas`.
- Whether the change is additive (new column with default), destructive (column removal), or transformative (type change).
- Migration strategy: whether it requires data backfill, whether it is backward-compatible, and whether it requires downtime.

## Cross-Reference Direction

Brownfield references in the PRD flow in one direction:

```
PRD Section → BrownfieldContext / BrownfieldDetail
```

The PRD references brownfield data; brownfield data does not reference the PRD. This is consistent with the overall system design where brownfield context is an input to the compile phase, and the PRD is an output.

## Application Notes

- DR-1 through DR-3 are structurally verifiable: the review agent can cross-reference PRD content against BrownfieldContext and BrownfieldDetail data structures.
- DR-4 through DR-6 require semantic interpretation: the review agent must understand what "affects an invariant" or "replaces an endpoint" means in context.
- These rules complement logic rule LR-7 (brownfield tag consistency) from logic_rules.md.

## Related Documents

- concepts.md — Definitions of brownfield, BrownfieldContext, BrownfieldDetail
- logic_rules.md — LR-7 (brownfield tag consistency)
- competency_qs.md — Q6 (brownfield tag accuracy)
- structure_spec.md — Structural requirements for Technical Requirements section
