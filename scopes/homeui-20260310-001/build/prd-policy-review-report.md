# PRD 정책 분석 최종 보고서

**대상**: 홈 화면 상태 기반 재설계 (homeui-20260310-001)
**분석 일자**: 2026-03-10
**분석 방법**: 4-agent 다관점 팀 (4명 관점 분석가 + Devil's Advocate)
**참조 문서**: podo-backend/podo-docs (10개 도메인), podo-app/podo-docs (아키텍처/디자인 시스템)

---

## 목차

1. [분석 개요](#1-분석-개요)
2. [PM 필수 의사결정 TOP 10](#2-pm-필수-의사결정-top-10)
3. [PRD 내부 자기 모순](#3-prd-내부-자기-모순)
4. [각 관점별 분석 결과](#4-각-관점별-분석-결과)
5. [Devil's Advocate 검증 결과](#5-devils-advocate-검증-결과)
6. [개발 레벨 다운그레이드](#6-개발-레벨-다운그레이드)
7. [권고 사항](#7-권고-사항)

---

## 1. 분석 개요

| 항목 | 값 |
|------|-----|
| 분석가 수 | 4명 (체험수업/결제전환/수강권예약/프론트아키텍처) + DA 1명 |
| 원본 발견 건수 | 15건 |
| 병합 후 건수 | **13건** |
| CRITICAL | **4건** |
| HIGH | **3건** |
| MEDIUM | **3건** |
| Dev-level 다운그레이드 | **3건** |
| 신규 발견 (DA) | **2건** |
| PRD 내부 모순 | **3건** |

---

## 2. PM 필수 의사결정 TOP 10

### 1위: [CRITICAL] 유료 체험 3회 상품과 현행 시스템 충돌

현재 시스템은 체험 수업 1회 고정 발급 + 1인 1회 제한으로 설계되어 있습니다. PRD가 언급하는 "유료 체험 5,000원/3회" 상품은 이 설계와 충돌합니다.

- **근거**: payment/policies.md (TRIAL 유형: 1인 1회 제한), ticket/policies.md (nPurchased=1 고정 발급)
- **영향**: 유료 체험 3회를 구현하려면 수강권 발급 로직, 예약 제한, 결제 검증(DUPLICATE_SUBSCRIPTION) 모두 변경 필요

- [ ] 유료 체험 3회 상품을 이번 scope에 포함할지, 후속 scope로 분리할지 결정
- [ ] 포함 시: 1인 1회 제한 해제 범위와 수강권 발급 로직 변경 승인 여부
- [ ] 분리 시: 시나리오 7(TRIAL_EXHAUSTED) 화면에서 유료 체험 안내를 제거할지, placeholder로 유지할지

### 2위: [CRITICAL] NOSHOW_BOTH 상태 매핑 누락

백엔드 InvoiceStatus에 NOSHOW_BOTH(양측 노쇼) 상태가 존재하지만, PRD의 8상태에 매핑이 없습니다.

- **근거**: lecture/policies.md 섹션 1.1, enums.md Lecture.InvoiceStatus

- [ ] NOSHOW_BOTH를 STUDENT_NOSHOW로 매핑할지, 별도 9번째 상태로 추가할지
- [ ] NOSHOW_BOTH 시 72시간 패널티 적용 여부
- [ ] NOSHOW_BOTH 시 체험 횟수 차감/복구 정책

### 3위: [CRITICAL] 예약 제한 규칙 3건 온톨로지 근거 부재

PRD가 명시한 3가지 예약 제한(회차권 1일1회, 무제한권 동시1회, 스마트톡 AI챗 6회)이 온톨로지 어디에도 정의되어 있지 않습니다.

- **근거**: ticket/policies.md, schedule/policies.md, lecture-flow.md 전체 검색 — 해당 규칙 없음

- [ ] 이 3가지 규칙이 실제 운영 중인 비즈니스 규칙인지, PRD 신규 제안인지 확인
- [ ] 운영 중이라면 온톨로지에 추가
- [ ] 신규 제안이라면 이해관계자 합의 + "백엔드 API 신규 개발 제외" 범위와의 충돌 해결

### 4위: [CRITICAL] 학생 노쇼 패널티 — 체험 수업 적용 범위

72시간 패널티는 무제한권(UNLIMIT) 취소/노쇼 시에만 적용되는 것으로 문서화되어 있습니다. 체험권에 패널티가 적용되는지 정의되지 않았습니다.

- **근거**: schedule/policies.md 섹션 3.2 (무제한권만 명시)

- [ ] 체험 수업 학생 노쇼 시 패널티 적용 여부 (없음 / 72시간 동일 / 체험 전용 24시간 등)
- [ ] 패널티 미적용 시 STUDENT_NOSHOW 화면의 안내 문구 재설계

### 5위: [HIGH] 튜터 노쇼 시 "대체 튜터 자동 매칭" 백엔드 프로세스 미정의

PRD는 자동 매칭을 전제하지만, 백엔드에는 관리자 수동 배정 API(`/api/schedule/admin/cancel-and-reassign`)만 존재합니다.

- **근거**: schedule/policies.md 섹션 3.2, lecture/policies.md 섹션 5.1

- [ ] 자동 매칭 시스템을 이번 scope에서 구현할지, 관리자 수동 배정으로 대체할지
- [ ] 수동 배정 시 사용자에게 "관리자가 처리 중" 안내를 표시할지, "다시 예약하기"로 안내할지

### 6위: [HIGH] FIRST_BILLING 결제 실패 시 failedCount 반영 여부

첫 정기결제 실패 시 failedCount가 증가하면, CTA 재시도 시 체납자 검증(DELINQUENT_PAYMENT)에서 차단될 수 있습니다.

- **근거**: payment/policies.md (체납자 검증), subscription/policies.md (결제 3회 실패 시 자동 해지)

- [ ] FIRST_BILLING 실패가 failedCount에 포함되는지 백엔드 확인
- [ ] 포함 시: 유예기간 부여 / failedCount 제외 / 별도 재시도 로직 중 선택

### 7위: [HIGH] 체험 수업 취소 정책 예외 근거

"체험 수업은 항상 무료 취소"라는 규칙의 온톨로지 근거가 없습니다.

- **근거**: lecture/policies.md 섹션 5.1 (시간 기반 3단계만 정의), 체험 취소 예외 미명시

- [ ] 체험 수업 취소를 정규와 동일 적용 / 무조건 무료 / 시간 조건부 무료 중 선택
- [ ] 결정을 온톨로지에 추가

### 8위: [MEDIUM] 스마트톡 AI챗 6회→레슨 전환 규칙의 API 존재 여부

3위 결정의 파생 항목입니다. AI챗 6회 완료 카운트를 제공하는 API가 존재하는지 확인이 필요합니다.

- [ ] 3위 결정 이후, 스마트톡 규칙의 구현 범위 확정

### 9위: [MEDIUM] LESSON_IMMINENT 상태 판정 시간 기준

TRIAL_BOOKED → LESSON_IMMINENT 전환 시점이 정의되지 않았습니다 (5분 전? 1시간 전? 당일?).

- [ ] LESSON_IMMINENT 진입 기준 시간 결정 (예: 수업 시작 1시간 전)

### 10위: [MEDIUM] 결제 전환 CTA 도착 URL

리다이렉트 제거 후 CTA '수강권 구매하기'가 어느 페이지로 연결되는지 미명시입니다.

- [ ] CTA 도착 URL이 기존 `/subscribes/tickets`와 동일한지, 별도 전환 전용 화면인지 결정

---

## 3. PRD 내부 자기 모순

### 모순 1: 체험 수업 1인 1회 제한 vs 유료 체험 3회 상품
PRD가 체험 수업을 1인 1회로 제한하면서 동시에 유료 체험 3회 상품(CST-007)을 언급합니다. 1회 제한 하에서 3회 상품은 발급 자체가 불가능합니다.

### 모순 2: "항상 무료 취소" vs 취소 정책 부재
체험 수업의 무료 취소를 전제하면서, 정규 취소 정책과의 관계(예외인지 별도 정책인지)가 정의되어 있지 않습니다.

### 모순 3: "대체 튜터 자동 매칭" vs 백엔드 수동 프로세스
PRD에서 자동 매칭을 사용자 플로우로 제시하지만, 실제 백엔드는 관리자 수동 배정 프로세스입니다.

---

## 4. 각 관점별 분석 결과

### 4.1 체험 수업 정책 (trial-lesson-analyst)

| ID | 심각도 | 내용 |
|----|--------|------|
| CRITICAL-1 | CRITICAL | NOSHOW_BOTH 상태 매핑 누락 |
| CRITICAL-2 | CRITICAL→CRITICAL | 학생 노쇼 72시간 패널티 — 체험 수업 적용 여부 미정의 |
| HIGH-1 | HIGH | 튜터 노쇼 "대체 튜터 자동 매칭" 백엔드 근거 부재 |
| HIGH-2 | HIGH | 체험 수업 "항상 무료 취소" 근거 불충분 |
| HIGH-3 | HIGH→MEDIUM | LESSON_IMMINENT 상태 판정 시간 기준 불명확 |
| MEDIUM-1 | Dev 다운그레이드 | 튜터 노쇼 프론트 실시간 반영 방식 |

### 4.2 결제 전환 정책 (payment-conversion-analyst)

| ID | 심각도 | 내용 |
|----|--------|------|
| MEDIUM-1 | MEDIUM | CTA 도착 URL 미명시 |
| HIGH-2 | HIGH | FIRST_BILLING 결제 실패 시 failedCount 반영 미정의 |
| CRITICAL-3 | CRITICAL | 유료 체험 3회 상품 시스템 구조 충돌 |

### 4.3 수강권·예약 정책 (ticket-reservation-analyst)

| ID | 심각도 | 내용 |
|----|--------|------|
| CRITICAL-1 | CRITICAL | 예약 제한 3건 온톨로지 근거 없음 |
| HIGH-1 | HIGH→MEDIUM | 스마트톡 AI챗 6회 규칙 API 존재 여부 |
| MEDIUM-1 | 신규-1로 병합 | TRIAL_IDLE StickyBottom CTA 문구 충돌 |

### 4.4 프론트엔드 아키텍처 (frontend-arch-analyst)

| ID | 심각도 | 내용 |
|----|--------|------|
| MEDIUM-1 | 신규-1로 병합 | RECOMMEND_BOOKING_REGULAR_CLASS 매핑 누락 |
| MEDIUM-2 | Dev 다운그레이드 | 디버그 UI 환경 분기 패턴 불일치 |
| MEDIUM-3 | Dev 다운그레이드 | SSR prefetch BFF 래퍼 필요 여부 |

---

## 5. Devil's Advocate 검증 결과

### 병합 (2건)
- ticket-reservation MEDIUM-1 + frontend-arch MEDIUM-1 → **신규-1**: 홈 화면 상태 분기 불완전 (체험/정규 사용자 라우팅 충돌)

### Severity 조정 (3건)
- trial-lesson CRITICAL-2 → **CRITICAL 유지** (체험 전환율 직접 영향)
- trial-lesson HIGH-3 → **MEDIUM 하향** (기본값 설정 가능, 차단 요소 아님)
- ticket-reservation HIGH-1 → **MEDIUM 하향** (3위 CRITICAL의 파생 항목)

### 신규 발견 (2건)
1. **[HIGH] 체험/정규 사용자 홈 상태 분기 불완전** — RECOMMEND_BOOKING_REGULAR_CLASS 매핑 누락 + TRIAL_IDLE CTA 충돌을 종합하면, 상태 분기 로직 전체에 빈 칸이 있음
2. **[MEDIUM] 체험 완료 후 미전환 사용자 상태 만료 정책 부재** — 영구 CTA 노출인지, N일 후 숨기는지, 체험 재신청 허용인지 미정의

---

## 6. 개발 레벨 다운그레이드

다음 3건은 PM 의사결정 없이 개발팀이 기존 시스템 관례에 따라 해결 가능합니다.

| 원본 | 내용 | 다운그레이드 근거 |
|------|------|------------------|
| trial-lesson MEDIUM-1 | 튜터 노쇼 판정 시 프론트 실시간 반영 방식 (폴링/SSE/WebSocket) | 기술 구현 결정. 기존 실시간 통신 패턴을 따르면 됨 |
| frontend-arch MEDIUM-2 | 디버그 UI의 process.env.NODE_ENV vs Flagsmith 피처플래그 | 기존 프로젝트의 피처플래그 관리 패턴(Flagsmith + APP_ENV)에 맞추면 됨 |
| frontend-arch MEDIUM-3 | SSR prefetch의 BFF 래퍼 필요 여부 | 기존 아키텍처(BFF 계층)의 관례를 따르는 기술 결정 |

---

## 7. 권고 사항

### 즉시 조치 필요 (구현 착수 전)

1. **유료 체험 3회 상품 범위 결정** (TOP 1위) — 이번 scope 포함 vs 후속 scope 분리. 현재 defer 결정이 되어 있으나 defer 범위가 "텍스트 수정"이 아닌 "상품 설계 전체"임을 인지해야 합니다.

2. **NOSHOW_BOTH 매핑 확정** (TOP 2위) — 상태 머신에 빈 칸이 있으므로, 8상태 구현 착수 전에 9번째 상태 추가 여부를 결정해야 합니다.

3. **예약 제한 규칙 출처 확인** (TOP 3위) — 백엔드 코드에 구현되어 있는지 확인. 미구현이면 "백엔드 API 신규 개발 제외" 범위와 충돌하므로 scope 조정이 필요합니다.

4. **학생 노쇼 패널티 정책 확정** (TOP 4위) — 체험 수업에 패널티 적용 여부. STUDENT_NOSHOW 화면 설계에 직접 영향을 줍니다.

### 후속 scope 검토 권장

5. 튜터 노쇼 자동 매칭 시스템 (현재는 수동 배정으로 대체 가능)
6. 전환 실패 원인별 세분화 대응 (현재는 CTA 상시 노출로 간접 대응)
7. 체험 완료 후 미전환 사용자의 상태 만료 정책
