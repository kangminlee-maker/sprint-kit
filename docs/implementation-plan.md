# Implementation Plan

Sprint Kit은 Claude Code 세션 안에서 동작하는 도구입니다.
AI 에이전트가 곧 시스템입니다. 사용자가 `/start`, `/align`, `/draft`를 입력하면,
에이전트가 커널과 상호작용하면서 설계 문서에 정의된 프로토콜대로 행동합니다.

## 역할 분리

| 영역 | 구현 형태 | 보장하는 것 |
|------|----------|-----------|
| **커널 (kernel/)** | TypeScript 순수 함수 | 이벤트 저장, 상태 계산, 전이 검증, gate guard. 결정론적 — 동일 입력 → 동일 출력 |
| **에이전트 프로토콜 (.claude/commands/)** | 마크다운 slash command | 소스 스캔, constraint 발견, mockup 생성, Build Spec 작성. AI 에이전트의 행동 지침 |
| **모듈 코드 (commands/, renderers/, compilers/, validators/)** | TypeScript | 커널 호출, 산출물 생성, 이벤트 발행 파이프라인 |

### 철학 원칙별 보장 구조

| 원칙 | 커널 코드 보장 | 에이전트 프로토콜 보장 |
|------|--------------|---------------------|
| 시스템이 발견/제시, 인간이 결정 | gate guard가 결정 없이 compile 차단 | 탐색 체크리스트로 발견 품질 확보 |
| 모든 정보 제공 | Compile Defense가 constraint 누락 탐지 | 스캔 범위를 프로토콜에 명시 |
| Compile이 새 결정 금지 | constraint_gap_found로 Draft 복귀 강제 | — |
| 의미적 정확성 우선 | 렌더러가 템플릿 구조 보장 | 선택지의 리스크/되돌림 비용 정확성 |

---

## Phase 구조

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
 kernel    kernel    pipeline   commands   compile   validate
 기초      완성      통합       + render   + defense
