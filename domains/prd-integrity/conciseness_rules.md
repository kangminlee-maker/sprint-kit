---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Conciseness Rules

Rules for managing redundancy and granularity within the PRD. The goal is to ensure the PRD is complete without being bloated — every piece of information should appear either once or as a deliberate cross-reference.

## Allowed Redundancy

The following forms of repetition are intentional and permitted:

- **Cross-references between sections**: A Functional Requirement citing its source CST in Section 9 (Functional Requirements) and the same CST-ID appearing in the Appendix Traceability Matrix. Both occurrences serve different purposes (inline traceability vs comprehensive index).
- **Journey referencing FR by ID**: A User Journey mentioning "the user taps the CTA (FR-12)" in its Rising Action. The Journey provides narrative context; the FR provides specification detail.
- **Pre-Apply Review findings restated in relevant sections**: A Pre-Apply Review finding about a policy constraint may be summarized in Domain-Specific Requirements with additional context. The Pre-Apply Review section records the original finding; the domain section applies it.
- **YAML front matter constraint counts echoed in Executive Summary**: The constraintSummary in front matter and a prose summary in Executive Summary serve different consumers (machine vs human).

## Removal Targets

The following forms of repetition add no value and must be eliminated:

- **Verbatim duplication of constraint text**: If the same constraint's `summary` text appears identically in Success Criteria, Functional Requirements, and the Traceability Matrix without adaptation to each section's purpose, the duplicates in Success Criteria and Functional Requirements must be rewritten to serve their section's specific function or replaced with a CST-ID reference.
- **Executive Summary restating Goal Metrics table**: The Executive Summary should synthesize the metrics into a narrative. Reproducing the Goal Metrics table verbatim in both locations wastes space without adding interpretation.
- **Same edge case in both QA Considerations and User Journeys without cross-reference**: If an edge case appears as a QA test scenario and also as an Exception Path Journey, one must reference the other (e.g., "See Journey 5 for the full user flow" or "See QA-3 for test criteria"). Without cross-reference, the reader cannot determine whether they describe the same or different scenarios.
- **Functional Requirement detail duplicated in Technical Requirements**: If an FR describes a database write operation and Technical Requirements repeats the same operation description, Technical Requirements should reference the FR-ID and add only the technical implementation detail (schema, migration) not present in the FR.

## Minimum Granularity Criteria

Sub-FRs (e.g., FR-3-1, FR-3-2) are justified only when they describe:
- **Different user actions**: FR-3-1 describes tapping a button; FR-3-2 describes swiping a card. These are distinct interactions.
- **Different system states**: FR-3-1 describes behavior when the user has an active subscription; FR-3-2 describes behavior when the subscription is expired. These are distinct conditions.

Sub-FRs that merely break a single user action into implementation steps (e.g., "validate input," "call API," "update UI") should be consolidated into one FR with a description covering the full flow.

## Measurement

Conciseness measurement criteria are not yet defined. They will be accumulated through learning as PRDs are reviewed and patterns of problematic redundancy are identified. When sufficient patterns are collected, this section will be updated with quantitative thresholds (e.g., maximum acceptable duplication ratio, maximum section length variance).

## Related Documents

- structure_spec.md — Section depth uniformity requirement (complements conciseness)
- competency_qs.md — Q3 (FR traceability), Q13 (exception path detail parity)
- logic_rules.md — LR-8 (Journey and FR alignment)
