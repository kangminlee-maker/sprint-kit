# Build Spec: 홈 화면 체험 상태 기반 재설계

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | homeui-20260311-001 |
| 제목 | 홈 화면 체험 상태 기반 재설계 |
| 방향 | 홈 화면 Greeting 영역을 체험 진행 상태(미신청→대기→레슨 중→완료→예외) 기반으로 확장하고, 체험 완료 학생의 강제 리다이렉트를 제거하여 홈 화면 내에서 결제 전환 CTA를 노출. 디자인 온톨로지 기존 5개 홈 변형에 매핑하여 디자인 시스템 변경 최소화. |
| scope type | experience |

**범위 — 포함:**
- 홈 화면 Greeting 상태 분기 확장 (4개 → 8개+: 미신청, 체험대기, 예약완료, 레슨입장, 체험완료, 튜터노쇼, 학생노쇼/취소, 전체소진)
- HomeRedirection 강제 리다이렉트 제거 → 체험완료 학생도 홈 화면에 머무르도록 변경
- 상태별 메인 문구, 프로그레스 활성 단계, 본문 카드, CTA 버튼 라벨/동작 전환
- 체험 완료 후 결제 유도 카드(첫 수강 혜택, AFTER_TRIAL 쿠폰, 프로모션 배너) 홈 화면 내 노출
- 예외 상태(노쇼, 취소) 안내 UI 및 재신청/복귀 경로 제공
- 디자인 온톨로지 기존 home_variants 5개에 새 체험 상태를 매핑 (온톨로지 확장 없이)

**범위 — 제외:**
- GNB 구조 변경 (현재 5탭 유지)
- 백엔드 API 신규 개발 (기존 API 조합으로 처리)
- 결제 페이지(/subscribes/tickets) 자체의 UI 변경
- 정규 수강생(paymentYn=Y)의 홈 화면 변경
- 스마트토크 전용 홈(/home/ai) 변경
- 디자인 온톨로지(ontology.yaml) 자체의 변형 추가/수정

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `6af68fd57b69537bc665a2deb58cabcd8f4324f79626ec9120cc4e02e9046c99`

**시나리오 요약:**
8개 체험 상태별 홈 화면. 5개 변형 매핑. CTA 카드 내 배치.

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Code | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음 | inject | Section 4에서 구현. 리다이렉트 제거 |
| CST-002 | Code | greetingStatusSchema가 4개 상태만 지원 — 체험 세분화 상태 미존재 | inject | Section 4에서 구현. greetingStatusSchema 8개 확장 |
| CST-003 | Code | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가 | inject | Section 4에서 구현. getPodoTrialLectureList prefetch 추가 |
| CST-004 | Policy | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 | defer | 이번 범위에서 제외. 이유: 3회/유료 체험 정책 근거 미확인. 현재 백엔드(1회 하드코딩) 기준으로 먼저 구현, 정책 확인 후 별도 scope에서 처리. |
| CST-005 | Experience | 디자인 온톨로지 home_variants(5개)와 brief 상태 모델(8개+) 간 매핑 불일치 | inject | Section 4에서 구현. Surface 매핑 그대로 적용 |
| CST-006 | Policy | 노쇼 판정 기준 불일치 — 백엔드 코드 5분 vs 이용약관 10분 | defer | 이번 범위에서 제외. 이유: 노쇼 시간 기준 불일치(5분 vs 10분) 해소는 별도 과제. 이 scope에서는 시간을 언급하지 않음. |
| CST-007 | Policy | 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태 — 취소 안내 불가, 재매칭 대기 반영 필요 | inject | Section 4에서 구현. InvoiceStatus 직접 참조로 판별 |
| CST-008 | Code | 정기권 구매 시 체험 수업/수강권 자동 소멸 — 홈 화면 실시간 전환 필요 | inject | Section 4에서 구현. tanstack-query invalidateQueries |
| CST-009 | Experience | 홈 화면 GNB(62px 고정)와 플로팅 CTA 버튼 겹침 방지 전략 필요 | inject | Section 4에서 구현. CTA 카드 내 배치 |
| CST-010 | Policy | 스마트토크 체험은 AI 6회→튜터 1회 순차 개방 — 프로그레스 구조 영향 | defer | 이번 범위에서 제외. 이유: 스마트토크 전용 홈은 제외 범위. 일반 체험 프로그레스만 이 scope에서 구현. |

