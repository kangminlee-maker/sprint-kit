# Align & Draft Packet Templates

이 문서는 Align Packet과 Draft Packet의 공식 템플릿을 정의합니다.
각 섹션의 구조, 필수/선택 항목, 렌더링 규칙을 명시합니다.

완성된 예시는 `docs/golden-example.md` 참조.

---

## Align Packet Template

Align Packet은 사용자의 의도(to-be)와 현재 현실(as-is)을 대면시키고,
충돌 지점(tension)을 보여주어 범위를 확정하는 산출물입니다.

대응 이벤트: `align.proposed` (최초), `align.revised` (수정 시)
저장 위치: `build/align-packet.md`

Align Packet은 전이 이벤트(`align.proposed`)가 artifact 생성을 겸하므로, Draft Packet과 달리 별도 관찰 이벤트가 없습니다.

### Section 1: 당신이 요청한 것 (To-be)

| 항목 | 필수 | 내용 |
|------|------|------|
| **원문** | 필수 | 사용자가 입력한 원본 텍스트. 변형하지 않음 |
| **시스템이 해석한 방향** | 필수 | 시스템이 해석한 한 문장 요약 |
| **제안된 범위 — 포함** | 필수 | 포함할 기능 목록. 각 항목에 "동의하시나요?" 열 |
| **제안된 범위 — 제외** | 필수 | 제외할 기능 목록. 각 항목에 "동의하시나요?" 열 |
| **시나리오** | 필수 | 핵심 사용 시나리오 1~3개 권장 (scope 복잡도에 따라 조정 가능). 구체적 행위자와 행동 포함 |

규칙:
- 포함/제외 각 항목에 대해 사용자 동의를 개별 요청
- 시스템이 임의로 포함/제외를 확정하지 않음

### Section 2: 현재 현실 (As-is)

3개 관점별로 현재 상태를 기술합니다.

| 관점 | 제목 형식 | 내용 |
|------|----------|------|
| **Experience** | `Experience 관점 — 지금 사용자가 보는 것` | 현재 화면, 흐름, 사용자가 할 수 있는/없는 것 |
| **Policy** | `Policy 관점 — 지금 적용되는 규칙` | 관련 약관, 규정, 운영 정책 |
| **Code** | `Code 관점 — 지금 시스템이 할 수 있는 것` | 현재 시스템의 기술적 능력과 한계. 비즈니스 영향 중심으로 서술 |

규칙:
- 비즈니스 영향 중심으로 서술. 기술 상세는 `<details>` 안에 접어둠
- `<details><summary>기술 상세 (Builder 참고용)</summary>` 패턴 사용
- 기술 용어는 유지하되, 첫 등장 시 괄호 안에 설명

### Section 3: 충돌 지점 (Tension)

요청(to-be)과 현실(as-is)이 충돌하는 지점을 보여줍니다.
이 단계의 constraint는 방향 수준(direction-level)입니다.

**요약 테이블** (필수):

```
| CST-ID | 관점 | 요약 |
```

**개별 상세** (각 constraint마다, 필수):

| 항목 | 필수 | 내용 |
|------|------|------|
| **이것이 무엇인가** | 필수 | 현재 상태와 충돌의 구체적 설명 |
| **왜 충돌하는가** | 필수 | to-be와 as-is가 왜 양립할 수 없는지 |
| **처리하지 않으면** | 필수 | 이 충돌을 무시하고 진행할 때 일어나는 일 |
| **변경 규모** | 필수 | 이 변경이 얼마나 큰지 (화면만 / 내부 로직 / 정책 검토 등) |
| **선택지** | 선택 | Align 단계에서 방향 판단에 필요한 경우에만 제시 |
| **기술 상세** | 선택 | `<details>` 안에 접어둠 |

### Section 4: 지금 결정할 것 (Decision)

| 항목 | 필수 | 내용 |
|------|------|------|
| **질문 목록** | 필수 | 범위 동의, 충돌 인지, 열린 질문 처리 시점 |
| **선택지** | 필수 | Approve / Revise / Reject / Redirect |

### Interface scope 차이점

`interface` scope의 Align Packet에는 추가 항목이 포함됩니다:

| 추가 항목 | 내용 |
|-----------|------|
| **API 공개 범위** | public / internal |
| **하위 호환(breaking change) 허용 여부** | 허용 / 금지 / 조건부 |
| **버전 정책** | 새 버전 / 기존 버전 확장 |

이 항목들은 Align에서 잠기며, Draft 이후 변경 불가입니다.

---

