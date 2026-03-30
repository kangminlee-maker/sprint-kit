# PRD Multi-Perspective Review

This document defines the multi-perspective review process for PRD integrity verification.
It is executed after `prd.rendered` (status: success) and before `apply.started`.

## Prerequisites

- `prd.rendered` event with `status !== "failed"` exists in events.ndjson
- `pre_apply.review_completed` event with `verdict: pass` exists in events.ndjson
- PRD file at `build/prd.md`

## PRD Integrity: 3-Axis Definition

| Axis | Question | Responsible |
|------|----------|-------------|
| Conformance | Does the PRD align with external criteria (policy, brownfield, logic)? | Pre-Apply Review (existing, in `draft-compile.md`) |
| Quality | Is the PRD internally consistent and complete? | This review |
| Judgment Fitness | Does the PO have sufficient information to make correct decisions? | This review |

The Conformance axis is already covered by the Pre-Apply Review (3-perspective check in `draft-compile.md`). This review focuses on the Quality and Judgment Fitness axes. The two reviews are complementary: Pre-Apply Review checks "are the decisions correct?", while this review checks "is the document that communicates those decisions correct?"

## Verification Agents (8 perspectives)

| Perspective ID | Verification Dimension | Axis | Role File |
|---------------|----------------------|------|-----------|
| `prd_logic` | Logical consistency | Quality | `roles/prd_logic.md` |
| `prd_structure` | Structural completeness | Quality | `roles/prd_structure.md` |
| `prd_dependency` | Brownfield dependency alignment | Quality | `roles/prd_dependency.md` |
| `prd_semantics` | Term consistency and accuracy | Quality | `roles/prd_semantics.md` |
| `prd_pragmatics` | Builder executability + PO judgment sufficiency | Judgment Fitness | `roles/prd_pragmatics.md` |
| `prd_evolution` | Post-implementation extensibility risk | Quality | `roles/prd_evolution.md` |
| `prd_coverage` | Constraint and scenario coverage | Quality | `roles/prd_coverage.md` |
| `prd_conciseness` | Redundancy and over-specification | Quality | `roles/prd_conciseness.md` |

## Philosopher

Purpose alignment mediator. Synthesizes all 8 perspectives to determine whether the PRD serves its dual purpose: (1) PO judgment tool and (2) Builder reference. Resolves contradictions between agents by returning to the brief's original intent. Role definition at `roles/philosopher.md`.

## Review Process

### Step 0: Review Trigger

- **Condition**: `prd.rendered` event exists with `status !== "failed"`
- **If PRD generation failed**: Record `prd.review_completed` with `verdict: "pass"` and findings: `[{perspective: "prd_coverage", severity: "low", summary: "PRD generation failed -- review skipped"}]`. Proceed to apply.

### Step 1: Context Gathering

The review executor collects the following inputs:

1. **PRD**: Read `build/prd.md` (the review target)
2. **Build Spec**: Read `build/build-spec.md` (compile output -- the source data for PRD)
3. **Brief**: Read `inputs/brief.md` (the original change request from PO)
4. **Constraint pool**: Extract from scope state (`state.constraint_pool`)
5. **Scope purpose**: Identify from brief's change objective and expected outcome
6. **Delta-set**: Read `build/delta-set.json` (change items for cross-referencing)
7. **Validation plan**: Read `build/validation-plan.md` (QA items for coverage check)
8. **Surface files**: Read `surface/preview/` (scenarios and wireframes)

### Step 2: Round 1 -- Independent Review

Each verification agent reviews the PRD independently from its specialized perspective.

**Session ID generation**: `$(date +%Y%m%d)-$(openssl rand -hex 4)` (e.g., `20260330-a3f7b2c1`)

**Session directory**: `scopes/{scope-id}/prd-review/{session-id}/round1/`

Each agent:
1. Loads its role definition from `roles/prd_{perspective}.md`
2. Loads its learning file from `prd-review/learnings/prd_{perspective}.md` (if exists)
3. Reads the PRD and relevant context documents
4. Writes findings to `scopes/{scope-id}/prd-review/{session-id}/round1/prd_{perspective}.md`
5. Reports the file path only (not the content)

