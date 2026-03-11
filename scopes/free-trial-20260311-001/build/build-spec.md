# Build Spec: 무료체험 횟수 정책 변경 (1회 → 3회)

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | free-trial-20260311-001 |
| 제목 | 무료체험 횟수 정책 변경 (1회 → 3회) |
| 방향 | 체험 레슨을 1회에서 3회로 확대한다. 첫 수업 예약 시 체험권 3장을 발급하고, 순차 개방(직전 수업 정상 종료 후 다음 예약 가능)하며, 예약 시 3일 이내 수업만 선택 가능하다. 학생 노쇼·2시간 내 취소 시 2장 소멸(사용+페널티), 2시간 전 취소 시 복구, 강사 노쇼 시 복구. 매회 체험 완료 후 쿠폰 발급. 정규 전환 시 잔여 체험 자동 취소(확인 없음). 무료 체험은 TRIAL_FREE(0원), 유료 체험(5,000원/3회)은 TRIAL 유형. |
| scope type | experience |

**범위 — 포함:**
- 무료체험 총 3회 제공 규칙 (기존 1회 → 3회)
- 첫 수업 예약 시 체험권 3장 발급, 순차 개방
- 예약 가능 범위: 예약 시점으로부터 3일 이내
- 학생 노쇼·2시간 내 취소 시 2장 소멸 (사용+페널티)
- 학생 2시간 전 취소 시 복구
- 강사 노쇼 시 복구 + 재예약 3일 이내
- 매회 체험 완료 후 AFTER_TRIAL 쿠폰 발급
- 정규 전환 시 잔여 체험 자동 취소 (확인 없음)
- 3회 소진 후 유료 체험(5,000원/3회) 전환
- 체험 상태 추적 구조 변경 (Y/N → 횟수 기반)
- UI 문구·배너·이미지 3회 정책 반영
- 홈 화면 체험 진행 중 상태 추가 및 진행률 표시

**범위 — 제외:**
- 정규 수강권 결제 흐름 변경
- 튜터 매칭 알고리즘 변경
- 다국어(영어·일본어 외) 체험 정책
- 체험 레슨 교재/커리큘럼 변경
- 마케팅 채널별 체험 차별 정책

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `f31300f3094d7bca7985b943c5cf0f3994fed087a5c78ecb611516ef2215d30c`