## Draft Packet Template

Draft Packet은 확정된 surface에 대해 deep constraint discovery를 수행한 결과를 보여주고,
각 constraint에 대한 결정을 요청하는 산출물입니다.

대응 이벤트: `draft_packet.rendered` (관찰 이벤트)
저장 위치: `build/draft-packet.md`

### Section 1: 확정된 Surface

| 항목 | 필수 | 내용 |
|------|------|------|
| **scope type** | 필수 | `experience` 또는 `interface` |
| **surface location** | 필수 | surface 파일 경로 |
| **실행 방법** | experience만 | mockup 실행 명령어 |
| **mockup 반복** | experience만 | 수정 횟수, 최종 revision 번호 |
| **시나리오 가이드** | 필수 | mockup에서 확인한 시나리오 테이블: 시나리오 / 시작 / 동작 순서 / 확인된 동작 |

### Section 2: 현재까지의 결정 현황

| 항목 | 필수 | 내용 |
|------|------|------|
| **Align에서 결정** | 필수 | 방향 승인, 범위 확정, Tension 인지 내역 |
| **Draft에서 결정 필요** | 필수 | 총 건수, 결정 완료 건수, 미결정 건수 |
| **잠금 조건** | 필수 | `clarify` 상태 항목이 있으면 잠글 수 없음 |

### Section 3: 결정이 필요한 항목

시스템이 확정된 surface에 대해 3개 관점으로 deep discovery를 수행한 결과입니다.
Grounding(Align 단계)에서 발견된 constraint는 같은 CST-ID로 재표현됩니다.
새 이벤트가 발행되는 것이 아니라, 렌더러가 확정 surface 기준으로 더 구체적인 선택지를 생성합니다.

constraint가 0건인 경우: "발견된 제약 없음"을 표시하고, Section 6(결정)은 constraint 결정 없이 Approve만 요청합니다.

**요약 테이블** (필수):

```
| CST-ID | 관점 | 요약 | severity(중요도) |
```

severity(중요도 — 이것 없이 기능이 작동하는가 여부): `required` → "필수", `recommended` → "권장". Builder 결정 항목은 "(Builder 결정)" 표기.
순서: required → recommended. 같은 severity 내에서는 CST-ID 순.

**개별 상세 — Product Owner 결정 항목** (각 constraint마다):

| 항목 | 필수 | 내용 |
|------|------|------|
| **상황** | 필수 | 현재 상태와 이 constraint가 존재하는 이유 |
| **처리하지 않으면** | 필수 | 무시할 때 일어나는 일 |
| **선택지 테이블** | 필수 | 선택 / 내용 / 리스크 / 되돌림 비용 |
| **추천** | 필수 | 시스템 추천과 근거. 선택지가 1개여도 사용자에게 물어야 함 |

**개별 상세 — Builder 결정 항목**:

| 항목 | 필수 | 내용 |
|------|------|------|
| **상황** | 필수 | 현재 상태 |
| **처리하지 않으면** | 필수 | 무시할 때 일어나는 일 |
| **Builder가 결정할 사항** | 필수 | 무엇을 결정해야 하는지 |
| **이 작업 관점에서의 판단** | 필수 | 시스템이 보는 맥락과 추천. 되돌림 비용 포함 |

Product Owner는 Builder 결정 항목을 직접 결정하지 않습니다.
Product Owner의 역할: guardrail(제품 관점의 제약 조건 — "이것만은 반드시 지켜야 한다"는 조건)을 확인하고, Builder에게 위임함을 승인합니다.
표기: "선택: ___" 대신 "Builder 결정 예정 — guardrail 확인 후 승인: ___"

Builder 결정 항목에도 product guardrail이 있으면 명시합니다.
예: "기존 API 응답 형식을 깨지 않는다"

### Section 4: 시스템이 제외한 항목 (Invalidated)

redirect.to_align 후 re-discovery에서 시스템이 관련성 소멸로 판단한 항목입니다.
이 섹션은 redirect 이력이 있는 경우에만 표시됩니다.
redirect 이력이 없으면 이 섹션은 생략되며, 이후 섹션 번호(5, 6)는 그대로 유지됩니다.

| 항목 | 필수 | 내용 |
|------|------|------|
| **요약 테이블** | 필수 | CST-ID / 관점 / 요약 / 제외 사유 |
| **재활성화 안내** | 필수 | "동의하지 않으면 해당 항목을 결정 목록으로 복원할 수 있습니다" |

