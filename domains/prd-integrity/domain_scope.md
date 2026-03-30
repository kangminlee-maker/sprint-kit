---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Domain Scope Definition

The reference document used by PRD review agents when verifying the internal quality and judgment fitness of a Product Requirements Document.

## Application Scope

This domain applies after a PRD has been generated (`prd.rendered` event) and before the scope proceeds to the apply phase. It defines what "PRD integrity" means and what the review must verify.

## 3-Axis Verification Model

PRD verification operates on three independent axes. Each axis has a distinct owner and scope:

| Axis | What It Verifies | Owner | When Applied |
|------|-----------------|-------|-------------|
| Conformance | Alignment with external criteria (policy documents, brownfield invariants, logic consistency) | Pre-Apply Review | Before PRD generation |
| Quality | Internal consistency, completeness, and structural correctness of the PRD document itself | PRD Review (this domain) | After PRD generation |
| Judgment Fitness | Whether the PRD provides sufficient information for PO to make correct decisions | PRD Review (this domain) | After PRD generation |

## What This Domain Covers

- Internal consistency across all 14 PRD sections
- Completeness of the CST → IMPL → CHG → VAL traceability chain within the PRD
- Structural correctness (all required sections present, YAML front matter complete)
- PO judgment adequacy (trade-off visibility, risk transparency, actionable summaries)
- Cross-reference integrity between sections (e.g., FR citing CST, Journey referencing Surface scenario)
- Brownfield tag accuracy within the PRD

## What This Domain Does NOT Cover

- External criteria compliance: whether constraint decisions align with policy documents, brownfield invariants, or logical consistency rules. This is handled by Pre-Apply Review (`pre_apply.review_completed` event) before PRD generation.
- Surface quality or visual correctness
- Build Spec structural integrity (handled by compile defense)
- Code implementation correctness

## Required Concept Categories

| Category | Description | Risk if Missing |
|----------|------------|----------------|
| Constraint decisions | inject/defer/override/clarify decisions and their rationale | Traceability breaks, PO cannot verify decision chain |
| Implementation items | IMPL entries linking constraints to concrete work | Gap between decision and execution becomes invisible |
| Change items | CHG entries specifying file-level modifications | Builder cannot determine what to change |
| Validation items | VAL entries defining pass/fail criteria | No verification criteria for completed work |
| Brownfield context | Existing codebase files, APIs, schemas, configs, invariants | New features may break existing functionality |
| User journeys | 4-act narratives covering happy and exception paths | PO cannot verify user experience completeness |

## PRD Sections in Scope

All 14 sections of the PRD are subject to this domain's verification:

1. Brownfield Sources
2. Executive Summary
3. Goal Metrics
4. Success Criteria
5. Product Scope
6. User Journeys
7. Domain-Specific Requirements
8. Technical Requirements
9. Functional Requirements
10. Non-Functional Requirements
11. Pre-Apply Review
12. QA Considerations
13. Event Tracking
14. Appendix (Traceability Matrix + Text Wireframes)

## Related Documents

- concepts.md — Term definitions within this scope
- competency_qs.md — Questions the PRD must answer
- structure_spec.md — Structural requirements for the PRD
- logic_rules.md — Constraint-to-constraint logical rules
- dependency_rules.md — Brownfield reference rules
- extension_cases.md — PRD extension scenarios
- conciseness_rules.md — Redundancy and granularity criteria
