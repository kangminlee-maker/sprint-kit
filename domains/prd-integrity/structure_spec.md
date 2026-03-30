---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Structure Specification

Structural requirements for the PRD document. The authoritative source of truth for PRD structure is `docs/agent-protocol/draft-prd.md`. This document specifies the verification criteria applied to that structure; it does not duplicate the full spec.

## Required Sections

All 14 sections must be present in the PRD. A missing section is a structural failure:

1. Brownfield Sources
2. Executive Summary (includes Goal Metrics subsection)
3. Success Criteria
4. Product Scope
5. User Journeys
6. Domain-Specific Requirements
7. Technical Requirements
8. Functional Requirements
9. Non-Functional Requirements
10. Pre-Apply Review
11. QA Considerations
12. Event Tracking
13. Appendix — Traceability Matrix
14. Appendix — Text Wireframes

## YAML Front Matter Requirements

The YAML front matter block must include all of the following fields:

| Field | Type | Description |
|-------|------|-------------|
| scope_id | string | Scope identifier matching the scope directory name |
| version | string | PRD version (e.g., "1.0") |
| status | string | Must be "compiled" at generation time |
| created_at | string | Timestamp of scope.created event |
| compiled_at | string | Timestamp of compile.completed event |
| projectInfo | object | name, service_type, domain_entities, and project-specific metadata |
| inputDocuments | object | brief, align_packet, draft_packet, build_spec, validation_plan — each with path and hash |
| constraintSummary | object | total, inject, defer, override, invalidated counts |
| changeLog | array | Key state transition events with event type, date, and summary |

## Traceability Matrix Requirements

Each row in the Traceability Matrix must contain:

| Column | Required | Validation |
|--------|----------|-----------|
| CST-ID | yes | Must match a constraint_id in the constraint pool |
| Decision | yes | One of: inject, defer, override (clarify must be resolved before PRD) |
| IMPL-ID | conditional | Required when Decision === "inject" |
| CHG-IDs | conditional | Required when Decision === "inject" |
| VAL-ID | conditional | Required when Decision === "inject" |

Rows with defer or override decisions may leave IMPL-ID, CHG-IDs, and VAL-ID empty but must include the Decision column.

## User Journey Requirements

Each User Journey must follow the 4-act structure:
- **Opening Scene**: Entry context (persona, current state, how they reach the app)
- **Rising Action**: Screen-by-screen actions with URL paths and UI element references
- **Climax**: Core action (payment, registration, entry, etc.)
- **Resolution**: Outcome confirmation and next action

Each Journey must specify: persona (name, age, occupation, situation), path type (Happy Path or Exception Path).

## Functional Requirements Requirements

- Grouped by screen or page
- Each FR must cite its source (CST reference)
- Each FR with a `[BROWNFIELD]` tag must reference an existing feature
- Sub-FRs are permitted only when they describe different user actions or different system states

## Section Depth Uniformity

All sections must have comparable detail level. A section with only a single sentence when other sections contain multiple paragraphs with tables is a structural failure. The review agent compares relative detail depth across sections.

## Related Documents

- draft-prd.md — Authoritative PRD structure specification (SSOT)
- competency_qs.md — Q5 (YAML front matter), Q4 (User Journeys), Q6 (Brownfield tags)
- conciseness_rules.md — Granularity criteria for sub-FRs
