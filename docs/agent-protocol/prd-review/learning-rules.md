# Learning Rules -- PRD Review

> This file defines learning storage and consumption rules for the PRD review process.
> Agents self-load this file and their individual learning files at the start of each review.

## Storage Location

All learnings are stored at project level:

```
prd-review/learnings/prd_{perspective}.md
```

One file per perspective. The philosopher's learnings are stored in `prd-review/learnings/philosopher.md`.

There is no global-level storage. PRD review learnings are specific to the project's PRD patterns and do not generalize across projects.

## Entry Format

```markdown
- [{type}] [{axis tags}] [{purpose type}] {learning content} (source: {scope-id}, {date}) [impact:{severity}]
```

### Type Tags

- `[fact]`: Objective observation about PRD structure, patterns, or rules. Accumulation does not introduce judgment bias.
- `[judgment]`: Value judgment about PRD quality. Validity may change with context.

### Axis Tags

- `[methodology]`: Practical verification technique applicable to any PRD regardless of project domain.
- `[domain/prd-integrity]`: Learning specific to PRD integrity verification.

A single learning can carry both tags.

### Purpose Type Tags

- `[guardrail]`: Prohibition/warning derived from failure experience. Must contain all 3 elements:
  - **Situation**: the specific action taken and context
  - **Result**: the negative outcome
  - **Corrective action**: what should be done instead
- `[foundation]`: Foundational knowledge prerequisite for other learnings.
- `[convention]`: Terminology, notation, or procedure agreement.
- `[insight]`: All learnings that do not qualify as the above 3 types (default).

### Impact Severity

- `[impact:high]`: Ignoring this learning could cause a material PRD defect (missing constraint, misleading FR, PO misjudgment), or reaching the same conclusion without this learning would require significant investigation.
- `[impact:normal]`: Neither criterion met.

## Guardrail Template

```markdown
- [judgment] [domain/prd-integrity] [guardrail] **Situation**: {what was found in the PRD and why it seemed acceptable}. **Result**: {what went wrong -- PO misunderstood, Builder implemented incorrectly, etc.}. **Corrective action**: {what the PRD should contain instead}. (source: {scope-id}, {date}) [impact:high]
```

## Consumption Rules

When an agent loads its learning file at the start of a review:

1. Items with `[methodology]` tag: always apply.
2. Items with `[domain/prd-integrity]` tag: always apply.
3. Items without tags (legacy): treat as `[methodology]`.

## No Global Promotion

PRD review learnings remain at the project level. There is no promotion to a global knowledge base. The rationale: PRD patterns are shaped by the specific project's domain, constraint history, and document conventions. Cross-project generalization risks applying incorrect assumptions.

## No Audit/Curation Infrastructure

Learnings accumulate in flat markdown files. There is no scheduled curation, no automated audit, and no promotion ceremony. If a learning becomes invalid, the agent attaches an event marker during the review where invalidity was detected:

```markdown
<!-- applied-then-found-invalid: {date}, {session-id}, {reason} -->
```

Event markers are informational. No automated action is taken based on them.