**시나리오 요약:**
8개 시나리오로 구성된 체험 레슨 홈 화면 Surface.
- 미신청: 체험 3회 안내 + 예약 규칙 + "무료 체험 시작하기" CTA
- 1회차 예약: Stepper(0/3) + 레슨 정보 카드 + 잔여 체험권 표시
- 1/3 완료: Stepper(1/3) + 쿠폰 발급 알림 + 체험 기록 + "다음 체험 예약하기"
- 2/3 완료: Stepper(2/3) + "마지막 체험 예약하기"
- 3/3 완료: Stepper(3/3) + 쿠폰 3장 발급 + "수강권 보러가기"
- 학생 노쇼: 2장 소멸(사용+페널티) 안내 + "남은 N회 예약하기"
- 튜터 노쇼: 복구(+1장) 안내 + "다시 예약하기"
- 소진: 유료 체험 5,000원/3회 상품 + 정규 수강 보조 CTA

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Policy | 1인 1회 체험 제한 정책이 구독 정책·검증 로직·DB에 걸쳐 적용 중이며, 3회 허용으로 전면 변경 필요 | inject | Section 4에서 구현. 3회 허용으로 전면 변경 |
| CST-002 | Code | 체험 수강권 발급 시 nPurchased=1, originCount=1 하드코딩 — 3으로 변경 필요 | inject | Section 4에서 구현. nPurchased=3 변경 + 발급 시점을 첫 예약으로 이동 |
| CST-003 | Policy | 체험 수강권 만료일이 7일(하드코딩)인데, 매일 1회 예약 제한(이용약관) 감안 시 3회 소화에 최소 3일 필요 — 만료일 연장 여부 결정 필요 | inject | Section 4에서 구현. 만료일 삭제 + 예약 시 3일 이내 제한 |
| CST-004 | Policy | 무료 3회 체험의 결제 유형을 TRIAL(카드 파킹 포함)과 TRIAL_FREE(0원 결제) 중 결정 필요 — 유료 체험(5,000원/3회) 전환 시 결제 유형도 함께 결정 | inject | Section 4에서 구현. 무료=TRIAL_FREE, 유료=TRIAL |
| CST-005 | Policy | 3회 체험에서 학생 노쇼·취소 시 차감 규칙과 튜터 노쇼 시 복구 규칙을 정의해야 함 — 현재 일반 정책은 노쇼 시 무조건 차감 | inject | Section 4에서 구현. 학생 노쇼=2장 소멸, 2h전 취소=복구, 튜터 노쇼=복구 |
| CST-006 | Policy | AFTER_TRIAL 쿠폰 발급 시점 결정 필요 — 매회 완료 시 vs 3회 전체 완료 후 1회 | inject | Section 4에서 구현. 매회 완료 시 쿠폰 발급 (중복 사용 불가) |
| CST-007 | Policy | 3회 체험 중 정규 전환 결제 시, 미완료 체험 수업이 자동 취소(L7/L8)됨 — 의도된 동작인지 결정 필요 | inject | Section 4에서 구현. 기존 자동 취소 동작 유지 (확인 없음) |
| CST-008 | Code | 체험 상태 추적이 trialPaymentYn/trialClassCompYn(Y/N 이진값) 기반 — '3회 중 N회 사용' 상태를 표현할 수 없어 횟수 기반으로 구조 변경 필요 | inject | Section 4에서 구현. trialUsedCount/trialTotalCount 필드 추가 + API 확장 |
| CST-009 | Experience | UI 전반의 1회 기준 문구·배너·이미지 교체 필요 — 취소 경고('다시 들을 수 없다'), 결제 안심('단 1회'), 상품명, 배너 에셋 7개+, CTA 문구 | inject | Section 4에서 구현. Surface 기준으로 전면 교체 |
| CST-010 | Experience | 홈 화면 상태 분기에 '체험 진행 중(1/3, 2/3)' 상태 추가 + 체험 완료 페이지 중간/최종 분기 + Progress 컴포넌트 적용 필요 | inject | Section 4에서 구현. Surface 기준으로 상태 분기 추가 |
| CST-011 | Policy | 유료 체험(5,000원/3회) 상품을 GT_SUBSCRIBE 테이블에 등록하고, 무료 3회 소진 후 전환 규칙 정의 필요 | inject | Section 4에서 구현. GT_SUBSCRIBE에 유료 체험 상품 등록 (5,000원/3회) |

## 4. Implementation Plan

### IMPL-001 | CST-001

- **요약:** 구독 정책 '1인 1회 체험 제한' 해제 + DuplicateLessonValidator 완화
- **변경 대상:** DuplicateLessonValidator.java, subscription/policies.md
- **변경 내용:** DuplicateLessonValidator에서 체험 수업 존재 시 차단 → trialUsedCount < trialTotalCount 시 허용으로 변경. 정책 문서 '1인 1회 제한' → '1인 3회 제한'으로 수정.

### IMPL-002 | CST-002, CST-001

- **요약:** 체험 수강권 발급 로직 변경 — nPurchased=3, 발급 시점을 첫 예약으로 이동
- **변경 대상:** TicketServiceV2Impl.java, TrialPaymentProcessor.java
- **변경 내용:** originCount=3, nPurchased=3으로 변경. 발급 시점을 결제(TrialPaymentProcessor) → 첫 수업 예약(PodoScheduleServiceImplV2) 시점으로 이동. 중복 발급 방지 로직 추가.
- **guardrail:** 체험권 발급은 첫 수업 예약 시에만 발생. 중복 발급 방지 로직 필수.

### IMPL-003 | CST-008

