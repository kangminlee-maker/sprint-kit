---
version: 1
last_updated: "2026-03-30"
source: manual
status: established
---

# PRD Integrity Domain — Extension Cases

Scenarios where the current PRD structure or verification rules may need to accommodate new requirements. Each case describes the extension scenario, what currently works, and what would need to change.

## EC-1: New constraint decision type

**Scenario**: A new decision type is introduced beyond inject, defer, override, clarify, and modify-direction.

**Current accommodation**: The Traceability Matrix's Decision column accepts string values. A new decision type would appear in the matrix without structural changes.

**What would need to change**: Logic rules (LR-1 through LR-5) define behavior per decision type. A new type would require adding its specific rules (e.g., does it generate an IMPL chain? does it require rationale?). The `ConstraintDecision` union type in `kernel/types.ts` would need the new value. Competency questions Q2 and Q8 would need updated checks.

## EC-2: New PRD section

**Scenario**: A 15th section is added to the PRD (e.g., "Accessibility Requirements" or "Internationalization Plan").

**Current accommodation**: The YAML front matter does not enumerate section names — it records `section_count`. The PRD body uses Markdown headings with no enforced ordering mechanism.

**What would need to change**: `structure_spec.md` must add the section to the required list. `domain_scope.md` must update the "PRD Sections in Scope" list. The `section_count` in `PrdRenderedPayload` would increase. Competency questions may need new entries depending on the section's content.

## EC-3: Multi-scope PRDs

**Scenario**: A product change spans multiple scopes, and the PRD needs to reference decisions from other scopes (e.g., "CST-3 from scope retention-payment-20260317-001 is a prerequisite").

**Current accommodation**: The YAML front matter's `scope_id` is singular. The Traceability Matrix CST-IDs are local to the current scope. Cross-scope references are not structurally supported.

**What would need to change**: The YAML front matter would need an `externalDependencies` field listing referenced scope IDs. The Traceability Matrix would need a column or prefix distinguishing local vs external CST-IDs. Dependency rule DR-3 would need to extend its validation to include external scope brownfield data.

## EC-4: New brownfield source type

**Scenario**: A new source type is added to `SourceEntry` (e.g., `notion-page`, `confluence-space`) that produces brownfield context.

**Current accommodation**: `BrownfieldContext` is source-type-agnostic — it stores files, dependencies, APIs, schemas, and configs regardless of where they came from. Technical Requirements reference brownfield entries by content, not by source type.

**What would need to change**: Dependency rules (DR-1 through DR-6) would not need structural changes as long as the new source type produces standard `BrownfieldContext` entries. The Brownfield Sources section of the PRD would list the new source type. No logic rule changes required.

## EC-5: Service-specific customization

**Scenario**: Domain documents are specialized per service (e.g., podo-specific PRD rules that add "Lesson Schedule Integrity" checks not applicable to other services).

**Current accommodation**: The current domain documents are service-agnostic. The `projectInfo` field in YAML front matter carries service-specific metadata, but verification rules do not branch on it.

**What would need to change**: An overlay mechanism — service-specific rule files that extend (not replace) the base domain documents. For example, `domains/prd-integrity/overlays/podo/additional_logic_rules.md` that adds podo-specific LR rules. The review agent would load base rules + applicable overlay. The extension_cases.md (this file) and domain_scope.md would document the overlay structure.

## EC-6: New review perspective

**Scenario**: A 9th review perspective is added to the PRD review process (e.g., `prd_accessibility`).

**Current accommodation**: `PrdReviewPerspective` is a union type in `kernel/types.ts`. The `PrdReviewCompletedPayload` records which perspectives were used in the `perspectives` array. The review process does not enforce a fixed number of perspectives.

**What would need to change**: The new perspective value must be added to the `PrdReviewPerspective` union type. A corresponding domain document or section must define what the new perspective verifies. Competency questions relevant to the new perspective should be added to `competency_qs.md`. No structural changes to the event system or payload format are needed.

## Related Documents

- domain_scope.md — Current scope boundaries
- structure_spec.md — Current structural requirements
- logic_rules.md — Current logic rules that extensions may affect
- concepts.md — Type definitions referenced by extensions