```

### Phase 1: Kernel 기초

이벤트를 기록하고, 상태 전이를 판정하는 기반.

| 파일 | 책임 |
|------|------|
| `src/kernel/types.ts` | 모든 타입 정의. Event envelope, 14개 상태, 30+ 이벤트 타입, payload 타입, ScopeState 인터페이스. discriminated union (type 필드가 판별자) |
| `src/kernel/event-store.ts` | `events.ndjson` append + 읽기. revision 자동 증가 |
| `src/kernel/state-machine.ts` | State × Event 매트릭스를 데이터로 인코딩. `canTransition(state, eventType) → { allowed, nextState }`. 전역/관찰 이벤트 처리 포함 |
| `src/kernel/hash.ts` | SHA-256 content hash 유틸리티 |

**완료 기준:**
- `scopes/example-tutor-block/events.ndjson`의 29개 이벤트를 파싱하여 타입 호환성 확인
- 매트릭스에 정의된 전이/자기전이/거부 조합 전수 테스트

**설계 결정:**
- 매트릭스는 `Record<State, Record<EventType, TransitionResult>>` 형태의 정적 데이터. 런타임에 변경 불가
- 이벤트 타입은 discriminated union. TypeScript 컴파일러가 payload 타입을 자동 추론

### Phase 2: Kernel 완성

이벤트 시퀀스로부터 현재 상태를 계산하고, 이벤트 기록 전 유효성을 검증.

| 파일 | 책임 |
|------|------|
| `src/kernel/reducer.ts` | `(events: Event[]) → ScopeState`. event-state-contract.md의 상태 계산 규칙 12개 항목 구현. 순수 함수, 부수 효과 없음 |
| `src/kernel/gate-guard.ts` | `(state: ScopeState, event: Event) → { valid, reason? }`. 4가지 규칙: (1) 상태 전이 허용, (2) 참조 무결성, (3) required+override rationale 필수, (4) convergence blocked 시 revise 거부. 순수 함수 |
| `src/kernel/constraint-pool.ts` | constraint 관련 상태 계산 헬퍼. `constraints_resolved` 전이 조건 3가지 판정. constraint-pool.json 생성 |

**완료 기준:**
- 예시 데이터 29개 이벤트 → reducer 결과가 `state/constraint-pool.json`, `state/verdict-log.json`과 동일
- **State × Event 매트릭스 전수 테스트 통과** (정방향 + 역방향 + 자기전이 + 거부)
- gate guard 규칙별 허용/거부 테스트 (참조 무결성 위반, required+override+no rationale, convergence blocked 등)
- 비정상 경로 테스트 데이터 별도 준비 (redirect, stale, constraint_gap_found 복귀 등)

**설계 결정:**
- gate guard의 조건부 로직(constraints_resolved 전이 조건, convergence blocking, required override rationale)을 각각 독립된 함수로 분리
- `compile.constraint_gap_found` 발생 시 `constraint.discovered` 자동 선행 발행 로직은 gate guard 내부에 구현

**이 Phase가 전체 프로젝트의 성패를 좌우합니다.**

### Phase 3: 이벤트 파이프라인 통합

gate guard 검증 → 이벤트 append → reducer 재실행 → materialized view 갱신을 단일 파이프라인으로 통합.

| 파일 | 책임 |
|------|------|
| `src/kernel/scope-manager.ts` | scope 디렉토리 생성/조회. `scopes/{scope-id}/` 구조 관리 |
| `src/kernel/event-pipeline.ts` | `appendEvent(scopeId, event)` — gate guard → event-store.append → reducer → materialized view 쓰기. 이벤트를 기록하는 유일한 경로 |

**완료 기준:**
- 빈 scope에서 `scope.created` → `grounding.completed` → `align.proposed`까지 순차 기록, 상태 전이 확인
- 잘못된 순서의 이벤트가 거부되는지 확인
- materialized view 자동 생성 확인
- artifact content hash 무결성 검증

### Phase 4: Commands + Renderers (통합)

사용자 slash command와 산출물 렌더링을 함께 구현. 이 Phase 완료 시 end-to-end slice 달성.

| 파일 | 책임 |
|------|------|
| `src/commands/start.ts` | `/start` 처리. scope 생성 → grounding → constraint discovery → Align Packet 렌더 → `align.proposed` 기록 |
| `src/commands/align.ts` | `/align` 처리. 사용자 verdict에 따라 `align.locked` / `align.revised` / redirect / deferred / rejected 기록 |
| `src/commands/draft.ts` | `/draft` 처리. surface 생성 → 반복 수정 → 확정 → deep discovery → constraint 결정 수집 → `target.locked` → compile |
| `src/renderers/align-packet.ts` | Align Packet 마크다운 생성. `align-draft-templates.md` 4개 섹션 구조 |
| `src/renderers/draft-packet.ts` | Draft Packet 마크다운 생성. `align-draft-templates.md` 6개 섹션 구조 |
| `src/renderers/scope-md.ts` | scope.md 현황 뷰. 상태, 진행률, 미결정 constraint, 최근 이벤트 |
| `.claude/commands/start.md` | `/start` 에이전트 프로토콜 |
| `.claude/commands/align.md` | `/align` 에이전트 프로토콜 |
| `.claude/commands/draft.md` | `/draft` 에이전트 프로토콜 |

**에이전트 프로토콜 필수 포함 사항:**

각 `.claude/commands/` 마크다운에 3-Perspective 탐색 체크리스트:

```
Experience: 화면 레이아웃, 사용자 흐름, 디자인 가이드, 기존 상호작용 패턴
Code: DB 스키마, API 계약, 모듈 의존성, 상태 머신, 성능
Policy: 이용약관, 사업 규칙, 규제·법규, 디자인 표준, 운영 정책
```

**완료 기준 (End-to-End Slice):**
- `/start "튜터 차단 기능"` → Align Packet 생성 → `/align` approve → surface 생성 → `/draft` → Draft Packet 생성까지 한 사이클 완주
- **골든 예시(`golden-example.md`)와 구조적 일치 검증 통과:**
  - 섹션 존재 여부 (To-be, As-is, Tension, Decision / Surface, Status, Constraints, Guardrails, Decision)
  - CST-ID 추적 가능성
  - 필수 항목 완전성 (처리하지 않으면, 선택지 테이블, 되돌림 비용)
  - 기술 상세 `<details>` 접기
  - severity(중요도) 표기
  - Builder 결정 항목 구분

**설계 결정:**
- 소스 스캔(grounding)은 에이전트가 직접 수행. 코드 자동화하지 않음
- mockup 생성도 에이전트가 직접 수행. React + MSW 코드를 에이전트가 작성하여 `surface/preview/`에 저장
- 렌더러는 순수 함수: `(state, context) → string`. 뼈대를 만들고 에이전트가 내용 채움
- constraint 선택지(options)는 렌더링 시점에 에이전트가 생성

**이 Phase가 가장 중요한 이정표입니다. 이 시점에서 산출물이 나오지 않으면 이후 Phase는 의미 없음.**

### Phase 5: Compilers + Compile Defense

확정된 target을 Build Spec + delta-set + validation-plan으로 변환.

| 파일 | 책임 |
|------|------|
| `src/compilers/compile.ts` | Build Spec 7개 섹션 + delta-set.json + validation-plan.md 생성. `compile.started` → `compile.completed` 이벤트 기록 |
| `src/compilers/compile-defense.ts` | Layer 1 (Checklist): 모든 constraint가 Build Spec에 참조되는지. Layer 2 (Audit Pass): inject 반영, defer 비간섭, override 비반영, 추적 체인 완전성, edge case 존재 여부. Layer 3 (Warnings): 미검증 가정, 정책 변경 전제, 상태 누락, 공유 리소스, 불변 제약, brownfield 교차 검증 (비차단) |

**완료 기준:**
- 예시 데이터의 `build/delta-set.json`, `build/validation-plan.md`와 구조적 동일
- compile-defense가 의도적 누락을 탐지하는지 확인
- 추적 체인 끊김 탐지 테스트
- `compile.constraint_gap_found` 발생 시 Draft 복귀 확인

### Phase 6: Validators

구현 후 검증.

| 파일 | 책임 |
|------|------|
| `src/validators/validate.ts` | validation-plan.md 파싱 → 검증 항목 추출 → 통과/실패 기록. `validation.started` → `validation.completed` 이벤트 기록. 실패 시 상태 전이 (target issue → `constraints_resolved`, stale → `grounded`) |

**설계 결정:**
- v1에서 검증은 에이전트가 수동 수행. validate.ts는 결과 기록 + 상태 전이 관리

---

## End-to-End Slice에서 제외 (v1 이후 또는 에이전트 직접 수행)

| 항목 | 이유 |
|------|------|
| 소스 스캔 자동화 (Figma MCP, GitHub tarball, --add-dir 해시 비교) | 에이전트가 직접 수행. v1에서 코드 자동화 불필요 |
| stateful mockup 자동 생성 | 에이전트가 React + MSW 코드 작성 |
| stale detection (해시 비교) | gate guard에 해시 비교 로직 구현은 Phase 2 이후 |
| convergence safety (3/5/7 tier) | 에이전트 프로토콜로 관리 |
| feedback classification (confidence-based) | 에이전트가 직접 판단 |

---

## 테스팅 전략

### 골든 데이터

`scopes/example-tutor-block/`가 모든 테스트의 기대값.

| 파일 | 테스트 용도 |
|------|-----------|
| `events.ndjson` (29개 이벤트) | 타입 호환, reducer 정확성, 상태 전이 시퀀스 |
| `state/constraint-pool.json` | reducer constraint pool 기대값 |
| `state/verdict-log.json` | reducer verdict log 기대값 |
| `build/delta-set.json` | compiler delta-set 구조 기대값 |
| `build/validation-plan.md` | compiler validation-plan 구조 기대값 |

### 비정상 경로 테스트 (Phase 2에서 준비)

| 시나리오 | 기대 동작 |
|---------|----------|
| `draft` 상태에서 `align.locked` 발행 | 거부 (매트릭스에 없는 조합) |
| 존재하지 않는 constraint_id 참조 | 거부 (참조 무결성) |
| `required` + `override` + rationale 없음 | 거부 (Required Override Rule) |
| `convergence.blocked` 후 `align.revised` | 거부 (Convergence Blocking Rule) |
| `redirect.to_align` 후 재진입 | 상태 복귀 + 기존 constraint 유지 |
| `compile.constraint_gap_found` | `constraints_resolved`로 역전이 + constraint.discovered 자동 선행 |
| `snapshot.marked_stale` at `align_locked` | `align_proposed`로 역전이 |

### 테스트 우선순위

| 순위 | 대상 | 내용 |
|------|------|------|
| 1 | `state-machine.ts` | 전이/자기전이/거부 매트릭스 전수 검증 |
| 2 | `reducer.ts` | 골든 데이터 29개 이벤트 → 최종 상태 비교 |
| 3 | `gate-guard.ts` | 4가지 규칙별 허용/거부 케이스 |
| 4 | `compile-defense.ts` | L1 checklist + L2 audit pass + L3 evidence warnings + 추적 체인 + brownfield 교차 |
| 5 | `renderers/` | 골든 예시 구조 일치 검증 |

---

## 프로젝트 부트스트랩

| 항목 | 내용 |
|------|------|
| 언어 | TypeScript (strict mode) |
| 런타임 | Node.js (ES2022+) |
| 의존성 | 최소화. Node.js 기본 API로 시작 |
| 테스트 | Vitest 또는 Node.js test runner |
| 패키지 매니저 | npm 또는 bun |
| 디렉토리 | `src/kernel/`, `src/commands/`, `src/renderers/`, `src/compilers/`, `src/validators/` |
| Claude Code 통합 | `.claude/commands/start.md`, `.claude/commands/align.md`, `.claude/commands/draft.md` |

---

## Critical Path

```text
Phase 1 (kernel 기초) ← 모든 것의 기반
  → Phase 2 (kernel 완성) ← 프로젝트 성패 좌우. 매트릭스 전수 테스트 필수
    → Phase 3 (pipeline 통합) ← 이벤트 기록의 유일한 경로
      → Phase 4 (commands + renderers) ← end-to-end slice. 가장 중요한 이정표
        → Phase 5 (compilers + defense) ← compile까지 완주
          → Phase 6 (validators) ← 검증 루프 완성
```
