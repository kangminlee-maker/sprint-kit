# Case View Template

## 목적

`case.md`는 Change Case의 현재 상태를 사람이 읽기 쉽게 보여주는 문서다.

이 문서는 시스템의 정본이 아니다.
정본은 `events.ndjson`이다.

즉:

- `events.ndjson`은 "무슨 일이 있었는가?"를 쌓는다
- `case.md`는 "지금 상태가 무엇인가?"를 보여준다

`case.md`의 역할은 세 가지다.

1. 현재 상태를 빠르게 파악하게 한다
2. 다음 판단 지점이 어디인지 알려준다
3. compile / apply / validate 준비 상태를 보여준다

## 위치

각 Change Case의 현재 상태 뷰는 아래에 렌더된다.

```text
cases/{change-id}/case.md
```

관련 파일:

- `cases/{change-id}/events.ndjson`
- `cases/{change-id}/surface/`
- `cases/{change-id}/build/`

## 중요한 원칙

`case.md`는 직접 편집하는 문서가 아니다.

정상 흐름은 항상 이렇다.

```mermaid
flowchart LR
    A[새 이벤트 추가] --> B[state reducer]
    B --> C[current case state]
    C --> D[case.md 렌더]
```

즉 상태 변경은 `case.md` 수정으로 일어나면 안 된다.
상태 변경은 반드시 이벤트 추가로만 일어나야 한다.

## 이 문서가 답해야 하는 질문

좋은 `case.md`는 아래 질문에 바로 답할 수 있어야 한다.

1. 이 change case는 지금 어느 단계에 있는가?
2. 현재 승인된 방향과 목표는 무엇인가?
3. 어떤 evidence를 근거로 움직이고 있는가?
4. 남아 있는 blocking gap은 무엇인가?
5. compile이 가능한 상태인가?
6. 최근 apply / validate 결과는 무엇인가?
7. 지금 사람이 해야 할 다음 행동은 무엇인가?

## 기본 템플릿 구조

```md
---
change_id: CC-2026-001
title: Tutor Block Change
status: target_approved
entry_mode: discovery
change_class:
  - experience_change
authority:
  requester: PM
  direction_approver: Product Owner
  target_approver: Product Owner
current_revision: 14
snapshot_revision: 5
compile_ready: false
blocking_gaps: 1
created_at: 2026-03-07T10:00:00Z
updated_at: 2026-03-07T12:30:00Z
---

# Change Case

## 1. Summary
- current stage:
- next expected action:
- current risk level:

## 2. Intent Card
- why:
- who_for:
- requested_change:
- forbidden_moves:
- success_conditions:

## 3. Reality Snapshot
- current behavior summary:
- relevant constraints summary:
- snapshot freshness:
- source summary:

## 4. Evidence Index
| Evidence ID | Claim | Source | Confidence | Location |
|-------------|-------|--------|------------|----------|

## 5. Direction Status
- latest direction summary:
- JP1 verdict:
- approved direction baseline:
- open direction issues:

## 6. Target Status
- current target summary:
- linked surface:
- JP2 verdict:
- approved hidden requirement decisions:

## 7. Gap Register Summary
| Gap ID | Type | State | Severity | Decision | Notes |
|--------|------|-------|----------|----------|-------|

## 8. Compile Status
- compile_ready:
- blockers:
- last compile result:
- injected constraints summary:

## 9. Build Outputs
- delta set:
- execution pack:
- validation plan:

## 10. Apply / Validate Status
- latest apply result:
- latest validation result:
- rollback note:

## 11. Timeline
| Revision | Event Type | Meaning | Timestamp |
|----------|------------|---------|-----------|
```

## 섹션별 설명

### Frontmatter

여기는 현재 상태를 기계와 사람이 동시에 빨리 파악하기 위한 요약이다.

특히 중요한 필드:

- `status`: 현재 상태 머신 위치
- `current_revision`: 최신 이벤트 revision
- `snapshot_revision`: 현재 snapshot이 어떤 기준인지
- `compile_ready`: 지금 compile 가능한지
- `blocking_gaps`: 남아 있는 막힘 수

### 1. Summary

문서 맨 위에서 지금 무슨 상태인지 한눈에 보여준다.
사용자가 문서를 처음 열었을 때 여기만 읽어도 현재 상황을 알아야 한다.

### 2. Intent Card

왜 이 변경을 하는지와 무엇이 금지되는지 보여준다.
이 섹션은 change의 존재 이유를 잊지 않게 한다.

### 3. Reality Snapshot

현재 시스템 현실을 짧게 요약한다.
이 내용은 사건 로그에서 가져오지만, 사람은 요약으로 읽는다.

### 4. Evidence Index

주요 주장과 근거를 연결한다.
이 섹션은 "왜 이렇게 판단했는가?"를 추적하는 기준이다.

### 5. Direction Status

JP1 관련 상태를 보여준다.

예:

- 방향이 아직 draft인지
- 승인됐는지
- revise 상태인지

### 6. Target Status

JP2 관련 상태를 보여준다.

예:

- 어떤 preview 또는 contract diff가 현재 판단 대상인지
- target이 승인됐는지
- hidden requirement 결정이 끝났는지

### 7. Gap Register Summary

현재 남아 있는 hidden requirement와 gap 상태를 요약한다.
여기서 `decision_required`나 `conflict`가 남아 있으면 compile로 가면 안 된다.

### 8. Compile Status

가장 실무적으로 중요한 섹션 중 하나다.

여기서는:

- compile 가능한지
- 왜 막혀 있는지
- 어떤 제약이 inject될 예정인지

를 보여준다.

### 9. Build Outputs

이미 생성된 파생 산출물 위치를 보여준다.

예:

- `delta-set.json`
- `execution-pack.md`
- `validation-plan.md`

### 10. Apply / Validate Status

최근 실행과 검증 결과를 보여준다.
이 섹션은 "개발이 실제로 끝났는가?"를 판단하는 기준이 된다.

### 11. Timeline

모든 이벤트를 다 보여줄 필요는 없지만,
주요 revision과 의미를 따라갈 수 있는 짧은 타임라인이 있어야 한다.

## 사람이 이 문서를 사용하는 방식

### 제품 전문가

이 문서를 읽고:

- 현재 어느 판단 단계인지
- 내가 지금 봐야 할 문서가 JP1인지 JP2인지
- 왜 compile이 막혔는지

를 이해한다.

### 개발자

이 문서를 읽고:

- 승인 상태가 어디까지 왔는지
- 어떤 `Execution Pack`이 최신인지
- snapshot이 stale인지

를 이해한다.

### 운영자 / 시스템

이 문서를 읽고:

- case를 재개할 위치
- 실패 이후 돌아가야 할 단계

를 이해한다.

## 좋은 `case.md`의 특징

- 현재 상태가 한눈에 보인다
- 이벤트 로그를 몰라도 상황을 이해할 수 있다
- 문서 간 링크가 분명하다
- 막힘과 다음 행동이 명확하다

## 나쁜 `case.md`의 특징

- 이벤트를 읽지 않으면 현재 상태를 알 수 없다
- JP1/JP2/compile 상태가 섞여 있다
- blocker가 어디서 생겼는지 알 수 없다
- 다음 행동이 드러나지 않는다

## 완료 판정

`case.md`는 아래 상태면 잘 만들어진 것이다.

- 사람이 현재 상태와 다음 행동을 바로 알 수 있다
- 승인 상태와 blocker를 바로 찾을 수 있다
- `events.ndjson`를 직접 열지 않아도 된다

아래 상태면 아직 미완료다.

- "결국 로그를 다 읽어야 한다"
- "현재 방향 승인됐는지 모르겠다"
- "왜 compile이 막혔는지 모르겠다"

그 상태면 `case.md`는 current view 역할을 못 하고 있는 것이다.