- **요약:** 체험 상태 추적 구조 변경 — trialUsedCount/trialTotalCount 필드 추가
- **변경 대상:** Student 엔티티, UserGateway.java, API 응답 DTO
- **변경 내용:** Student 엔티티에 trial_used_count(Integer, default 0), trial_total_count(Integer, default 0) 컬럼 추가. hasCompletedTrialClass를 count 기반으로 변경. API 응답에 remainingTrialCount 포함.
- **guardrail:** 기존 trialPaymentYn 필드 즉시 삭제 금지. 병행 운영.

### IMPL-004 | CST-003

- **요약:** 만료일 삭제 + 예약 시 3일 이내 수업만 선택 가능
- **변경 대상:** TrialPaymentProcessor.java, PodoScheduleServiceImplV2.java
- **변경 내용:** giveDays 기반 만료 로직 제거 (체험 수강권 expireDate = null 또는 충분히 먼 미래). 예약 API에 체험 수업 예약 시 3일 이내 필터 추가.

### IMPL-005 | CST-004

- **요약:** 결제 유형 분기 — 무료=TRIAL_FREE, 유료=TRIAL
- **변경 대상:** PaymentType.java, TrialPaymentProcessor.java
- **변경 내용:** 무료 체험 3회 결제 시 TRIAL_FREE 유형 사용. 유료 체험(5,000원) 결제 시 TRIAL 유형 사용. isTrialFreeEnabled 조건을 잔여 무료 체험 여부로 변경.

### IMPL-006 | CST-005

- **요약:** 노쇼/취소 차감 규칙 — 체험 전용 페널티 (2장 소멸)
- **변경 대상:** PodoScheduleServiceImplV2.java, ticket-policy.md
- **변경 내용:** 체험 수업 노쇼/2시간 내 취소 시 nUsed += 2 (사용 1장 + 페널티 1장). 2시간 전 취소 시 nUsed 변경 없음 (복구). 튜터 노쇼 시 nUsed 변경 없음 (복구).

### IMPL-007 | CST-001

- **요약:** 순차 개방 로직 — 직전 회차 정상 종료 후 다음 회차 개방
- **변경 대상:** PodoScheduleServiceImplV2.java, UserRepository.java
- **변경 내용:** 체험 수업 예약 시 이전 회차 수업의 상태가 DONE인지 확인. 첫 회차는 무조건 예약 가능. 2-3회차는 직전 회차 DONE 확인 후 예약 허용.
- **의존성:** IMPL-001

### IMPL-008 | CST-006

- **요약:** AFTER_TRIAL 쿠폰 매회 완료 시 발급
- **변경 대상:** 쿠폰 발급 트리거, coupon-policy.md
- **변경 내용:** 체험 수업 DONE 상태 전환 시 AFTER_TRIAL 쿠폰 발급. 동일 쿠폰 중복 사용 방지 로직 추가. STEP_3 판정 기준을 '체험 수업 3회 모두 DONE'으로 변경.

### IMPL-009 | CST-007

- **요약:** 정규 전환 시 자동 취소 유지
- **변경 대상:** PaymentGateway.java
- **변경 내용:** 기존 cancelTrialTicketBySubMappId() 로직 유지. 변경 없음.

### IMPL-010 | CST-009

- **요약:** 프론트엔드 UI 문구·배너·이미지 3회 정책 반영
- **변경 대상:** lesson-cancel-confirm-dialog.tsx, trial-subscribes/view.tsx, trial-banner.tsx 등
- **변경 내용:** 취소 경고 문구를 잔여 체험권 수에 따라 분기. '단 1회' → 삭제. 상품명 → '체험 레슨 3회'. 배너 이미지 교체.

### IMPL-011 | CST-010

- **요약:** 홈 화면 상태 분기 + Stepper + 완료 페이지 중간/최종 분기
- **변경 대상:** home-redirection.tsx, home-banners.tsx, use-greeting-status.ts
- **변경 내용:** trialClassCompYn → remainingTrialCount 기반 분기. 홈 화면에 Stepper(1/3, 2/3, 3/3) 표시. 체험 완료 페이지에 중간(다음 체험 예약) / 최종(수강권 유도) 분기.
- **의존성:** IMPL-003

