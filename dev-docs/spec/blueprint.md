# Sprint Kit Blueprint

## 이 문서를 읽는 방법

- **Product Owner**: §1~~§3을 순서대로 읽으세요. 접혀 있는 부분(`▶`)은 열지 않아도 됩니다. §4~~§8은 참조용입니다.
- **새 참여자**: §1~§3 본문 + §8(개념 색인)을 먼저 읽으세요. 세부 규칙은 필요할 때 검색하세요.
- **개발자 / AI 에이전트**: 접혀 있는 상세 섹션을 함께 참조하세요. 모든 개념에 고유 ID가 있으며, 문서 내 검색으로 정의를 찾을 수 있습니다. 에이전트 실행 프로토콜 상세는 `docs/agent-protocol/` 참조.
- **특정 개념 검색**: §8(개념 색인)에서 개념 이름으로 찾으세요.
- **변경 규칙**: 이 문서가 시스템의 정의 권한을 가집니다. 개념 추가/변경은 이 문서에서 시작하여 명세 문서 → 코드 순서로 반영합니다. 코드에서 선행 추가된 개념이 있으면, 이 문서에 역반영한 뒤 정의를 확정합니다.

---

## 1. 이 시스템은 무엇인가

> **npm**: [`sprint-kit@1.0.0`](https://www.npmjs.com/package/sprint-kit) | **GitHub**: [`re-speak/sprint-kit`](https://github.com/re-speak/sprint-kit) | **AI 도구**: Claude Code (production), Codex/Cursor (planned)

Sprint Kit은 **constraint-aware translation runtime**(제약 인식 번역 실행기)입니다.

시스템이 하는 일:

1. 사용자의 변경 의도를 받습니다
2. 3개 관점에서 소스를 탐색하여, 사용자가 혼자서는 보지 못할 제약을 발견합니다
3. 발견된 제약을 사용자에게 보여주어, 사용자가 더 정확한 판단을 내리도록 합니다
4. 확정된 판단을 실행 가능한 코드 변경으로 변환합니다

이 시스템이 **아닌** 것:

- 문서를 자동 생성하는 도구가 아닙니다
- 승인을 자동화하는 도구가 아닙니다
- 범용 멀티 에이전트 시스템이 아닙니다

### 3개 역할


| 역할                | 누구             | 책임                              |
| ----------------- | -------------- | ------------------------------- |
| **Product Owner** | 도메인 전문가 (비개발자) | 의도 제공, 범위 확정, 제약 결정             |
| **Builder**       | 개발자 또는 AI 에이전트 | Build Spec 기반 구현, 미발견 제약 에스컬레이션 |
| **System**        | Sprint Kit 런타임 | 소스 탐색, 제약 발견, 산출물 생성, 검증        |


### 프로토콜 문서의 Authority Hierarchy

에이전트 프로토콜 문서(`docs/agent-protocol/`)에서 산문 설명과 코드 예시가 공존할 때, 다음 우선순위를 따릅니다:

1. **산문 = 설계 의도 (source of truth)**. 순서, 조건, 의도를 정의합니다.
2. **코드 예시 = 실행 가이드 (산문에 종속)**. 산문의 의도를 코드로 표현한 것입니다.

산문과 코드 예시가 모순될 때, **산문이 우선**합니다. 코드 예시를 산문에 일치시켜야 합니다.

이 규칙의 배경: LLM 에이전트는 코드 예시를 산문보다 우선 참조하는 경향이 있습니다. 따라서 코드 예시가 부정확하면 산문의 설계 의도가 무효화됩니다.

---

## 2. 3개 관점

**관점(Perspective)**은 소스에서 제약을 찾는 탐색 방향입니다. 3개 관점이 존재하며, 각각 서로 다른 종류의 정보를 드러냅니다.


| 관점             | 드러내는 것                             | 숨기는 것            |
| -------------- | ---------------------------------- | ---------------- |
| **Experience** | 사용자가 보고 만지는 것 — 화면, 흐름, 상호작용       | 내부 구현, 정책 근거     |
| **Code**       | 시스템이 실행하는 것 — API, DB, 모듈, 상태 머신   | 사용자 경험, 사업 규칙 근거 |
| **Policy**     | 규칙이 제약하는 것 — 약관, 규제, 디자인 표준, 운영 정책 | 구현 상세, 사용자 경험    |


이것은 이론적 분류가 아닙니다. "사용자가 놓친 제약을 어디서 찾을 수 있는가"를 알려주는 실용적 탐색 방향입니다.

소스 접근 방법과 관점은 독립적입니다. 하나의 소스가 여러 관점의 정보를 담을 수 있습니다.

소스 접근 방법 (4가지)


| 방법             | 접근 대상                     |
| -------------- | ------------------------- |
| `--add-dir`    | 로컬 파일 또는 디렉토리             |
| GitHub tarball | 원격 GitHub 저장소             |
| Figma MCP      | Figma 디자인 데이터 (MCP 서버 경유) |
| Obsidian vault | 지식 베이스 (마크다운 파일)          |


**Figma MCP의 데이터 경로 차이**: Figma MCP는 다른 소스와 데이터 경로가 다릅니다. 시스템이 직접 스캔하는 것이 아니라 AI 에이전트가 MCP를 통해 조회합니다. stale 감지(소스 변경 감지)도 content hash가 아닌 `lastModified` timestamp 기반이므로, 메타데이터만 변경되어도 stale로 판정될 수 있습니다. Figma MCP는 `ScanResult`를 반환하는 스캐너가 없으므로, Figma 소스에서 발견된 Constraint의 `source_refs`는 Figma 컴포넌트 경로를 사용합니다. Compile Defense의 defer/override 검증에서 Figma `source_refs`는 delta-set의 파일 경로와 직접 비교되지 않으므로, 비간섭/비반영 검증은 Figma 소스에 대해 자동 통과됩니다.



---

## 3. 하나의 Scope가 완료되기까지

시스템은 위의 3개 관점을 하나의 작업 단위(Scope) 안에서 순서대로 적용합니다.

**Scope**(스코프)는 Sprint Kit의 작업 단위입니다. "튜터 차단 기능 추가"처럼 하나의 변경 목표를 담습니다. Scope에는 두 가지 유형이 있습니다:

- **experience**: 사용자 화면/흐름을 변경. Surface는 동작하는 화면(mockup)
- **interface**: API 계약/시스템 인터페이스를 변경. Surface는 계약 변경 전후 비교

하나의 Scope는 다음 흐름을 따릅니다:

```
시작(Intent) → Grounding → Exploration → Align(Gate 1) → Surface 반복 → Draft(Gate 2) → Compile → Pre-Apply Review → Apply → Validate → Close
```

각 단계에서 시스템이 무엇을 하고, 사용자가 무엇을 결정하는지 순서대로 설명합니다.

---

### 3.1 시작: Intent → Grounding

#### 이 단계의 목적

사용자의 변경 의도를 받아, 현재 시스템의 상태를 3개 관점에서 탐색합니다. 이 단계가 없으면, 시스템은 사용자의 의도만 알고 현실을 모릅니다. 현실과 동떨어진 결정이 나옵니다.

#### 사용자가 판단할 사항

- 변경하고 싶은 것을 자유 텍스트로 설명합니다 (예: `/start 튜터 차단 기능`)
- 추가로 탐색할 소스를 지정할 수 있습니다

#### 작동 방식

**Intent**(의도)는 사용자가 이 Scope를 시작한 이유입니다. 문제, 수혜자, 성공 조건을 담습니다.

**Grounding**(현실 탐색)은 시스템이 소스를 읽고 3개 관점에서 현재 상태를 파악하는 과정입니다.

Grounding의 결과물:

- **Reality Snapshot**(현실 스냅샷): 탐색 시점의 시스템 상태를 기록한 것. 이후 소스가 변경되었는지 감지할 수 있습니다.
- **Constraint**(제약): 탐색 중 발견된 "사용자가 혼자서는 보지 못할 제한". 각각 고유 ID(CST-001, CST-002, ...)가 부여됩니다.

이 단계의 탐색 깊이는 **방향 수준**입니다. "이 방향으로 가면 어떤 큰 충돌이 있는가?"를 찾습니다. 세부 구현 제약은 이후 Draft 단계에서 찾습니다.

Grounding Function 상세

**Grounding**

- 입력: 사용자 설명 + 소스 목록
- 출력: Reality Snapshot + 발견된 Constraint 목록
- [GC-001] 각 소스의 content hash(내용 해시 — 내용이 바뀌면 달라지는 고유 값)를 기록한다
- [GC-002] 발견된 각 Constraint에 CST-ID를 순차 부여한다
- [GC-003] 각 Constraint에 severity(필수/권장)와 decision_owner(PO/Builder)를 판정한다
- [GC-019] 발견된 각 Constraint에 대해 정책 문서 교차 대조(Policy Cross-Reference)를 수행하여 `evidence_status`를 판정한다 (verified / code_inferred / brief_claimed / unverified). 정책 문서 접근이 불가능한 환경에서는 `unverified`가 기본값이다

**부분 실패 정책**: 일부 소스 접근에 실패하더라도 Grounding은 완료될 수 있습니다. 실패한 소스는 `failed_sources`로 기록되며, 해당 관점의 탐색이 불완전함을 사용자에게 알립니다.

Grounding 완료 후, Exploration 단계로 진입합니다.

---

### 3.1.5 Exploration (탐색적 문답)

#### 이 단계의 목적

PO의 모호한 의도를 **대화를 통해 실행 가능한 명세로 구체화**합니다. Brief 없이 대화만으로도 시작할 수 있으며, Brief가 있어도 비어 있는 부분을 Exploration에서 채웁니다. 이 단계가 없으면, Brief의 품질이 이후 모든 산출물의 품질을 결정합니다.

#### 사용자가 판단할 사항

- sprint-kit이 제시하는 현재 서비스 상태가 맞는지 확인합니다
- 각 시나리오에서 사용자가 어떤 경험을 하길 원하는지 결정합니다
- sprint-kit이 제시하는 대안 중에서 방향을 선택합니다
- 이번 scope의 포함/제외 범위를 확정합니다

#### 작동 방식

**6개 Phase**를 순차적으로 진행합니다:
1. **목적 정밀화** — PO의 시작점을 "달성하려는 결과(outcome)" 수준으로 재정위합니다
2. **영역 탐색** — 목표에 관련된 서비스 영역을 체계적으로 발견합니다 (퍼널, 엔티티, 터치포인트, 영향 체인)
3. **현재 상태 공유** — 각 영역의 현재 동작을 PO가 이해할 수 있는 언어로 설명합니다
4. **시나리오 탐색** — 각 영역에서 "추출(PO 의도 확인) → 제안(대안 제시) → 확정" 패턴으로 결정합니다
5. **가정 검증** — 축적된 결정에 깔린 암묵적 가정을 드러내고 확인합니다
6. **범위 합의** — 포함/제외를 정리합니다. 이것이 Align Packet의 `proposed_scope` 입력이 됩니다. 최종 확정은 Align approve에서 이루어집니다

대화 전문은 `build/exploration-log.md`에 append-only로 기록됩니다. 이벤트에서 재생성할 수 없는 "왜 그렇게 결정했는가"의 맥락을 보존합니다.

**Exploration Function 상세**

- 입력: PO의 대화 (또는 Brief)
- 출력: 구체화된 scope 범위 (Align Packet 입력) + exploration-log.md
- 이벤트: `exploration.started` (전이 이벤트, grounded → exploring), `exploration.round_completed`, `exploration.phase_transitioned` (전이 이벤트, exploring 자기전이)
- [GC-020] Exploration은 `exploring` 정식 상태에서 진행됩니다. `exploration.started`가 `grounded → exploring` 전이를 유발합니다
- [GC-021] `MAX_EXPLORATION_ROUNDS`(20)를 초과하면 gate-guard가 round_completed를 거부합니다
- [GC-022] exploration-log.md는 공식 artifact입니다. Phase 전환 시 `log_path`와 `log_hash`가 필수 기록됩니다
- ClickHouse MCP가 연결되어 있으면, Phase 2(영역 탐색)와 Phase 5(가정 검증)에서 사용자 행동 데이터로 판단을 보강합니다

#### 회복 경로

- 세션이 중단되면 `current_state: "exploring"`으로 즉시 확인 가능. `exploration-log.md`에서 마지막 Phase와 합의 내용을 읽어 재개합니다
- PO가 이전 결정을 번복하면 해당 Phase로 역행합니다 (이유 명시)

Exploration 완료 후, 시스템은 Align Packet을 렌더링합니다.



#### 회복 경로

- 모든 소스 접근에 실패하면 Grounding이 완료되지 않습니다. 소스를 확보한 후 재실행합니다.
- 일부 소스만 실패하면 부분 Grounding으로 진행하되, 실패한 소스를 기록합니다.

---

### 3.2 Gate 1: Align

#### 이 단계의 목적

사용자의 의도(to-be)를 현재 현실(as-is)과 대면시키고, 충돌 지점을 보여주어 범위를 확정합니다. 이 단계가 없으면, 현실과 충돌하는 방향으로 진행하여 나중에 되돌려야 합니다.

#### 사용자가 판단할 사항

- 제안된 포함/제외 범위에 동의하는지
- 발견된 충돌을 인지한 상태에서 이 방향으로 진행할 것인지
- `interface` scope인 경우: API 공개 범위(public/internal), 하위 호환(breaking change) 허용 여부, 버전 정책도 이 시점에 결정
- Approve(승인) / Revise(수정) / Reject(거절) / Redirect(재탐색) 중 선택

#### 작동 방식

**Align Packet**(정렬 패킷)은 이 단계의 산출물입니다. 4개 섹션으로 구성됩니다:

1. **To-be** — 사용자가 요청한 것. 시스템의 해석, 포함/제외 범위, 시나리오
2. **As-is** — 현재 현실. 3개 관점별 현재 상태
2.5. **미검증 가정 (소스 탐색)** — 시스템이 소스에서 확인하지 못한 전제. 이 전제가 틀리면 아래 Tension의 분석이 달라질 수 있습니다. 미검증 constraint가 없으면 이 섹션은 표시되지 않습니다 (조건부)
2.6. **미검증 가정 (대화 탐색)** — Exploration Phase 5에서 발견된 PO 결정의 전제 중 아직 검증되지 않은 항목. §2.5와 독립적으로 표시됩니다. Exploration을 수행하지 않은 경우 이 섹션은 표시되지 않습니다 (조건부)
3. **Tension** — 충돌 지점. To-be와 As-is가 부딪히는 곳. Grounding에서 발견된 Constraint가 여기 표시됩니다
4. **Decision** — 지금 결정할 것

**Verdict**(판정)는 사용자의 결정입니다:


| Verdict      | 의미           | 결과                                    |
| ------------ | ------------ | ------------------------------------- |
| **Approve**  | 범위와 방향 확정    | Intent, Direction, Scope Boundary가 잠김 |
| **Revise**   | 수정 필요        | Align Packet 재렌더링                     |
| **Reject**   | 이 방향 자체가 부적절 | Scope 종료                              |
| **Redirect** | 정보 부족        | Grounding으로 복귀                        |


Approve 시 Gate 1이 잠기며, 이후 범위 변경(확대와 축소 모두)은 반드시 Align으로 되돌아와야 합니다. `interface` scope에서는 정책 결정(공개 범위, 하위 호환, 버전 정책)도 이 시점에 잠기며, Draft 이후 변경 불가입니다.

**Convergence Safety**(수렴 안전 장치): Revise가 반복되면 시스템이 개입합니다.

- 임계값에 도달하면 패턴 요약 → 진단 보고서 → 강제 중단 순서로 사용자에게 수렴 여부를 묻습니다.
- 강제 중단 후에는 사용자가 (1) 직접 작성, (2) 범위 축소, (3) Align 재검토 중 선택해야 진행됩니다.

Gate Guard: Align 단계 검증 규칙

**Gate Guard**(관문 검증기)는 새 이벤트가 현재 상태에서 허용되는지 판정하는 함수입니다.

- 입력: (현재 ScopeState, 새 Event)
- 출력: 허용 또는 거부 (거부 시 사유 포함)

Align 단계에서 적용되는 규칙:

- [GC-016] State × Event 매트릭스에 정의된 조합만 허용 (예: `align.locked` 전에 현재 상태가 `align_proposed`여야 함)
- [GC-005] Convergence 강제 중단 후 action_taken 없이 revise 거부
- [GC-006] 참조 무결성: payload에 참조하는 entity ID가 현재 상태에 존재해야 한다



#### 회복 경로

- Redirect 선택: `align_proposed` → `grounded`로 역전이. Grounding 재실행
- Revise 중 소스 변경 감지(stale): `align_proposed`에서 자기전이. 재스캔 후 Align Packet 재렌더링
- Align 잠긴 후 소스 변경 감지: `align_locked` → `align_proposed`로 역전이. Align 재검토 필요

---

### 3.3 작업 구간: Surface 반복

#### 이 단계의 목적

사용자가 원하는 to-be를 실제로 만들어보고 반복 수정합니다. 이 단계가 없으면, 사용자가 텍스트로만 to-be를 정의하여 의도와 결과물이 다를 수 있습니다.

#### 사용자가 판단할 사항

- 생성된 Surface를 확인하고 피드백 제공
- "이것이 내가 원하는 모습"이라고 확정 선언

#### 작동 방식

**Surface**(표면)는 사용자가 정의하는 to-be의 실체입니다.


| Scope 유형     | Surface 형태           | 판단 방법                                                    |
| ------------ | -------------------- | -------------------------------------------------------- |
| `experience` | 동작하는 화면 (직접 클릭하며 확인) | 사용자가 시나리오를 직접 실행하며 확인                                    |
| `interface`  | API 계약 변경 전후 비교      | Align에서 잠긴 정책 결정이 올바르게 반영되었는지 확인. 기술 구현 결정은 Builder에게 위임 |


Surface는 미리보기가 아닙니다. 사용자가 to-be를 Experience 언어(화면, 흐름, 상호작용)로 직접 정의하는 도구입니다. 확정된 Surface가 곧 Compile의 입력이 됩니다.

반복 수정 중 시스템이 제약을 발견하면 경량 힌트(constraint hint)로 즉시 알립니다. 이 시점에서는 결정을 요청하지 않습니다. 결정은 다음 단계(Gate 2)에서 합니다. 이를 통해 Gate 2에서 처음 듣는 제약을 최소화합니다.

Convergence Safety는 Align과 동일한 체계로 적용됩니다.

Surface 관련 Function 상세

**Surface 생성**

- 입력: Align에서 확정된 방향 + Reality Snapshot
- 출력: Surface 파일 + content hash
- experience scope: React + MSW 기반 stateful mockup (`surface/preview/`, `npm run dev`로 실행)
- interface scope: Contract diff (`surface/contract-diff/`)
- [GC-007] Surface 생성/수정 시 반드시 대응 이벤트(surface.generated, surface.revision_applied)를 기록한다

**피드백 분류**

- 입력: 사용자 피드백 텍스트
- 출력: 분류 결과 (surface_only / constraint_decision / target_change / direction_change)
- `direction_change`이면 Align으로 Redirect



#### 회복 경로

- 피드백이 방향 변경(direction_change)인 경우: `surface_iterating` → `align_proposed`로 역전이
- 소스 변경 감지(stale): 자기전이. 재스캔 후 사용자에게 알림

---

### 3.4 Gate 2: Draft

#### 이 단계의 목적

확정된 Surface를 기준으로 3개 관점에서 정밀 탐색(Deep Constraint Discovery)을 수행하고, 발견된 모든 제약에 대해 사용자의 결정을 받습니다. 이 단계가 없으면, 발견되지 않은 제약이 구현 중에 나타나 되돌림 비용이 커집니다.

#### 사용자가 판단할 사항

- 각 Constraint에 대해 결정:
  - **inject**: 이 제약을 구현에 반영한다. 검증 시 올바르게 반영되었는지 확인됩니다.
  - **defer**: 이번 범위에서는 처리하지 않는다 (판단 완료). 구현이 이 제약에 간섭하지 않는지만 확인됩니다.
  - **override**: 이 제약을 무시한다 (리스크 감수). 의도적으로 반영하지 않았는지 확인됩니다.
  - **clarify**: 추가 정보가 필요하다 (판단 보류). 해소될 때까지 다음 단계로 진행할 수 없습니다.
  - **modify-direction**: 이 제약으로 인해 방향 자체를 바꿔야 한다. 즉시 Align으로 되돌아갑니다. Align에서 방향을 재검토한 후, 변경된 방향에 맞지 않는 기존 제약은 시스템이 자동으로 무효화하고, 유효한 제약은 유지됩니다. 새로운 제약이 추가될 수 있습니다.
- 모든 결정 후 Approve / Revise / Reject / Redirect to Align 선택

#### 작동 방식

**Deep Constraint Discovery**(정밀 제약 탐색)는 확정된 Surface를 기준으로 모든 소스를 3개 관점에서 재탐색하는 것입니다. Grounding 때보다 깊이가 **대상 수준**입니다. "이 확정된 Surface를 구현하면 구체적으로 어떤 제약이 있는가?"를 찾습니다. `interface` scope에서는 Code/Policy 관점이 중심이 되고, Experience는 소비자(API를 사용하는 쪽) 관점에서 탐색합니다.

**Draft Packet**(초안 패킷)은 이 단계의 산출물입니다:

1. **확정된 Surface** — 경로, 실행 방법, 시나리오 가이드
2. **결정 현황** — Align에서 결정된 것, Draft에서 결정할 것
3. **결정이 필요한 항목** — 각 Constraint의 상황, 선택지(내용/리스크/되돌림 비용), 추천
4. **제약 조건** — 확정된 범위에서 자동으로 따라오는 구현 조건
5. **지금 결정할 것** — Approve + 각 CST 결정

**Constraint의 속성:**


| 속성                 | 값                 | 의미                               |
| ------------------ | ----------------- | -------------------------------- |
| **severity**       | `required`        | 이것 없이 기능 불능 또는 규정 위반             |
|                    | `recommended`     | 처리하면 더 좋지만 기능은 작동                |
| **decision_owner** | `product_owner`   | 제품/사업 판단 필요                      |
|                    | `builder`         | 구현 방식 판단 필요                      |
| **status**         | `undecided`       | 결정 대기                            |
|                    | `decided`         | 결정 완료                            |
|                    | `clarify_pending` | 추가 정보 대기. 이 상태가 있으면 target 잠금 불가 |
|                    | `invalidated`     | 방향 변경으로 더 이상 해당 없음 (시스템 자동 처리)   |
| **evidence_status** | `verified`        | 정책 문서에서 확인됨                         |
|                    | `code_inferred`   | 코드에서 추론됨 (문서 근거 없음)                |
|                    | `brief_claimed`   | 사용자 주장 (별도 확인 필요)                  |
|                    | `unverified`      | 출처 미확인 (기본값)                        |


`evidence_status`는 이 제약의 근거가 정책 문서에서 확인되었는지를 나타냅니다. `status`가 "결정을 했는가"를 기록하는 것과 달리, `evidence_status`는 "근거가 확인되었는가"를 기록합니다. `constraint.discovered` 이벤트에서 `evidence_status`를 생략하면 기본값 `unverified`가 적용됩니다.

`severity: required` + `decision: override` 조합에는 반드시 rationale(이유)이 필요합니다. 이유 없이 필수 제약을 무시하는 것은 시스템이 거부합니다.

모든 Constraint가 결정되고 clarify가 0건이면 **Target Lock**(대상 잠금)이 됩니다. Surface + 모든 Constraint Decisions가 잠깁니다.

Constraint Lifecycle 상세

Constraint의 생애:

```
Discover → Present → Evidence Verify (optional) → Decide → Inject → Verify
                        ↘ Invalidate (redirect 후 re-discovery 시)
```

**Invalidation**(무효화): Align으로 되돌아간 후 re-discovery에서 시스템이 기존 Constraint를 재평가합니다. 방향 변경으로 더 이상 관련 없는 Constraint는 시스템이 자동으로 `invalidated` 처리합니다. 단, `severity: required`인 Constraint는 시스템 단독 무효화가 금지되며, Draft Packet에 "제외 제안"으로 표시하여 사용자 확인 후 확정합니다. [GC-017 — Gate Guard Rule 3b에서 구현됨]

**Evidence 갱신**: PO가 정책 문서를 확인하여 constraint의 근거를 검증한 경우, `constraint.evidence_updated` 관찰 이벤트로 `evidence_status`를 `verified`로 변경할 수 있습니다. 이 이벤트는 상태 전이를 유발하지 않으며, 어떤 비터미널 상태에서든 기록 가능합니다. evidence 갱신이 없어도 워크플로우는 진행됩니다 — Compile 단계에서 미검증 가정에 대한 경고가 표시됩니다.

**Clarify 흐름**: `clarify`를 선택하면 해당 Constraint는 `clarify_pending` 상태가 됩니다. 이 상태가 1건이라도 있으면 target 잠금이 불가합니다. 외부에서 정보를 확보한 뒤, 최종 결정(inject/defer/override)을 내려야 합니다.

**constraint_id 규칙**:

- 형식: `CST-{NNN}` (예: CST-001)
- Scope 내 순차 부여, 불변, 고유
- 동일 ID가 모든 산출물을 관통: Align Packet → Draft Packet → Build Spec → Delta Set → Validation Plan



Gate Guard: Draft 단계 검증 규칙

- [GC-016] State × Event 매트릭스 준수 (§3.2와 동일)
- [GC-006] 참조 무결성 (§3.2와 동일)
- [GC-008] `required` severity + `override` 시 `rationale` 필수
- [GC-005] Convergence 강제 중단 규칙 (§3.2와 동일)
- [GC-009] `target.locked` 전에 모든 Constraint가 decided 또는 invalidated이고, clarify_pending이 0건이어야 한다



#### 회복 경로

- modify-direction 결정: `surface_confirmed` 또는 `constraints_resolved` → `align_proposed`로 역전이
- Constraint가 Surface 변경을 요구: `surface_confirmed` → `surface_iterating`로 역전이
- 새 Constraint 발견으로 미결정 발생: `constraints_resolved` → `surface_confirmed`로 역전이. 새 Constraint에 대한 결정 필요
- 소스 변경 감지(stale): 재스캔 후 제약 재탐색

---

### 3.5 변환: Compile

#### 이 단계의 목적

확정된 Target(Surface + Constraint Decisions)을 실행 가능한 구현 명세로 변환합니다. 이 단계가 없으면, Builder가 확정된 결정을 직접 해석해야 하여 누락과 왜곡이 발생합니다.

#### 사용자가 판단할 사항

정상 진행 시 없음. Compile 중 새로운 제약이 발견되면 Draft로 돌아가서 그 제약에 대한 결정이 필요합니다.

#### 작동 방식

**Compile**(컴파일)은 확정된 판단을 코드 변경으로 번역하는 함수입니다.

- 입력: 확정된 Surface, Constraint Decisions, Reality Snapshot
- 출력: Build Spec + Brownfield Detail + Delta Set + Validation Plan

Compile이 성공하더라도 Layer 3 경고(`warnings`)가 반환될 수 있습니다. 에이전트는 이 경고를 PO에게 자연어로 안내합니다. Compile이 실패한 경우에도 Layer 3 경고는 함께 반환됩니다.

- [GC-010] Compile은 새로운 제품 결정을 하지 않는다. 모호함을 발견하면 Draft로 되돌린다
- [GC-011] 모든 inject 결정은 CST → IMPL → CHG → VAL 추적 체인(추적 가능한 연결 고리)이 완전해야 한다

**Build Spec**(구현 명세)은 Builder가 구현에 필요한 모든 정보를 담은 문서입니다. 모호함이 남아 있으면 안 됩니다. `interface` scope에서는 전체 brownfield 스캔 결과 + guardrail(구현 시 반드시 지켜야 할 조건) + Align에서 잠긴 정책 결정이 Builder에게 제공됩니다.

**Brownfield Detail**(기존 시스템 상세)은 전체 스캔 결과를 소스별/항목별로 구조화한 문서입니다. Build Spec에서 참조합니다.

`BrownfieldDetail`에는 기존 시스템의 열거형 값을 기록하는 `enums` 필드가 포함될 수 있습니다. 이 필드는 Compile Defense Layer 3의 상태 완전성 검사(`L3-state-completeness`)에서, 기존 시스템에 정의된 상태값이 구현 계획에서 빠지지 않았는지 감지하는 데 사용됩니다.

**Delta Set**(변경 목록)은 현재 상태에서 목표 상태로의 파일 수준 변경 목록입니다. 각 변경에 `CHG-ID`가 부여됩니다.

**Validation Plan**(검증 계획)은 구현 후 무엇을 확인해야 하는지 정의합니다. Constraint 결정별로 검증 항목을 도출합니다:

- inject → 구현에 올바르게 반영되었는가
- defer → 구현이 이 제약에 간섭하지 않는가
- override → 의도적으로 반영하지 않았는가

**Compile Defense**(컴파일 방어)는 Compile 출력의 정합성을 검증하는 3단계 메커니즘입니다:

1. **Layer 1 — Checklist**: 모든 Constraint 결정이 Build Spec에 참조되어 있는지 확인
2. **Layer 2 — Audit Pass**: inject 반영, defer 비간섭, override 비반영, 추적 체인 완전성 검증
3. **Layer 3 — Evidence Quality Warnings (비차단)**: 미검증 가정과 상태 누락 경고. Layer 1/2와 달리 Compile을 차단하지 않고 경고만 반환합니다

Layer 3의 6가지 규칙:
- **L3-unverified-inject**: `required` + `inject`인데 `evidence_status`가 `verified`가 아닌 경우 경고
- **L3-policy-change-required**: `inject`인데 `requires_policy_change`가 `true`인 경우 정책 변경 검토 경고
- **L3-state-completeness**: `BrownfieldDetail.enums`에 정의된 값이 구현 계획에서 언급되지 않은 경우 경고 (예: NOSHOW_BOTH 누락)
- **L3-shared-resource**: 동일 파일을 별개의 CHG가 서로 다른 CST로 수정하는 경우 경고 (조합 충돌 가능성). 하나의 CHG가 여러 CST를 참조하는 것은 정상(경고 미발행)
- **L3-invariant-uncovered**: `BrownfieldDetail.invariants`의 영향 파일이 delta-set에서 변경되지만 구현 계획에서 언급되지 않은 경우 경고
- **L3-modify-not-in-brownfield**: delta-set의 `modify`/`delete` 대상 파일이 `brownfieldContext.related_files`에 등록되지 않은 경우 경고 (기존 코드 스캔 누락 가능성)

Layer 3 검사에는 `brownfieldDetail`과 `brownfieldContext`가 입력으로 필요합니다. 제공되지 않으면 해당 검사가 건너뛰어집니다.

Compile Function 상세

**추적 체인 ID 체계:**


| 접두어     | 범위                | 용도            |
| ------- | ----------------- | ------------- |
| `CST-`  | Scope 내           | Constraint 식별 |
| `IMPL-` | Build Spec 내      | 구현 항목 식별      |
| `CHG-`  | Delta Set 내       | 파일 변경 식별      |
| `VAL-`  | Validation Plan 내 | 검증 항목 식별      |


체인: `CST → IMPL → CHG → VAL`. 모든 inject 결정은 이 체인이 끊기지 않아야 합니다.

**Build Spec 7개 섹션:**

1. Scope Summary
2. Confirmed Surface
3. Constraint Decision Map (모든 결정 열거, 하나도 누락 불가)
4. Implementation Plan (IMPL 항목)
5. Delta Set Reference
6. Validation Plan Reference
7. Brownfield Context (현재 시스템 스캔 결과, 2계층: Tier 1 항상 표시 + Tier 2 접기)

**Compile 재시도 상한** [GC-018]: gap_found가 누적되어 임계값에 도달하면 compile.started가 거부됩니다. 이 경우 `scope.deferred`로 전환하거나 `redirect.to_align`으로 방향을 재검토합니다.

**2-이벤트 패턴**: Compile 중 gap 발견 시 이벤트 발행 순서: (1) `constraint.discovered` (Constraint Pool 등록, 자기전이) → (2) `compile.constraint_gap_found` (역전이 트리거). Apply 중 `apply.decision_gap_found`도 동일한 패턴입니다.



#### 회복 경로

- Compile 중 새 제약 발견: `target_locked` → `constraints_resolved`로 역전이. 새 Constraint에 CST-ID 부여 후 Draft에서 결정
- 소스 변경 감지(stale): `target_locked` → `constraints_resolved`로 역전이 (compile 차단). 또는 `compiled` → `grounded`로 역전이 (재탐색 필요)

---

### 3.5.5 Pre-Apply Review

#### 이 단계의 목적

Compile 완료 후, 코드를 적용하기 전에 **의미적 정합성**을 검증합니다. Compile Defense가 구조적 완전성(추적 체인 존재)을 보장하지만, "결정들이 서로 모순되지 않는가", "기존 정책을 깨뜨리지 않는가"는 검증하지 않습니다. 이 단계가 없으면, 의미적 문제가 코드 적용 후에야 발견되어 되돌림 비용이 높아집니다.

#### 검증 3관점

1. **정책 정합성**: inject 결정이 약관/정책 문서와 충돌하지 않는지
2. **기존 기능 정합성**: delta-set 변경이 brownfield invariant를 위반하지 않는지
3. **작동 로직**: 별개 CHG의 전제 조건 양립, edge case 커버, 상태 전이 교차점 부재

#### 작동 방식

- 이벤트: `pre_apply.review_completed` (관찰 이벤트, verdict: pass/gap_found)
- soft gate: PO 판단권 보존. 에이전트가 발견한 충돌을 보고하고 PO가 진행/수정 결정
- 문제 발견 시: `constraint.discovered` → `compile.constraint_gap_found` → `constraints_resolved`로 역전이
- PRD에 결과를 ✓/⚠ 형식으로 포함

---

### 3.6 검증: Apply → Validate → Close

#### 이 단계의 목적

Build Spec에 따라 코드를 변경하고, Validation Plan으로 검증합니다. 이 단계가 없으면, 구현이 확정된 결정을 올바르게 반영했는지 알 수 없습니다.

#### 사용자가 판단할 사항

- 검증 결과 확인
- 검증이 실패하면 실패 원인에 따라: (1) 구현 문제일 경우 Constraint를 재결정, (2) 소스 변경이 원인일 경우 재탐색이 필요합니다.
- 모든 검증 통과 후 Scope 종료 승인

#### 작동 방식

**Apply**(적용): Builder가 Delta Set의 변경을 실제 코드에 적용합니다. 구현 중 미발견 제약을 발견하면 에스컬레이션합니다.

**Validate**(검증): Validation Plan의 각 항목을 실행하고 결과를 기록합니다.

- 전부 통과: `validated` 상태
- 실패 (구현 문제): `constraints_resolved`로 역전이. 해당 Constraint 재결정
- 실패 (소스 변경): `grounded`로 역전이. 재탐색 필요

**Close**(종료): 검증 통과 후 사용자가 확인하면 Scope가 종료됩니다.

Apply/Validate Function 상세

**Apply**

- 입력: Build Spec + Delta Set
- 출력: 적용 결과 (성공 / 미발견 제약 발견)
- 미발견 제약 발견 시: `constraint.discovered` + `apply.decision_gap_found` → `constraints_resolved`로 역전이 (2-이벤트 패턴, §3.5와 동일)

**Validate**

- 입력: Validation Plan + 구현 결과
- 출력: 각 VAL 항목의 pass/fail + 상세 (payload 필드명: `items`)

**Applied 상태의 stale 처리**: Apply 완료 후 소스 변경이 감지되면 `applied`에서 자기전이(stale 플래그 설정). 이후 Validate 단계에서 stale 플래그에 의해 `grounded`로 역전이됩니다. 감지 시점과 실제 역전이 시점이 다릅니다.



#### 회복 경로

- Apply 중 미발견 제약: `compiled` → `constraints_resolved`로 역전이
- Apply 완료 후 소스 변경 감지(stale): `applied`에서 자기전이 → Validate에서 `grounded`로 역전이
- Validate 실패 (구현 문제): `applied` → `constraints_resolved`로 역전이
- Validate 실패 (소스 변경): `applied` → `grounded`로 역전이

---

## 4. 상태와 전이

Scope는 15개 상태를 가집니다. §3의 흐름에서 설명한 내용의 전체 요약입니다. Product Owner는 이 섹션을 건너뛰어도 됩니다.

### 상태 목록


| 상태                     | 의미                                | §3 위치 |
| ---------------------- | --------------------------------- | ----- |
| `draft`                | Scope 생성됨. Grounding 전            | §3.1  |
| `grounded`             | 소스 탐색 완료. Reality Snapshot 생성됨    | §3.1  |
| `exploring`            | 요구사항 탐색 중 (PO와 대화)              | §3.1.5 |
| `align_proposed`       | Align Packet 렌더됨. 사용자 판단 대기       | §3.2  |
| `align_locked`         | 방향과 범위 확정됨                        | §3.2  |
| `surface_iterating`    | Surface 반복 수정 중                   | §3.3  |
| `surface_confirmed`    | Surface 확정됨                       | §3.4  |
| `constraints_resolved` | 모든 Constraint 결정 완료               | §3.4  |
| `target_locked`        | Surface + Constraint Decisions 잠김 | §3.4  |
| `compiled`             | Build Spec 생성 완료                  | §3.5  |
| `applied`              | 코드 적용 완료                          | §3.6  |
| `validated`            | 검증 통과                             | §3.6  |
| `closed`               | 종료                                | §3.6  |
| `deferred`             | 보류 (터미널)                          | —     |
| `rejected`             | 거절 (터미널)                          | —     |


`deferred`와 `rejected`는 어떤 비터미널 상태에서든 전이 가능합니다.
터미널 상태(`closed`, `deferred`, `rejected`)에 도달하면 추가 이벤트를 받지 않습니다.

정방향 / 역방향 / 자기전이 전체 요약

**정방향 전이:**

```
draft → grounded → exploring → align_proposed → align_locked → surface_iterating
→ surface_confirmed → constraints_resolved → target_locked
→ compiled → applied → validated → closed
```

**역방향 전이 (회복 경로):**


| 출발                     | 도착                     | 원인                        |
| ---------------------- | ---------------------- | ------------------------- |
| `align_proposed`       | `grounded`             | Grounding으로 Redirect      |
| `align_locked`         | `align_proposed`       | 소스 변경 감지                  |
| `surface_iterating`    | `align_proposed`       | Align으로 Redirect          |
| `surface_confirmed`    | `surface_iterating`    | Constraint가 Surface 변경 요구 |
| `surface_confirmed`    | `align_proposed`       | modify-direction 결정       |
| `constraints_resolved` | `surface_iterating`    | Constraint가 Surface 변경 요구 |
| `constraints_resolved` | `align_proposed`       | Align으로 Redirect          |
| `constraints_resolved` | `surface_confirmed`    | 새 Constraint 발견 (미결정 발생)  |
| `target_locked`        | `constraints_resolved` | Compile 중 새 Constraint 발견 |
| `target_locked`        | `constraints_resolved` | 소스 변경 감지 (compile 차단)     |
| `compiled`             | `constraints_resolved` | Apply 중 미발견 제약            |
| `compiled`             | `grounded`             | 소스 변경 감지                  |
| `applied`              | `constraints_resolved` | Validate 실패 (구현 문제)       |
| `applied`              | `grounded`             | Validate 실패 (소스 변경)       |


**자기전이** (상태 변경 없이 이벤트만 기록):
`align.revised`, `surface.revision_applied`, `snapshot.marked_stale`, `constraint.discovered` (target_locked/compiled에서), `compile.started`, `apply.started`, `validation.started` 등

전체 State × Event 매트릭스는 `dev-docs/spec/event-state-contract.md`에 명세되어 있습니다.



### Stale 감지 시점

소스 변경 감지(stale detection)는 2가지 시점에 수행됩니다:

- **Gate 전이 시 (필수)**: 모든 소스를 검사. 불일치 시 전이 차단
- **명령 시작 시 (경량)**: 로컬 소스만 검사. 불일치 시 경고만 표시 (전이 차단 안 함)

---

## 5. 저장 구조

### 운영에 영향을 주는 규칙

- **이벤트는 추가만 가능합니다.** 한 번 기록된 이벤트는 수정하거나 삭제할 수 없습니다. 이것은 상태 계산의 인과 관계를 보장합니다. [GC-012]
- **동일한 이벤트 시퀀스는 항상 동일한 결과를 냅니다.** 상태 계산은 결정론적(deterministic — 같은 입력이면 항상 같은 출력)입니다. 이것이 보장되면, 동일한 이벤트 기록을 가진 Scope는 항상 동일한 현재 상태를 보여줍니다. 시스템이 "다시 계산했더니 결과가 달라지는" 상황이 발생하지 않습니다. [GC-013]
- **산출물 파일은 이벤트 없이 수정할 수 없습니다.** Surface, Build Spec 등의 파일이 변경되면 반드시 대응 이벤트가 기록되어야 합니다. [GC-007]
- **터미널 상태에서는 어떤 이벤트도 받지 않습니다.** [GC-014]

저장 구조 기술 상세

### 3개 계층


| 계층                 | 내용                      | 역할                       |
| ------------------ | ----------------------- | ------------------------ |
| **Event Layer**    | `events.ndjson` (추가 전용) | 상태 전이의 source of truth   |
| **Input Layer**    | `inputs/`               | 사용자 제공 원본. 시스템이 수정하지 않음  |
| **Artifact Layer** | `surface/`, `build/`    | 생성된 산출물. 이벤트에 경로+hash 기록. `exploration-log.md`도 이 계층에 속합니다 (GC-022로 hash 보호, append-only) |


### Scope 디렉토리

```
scopes/{scope-id}/
  inputs/sources.yaml
  events.ndjson
  scope.md                  ← 현황 뷰 (이벤트에서 재생성)
  state/
    reality-snapshot.json
    constraint-pool.json
    verdict-log.json
  surface/preview/           ← experience mockup
  build/
    align-packet.md
    draft-packet.md
    build-spec.md
    brownfield-detail.md
    delta-set.json
    validation-plan.md
```

### 불일치 해소


| 항목                            | 불일치 시                            |
| ----------------------------- | -------------------------------- |
| `scope.md`, `state/*.json`    | 이벤트 기준 재생성                       |
| `state/reality-snapshot.json` | re-grounding으로 재스캔               |
| `surface/`, `build/` 산출물      | content hash 검증. 불일치 시 해당 단계 재실행 |


### Event Envelope (이벤트 공통 구조)

```json
{
  "event_id": "evt_001",
  "scope_id": "tutor-block-20260309-001",
  "type": "align.proposed",
  "ts": "2026-03-07T10:30:00Z",
  "revision": 7,
  "actor": "user | system | agent",
  "state_before": "grounded",
  "state_after": "align_proposed",
  "payload": {}
}
```

이벤트는 3가지로 분류됩니다:

- **전이**: 상태를 변경. State × Event 매트릭스에 정의된 조합만 허용
- **전역**: 모든 비터미널 상태에서 터미널로 전이 (`scope.deferred`, `scope.rejected`)
- **관찰**: 상태 변경 없음 (`feedback.classified`, `convergence.*`, `draft_packet.rendered`, `constraint.evidence_updated`, `prd.rendered`, `pre_apply.review_completed`)

이벤트 유형 전체 목록과 payload 상세는 `dev-docs/spec/event-state-contract.md`에 명세되어 있습니다.

### 핵심 함수

**Reducer**(축약기): 이벤트 시퀀스를 현재 상태로 계산하는 순수 함수.

- 입력: Event[]
- 출력: ScopeState
- [GC-013] 동일 입력 → 동일 출력 (결정론)
- 금지: 현재 시각 참조, 난수, 외부 호출, 이벤트 순서 변경

**Event Pipeline**(이벤트 파이프라인): 이벤트를 기록하는 유일한 경로.

- Gate Guard 검증 → Event Store 추가 → Reducer 재실행 → Materialized View 갱신
- [GC-015] 이것이 이벤트를 기록하는 유일한 경로. 다른 코드가 Event Store에 직접 쓰는 것은 금지



---

6. 모듈 구조 (개발자 및 AI 에이전트 참조용)


| 모듈            | 책임                                                               | 소유하는 개념                                                                         |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `kernel/`     | Event Store, Reducer, State Machine, Gate Guard, Constraint Pool | Event, State, ScopeState, Constraint Pool, Verdict Log, Reality Snapshot (type) |
| `config/`     | `.sprint-kit.yaml` 로딩, 소스 병합                                     | ProjectConfig                                                                   |
| `scanners/`   | 소스 스캔, 패턴 탐지, 온톨로지 인덱스                                           | ScanResult, OntologyIndex                                                       |
| `commands/`   | `/start`, `/align`, `/draft` 진입점, Reality Snapshot 작성            | Scope, Intent                                                                   |
| `renderers/`  | scope.md, Align Packet, Draft Packet 렌더링                         | —                                                                               |
| `compilers/`  | Compile, Build Spec, Compile Defense (3-layer)                   | Delta Set, Build Spec                                                           |
| `validators/` | 검증 실행, 결과 기록                                                     | —                                                                               |
| `parsers/`    | brief.md 파싱, 구조화된 데이터 추출                                          | BriefData                                                                       |
| `logger.ts`   | 스코프 이벤트 로깅                                                        | —                                                                               |


### 의존 방향

```
config/ → kernel/, scanners/ (SourceEntry type + sourceKey 함수)
scanners/ → kernel/, config/
parsers/ → (독립)
commands/ → kernel/, config/, scanners/, renderers/, compilers/, parsers/
renderers/ → kernel/
compilers/ → kernel/
validators/ → kernel/
```

금지 의존: `kernel/ → 다른 모듈`, `scanners/ → compilers/`, `scanners/ → renderers/`

에이전트 실행 프로토콜 상세: `docs/agent-protocol/start.md`, `align.md`, `draft.md`

### 검증 경계와 에이전트 신뢰 모델

시스템의 검증은 두 영역으로 나뉩니다. 경계 기준은 "시스템이 의미 해석 없이 구조만으로 탐지할 수 있는가?"입니다.

| 계층 | 검증 대상 | 강제 방식 | 위반 시 |
|------|----------|----------|--------|
| Gate Guard | 이벤트 유효성, 상태 전이 규칙 | 코드 차단 | 이벤트 거부 |
| Compile Defense L1-2 | 추적 체인 완전성(CST→IMPL→CHG→VAL), 참조 무결성 | 코드 차단 | compile 실패 |
| Compile Defense L3 | 구조적 패턴 탐지 (증거 미검증, 상태 누락, 리소스 공유) | 코드 경고 (비차단) | 경고 표시, 에이전트가 PO에게 안내 |
| 에이전트 프로토콜 | 의미적 정합성 (cross-constraint, 정책 정합성, 선택지 품질) | 프로토콜 지침 | best-effort |

**코드 강제 영역** (Gate Guard, L1-2): 위반 시 시스템 정합성이 깨지는 항목. 에이전트가 어떤 행동을 해도 이 규칙을 우회할 수 없습니다.

**코드 탐지 + 에이전트 판정 영역** (L3): 시스템이 구조적 패턴(같은 파일을 수정하는 다수 CST, 미검증 증거 등)을 탐지하여 경고를 발행합니다. 경고의 의미 해석과 대응은 에이전트가 수행합니다.

**에이전트 위임 영역** (프로토콜): 의미 해석이 필요한 검증(constraint 간 논리적 충돌, 정책 문서와의 정합성, 선택지의 완전성)은 에이전트 프로토콜 지침으로 안내합니다. 이 영역의 검증 품질은 에이전트 실행 품질에 의존합니다.



---

## 7. Global Constraint 정의

아래는 2개 이상의 Function에 공통 적용되는 제약입니다. 각 항목의 [hard]/[soft] 분류는 2단계 기준으로 판정합니다:

1. 이것을 변경하면 시스템의 다른 부분이 무효화되는가?
2. 무효화 범위를 국소화할 수 있는가? — No이면 hard, Yes이면 soft

[hard]는 시스템의 정합성을 위해 고정된 제약입니다. 변경 대상이 아닙니다.
[soft]는 현재 설정된 기본값입니다. Product Owner가 비즈니스 요구에 따라 변경을 요청할 수 있습니다.

### Hard Constraints


| ID     | 제약                                              | 위반 시 결과                                   | 관련 Function                         | 도입 위치 |
| ------ | ----------------------------------------------- | ----------------------------------------- | ----------------------------------- | ----- |
| GC-012 | events.ndjson은 추가 전용. 수정/삭제 불가                  | 상태 계산의 인과 관계 파괴. 복구 불가                    | Reducer, Event Pipeline, Gate Guard | §5    |
| GC-013 | 동일 이벤트 시퀀스 → 동일 상태 (Reducer 결정론)                | Materialized View 신뢰 불가                   | Reducer                             | §5    |
| GC-014 | 터미널 상태에서 모든 이벤트 거부                              | 종료된 Scope에 이벤트 추가되어 상태 불일치                | Gate Guard                          | §4    |
| GC-015 | Event Pipeline이 이벤트 기록의 유일한 경로                  | Gate Guard 우회, 무검증 이벤트 기록                 | Event Pipeline                      | §5    |
| GC-006 | 참조 무결성: payload에 참조하는 entity ID가 현재 상태에 존재해야 함  | 존재하지 않는 Constraint에 결정 기록                 | Gate Guard                          | §3.2  |
| GC-016 | State × Event 매트릭스에 정의된 조합만 허용                  | 허용되지 않는 상태 전이 발생                          | Gate Guard, State Machine           | §3.2  |
| GC-007 | 산출물(Surface, Build Spec 등) 생성/수정 시 대응 이벤트 기록 필수 | Artifact와 Event의 hash 불일치, Compile 입력 무효화 | Surface, Event Pipeline, Compile    | §3.3  |


### Soft Constraints


| ID     | 제약                                                          | 변경 시 영향 범위                | 관련 Function               | 도입 위치 |
| ------ | ----------------------------------------------------------- | ------------------------- | ------------------------- | ----- |
| GC-005 | Convergence 강제 중단 후 revise 거부                               | Gate Guard 규칙만 수정         | Gate Guard                | §3.2  |
| GC-008 | `required` + `override` 시 `rationale` 필수                    | Gate Guard 규칙만 수정         | Gate Guard                | §3.4  |
| GC-009 | Target lock 전 모든 Constraint decided/invalidated, clarify 0건 | Gate Guard 규칙만 수정         | Gate Guard                | §3.4  |
| GC-010 | Compile은 새 제품 결정 금지                                         | Compile + Compile Defense | Compile                   | §3.5  |
| GC-011 | inject 결정의 CST→IMPL→CHG→VAL 추적 체인 완전성                       | Compile Defense 규칙만 수정    | Compile Defense           | §3.5  |
| GC-001 | 각 소스의 content hash 기록                                       | Grounding + stale 감지      | Grounding                 | §3.1  |
| GC-002 | Constraint에 CST-ID 순차 부여                                    | Constraint Pool           | Grounding, Deep Discovery | §3.1  |
| GC-003 | Constraint에 severity + decision_owner 판정                    | Constraint Pool, 렌더러      | Grounding, Deep Discovery | §3.1  |
| GC-017 | `severity: required` Constraint는 시스템 단독 무효화 금지              | Gate Guard 규칙 추가          | Gate Guard                | §3.4  |
| GC-018 | Compile 재시도 상한: gap_found 누적이 임계값 이상이면 compile.started 거부   | Gate Guard 규칙만 수정         | Gate Guard, Compile       | §3.5  |
| GC-019 | Grounding 시 각 Constraint에 대해 정책 문서 교차 대조(`evidence_status` 판정) 수행 | Grounding + Align Packet 렌더링 | Grounding, Align Packet | §3.1 |
| GC-020 | Exploration은 `exploring` 정식 상태에서 진행. `exploration.started`가 `grounded → exploring` 전이 유발 | State Machine + Gate Guard | Exploration, State Machine | §3.1.5 |
| GC-021 | `MAX_EXPLORATION_ROUNDS`(20) 초과 시 gate-guard가 round_completed 거부 | Gate Guard 규칙만 수정 | Gate Guard | §3.1.5 |
| GC-022 | exploration-log.md는 공식 artifact. Phase 전환 시 `log_path`와 `log_hash` 필수 기록 | Exploration 이벤트 payload | Exploration | §3.1.5 |


---

## 8. 개념 색인


| 개념                  | 정의                                          | 맥락 요약                                               | 관련 개념                        | 위치         |
| ------------------- | ------------------------------------------- | --------------------------------------------------- | ---------------------------- | ---------- |
| Sprint Kit          | constraint-aware translation runtime        | 3개 관점에서 제약을 발견하여 사용자 판단을 개선하고 코드 변경으로 변환            | 모든 개념의 상위                    | §1         |
| Perspective         | 소스에서 제약을 찾는 탐색 방향 (Experience/Code/Policy)  | 3개 관점이 서로 다른 종류의 정보를 드러냄                            | Constraint, Reality Snapshot | §2         |
| Scope               | 작업 단위. 하나의 변경 목표를 담음                        | 15개 상태를 거쳐 완료됨. experience/interface 두 유형           | Intent, Event, State         | §3         |
| Intent              | Scope의 존재 이유                                | Gate 1에서 잠김                                         | Scope, Align                 | §3.1       |
| Reality Snapshot    | 탐색 시점의 시스템 상태 기록                            | 소스 content hash 포함. stale 감지 기준                     | Grounding, Constraint        | §3.1       |
| Constraint          | 시스템이 발견한 "사용자가 혼자서는 보지 못할 제약"               | CST-ID로 식별. severity + decision_owner 속성            | 모든 산출물                       | §3.1, §3.4 |
| Align Packet        | Gate 1 산출물. To-be/As-is/Tension/Decision    | 사용자 의도와 현실을 대면시켜 범위 확정. Grounding 후 렌더              | Align, Constraint            | §3.2       |
| Verdict             | 사용자의 판정 (approve/revise/reject/redirect)    | Gate에서 사용자가 내리는 결정                                  | Align, Draft                 | §3.2       |
| Surface             | 사용자가 정의하는 to-be의 실체                         | experience=동작하는 화면, interface=계약 전후 비교. Compile 입력  | Compile 입력                   | §3.3       |
| Draft Packet        | Gate 2 산출물. Constraint 결정 요청                | 확정 Surface 기준 모든 제약에 대한 결정을 요청. Deep Discovery 후 렌더 | Constraint, Surface          | §3.4       |
| Constraint Decision | 각 Constraint에 대한 사용자 결정                     | inject/defer/override/clarify/modify-direction      | Constraint, Build Spec       | §3.4       |
| Build Spec          | 구현 명세. Builder가 이것만 보고 구현                   | 7개 섹션. 모호함 불허. Compile 출력물                          | Compile, Delta Set           | §3.5       |
| Brownfield Detail   | 전체 스캔 결과 구조화 문서                             | Build Spec Section 7에서 참조. Compile 출력물              | Build Spec                   | §3.5       |
| Delta Set           | 파일 수준 변경 목록. CHG-ID로 식별                     | Compile 출력물                                         | Build Spec, Validation Plan  | §3.5       |
| Validation Plan     | 검증 항목 목록. VAL-ID로 식별                        | inject/defer/override별 검증 방식 상이. Compile 출력물        | Delta Set, Constraint        | §3.5       |
| Compile Defense     | Compile 출력의 정합성 검증 (Checklist + Audit Pass) | Checklist: 누락 탐지. Audit: 반영/비간섭/추적 체인 검증            | Build Spec, Constraint       | §3.5       |
| Event               | 상태 변경 기록. 추가 전용                             | 전이/전역/관찰 3가지 분류                                     | State, Reducer               | §5         |
| State               | Scope의 현재 단계 (15개)                          | 정방향/역방향/자기전이 존재                                     | Event, Gate Guard            | §4         |
| Exploration         | PO와 대화로 요구사항을 구체화하는 6-Phase 프로토콜 | `exploring` 상태에서 진행. exploration-log.md에 맥락 기록 | Grounding, Align Packet      | §3.1.5     |
| Reducer             | 이벤트 시퀀스 → 현재 상태 계산. 순수 함수                   | 결정론 필수. 동일 입력 → 동일 출력 보장                            | Event, State                 | §5         |
| Gate Guard          | 새 이벤트의 허용/거부 판정                             | 매트릭스 준수, 참조 무결성, required override, convergence 등   | Event, State                 | §3.2, §3.4 |
| Event Pipeline      | 이벤트 기록의 유일한 경로                              | Gate Guard → Store → Reducer → View 갱신              | Gate Guard, Reducer          | §5         |
| Convergence Safety  | Revise 반복 시 수렴 안전 장치                        | 임계값 기반 패턴 요약 → 진단 → 강제 중단                           | Align, Surface 반복            | §3.2, §3.3 |
| Grounding           | 소스 탐색. Reality Snapshot + Constraint 발견     | 방향 수준 깊이. 부분 실패 허용(failed_sources)                  | Reality Snapshot, Constraint | §3.1       |
| Deep Discovery      | 확정 Surface 기준 정밀 재탐색                        | 대상 수준 깊이. interface scope에서는 Code/Policy 중심         | Constraint, Draft Packet     | §3.4       |
| Stale Detection     | 소스 변경 감지 메커니즘                               | Gate 전이 시(필수, 전체 소스) + 명령 시작 시(경량, 로컬만)             | Reality Snapshot, Gate Guard | §4         |
| EvidenceStatus      | Constraint 근거의 현재 검증 상태                    | status(결정 여부)와 별도. 근거가 확인됨/미확인을 구분하여 PO가 제약의 신뢰도를 판단 | Constraint, Compile Defense  | §3.4       |
| Policy Cross-Reference | Grounding 시 정책 문서와 교차 대조하는 단계             | Step 2.5. evidence_status를 판정하여 미검증 가정을 식별                | Grounding, EvidenceStatus    | §3.1       |


