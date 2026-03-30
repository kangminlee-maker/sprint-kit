---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Logic Rules

Constraint-to-constraint and cross-section logical rules that the PRD must satisfy. These rules detect contradictions and inconsistencies within the PRD document itself. External conformance (policy alignment, brownfield compatibility) is verified separately by Pre-Apply Review.

## Constraint Decision Consistency Rules

### LR-1: No mutually exclusive inject decisions
Two inject decisions must not require mutually exclusive changes to the same component.
- Detection: If two inject CSTs both generate CHG items targeting the same `file_path` with contradictory `after_context` descriptions, this rule is violated.
- Example: CST-1 injects "remove the retry button" and CST-2 injects "add retry count display next to the retry button."

### LR-2: Override rationale must not contradict inject rationale
An override decision's rationale must not contradict the rationale of any inject decision in the same scope.
- Detection: If CST-A (override) states "feature X is unnecessary because users do not need it" and CST-B (inject) states "feature X is critical for user retention," this rule is violated.
- Note: This rule requires semantic interpretation. The PRD review agent evaluates it; automated detection is not possible.

### LR-3: Deferred constraints must not be prerequisites for injected constraints
If constraint B depends on constraint A (i.e., B's implementation assumes A is already implemented), then A must not be deferred while B is injected.
- Detection: Check IMPL `depends_on` references. If an IMPL for an inject CST depends on an IMPL whose related CST is deferred, this rule is violated.

### LR-4: Success criteria achievability
Success criteria must be achievable given the set of inject decisions.
- Detection: Each success criterion in Section 4 must map to at least one inject CST chain. A success criterion that requires a deferred or overridden constraint's implementation cannot be achieved.

### LR-5: Goal metrics measurability
Goal metrics must be measurable with the proposed technical changes.
- Detection: Each metric in the Goal Metrics table must have a corresponding data source. If the metric requires an event or API that is not listed in Event Tracking (Section 13) or Technical Requirements (Section 8), this rule is violated.

## Cross-Section Consistency Rules

### LR-6: No conflicting functional requirements from the same constraint
Functional requirements derived from the same constraint must not conflict with each other.
- Detection: If CST-1 produces FR-1 ("show price in KRW") and FR-2 ("show price in USD") without specifying a condition distinguishing them, this rule is violated.
- Acceptable: FR-1 and FR-2 from the same CST when they apply to different user states or different screens.

### LR-7: Brownfield tag consistency
Features tagged [BROWNFIELD] in Functional Requirements must not be listed as new features in Product Scope or Executive Summary.
- Detection: Cross-reference [BROWNFIELD]-tagged FRs against the "new features" list in Product Scope (Section 5). Any overlap is a violation.

### LR-8: User Journey and Functional Requirement alignment
Every user action described in a User Journey must correspond to a functional requirement, and every functional requirement must be exercised by at least one User Journey.
- Detection: Extract user actions from Journey Rising Action and Climax sections. Map each to an FR. Identify orphan FRs not covered by any Journey and Journey actions not backed by any FR.

### LR-9: Event Tracking coverage
Every user-facing action in Functional Requirements that constitutes a measurable interaction must have a corresponding event in Event Tracking (Section 13).
- Detection: CTA button presses, form submissions, page navigations, and state changes listed in FRs should have matching events. Purely display-only FRs are exempt.

### LR-10: QA Considerations and Validation Plan alignment
QA Considerations (Section 12) must cover all scenarios described in the Validation Plan items (VAL entries in the Traceability Matrix).
- Detection: Each VAL-ID must have a corresponding QA case. QA cases may cover additional scenarios beyond those in the Validation Plan.

## Application Notes

- Rules LR-1 through LR-5 operate on constraint decisions. They are most relevant to the `prd_logic` review perspective.
- Rules LR-6 through LR-10 operate across PRD sections. They are most relevant to the `prd_coverage` and `prd_dependency` review perspectives.
- Semantic rules (LR-2, LR-4) require agent interpretation. Structural rules (LR-1, LR-3, LR-5, LR-6, LR-7, LR-8, LR-9, LR-10) can be partially automated through cross-reference checks.

## Related Documents

- concepts.md — Definitions of constraint, inject, defer, override, CST/IMPL/CHG/VAL
- competency_qs.md — Questions Q2, Q3, Q9 that these rules support
- dependency_rules.md — Brownfield-specific reference rules (complements LR-7)