### IMPL-012 | CST-011

- **요약:** 유료 체험 상품(5,000원/3회) GT_SUBSCRIBE 등록 + 결제 UI
- **변경 대상:** GT_SUBSCRIBE 테이블, trial-subscribes/view.tsx
- **변경 내용:** 영어/일본어 유료 체험 상품 레코드 추가 (SUB_PRICE=5000, nPurchased=3). 무료 체험 소진 후 유료 체험 구매 UI 노출.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 1건, modify 16건
- **content hash**: `9d55811fdb2ac6b843d4a04d2fdaf84a1823d1da328110535df948cb6b0ff143`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 11건
- **content hash**: `30dabed7d133ff5a22439b98328b9678c76c36f77ab1069f3c599edbf3c06000`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `87411b81`)

### 변경 대상 파일 (11건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `DuplicateLessonValidator.java` | 체험 중복 검증 | [→ 상세](brownfield-detail.md#dup-validator) |
| `TicketServiceV2Impl.java` | 수강권 발급 | [→ 상세](brownfield-detail.md#ticket-service) |
| `TrialPaymentProcessor.java` | 체험 결제 처리 | [→ 상세](brownfield-detail.md#trial-payment) |
| `UserGateway.java` | 사용자 정보 조회 | [→ 상세](brownfield-detail.md#user-gateway) |
| `UserRepository.java` | 사용자 DB 쿼리 | [→ 상세](brownfield-detail.md#user-repo) |
| `PodoScheduleServiceImplV2.java` | 수업 예약/취소 | [→ 상세](brownfield-detail.md#schedule-service) |
| `PaymentGateway.java` | 결제 게이트웨이 | [→ 상세](brownfield-detail.md#payment-gateway) |
| `home-redirection.tsx` | 홈 리다이렉트 로직 | [→ 상세](brownfield-detail.md#home-redirect) |
| `home-banners.tsx` | 홈 배너 분기 | [→ 상세](brownfield-detail.md#home-banners) |
| `trial-subscribes/view.tsx` | 체험 결제 페이지 | [→ 상세](brownfield-detail.md#trial-subscribes) |
| `lesson-cancel-confirm-dialog.tsx` | 취소 다이얼로그 | [→ 상세](brownfield-detail.md#cancel-dialog) |

### 직접 의존 모듈 (3건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| TrialPaymentProcessor | TicketServiceV2Impl | [→ 상세](brownfield-detail.md#dep-trial-ticket) |
| PodoScheduleServiceImplV2 | TicketGateway | [→ 상세](brownfield-detail.md#dep-schedule-ticket) |
| home-redirection | userEntityQueries | [→ 상세](brownfield-detail.md#dep-home-user) |

<details>
<summary>API 계약 (3건)</summary>

| endpoint | method | 설명 | 상세 |
|----------|--------|------|------|
| /api/user/info | GET | 사용자 정보 (trialPaymentYn → +remainingTrialCount) | [→ 상세](brownfield-detail.md#api-user-info) |
| /api/schedule/trial | POST | 체험 수업 예약 (순차 개방 + 3일 이내 검증) | [→ 상세](brownfield-detail.md#api-trial-schedule) |
| /api/payment/trial | POST | 체험 결제 (TRIAL_FREE/TRIAL 분기) | [→ 상세](brownfield-detail.md#api-trial-payment) |

</details>

<details>
<summary>DB 스키마 (3건)</summary>

| 테이블 | 컬럼 | 상세 |
|--------|------|------|
| GT_STUDENT | trial_payment_yn, trial_class_comp_yn → +trial_used_count, +trial_total_count | [→ 상세](brownfield-detail.md#schema-student) |
| GT_SUBSCRIBE | FREE_TRIAL, SUB_PRICE, LESSON_COUNT_PER_MONTH | [→ 상세](brownfield-detail.md#schema-subscribe) |
| GT_TICKET | origin_count, n_purchased, expire_date | [→ 상세](brownfield-detail.md#schema-ticket) |

</details>

