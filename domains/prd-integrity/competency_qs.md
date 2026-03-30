---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Competency Questions

Core questions the PRD must answer. Organized by the two verification axes this domain covers.

## Quality Axis

These questions verify internal consistency, completeness, and structural correctness.

### Q1: Traceability completeness
Does every non-invalidated constraint appear in the Traceability Matrix?
- Check: Each CST-ID in the constraint pool with status !== "invalidated" must have a corresponding row in the Appendix Traceability Matrix.

### Q2: Chain completeness for inject decisions
Does every inject constraint have at least one complete IMPL → CHG → VAL chain referenced?
- Check: For each row where Decision === "inject", all three columns (IMPL-ID, CHG-IDs, VAL-ID) must be populated and reference existing items in the PRD.

### Q3: Functional requirement traceability
Are all functional requirements traceable to a constraint decision?
- Check: Every FR in Section 9 (Functional Requirements) must cite a source CST reference. No orphan FRs.

### Q4: User Journey coverage
Do User Journeys cover all Surface scenarios?
- Check: The scenario_guide from the confirmed Surface must have a corresponding Journey. Exception paths must have separate Journeys.

### Q5: YAML front matter completeness
Is the YAML front matter complete and accurate?
- Check: All required fields present (scope_id, version, status, created_at, compiled_at, projectInfo, inputDocuments, constraintSummary, changeLog). Hash values must match the actual referenced files.

### Q6: Brownfield tag accuracy
Are all [BROWNFIELD] tags placed on features that exist in the current system?
- Check: Every FR marked [BROWNFIELD] must reference a file or API that exists in BrownfieldContext or BrownfieldDetail. No [BROWNFIELD] tag on features listed as new elsewhere in the PRD.

### Q7: Goal Metrics measurability
Do Goal Metrics have both Current and Target values?
- Check: The Goal Metrics table must have Current and Target columns populated for every row. Target values must be quantifiable.

## Judgment Fitness Axis

These questions verify whether the PRD provides sufficient information for PO to make correct decisions.

### Q8: Decision rationale transparency
Can PO understand why each constraint was decided the way it was?
- Check: Each constraint in the Traceability Matrix with a decision must have a rationale accessible from the PRD (either inline or via cross-reference to the constraint pool).

### Q9: Trade-off visibility
Are trade-offs between competing constraints visible?
- Check: When two or more inject decisions affect the same component or user flow, the PRD must make the interaction explicit. Cross-constraint effects must not be buried in individual constraint descriptions.

### Q10: Defer consequence clarity
Does each deferred constraint explain what happens if it is not addressed?
- Check: Each defer decision must include impact_if_ignored content, either in the Traceability Matrix or in the relevant section body.

### Q11: Residual risk identification
Can PO identify what risks remain after applying this change?
- Check: Non-Functional Requirements and QA Considerations must collectively surface risks that persist even after all inject decisions are implemented. Compile defense warnings (L3) should be reflected.

### Q12: Executive Summary actionability
Is the Executive Summary actionable — can PO say "proceed" or "stop" based on it?
- Check: The Executive Summary must contain the change purpose, expected outcomes, key trade-offs, and a clear success/failure criterion. It must not require reading other sections to form a proceed/stop judgment.

### Q13: Exception path detail parity
Are exception paths (failure scenarios) as detailed as happy paths?
- Check: Exception path User Journeys must have the same 4-act structure (Opening Scene, Rising Action, Climax, Resolution) as happy path Journeys. QA Considerations must cover the same exception scenarios.

### Q14: Change vs stability boundary
Does the PRD make clear what will change vs what will stay the same?
- Check: Product Scope must explicitly list in-scope and out-of-scope items. [BROWNFIELD] tags in Functional Requirements must distinguish "existing and unchanged" from "existing and modified."

## Related Documents

- domain_scope.md — Verification axes definition
- concepts.md — Term definitions for constraint, CST/IMPL/CHG/VAL, brownfield
- logic_rules.md — Logical rules that underpin Q2, Q3, Q9