`required` severity constraint가 제외 제안된 경우, 별도 확인을 요청합니다:
"이 항목은 기능 불능 또는 규정 위반으로 분류되었습니다. 제외에 동의하시나요?"

### Section 5: 제약 조건

Align에서 잠긴 방향과 확정된 surface에서 도출된 구현 제약입니다.
사용자가 결정하는 항목이 아니라, 이미 확정된 범위에서 자동으로 따라오는 조건입니다.

규칙:
- 각 항목은 한 줄로 서술
- 근거가 명확해야 함 (어디서 도출되었는지)

### Section 6: 지금 결정할 것 (Decision)

| 항목 | 필수 | 내용 |
|------|------|------|
| **결정 요청** | 필수 | 각 CST에 대해 선택 |
| **clarify 안내** | 필수 | clarify를 선택한 항목은 해소될 때까지 잠글 수 없음 |
| **완료 조건** | 필수 | 모든 결정이 완료되면 compile 시작 |
| **선택지** | 필수 | Approve + 각 CST 결정 / Revise / Reject / Redirect to Align |

### Interface scope 차이점

`interface` scope의 Draft Packet은 다릅니다:

| 차이 | Experience scope | Interface scope |
|------|-----------------|-----------------|
| Surface | stateful mockup (React + MSW) | contract diff (API 변경 전후 비교) |
| 시나리오 가이드 | mockup에서 확인한 동작 | API 요청/응답 예시 |
| Constraint | 3관점 모두 | Code/Policy 중심 (Experience는 소비자 관점) |

---

## Rendering Rules

### 용어 표기

| 규칙 | 예시 |
|------|------|
| 기술 용어는 유지, 첫 등장 시 괄호 설명 | `DB 테이블(데이터를 행과 열로 보관하는 저장 공간)` |
| 이후 재등장 시 설명 생략 | `DB 테이블` |
| 관점 이름은 영문 유지 | `Experience`, `Code`, `Policy` |

### 기술 상세 표기

| 규칙 | 패턴 |
|------|------|
| 본문은 비즈니스 영향 중심 | "매칭 시스템이 그 기록을 읽지 않으면 차단된 튜터가 다시 배정됩니다" |
| 기술 상세는 접어둠 | `<details><summary>기술 상세 (Builder 참고용)</summary>...</details>` |
| 소스 코드 참조는 기술 상세 안에 | `matching-engine.ts`의 `findAvailableTutors()` |

### Constraint 표기 패턴

| 항목 | 표기 |
|------|------|
| ID | `CST-001` (scope 내 순차) |
| 관점 | `Experience` / `Code` / `Policy` |
| severity | required → "필수", recommended → "권장" |
| Builder 결정 | "(Builder 결정)" 또는 "(Builder 결정 항목)" |
| 선택지 옵션명 | decision type으로 시작: `inject(추가)`, `defer(보류)`, `override(무시)`, `clarify(확인 필요)`, `modify-direction(방향 변경)` + 구체적 내용. 예: `inject (언어별 5명)`, `clarify (법무 확인)` |
| 추천 표기 | "추천: **inject (구체적 내용)**" — bold로 추천 옵션 강조 |

### 선택지 테이블 규격

Product Owner 결정 항목의 선택지 테이블:

```
| 선택 | 내용 | 리스크 | 되돌림 비용 |
```

- **선택**: decision type + 구체적 내용 (예: `inject (언어별 5명)`)
- **내용**: 이 선택이 무엇을 하는지
- **리스크**: 이 선택의 부정적 가능성
- **되돌림 비용**: 낮음(설정 변경으로 해결) / 중간(코드 수정 또는 외부 절차 필요) / 높음(데이터 마이그레이션 또는 이미 발생한 영향 대응 필요) + 구체적 이유. `clarify` 선택지는 결정 보류이므로 되돌림 비용 해당 없음 ("—"으로 표기)

---

## `draft_packet.rendered` 이벤트

Draft Packet 렌더 완료 시 기록되는 관찰 이벤트입니다.
이벤트 정의와 payload는 `docs/event-state-contract.md`에서 확정합니다 (이 문서는 소유하지 않음).

### 렌더러가 필요로 하는 기록 정보

| 정보 | 이유 |
|------|------|
| packet 경로 + 해시 | artifact 추적 |
| surface 해시 | 어떤 surface를 기반으로 렌더했는지 |
| constraint 총 수 | 빠른 현황 확인 |
| severity 분포 (required / recommended) | 결정 부하 사전 파악 |
| invalidated 수 | redirect 이력이 있는 scope에서 제외 현황 확인 |