## 4. Implementation Plan

### IMPL-001 | CST-001

- **요약:** HomeRedirection 체험완료 리다이렉트 제거
- **변경 대상:** features/home-redirection/home-redirection.tsx
- **변경 내용:** trialClassCompYn=Y && paymentYn=N 리다이렉트 제거

### IMPL-002 | CST-002

- **요약:** greetingStatusSchema 8개 확장
- **변경 대상:** widgets/greeting/model/status.ts
- **변경 내용:** 7개 새 상태 추가

### IMPL-003 | CST-003

- **요약:** prefetch 추가
- **변경 대상:** app/(internal)/home/page.tsx
- **변경 내용:** getPodoTrialLectureList prefetch
- **guardrail:** SSR 실패 시 fallback

### IMPL-004 | CST-002, CST-003, CST-007

- **요약:** 상태 판별 로직 확장
- **변경 대상:** widgets/greeting/hooks/use-greeting-status.ts
- **변경 내용:** InvoiceStatus+classState 조합 판별
- **의존성:** IMPL-002, IMPL-003

### IMPL-005 | CST-005

- **요약:** 5개 변형 매핑
- **변경 대상:** widgets/greeting/ui/greeting-content.tsx
- **변경 내용:** 8개 상태→5개 변형
- **의존성:** IMPL-002

### IMPL-006 | CST-001, CST-005

- **요약:** 체험완료/소진 화면
- **변경 대상:** features/home-greeting/ui/states/
- **변경 내용:** 혜택 카드 + CTA
- **의존성:** IMPL-001, IMPL-005

### IMPL-007 | CST-007, CST-005

- **요약:** 노쇼 화면
- **변경 대상:** features/home-greeting/ui/states/
- **변경 내용:** 복구/미복구 안내 + 재예약
- **의존성:** IMPL-004, IMPL-005

### IMPL-008 | CST-009

- **요약:** CTA 카드 내 배치
- **변경 대상:** features/home-greeting/ui/components/GreetingActionSection.tsx
- **변경 내용:** ButtonPrimary를 GreetingCard 내부 하단에 배치. StickyBottom 미사용.

### IMPL-009 | CST-008

- **요약:** 캐시 무효화
- **변경 대상:** 결제 완료 콜백
- **변경 내용:** invalidateQueries 호출

### IMPL-010 | CST-010

- **요약:** 프로그레스바
- **변경 대상:** features/home-greeting/ui/components/TrialProgressBar.tsx
- **변경 내용:** 4단계 프로그레스 (일반 체험)

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 6건, modify 7건
- **content hash**: `1453119d2649e4a9468fffc6d69cb6cf724fb46cad040d26fa32e97da18a464c`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 10건
- **content hash**: `c904d89222d311981f354691491e67d35bca1233b9b59a4d38bffda105190ee3`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `8e79dc2b`)

### 변경 대상 파일 (6건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `apps/web/src/features/home-redirection/home-redirection.tsx` | 리다이렉트 | [→ 상세](brownfield-detail.md#a1) |
| `apps/web/src/widgets/greeting/model/status.ts` | 상태 스키마 | [→ 상세](brownfield-detail.md#a2) |
| `apps/web/src/widgets/greeting/hooks/use-greeting-status.ts` | 상태 판별 | [→ 상세](brownfield-detail.md#a3) |
| `apps/web/src/widgets/greeting/ui/greeting-content.tsx` | UI 분기 | [→ 상세](brownfield-detail.md#a4) |
| `apps/web/src/app/(internal)/home/page.tsx` | SSR prefetch | [→ 상세](brownfield-detail.md#a5) |
| `apps/web/src/views/home/view.tsx` | 홈 뷰 | [→ 상세](brownfield-detail.md#a6) |

### 직접 의존 모듈 (2건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| home-greeting | greeting widget | [→ 상세](brownfield-detail.md#b1) |
| greeting widget | subscribes entity queries | [→ 상세](brownfield-detail.md#b2) |

<details>
<summary>API 계약 (2건)</summary>

| endpoint | method | 설명 | 상세 |
|----------|--------|------|------|
| GET /api/v1/user/podo/getInfo | GET | PodoUserDto | [→ 상세](brownfield-detail.md#c1) |
| GET /api/v2/lecture/podo/getPodoTrialLectureList | GET | 체험수업 목록 | [→ 상세](brownfield-detail.md#c2) |

</details>