**Agent Initial Prompt Template** (include in each agent's initial prompt):

```
You are prd_{perspective}, a PRD review agent.

[Identity]
{contents of roles/prd_{perspective}.md}

[Learnings]
{contents of prd-review/learnings/prd_{perspective}.md, or "No prior learnings." if absent}

[Review Target]
{contents of build/prd.md}

[Reference Documents]
- Brief: {contents of inputs/brief.md}
- Build Spec: {contents of build/build-spec.md}
- Constraint pool: {constraint pool summary from state}

[Directives]
- Answer each core question from your role definition specifically.
- If an issue is found: specify (1) what the issue is, (2) why it is an issue from your perspective, and (3) how to fix it.
- If no issues are found, do not just state "no issues" -- provide rationale for why the PRD is correct from your perspective.
- You do not know other agents' perspectives. Judge only from your own perspective.
- Reference past learnings, but ignore learnings that do not apply to the current PRD.

[Report Format]
Write your findings to: scopes/{scope-id}/prd-review/{session-id}/round1/prd_{perspective}.md

Include at the end:

### Newly Learned
- Learning: [{fact|judgment}] [{axis tags}] [{purpose type}] (content) [impact:{severity}]
  - For guardrail type: **Situation**: ... **Result**: ... **Corrective action**: ...
Mark "none" if nothing to report.

### Applied Learnings
- Learning: {summary} (source: {source})
  - "Would there be a finding missed in this review without this learning?" (yes/no)
Mark "none" if no learnings were applied.
```

### Step 3: Philosopher Synthesis

After all 8 agents complete Round 1, deliver their finding file paths to the Philosopher.

The Philosopher:
1. Reads all 8 `round1/prd_{perspective}.md` files
2. Classifies findings into: consensus, contradictions, overlooked premises, new perspectives
3. Determines deliberation necessity
4. If deliberation is not needed: writes the final output directly
5. If deliberation is needed: proceeds to Step 4

**Philosopher synthesis prompt**:

```
Synthesize the verification agents' Round 1 review results.

[Verification Agents' Review Result Files]
Read the files at these paths:
{list of 8 file paths}

[System Context]
- PRD purpose: (1) PO judgment tool, (2) Builder reference
- Brief objective: {brief summary}

[Directives]
Classify findings into:
- Consensus Items: judgments agreed upon by majority of agents
- Contradicting Opinions: conflicting judgments with rationale summaries
- Overlooked Premises: items not mentioned by any agent but requiring examination
- New Perspectives: perspectives derived from the PRD's dual purpose

Determine deliberation necessity. If any:
- Contradicting opinions exist
- Overlooked premises were discovered
- New perspectives require additional examination
→ Answer "needed" and proceed to deliberation.
Otherwise → Answer "not needed" and write the final output directly.
```

### Step 4: Deliberation (conditional)

Executed only if the Philosopher determines "deliberation needed."

- Direct exchange between disagreeing agents on contested points
- Maximum 3 round-trips per contested point
- After deliberation, the Philosopher writes the final output

**Deliberation rules**:
- Before starting, confirm whether definitions of key terms in contested points are aligned among participants. This alignment round-trip does not count toward the 3-trip limit.
- Respond directly to counterpart's arguments. Do not merely repeat your own position.
- If the counterpart's argument is valid, accept it.
- If a new alternative combining both sides is possible, propose it.
- If consensus is not reached after 3 round-trips, each party reports their final position.

**Judgment conflict resolution**: When `prd_conciseness` judges "removal needed" and another agent judges "retention needed," the Philosopher adjudicates from the perspective of the PRD's dual purpose. Simple majority does not apply -- the conciseness perspective is structurally in the minority.

### Step 5: Verdict Determination

Map the Philosopher synthesis to a verdict:

- **pass**: No high-severity findings, or all high-severity findings have consensus resolution
- **gap_found**: At least one unresolved high-severity finding that requires constraint revision or PRD regeneration

The Philosopher writes the final output to `scopes/{scope-id}/prd-review/{session-id}/philosopher_synthesis.md`:

```markdown
---
session_id: {session-id}
process: prd-review
target: "PRD integrity verification"
date: {YYYY-MM-DD}
verdict: pass | gap_found
---

## PRD Review Result

### Review Target
PRD for scope {scope-id}: {brief summary}

### Consensus ({N}/8)
- (List of judgments with full consensus)

### Conditional Consensus
- (Majority consensus + minority reservations with reasons)

### Disagreement (if deliberation occurred)
- [{Factual|Criteria|Value} discrepancy] {description}

### Purpose Alignment Verification
- Does the PRD serve as a PO judgment tool? {assessment}
- Does the PRD serve as a Builder reference? {assessment}

### Immediate Actions Required
- (High-severity findings requiring PRD correction)

### Recommendations
- (Lower-severity findings that can be addressed later)
```

### Step 6: Event Recording

```typescript
appendScopeEvent(paths, {
  type: "prd.review_completed",
  actor: "agent",
  payload: {
    verdict: "pass" | "gap_found",
    perspectives: [
      "prd_logic", "prd_structure", "prd_dependency", "prd_semantics",
      "prd_pragmatics", "prd_evolution", "prd_coverage", "prd_conciseness"
    ],
    findings: [
      // mapped from philosopher synthesis
      {
        perspective: "prd_{perspective}",
        severity: "high" | "normal" | "low",
        summary: "...",
        detail: "...",
      },
    ],
    philosopher_synthesis: "prd-review/{session-id}/philosopher_synthesis.md",
    constraint_gap_id: undefined,  // only if gap_found: "CST-{N}"
    review_session_path: "prd-review/{session-id}/",
  },
});
```

### Step 7: Gap Found Handling

If the verdict is `gap_found`:

1. Inform PO of the identified gap:
   ```
   "PRD 다관점 리뷰에서 문제가 발견되었습니다.

   [발견 내용] {high-severity finding summary}
   [영향] {what breaks if this is not addressed}
   [권장 조치] constraint 보강 후 재컴파일 → PRD 재생성 → 재리뷰

   진행 방식을 선택해 주세요:
   [a] constraint 보강 후 재컴파일
   [b] 현재 상태로 apply 진행 (리스크 수용)"
   ```

2. If PO chooses [a]: Record `compile.constraint_gap_found` event, trigger backward transition to `constraints_resolved` state. The re-compile -> re-PRD -> re-review cycle follows automatically.

3. If PO chooses [b]: Record `prd.review_completed` with `verdict: "pass"` and a finding noting the PO override, then proceed to apply.

### Step 8: Learning Storage

After the review completes (regardless of verdict):

1. Extract learnings from each agent's report (the "Newly Learned" section)
2. Store in `prd-review/learnings/prd_{perspective}.md`
3. Follow the storage format defined in `learning-rules.md`

## Error Handling

- **Single agent failure**: Exclude the failed agent from the synthesis. Adjust consensus denominator (e.g., 7/7 instead of 8/8). Mark in Philosopher prompt: "prd_{perspective}: excluded due to error."
- **2+ agent failures**: Halt the review. Inform PO: "PRD review could not proceed (N agents failed). Proceeding without review."
- **Review process failure**: Record `prd.review_completed` with `verdict: "pass"` and a warning finding: `{perspective: "prd_coverage", severity: "low", summary: "Review process failed -- proceeding without review"}`. This prevents the review from blocking the pipeline.

## PO Notification Format

After successful review:

```
"PRD 다관점 리뷰가 완료되었습니다.

[결과] {pass 또는 gap_found}
[참여 관점] {N}개 관점
[합의 사항] {consensus count}건
[권장 사항] {recommendation count}건

상세 결과: prd-review/{session-id}/philosopher_synthesis.md"
```
