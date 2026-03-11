# PRD 정책 분석 최종 보고서

**대상**: Build Spec — 홈 화면 체험 상태 기반 동적 전환 (homeui-20260311-001)
**분석일**: 2026-03-11
**방법**: 5-에이전트 다관점 팀 (4명 관점별 분석가 + Devil's Advocate)
**참조 문서**: podo-app/podo-docs, podo-backend/podo-docs (GitHub 원본, 총 12개 파일 참조)

---

## 목차

1. [분석 개요](#1-분석-개요)
2. [PM 필수 의사결정 TOP 10](#2-pm-필수-의사결정-top-10)
3. [PRD 내부 자기 모순](#3-prd-내부-자기-모순)
4. [체험 수강권 정책 분석 결과](#4-체험-수강권-정책-분석-결과)
5. [수업 상태 전환 분석 결과](#5-수업-상태-전환-분석-결과)
6. [구독 전환/결제 분석 결과](#6-구독-전환결제-분석-결과)
7. [UX 상태 완전성 분석 결과](#7-ux-상태-완전성-분석-결과)
8. [Devil's Advocate 검증 결과](#8-devils-advocate-검증-결과)
9. [개발 레벨 다운그레이드](#9-개발-레벨-다운그레이드)
10. [권고 사항](#10-권고-사항)

---

## 1. 분석 개요

| 항목 | 수치 |
|------|------|
| 원본 이슈 (4개 보고서 합계) | 24건 |
| 중복 병합 후 고유 이슈 | **15건** |
| CRITICAL | 3건 |
| HIGH | 7건 |
| MEDIUM | 3건 |
| Dev-Level 다운그레이드 | 5건 (PM 결정 불필요) |
| DA 신규 발견 | 2건 |
| PRD 내부 자기 모순 | 3건 |

### 관점별 분석가

| 관점 | 범위 | 원본 이슈 수 |
|------|------|------------|
| 체험 수강권 정책 (ticket-trial) | PODO_TRIAL 생명주기, 3회 무료→유료 전환 | 5건 |
| 수업 상태 전환 (lecture-state) | InvoiceStatus/LectureStatus/classState → TrialStatus 매핑 | 7건 |
| 구독 전환/결제 (subscription-conversion) | 체험→정규 전환, 결제 후 상태, 쿠폰 | 5건 |
| UX 상태 완전성 (ux-state-completeness) | 7상태 시나리오 커버리지, 프로그레스바, CTA | 9건 |

---

## 2. PM 필수 의사결정 TOP 10

### #1. [CRITICAL] "무료체험 3회" 정책의 실체 확인

**PRD 기술 내용**: CST-007 "무료체험 횟수(3회) 추적", "3회 소진 → 유료 체험 안내". IMPL-002 "레슨 이력에서 체험 횟수 계산".

**기존 정책**: ticket-policy.md — PODO_TRIAL은 `nPurchased=1`(1회). 체험권 발급 코드(TicketServiceV2Impl.java:305-341)도 1개만 생성. subscription-flow.md — TRIAL은 "1회 무료 체험 수업", "1인 1회 체험 제한".

**충돌**: 현행 시스템에서 PODO_TRIAL 체험권은 1회짜리이다. "3회 무료체험"을 구현하는 메커니즘(3개 체험권 동시 발급, 또는 nPurchased=3인 체험권)이 백엔드에 없다.

- [ ] "3회 무료체험"이 기존 운영 중인 정책인가, 이번에 신규 도입하는 정책인가?
- [ ] 신규 정책이라면 백엔드 변경이 필요하며, scope 범위("백엔드 API 신규 개발 제외")를 재설정해야 하는가?
- [ ] 현행 1회를 유지한다면 PRD의 EXHAUSTED/STUDENT_ABSENT("잔여 N회")/TUTOR_NOSHOW("복구") 상태를 1회 기준으로 전면 수정해야 함

---

### #2. [CRITICAL] "유료 체험 5,000원/3회" 상품 미존재

**PRD 기술 내용**: EXHAUSTED CTA "유료 체험 신청하기 · 5,000원", ctaAction `/trial/paid-apply`.

**기존 정책**: subscription-flow.md — 구독 타입 5종(TRIAL/SUBSCRIBE/LUMP_SUM/EXTEND/BONUS)에 "유료 체험" 없음. Subscribe 엔티티에 5,000원/3회에 대응하는 상품 레코드 부재.

**충돌**: EXHAUSTED 상태의 핵심 CTA가 존재하지 않는 상품을 가리킨다. 결제 플로우 구현 불가.

- [ ] 유료 체험 상품을 백엔드에 신규 추가하는가? (scope 범위 변경 필수)
- [ ] EXHAUSTED CTA를 "정규 수강권 구매하기"로 변경하는가?
- [ ] EXHAUSTED 상태를 이 scope에서 제외하는가?

---

### #3. [CRITICAL] 체험 횟수 계산 기준 미정의

**PRD 기술 내용**: IMPL-002 "레슨 이력에서 체험 횟수 계산". VAL-003 "NOSHOW 1건 + COMPLETED 2건 = 3건 → EXHAUSTED".

**기존 정책**: ticket-policy.md — 노쇼 시 `nUsed += 1`(소진). entities.md — NOSHOW_S는 "완료 그룹"(정산 관점).

**충돌**: "체험 1회 소비"의 정의가 없다. (A) Ticket 발급 수, (B) Lecture 완료 건수, (C) nUsed 합계 — 각각 다른 결과를 만든다.

- [ ] 학생 노쇼(NOSHOW_S) = 체험 1회 소비인가?
- [ ] 학생 취소(2시간 이내, nUsed += 1) = 체험 1회 소비인가?
- [ ] 취소(2시간 이전, 수강권 복구) = 소비 아님으로 확정 가능한가?

---

### #4. [HIGH] 체험권 만료(7일, 미사용) 사용자의 상태 누락

**PRD 기술 내용**: 7상태에 "체험권 만료" 상태 없음. EXHAUSTED는 "3회 소진"으로 정의.

**기존 정책**: ticket-policy.md — 체험권 만료 조건: `expireDate < 오늘`. 만료 시 잔여 횟수 소멸.

**충돌**: 가입 후 7일 내 체험 미사용 → 7상태 중 어디에도 해당하지 않음.

- [ ] 체험권 만료(미사용) 사용자의 TrialStatus를 정의할 것 (8번째 상태 추가? EXHAUSTED 확장? NOT_APPLIED fallback?)
- [ ] 만료 후 재발급 가능 여부

---

### #5. [HIGH] NOSHOW_BOTH(양측 노쇼) 상태 매핑 부재

**PRD 기술 내용**: 7상태에 TUTOR_NOSHOW와 STUDENT_ABSENT만 정의.

**기존 정책**: entities.md — NOSHOW_BOTH는 InvoiceStatus에 정의된 유효한 상태.

**충돌**: trial-status-mapper가 invoiceStatus=NOSHOW_BOTH를 수신하면 매핑할 곳이 없음.

- [ ] NOSHOW_BOTH → TUTOR_NOSHOW로 매핑(학생 유리 원칙)을 확정하는가?
- [ ] NOSHOW_BOTH 시 체험 횟수 차감 여부

---

### #6. [HIGH] CANCEL/CANCEL_PAID 체험수업의 TrialStatus 부재

**PRD 기술 내용**: 7상태에 "취소" 상태 없음.

**기존 정책**: policies.md — CANCEL(2시간 전 취소, 수강권 복구), CANCEL_PAID(2시간 이내 취소, 수강권 소진).

**충돌**: 학생이 체험 예약을 취소한 경우의 홈 화면 상태 미정의.

- [ ] 취소(2시간 전) = 횟수 미소비 → WAITING/NOT_APPLIED로 복귀하는가?
- [ ] 취소(2시간 이내, 수강권 소진) = 횟수 소비로 카운트하는가?
- [ ] CANCEL_PAID가 무료 체험에서 발생 가능한가? (튜터 정산이 발생하는 케이스)

---

### #7. [HIGH] TUTOR_NOSHOW "다시 신청하기" — 체험권 복구 정책 미확인

**PRD 기술 내용**: Surface TUTOR_NOSHOW subtitle "체험 1회가 복구되었습니다", CTA "다시 신청하기".

**기존 정책**: ticket-policy.md — 노쇼 시 `nUsed += 1`(소진). 튜터 노쇼 시 학생 수강권 복구 정책이 **명시되어 있지 않음**.

**충돌**: "복구되었습니다"라고 안내하지만, 실제 복구 여부가 불확실. 1회 체험 모델이면 소진 후 재신청 불가.

- [ ] 튜터 노쇼(CANCEL_NOSHOW_T) 시 학생 체험 횟수가 실제로 복구되는지 백엔드 확인
- [ ] 복구된다면 "다시 신청하기"의 동작 정의 (새 수업 생성? 재예약?)

---

### #8. [HIGH] AFTER_TRIAL 쿠폰 미노출

**PRD 기술 내용**: COMPLETED subtitle "지금 수강권을 구매하면 특별 혜택을 받을 수 있어요".

**기존 정책**: coupon-policy.md — AFTER_TRIAL 쿠폰: 체험 완료 후 자동 발급, 20% 할인, 7일 유효.

**충돌**: 쿠폰 할인율(20%)과 유효기간(7일)이 전환의 핵심 레버인데, COMPLETED 카드에서 구체적 정보를 노출하지 않음.

- [ ] COMPLETED 카드에 쿠폰 할인율/유효기간을 명시할 것인가?
- [ ] EXHAUSTED 상태에서도 쿠폰 잔여 유효기간이 있을 수 있는데, 이 경우 안내 방식은?

---

### #9. [HIGH] WAITING 상태의 과도한 범위

**PRD 기술 내용**: WAITING CTA "예습하기", subtitle에 예약 일정 표시.

**기존 정책**: lecture-flow.md — 수업 생성(CREATED) → 예습 → 예약(RESERVED) 순서. 예습은 예약 **전**에 진행.

**충돌**: WAITING이 3가지 서로 다른 시점을 모두 포함:
1. 수업 생성 후 예습 전 (일정 미확정, CTA "예습하기" 적절)
2. 예습 완료 후 예약 전 (일정 미확정, CTA "레슨 예약하기"가 적절)
3. 예약 완료 후 수업 대기 (일정 확정, CTA "일정 확인"이 적절)

- [ ] WAITING을 세분화할 것인가? (예: PREPARING / RESERVED_WAITING)
- [ ] 단일 WAITING으로 유지하되 CTA/subtitle을 조건부 변경할 것인가?

---

### #10. [HIGH] NOT_APPLIED 범위 — 순수 신규 vs 정규 만료 재방문자

**PRD 기술 내용**: NOT_APPLIED CTA "무료 체험 신청하기".

**기존 정책**: VAL-004 "정규 만료 후 수강권 없음 → NO_TICKET (기존 UI)".

**충돌**: "체험 완료 + 정규 만료"인 재방문자가 NOT_APPLIED 분기에 진입하면 이미 완료한 체험을 다시 신청하라는 안내를 받을 수 있음.

- [ ] NOT_APPLIED 진입 조건에 "체험 이력 없음"을 필수 조건으로 추가할 것인가?
- [ ] "체험 완료 + 정규 만료" 사용자는 EXHAUSTED로 분기? 기존 NO_TICKET UI 유지?

---

## 3. PRD 내부 자기 모순

### 모순 1: "백엔드 API 신규 개발 제외" vs "3회 무료체험 + 유료 체험 5,000원"

| 위치 | 내용 |
|------|------|
| Scope Summary "범위 — 제외" | "백엔드 API 신규 개발 (기존 API의 응답 데이터 활용 범위 내에서 해결)" |
| CST-007 / EXHAUSTED 상태 | "무료체험 횟수(3회) 추적", "유료 체험 5,000원/3회 전환" |

3회 체험 발급 메커니즘과 유료 체험 상품이 백엔드에 없으므로, 이들을 구현하려면 백엔드 변경이 필수. scope의 "제외" 범위와 직접 충돌.

### 모순 2: "체험 1회 복구" 서술 vs 1회 체험 모델

| 위치 | 내용 |
|------|------|
| TUTOR_NOSHOW subtitle | "체험 1회가 복구되었습니다" |
| STUDENT_ABSENT subtitle | "잔여 무료체험: 2회 남음" |
| ticket-policy.md | PODO_TRIAL `nPurchased=1` |

1회 체험 모델에서 "복구"와 "잔여 2회"는 논리적으로 불가능. 두 상태의 subtitle 모두 3회 모델을 전제.

### 모순 3: RESERVED+PREFINISH → LESSON_READY 매핑 vs entities.md 정의

| 위치 | 내용 |
|------|------|
| VAL-008 Edge case | "RESERVED+PREFINISH → LESSON_READY" 기대 |
| entities.md 완료 쿼리 | PREFINISH를 COMPLETED와 동일 취급 |
| policies.md 6.1 | PREFINISH = "가완료"(수업 거의 종료) |

PREFINISH는 "수업 종료 직전"이므로 LESSON_READY("레슨 입장하세요")가 아니라 COMPLETED에 가까움. 매핑이 반대 방향.

---

## 4. 체험 수강권 정책 분석 결과

### [CRITICAL-1] "3회 무료체험" 정책 근거 부재
→ TOP 10 #1로 통합

### [CRITICAL-2] "유료체험 5,000원/3회" 상품 미존재
→ TOP 10 #2로 통합

### [HIGH-1] 체험 횟수 계산 기준 모호
→ TOP 10 #3으로 통합 (DA에 의해 CRITICAL로 상향)

### [HIGH-2] 체험권 만료 후 TrialStatus 미정의
→ TOP 10 #4로 통합

### [MEDIUM-1] curriculumType 제약 + API 응답 eventType 포함 여부
→ Dev-Level 다운그레이드 (DL-2)

---

## 5. 수업 상태 전환 분석 결과

### [CRITICAL-1] NOSHOW_BOTH → TrialStatus 매핑 부재
→ TOP 10 #5로 통합 (DA에 의해 HIGH로 하향: 발생 빈도 극히 낮음)

### [CRITICAL-2] CANCEL/CANCEL_PAID 체험수업의 TrialStatus 부재
→ TOP 10 #6으로 통합 (DA에 의해 HIGH로 하향: 기존 정책 매핑 문제)

### [HIGH-1] CREATED + classState 조합의 모호한 매핑
→ Dev-Level 다운그레이드 (DL-1: WAITING 매핑이 자명)

### [HIGH-2] RESERVED + PREFINISH → LESSON_READY 매핑 오류
→ PRD 내부 자기 모순 #3으로 통합

### [HIGH-3] 프로그레스바 "예습" 단계의 InvoiceStatus 공백
- classState=PRESTUDY는 별도 예습용 Lecture 레코드를 의미하며, 본 수업의 예습 상태가 아닐 수 있음
- 예습 판별은 preStudyTime > 0 또는 예습용 Lecture 존재 여부로 해야 할 가능성
- **참조**: lecture-flow.md 3단계, entities.md 선행학습 조회 쿼리

### [MEDIUM-1] WAITING 진입 조건 불명확
→ TOP 10 #9와 연관

### [MEDIUM-2] 체험 횟수에 NOSHOW_S 포함 여부
→ TOP 10 #3으로 통합

---

## 6. 구독 전환/결제 분석 결과

### [CRITICAL-1] EXHAUSTED "유료 체험 5,000원" 상품 미존재
→ TOP 10 #2로 통합

### [HIGH-1] AFTER_TRIAL 쿠폰 미노출
→ TOP 10 #8로 통합

### [HIGH-2] invalidateQueries 충분성
→ Dev-Level 다운그레이드 (DL-5: 개발자가 optimistic update/polling으로 해결 가능)

### [HIGH-3] 정규+체험 동시 보유 시 UI 우선순위
→ TOP 10 #10과 연관. "정규 우선" 원칙 확인 시 Dev-Level 가능

### [MEDIUM-1] EXHAUSTED 판정 기준 — 무료 체험만 vs 유료 체험 포함
→ TOP 10 #1에 종속 (3회 정책 확정 후 자동 결정)

---

## 7. UX 상태 완전성 분석 결과

### [CRITICAL-1] "예습 중" 상태 누락 — WAITING 범위 과도
→ TOP 10 #9로 통합 (DA에 의해 HIGH로 보정: 기능 오류가 아닌 UX 구분 문제)

### [CRITICAL-2] 체험권 만료(미사용) 시나리오 부재
→ TOP 10 #4로 통합

### [HIGH-1] 프로그레스바 "예습→레슨" 경계 모호
→ Dev-Level 다운그레이드 (DL-3: CST-011 결정의 자연스러운 결과)

### [HIGH-2] TUTOR_NOSHOW "다시 신청하기" — 체험권 복구 정책 불일치
→ TOP 10 #7로 통합

### [HIGH-3] STUDENT_ABSENT "잔여 2회" — 1회 체험 모델과 모순
→ TOP 10 #1에 종속 (3회 정책 확정 후 자동 해소)

### [HIGH-4] EXHAUSTED "유료 체험 5,000원" — 상품 미존재
→ TOP 10 #2로 통합

### [MEDIUM-1] NOT_APPLIED 범위 — 신규 vs 정규 만료 재방문자
→ TOP 10 #10으로 통합 (DA에 의해 HIGH로 상향)

### [MEDIUM-2] COMPLETED CTA와 GNB 수강신청 중복
→ Dev-Level 다운그레이드 후 **제거** (DL-4: 의도된 설계, Brief에서 명시)

### [MEDIUM-3] NOSHOW_BOTH 미처리
→ TOP 10 #5로 통합

---

## 8. Devil's Advocate 검증 결과

### 심각도 조정

| 이슈 | 원래 | 조정 후 | 사유 |
|------|------|---------|------|
| 체험 횟수 계산 기준 (Report 1 HIGH-1) | HIGH | **CRITICAL** | #1과 결합 시 EXHAUSTED/STUDENT_ABSENT 계산 완전 불능 |
| NOSHOW_BOTH 매핑 (Report 2 CRITICAL-1) | CRITICAL | **HIGH** | 발생 빈도 극히 낮은 예외 케이스 |
| CANCEL 매핑 (Report 2 CRITICAL-2) | CRITICAL | **HIGH** | 기존 정책의 매핑 문제, 신규 정책 아님 |
| WAITING 과도한 범위 (Report 4 CRITICAL-1) | CRITICAL | **HIGH** | 기능 오류가 아닌 UX 구분 문제 |

### 신규 발견

**NEW-1 [HIGH]**: NOT_APPLIED 범위 — "체험 완료 + 정규 만료" 재방문자가 NOT_APPLIED에 진입하면 이미 완료한 체험을 재신청하라는 안내. → TOP 10 #10으로 반영.

**NEW-2 [MEDIUM]**: COMPLETED 상태 유효 기간 미정의 — 체험 완료 후 결제하지 않은 사용자가 7일(쿠폰 유효기간) 이후 재방문 시 "특별 혜택" 메시지가 무효. 상태 전환 정책 필요.

---

## 9. 개발 레벨 다운그레이드

PM 결정이 불필요하며, 개발자(Builder)가 독립적으로 판단 가능한 항목:

| # | 원래 이슈 | 원래 심각도 | 다운그레이드 근거 |
|---|----------|-----------|----------------|
| DL-1 | CREATED+classState 매핑 (Report 2 HIGH-1) | HIGH | CREATED 전체를 WAITING으로 매핑하는 것이 자명. 개발자가 API 응답 확인 후 판단 가능 |
| DL-2 | curriculumType 제약 + eventType (Report 1 MEDIUM-1) | MEDIUM | API 응답 필드 존재 여부는 개발자가 확인 가능 |
| DL-3 | 프로그레스바 경계 (Report 4 HIGH-1) | HIGH | CST-011에서 classState/pre_study_time 판별로 이미 결정. 프로그레스바 step은 이 매핑의 자연스러운 결과 |
| DL-4 | COMPLETED CTA와 GNB 중복 (Report 4 MEDIUM-2) | MEDIUM | 의도된 설계. Brief에서 "GNB 수강신청 버튼 상시 접근" 명시. 이슈에서 제거 |
| DL-5 | invalidateQueries 충분성 (Report 3 HIGH-2) | HIGH | tanstack-query의 자동 refetch + optimistic update/polling으로 개발자가 해결 가능 |

---

## 10. 권고 사항

### 즉시 조치 (TOP 3 블로커)

TOP 1~3("3회 무료체험", "유료 체험 상품", "횟수 계산 기준")이 미해결이면 나머지 모든 결정이 블로킹됩니다.

**권장 결정 순서:**
1. **TOP 1 확정** → 무료체험이 1회인지 3회인지 결정
2. **TOP 2 확정** → 유료 체험 상품 존재 여부 결정 (없으면 EXHAUSTED CTA 변경)
3. **TOP 3 확정** → 횟수 계산 기준 정의 (노쇼/취소 포함 여부)
4. TOP 1~3 확정 후 → TOP 4~7(예외 상태 매핑) 결정
5. 마지막으로 → TOP 8~10(UX 세부) 결정

### scope 범위 재검토

"백엔드 API 신규 개발 제외"가 PRD의 핵심 기능(EXHAUSTED/STUDENT_ABSENT/TUTOR_NOSHOW)과 충돌합니다. 두 가지 해결 경로:

**(A) scope 범위 유지 → PRD 축소**: 체험 모델을 현행 1회로 유지. EXHAUSTED/STUDENT_ABSENT의 "잔여 횟수"와 유료 체험 CTA를 제거. 7상태를 5~6상태로 축소.

**(B) scope 범위 확장 → 백엔드 선행**: 3회 체험 발급 + 유료 체험 상품을 별도 scope로 선행 개발. 프론트엔드 scope는 백엔드 완료 후 진행.

### PRD 정정 필요 항목

1. VAL-008: `RESERVED+PREFINISH → LESSON_READY` → `RESERVED+PREFINISH → COMPLETED`로 정정 (자기 모순 #3)
2. TUTOR_NOSHOW subtitle: "체험 1회가 복구되었습니다" → 복구 정책 확인 후 정정 (자기 모순 #2)
3. STUDENT_ABSENT subtitle: "잔여 무료체험: 2회 남음" → 체험 모델 확정 후 정정 (자기 모순 #2)
4. WAITING subtitle: 예약 일정 표시 → 예약 전 상태에서는 일정 미확정이므로 조건부 표시 필요

---

*이 보고서는 prism:prd 다관점 분석 스킬로 생성되었습니다.*
