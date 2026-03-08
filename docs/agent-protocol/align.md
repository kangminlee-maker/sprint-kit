# /align Protocol

사용자가 Align Packet을 검토하고 결정을 내립니다.

## 입력

```
/align {verdict}
```

verdict 종류: `approve`, `revise {피드백}`, `reject {사유}`, `redirect`

## 전제 조건

- 현재 상태가 `align_proposed`여야 합니다
- `build/align-packet.md`가 존재해야 합니다

## 실행 순서

### 1. 현재 상태 확인

```typescript
import { readEvents } from "src/kernel/event-store";
import { reduce } from "src/kernel/reducer";

const state = reduce(readEvents(paths.events));
```

현재 상태가 `align_proposed`가 아니면 사용자에게 안내합니다.

### 2. Stale 검사

이벤트 기록 전에 소스 해시를 비교합니다.

- 로컬 소스(`--add-dir`): 파일 해시를 `state`의 `grounding.completed` 시점 해시와 비교
- 불일치 발견 시: 사용자에게 경고. "소스가 변경되었습니다. 재스캔하시겠습니까?"

### 3. Verdict 처리

#### approve

방향과 범위를 확정합니다.

```typescript
appendScopeEvent(paths, {
  type: "align.locked",
  actor: "user",
  payload: {
    locked_direction: "확정된 방향 한 문장",
    locked_scope_boundaries: {
      in: ["확정된 포함 목록"],
      out: ["확정된 제외 목록"],
    },
    locked_in_out: true,
  },
});
```

사용자가 포함/제외 항목을 수정한 경우, 수정된 목록을 반영합니다.

#### revise

피드백을 반영하여 Align Packet을 재렌더링합니다.

```typescript
appendScopeEvent(paths, {
  type: "align.revised",
  actor: "user",
  payload: {
    revision_count: state.revision_count_align + 1,
    feedback_scope: "수정 범위 (예: tension, scope)",
    feedback_text: "사용자 피드백 원문",
    packet_path: "build/align-packet.md",
    packet_hash: contentHash(updatedMarkdown),
  },
});
```

**Convergence Safety:**
- 3회 revise: `convergence.warning` 관찰 이벤트 기록. 패턴 요약 제시.
- 5회 revise: `convergence.diagnosis` 기록. 진단 + 3가지 선택지 제시.
- 7회 revise: `convergence.blocked` 기록. 사용자가 선택해야 진행 가능.

#### reject

scope를 거절합니다.

```typescript
appendScopeEvent(paths, {
  type: "scope.rejected",
  actor: "user",
  payload: {
    reason: "거절 사유",
    rejection_basis: "거절 근거",
  },
});
```

#### redirect

정보가 부족하여 grounding으로 복귀합니다.

```typescript
appendScopeEvent(paths, {
  type: "redirect.to_grounding",
  actor: "user",
  payload: {
    from_state: "align_proposed",
    reason: "복귀 사유",
  },
});
```

### 4. scope.md 확인

이벤트 기록 후 `scope.md`가 자동 갱신됩니다 (event-pipeline이 처리). 갱신된 현황을 사용자에게 안내합니다.

## 다음 단계

- approve 후: `/draft`로 Surface 생성 단계로 진행
- revise 후: 수정된 Align Packet을 다시 `/align`으로 검토
- reject 후: scope 종료
- redirect 후: 추가 소스를 확보한 뒤 `/start`부터 재실행
