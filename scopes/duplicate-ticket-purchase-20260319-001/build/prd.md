---
scope_id: "duplicate-ticket-purchase-20260319-001"
version: "4.0"
status: "compiled"
created_at: "2026-03-19T02:33:05.517Z"
compiled_at: "2026-03-19T12:10:00.000Z"
projectInfo:
  name: "포도스피킹"
  service_type: "1:1 원어민 외국어 스피킹 교육"
  domain_entities: [Ticket, SubscribeMapp, LessonTicket, Payment, Coupon, Notification, Popup]
  supported_languages: ['영어', '일본어']
  subscription_types: ['무제한권', '회차권', '스마트토크권', '더블팩']
  ticket_types_enum: ['UNLIMITED', 'COUNT', 'SMART_TALK', 'DOUBLE_PACK']
  lang_types_enum: ['ENGLISH', 'JAPANESE', 'ENGLISH_JAPANESE']
  curriculum_types_enum: ['BASIC', 'BUSINESS', 'SMART_TALK', 'DOUBLE_PACK']
  ticket_status_enum: ['INACTIVE', 'ACTIVE', 'EXPIRED', 'DEPLETED', 'REFUNDED']
inputDocuments:
  brief: { path: "inputs/brief.md" }
  align_packet: { path: "build/align-packet.md" }
  exploration_log: { path: "build/exploration-log.md" }
  existing_prd_v3_8: { path: "https://github.com/re-speak/prd/.../prd.md" }
constraintSummary:
  total: 11
  inject: 11
  defer: 0
  override: 0
  invalidated: 0
changeLog:
  - { event: "scope.created", date: "2026-03-19", summary: "Brief 등록" }
  - { event: "exploration.completed", date: "2026-03-19", summary: "6 Phase 완료, O0-O5 확정" }
  - { event: "align.locked", date: "2026-03-19", summary: "포함 15항목, 제외 7항목 확정" }
  - { event: "prd.rendered", date: "2026-03-19", summary: "PRD v4.0 생성 — v3.8 기반 + sprint-kit 메타데이터 통합" }
mvpConfig:
  phase: 'Phase 1'
  backend_schedule_timings: ['D-25', 'D-14', 'D-7', 'H-12']
  backend_schedule_channel: '알림톡 (카카오)'
  client_popup_phases: ['report(D-25~D-15)', 'coupon-first(D-14)', 'coupon-soft(D-13~D-10)', 'coupon-hard(D-7~D-2)', 'coupon-d1(D-1)', 'coupon-d0(D-0)']
  post_purchase_notification: '결제완료 알림톡'
  storage_policy:
    billing: 'no_storage_immediate_active'
    lump_sum: 'unlimited_storage'
  extension_benefit:
    3months: 14
    6months: 30
    12months: 60
  extension_benefit_mapping: 'GT_SUBSCRIBE.additional_days (hard-mapped)'
  segment_tiers: { LOW: '<6/mo', MID: '6-10/mo', HIGH: '11-15/mo', ULTRA_HIGH: '>=16/mo' }
  segment_discount: { LOW: 30, MID: 20, HIGH: 20, ULTRA_HIGH: 5 }
  expiry_reference: 'bonus_inclusive_end_date'
  coupon_trigger: 'cron_date_vs_lesson_ticket_end_date'
  duplicate_payment_rule: 'same_lang_active_exists → lump_sum_only; other_lang → subscription_ok'
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-requirements', 'step-04-scope', 'step-05-journeys', 'step-06-technical', 'step-07-functional', 'step-08-nfr', 'step-09-qa', 'crystallize-s2', 'policy-review-42', 'dev-meeting-2024-02-24']
documentStatus: 'final'
classification:
  projectType: 'cross-platform-app'
  domain: 'edtech'
  complexity: 'high'
  projectContext: 'brownfield'
partyModeInsights:
  ux:
    - '수강권 상태(활성/비활성/만료)를 직관적으로 구분할 수 있는 UI가 핵심. 비활성 수강권의 활성화 플로우가 너무 깊으면 사용자가 방법을 모를 수 있음'
    - 'Deep Link 파라미터 오류 시 사용자 혼란 방지를 위한 폴백 UX 필수'
    - '레슨권 체인 구조에서 보상권/보너스까지 순서 변경 UI에 통합 표시 필요'
  architecture:
    - '기존 InvalidTicketDuplicate 예외 제거 시 사이드이펙트 범위 파악 필수'
    - '리텐션 프로모션 스케줄러는 만료일 기준이 보너스 포함 전체 종료일(end_date)로 변경됨'
    - 'MSW 기반 프로토타입으로 API 계약 사전 검증 완료'
    - '레슨권 체인 구조: N개월 = N개 티켓. 순서 변경 시 연쇄 날짜 재계산 필요 (삭제 후 재생성 접근)'
  business:
    - '프로모션 6회 발송이 고객 피로도를 높이지 않는지 A/B 테스트 계획'
    - '세그먼트별 할인율 차등 적용으로 고가치 고객 유지 전략 내재'
    - '동일 프로모션 1회 제한으로 악용 방지 필요'
  qa:
    - '더블팩 + 단품 동시 보유 시 예약 가능 횟수/언어 선택 로직 엣지케이스'
    - '구독(BILLING) 보관 불가 구조 검증 + 일괄결제(LUMP_SUM) 보관 정상 동작 테스트'
    - '연장레슨권 보유 시 레거시 화면 분기 정확성'
---

# Product Requirements Document — 수강권 중복 구매 기능 및 리텐션 프로모션

**Author:** Auto Sprint (John, PM) — sprint-kit v4.0 compilation
**Date:** 2026-03-19
**Version:** 4.0 (sprint-kit exploration + align + v3.8 통합)
**Status:** compiled
**Base PRD:** v3.8 (2026-03-05)

---

## Exploration Outcomes (sprint-kit)

이 프로젝트의 본질은 **레거시 연장수강권 시스템(팝업 결제 예약)을 제거하고, 중복 구매 시스템으로 교체**하는 것이다. sprint-kit exploration을 통해 6 Phase 대화 기반 탐색을 수행하였으며, 다음 결과(Outcome)가 확정되었다.

| ID | Outcome | 우선순위 |
|----|---------|---------|
| O0 | 레거시 연장수강권 시스템(팝업 결제 예약)이 제거된다 (전체 프로젝트의 전제) | 전제 |
| O1 | 기존 회원이 수강권 만료 전에 다음 수강권을 확보할 수 있다 | 1 |
| O2 | 만료 임박 고객이 적시에 재구매/연장 동기를 부여받아 이탈하지 않는다 | 2 |
| O3 | 중복 구매 관련 CS 문의가 대폭 감소한다 | 3 |
| O4 | 고객이 보유 수강권 현황을 한눈에 파악하고 직접 관리할 수 있다 | 4 |
| O5 | 고객이 자신의 학습 성과를 확인하여 재구매를 스스로 판단할 수 있다 | 5 |

### Exploration Scenarios (확정)

- **S1**: 기존 회원 중복 구매 — 홈 "수강권 구매" 또는 팝업/알림톡 → 결제 페이지. ACTIVE 있으면 구독 미노출, 일괄결제만. 결제 후 INACTIVE 보관
- **S2**: 알림톡 리텐션 4회 (D-25/D-14/D-7/H-12) + 결제 완료 알림 1종. 기존 심사 통과 템플릿 재사용
- **S3**: 홈 팝업 6단계 (report → coupon-first → coupon-soft → coupon-hard → coupon-d1 → coupon-d0)
- **S4**: 수강권 관리 3섹션(활성화중/보관중/만료) + 순서 변경 + 하단 플로팅바
- **S5**: 환불은 CS 통해서만 처리. 앱 내 셀프 환불 없음
- **S6**: 학습통계 마이포도 메뉴에 "학습통계" 항목 추가로 상시 접근

### PO Decisions (Exploration 중 확정)

- 만료 수강권에서 재구매 유도 X, 하단 플로팅바로 구매
- 환불은 앱 내 셀프 환불 없이 CS 통해서만
- 학습통계는 마이포도 메뉴에 "학습통계" 항목 추가로 상시 접근
- 알림톡은 기존 심사 통과 템플릿 재사용 (카카오 심사 이슈 없음)

---

## Brownfield Sources

This PRD incorporates brownfield context gathered from the following sources.

### MCP Servers

| MCP Server | Purpose | Findings |
|------------|---------|----------|
| svc-map | 서비스맵 | 5개 Customer Journey 플로우 (체험/구매/정규/연장/해지), 188개 화면, 20종 알림톡, 연장유도 3종(D-25/D-7/당일) |
| figma | 디자인 데이터 | Not configured (프로토타입으로 대체) |
| backend-docs | 백엔드 정책 | Ticket 도메인(InvalidTicketDuplicate, TicketServiceV2), Subscribe 도메인, Payment(PortOne PG), Notification(FCM/알림톡) |
| client-docs | 클라이언트 UI/UX | Flutter 앱 (podo-app), 모바일 기반 UI |

### Input Documents

| Document | Key Brownfield Information |
|----------|---------------------------|
| brief.md | 기존 "1인 1언어 1수강권" 제약, 신규 회원 결제 페이지 1개만 존재, 연장 유도 3종 알림톡 |
| terms-of-service.md | 환불 규정(제15조), 예약 제한(제13조), 일시정지(제16조), 수강확인증(제16조 4항) |
| brownfield-context.md | L1~L4: InvalidTicketDuplicate 예외, getActiveTicket() 단일 반환, PortOne PG 연동, FCM/알림톡 체계 |
| 2026-02-24-developer-meeting.md | 개발자 미팅: 체인 구조 확인, 홀딩 분리, 보관 기간 제한, 만료 기준 재정의 |

### Prototype Source

| Source | Key Reconciliation Information |
|--------|-------------------------------|
| prototype-analysis.md | 7개 화면, 16개 컴포넌트, 15개 API 엔드포인트, 12개 User Flow, 21개 상품 시드 데이터 |

### PRD Brownfield Notation

- `[BROWNFIELD]` 태그: 기존 시스템 수정이 필요한 FR에 표시
- `> **Existing system:** ` 블록: 기존 시스템 연동 지점 명시
- `(existing)` / `(new)` / `(existing + extension)` 태깅: 컴포넌트 구분
- Source attribution: `(source: PROTO, origin: BRIEF-N)` for prototype-confirmed items from brief; `(source: PROTO)` for prototype-only items; `(source: carry-forward)` for non-prototype items; `(source: DEV-MEETING)` for developer meeting decisions

---

## Executive Summary

**Product:** 포도스피킹 - 1:1 원어민 외국어 스피킹 교육 서비스
**Feature:** 수강권 중복 구매 기능 및 리텐션 프로모션 시스템
**Core Value:** "기존 고객이 유리한 시점에 미리 수강권을 구매하고, 만료 전 자동화된 프로모션으로 이탈 없이 학습을 지속할 수 있다"

**프로젝트 본질 (O0):** 레거시 연장수강권 시스템(팝업을 통해 연장수강권을 기존 수강권 만료 후 이용할 수 있게 결제 예약하는 시스템)을 제거하고, 중복 구매 시스템으로 완전 교체한다. 기존 회원이 동일 언어 수강권을 미리 구매하여 비활성(INACTIVE) 상태로 보관하고, 현재 수강권 만료 시 자동 또는 수동으로 활성화하는 구조로 전환한다.

### Summary

| Item | Details |
|------|---------|
| **Target Scale** | 기존 활성 수강권 보유 회원 전체 |
| **MVP Scope** | 중복 구매 + 기존회원 결제(3단계 선택) + 수강권 관리 UI + 리텐션 프로모션 자동화 + 활성화 순서 변경 + 학습통계 |
| **Platform** | React 프로토타입 (실제 Flutter 앱 + Spring Boot 백엔드) |
| **Prototype** | 7개 화면, 15 API 엔드포인트, MSW 기반 |
| **Estimated Timeline** | 8~12 주 |

### Goal Metrics

| Metric | Current | Target |
|--------|---------|--------|
| 수강권 만료 전 리텐션율 (만료 전 재구매) | 측정 필요 | +20%p |
| 프로모션 전환율 (노출 -> 구매) | N/A | 10%+ |
| 중복 구매 관련 CS 문의 | 월 N건 | 80% 감소 |
| 알림톡 오픈율 | N/A | 30%+ |

---

## Success Criteria

### User Success
- 기존 회원이 동일 언어 수강권을 **추가 구매하여 비활성 상태로 보관** 가능 (source: PROTO, origin: BRIEF-1)
- 고객이 **원하는 시점에 수강권을 활성화**하여 수강 시작 가능 (source: PROTO, origin: BRIEF-4)
- 홈 화면에서 만료 예정 안내를 **6단계 phase별 팝업**으로 수신하여 재구매 기회를 놓치지 않음 (source: PROTO, origin: BRIEF-7)
- 기존 회원 전용 **세그먼트별 할인 쿠폰 + 기간연장 혜택**으로 동등 이상의 혜택 확보 (source: PROTO, origin: BRIEF-2)
- 수강권 **활성화 순서 변경**(드래그 앤 드롭)으로 원하는 순서대로 학습 계획 수립 가능 — 구매 레슨권 + 보상권 + 보너스 통합 관리 (source: PROTO + DEV-MEETING)
- **학습통계 리포트**로 수강 성과를 확인하고 재구매 동기 부여 (source: PROTO)

### Business Success
- 출시 3개월 내 **수강권 만료 전 리텐션율 20%p 향상** (만료 전 재구매 = 리텐션, 만료 후 재구매 = 리바이(rebuy)로 구분) [carry-forward]
- 프로모션 전환율 **10% 이상** 달성 [carry-forward]
- 중복 구매 관련 CS 인입 **80% 감소** [carry-forward]
- 채널별 프로모션 전환 데이터 기반 **최적 타이밍 도출** (source: PROTO, origin: BRIEF-10)

### Technical Success
- 결제 페이지 로딩 시간 **< 2초** (p95) [carry-forward]
- 프로모션 발송 정시성 **99%** (스케줄 대비 5분 이내 발송) [carry-forward]

### Measurable Outcomes

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|--------------------|
| 만료 전 리텐션율 | 측정 필요 | +20%p | 수강권 만료 전 재구매(리텐션) 이벤트 추적. 만료 후 재구매는 리바이(rebuy)로 별도 측정 [carry-forward] |
| 타이밍별 전환율 | N/A | 수집 | 백엔드 스케줄(D-25/D-14/D-7/H-12) + 클라이언트 팝업(6 phase) 각 시점별 전환 추적 (source: PROTO, origin: BRIEF-10) |
| CS 인입 변화 | 월 N건 | -80% | 중복 구매 카테고리 CS 건수 [carry-forward] |
| 알림톡 오픈율 | N/A | 30%+ | 알림톡 발송 대비 오픈/클릭 추적 |
| 홈 팝업 CTA 클릭률 | N/A | 수집 | 팝업 노출 대비 CTA 클릭 추적 (source: PROTO) |

---

## Product Scope

### Phase 1: 전체 기능

> **목표:** 레거시 연장수강권 시스템 제거(O0) + 중복 구매 제약 제거(O1) + 기존 회원 결제 + 리텐션 프로모션 자동화(O2) + CS 문의 감소(O3) + 사용 편의성 향상(O4) + 학습 성과 확인(O5).
>
> **포함 FR:** FR1, FR2, FR3, FR6, FR8, FR11, FR12, FR15, FR16, FR17, FR18, FR19, FR23, FR24, FR26, FR27

| Feature | Description | FRs |
|---------|-------------|-----|
| 수강권 중복 구매 제약 제거 | 동일 언어 수강권 무제한 중복 구매 허용 (SMART_TALK 제외: 409 응답). 프로모션 1회 제한 | FR1 |
| 수강권 상태 관리 | INACTIVE/ACTIVE/EXPIRED/REFUNDED/DEPLETED 5상태 전이 로직 | FR2 |
| 고객 주도형 활성화 | 비활성 수강권을 원하는 시점에 활성화 (더블팩: 충돌 없을 때만) | FR3 |
| 구독 보관 불가 구조 | 구독(BILLING)은 결제 즉시 ACTIVE → 보관(INACTIVE) 불가. 일괄결제(LUMP_SUM)만 보관 가능 (무제한) | FR2-6 |
| 기존 회원 결제 페이지 | 기존 결제 페이지 UI + 쿠폰 보유 시 상단 프로모션 배너. 쿠폰 적용 수강권은 할인만, 미적용 수강권은 기간연장만 | FR6, FR8 |
| 결제 방식 분기 | 같은 언어 ACTIVE 시 일괄결제만. 다른 언어는 구독결제도 가능 (source: DEV-MEETING) | FR6-6 |
| 수강권 관리 UI | 활성/비활성/만료 3섹션 + 상세 뷰 + 결제 이력. **레슨권 기반 표시** (source: DEV-MEETING) | FR11, FR12 |
| 연장레슨권 레거시 분기 | 연장레슨권 보유 시 레거시 화면/마이포도 레거시 표시 (source: DEV-MEETING) | FR11-6, FR23-5 |
| 활성화 순서 변경 | 비활성 수강권 드래그 앤 드롭. **구매+보상+보너스 통합** 한 화면. 더블팩 배치 제약 (source: DEV-MEETING) | FR15 |
| 리텐션 홈 팝업 | 만료일 기준 6단계 phase별 바텀시트 팝업 | FR16 |
| 리텐션 프로모션 스케줄러 | D-25/D-14/D-7/H-12 알림톡 자동 생성. 만료 기준=보너스 포함 end_date | FR17 |
| 알림톡 발송 | 리텐션 + 결제완료 알림톡 5종 | FR18 |
| 세그먼트 기반 할인 | 월별 사용량 4단계(LOW/MID/HIGH/ULTRA_HIGH) 차등 할인 | FR8 |
| 학습통계/리포트 | D-25 게이트 + 만료 리포트 아카이브. **리포트 콘텐츠는 기존 학습통계 화면 활용**. 실시간 우선, 캐시 조절. 멀티 리포트 탭 (source: DEV-MEETING) | FR19 |
| 마이포도 페이지 | 주요 기능 허브 + 레슨권 기반 + 레거시 분기 | FR23 |
| 환불 정책 | 개별 수강권 단위 환불, originPrice 기준 | FR24 |
| 수강확인증 | 수강권 선택 UI (다수 보유 시). 환불불가 경고 모달 없이 바로 발급 | FR26 |
| additional_days 하드매핑 | GT_SUBSCRIBE 하드매핑 (iPad 패턴 동일) (source: DEV-MEETING) | FR27 |

### 포함 항목 (15항목, Exploration 확정)

- 레거시 연장수강권 시스템 제거
- 중복 구매 차단 해제 (SMART_TALK 제외)
- 수강권 5상태 전이 도입
- 결제 페이지 — ACTIVE 시 구독 미노출, 일괄결제만
- 결제 완료 후 INACTIVE 보관 + 만료 시 자동 활성화
- 홈 팝업 6단계 리텐션 바텀시트
- 알림톡 4회 리텐션 + 결제 완료 1종
- 수강권 관리 UI 3섹션 + 상세 + 플로팅바
- 보관중 수강권 순서 변경 (드래그 앤 드롭)
- 결제 페이지 기존 회원 프로모션
- 세그먼트별 차등 할인 쿠폰
- 학습통계 마이포도 메뉴 상시 접근
- 환불 개별 수강권 단위 (CS)
- 수강확인증 수강권 선택 UI
- 연장레슨권 유저 레거시 분기

### 제외 항목 (7항목, Exploration 확정)

- 다중 수강권 예약/합산/차감 규칙
- 홀딩 기능 변경
- 해지유도 페이지
- 앱 푸시/SMS
- 프로모션 랜딩 페이지
- 1개월 구독 수강권
- 앱 내 셀프 환불

---

## User Journeys

### Journey 1: 홈 팝업을 통한 리텐션 재구매 - 만료 전 단계별 유도 (Happy Path)

**Persona:** 박서준 (28세, 직장인, 영어 무제한 수강권 만료 25일 전)

**Opening Scene:**
박서준은 매일 영어 수업을 듣고 있다. 수강권 만료가 25일 앞으로 다가온 어느 날, 앱 홈 화면을 열자 **바텀시트 팝업**이 올라온다. "학습 리포트가 준비되었어요!" 라는 report phase 안내다. 팝업의 **"리포트 보러가기"** CTA 버튼이 눈에 들어온다.

> **만료 기준:** 박서준의 레슨권 체인 전체(정규 + 보너스)의 마지막 end_date 기준 25일 전 (source: DEV-MEETING)

**Rising Action:**
CTA를 탭하면 **학습통계 페이지(`/learning-stats`)**로 이동한다. 수강 기간 동안의 총 수업 횟수, 표현력/발음/주제별 통계 카드가 실시간으로 표시된다. sub_mapp 기반이므로 과거 수강 이력도 모두 조회 가능하다. "생각보다 많이 했구나" 뿌듯함을 느낀다.

14일이 남은 D-14, 크론이 실행되어 박서준의 레슨권 end_date가 대상 조건에 해당하므로 **세그먼트 할인 쿠폰이 자동 지급**된다. 앱을 열면 **coupon-first phase 팝업**이 표시된다. "기존 고객 전용 특별 쿠폰이 도착했어요!" 메시지와 함께 CTA **"혜택 확인하러 가기"**를 탭하면 **기존 회원 결제 페이지(`/payment/existing-user?promo=retention-d14`)**로 이동한다. 상단에 **쿠폰 섹션**이 최상단에 표시되어 "영어 쿠폰 20% 할인 + 일본어 기간연장 14일"이 강조된다.

D-7, **coupon-hard phase 팝업**이 다시 표시된다. "일주일 남았습니다! 놓치면 후회할 혜택"과 함께 **결제 페이지(`/payment/existing-user?promo=retention-d7`)**로 안내한다.

**Climax:**
박서준은 결제 페이지에서 언어(ENGLISH), 타입(UNLIMITED), 기간(6개월)을 선택한다. 현재 같은 언어(영어) ACTIVE 레슨권이 존재하므로 **일괄결제만 선택 가능**하다. 영어 쿠폰이 적용되므로 **할인 쿠폰 적용 가격**을 확인한다 (쿠폰 적용 수강권이므로 기간연장 혜택은 미적용). **"구매하기"** 버튼을 탭한다.

결제 완료 후 **구매 완료 화면**이 표시된다. "새 수강권이 비활성 상태로 보관되었습니다. 현재 수강권 만료 후 활성화하세요." 안내와 함께 **"마이 포도 플랜으로 이동"** CTA가 표시된다.

**Resolution:**
CTA를 탭하면 **수강권 관리 페이지(`/tickets`)**로 이동한다. **레슨권 기반**으로 활성 레슨권(만료 7일 후)과 비활성 레슨권(미활성화)이 명확히 구분되어 표시된다. "혜택 좋을 때 미리 사둬서 다행이다"라고 느낀다.

### Journey 2: 더블팩 추가 구매 - 단품 보유 중 더블팩 구매 (Happy Path)

**Persona:** 김지현 (32세, 마케터, 영어 무제한 + 일본어 무제한 보유 중, 일본어 비활성)

**Opening Scene:**
김지현은 영어와 일본어를 따로 구매해서 사용 중이다. 더블팩이 더 경제적이라는 것을 알게 되어 추가 구매를 고려한다.

**Rising Action:**
**기존 회원 결제 페이지**에서 Step 1: **ENGLISH_JAPANESE** 선택 -> Step 2: 자동으로 **DOUBLE_PACK** 선택 -> Step 3: **6개월**을 선택한다.

**Climax:**
**"구매하기"**를 탭하면 더블팩 확인 팝업이 표시된다. 기존 비활성 수강권이 있으므로 비활성 수강권 목록과 함께 "더블팩이 비활성으로 보관됩니다" 안내가 표시된다.

**"구매하기"**를 탭하면 `POST /payment/existing-user/purchase`가 실행되고 구매 완료 화면이 표시된다.

**Resolution:**
**"마이 포도 플랜 확인하기"** CTA를 탭하면 수강권 관리 페이지에서 새 더블팩(비활성)을 레슨권 기반으로 확인한다.

### Journey 3: 더블팩 활성화 및 순서 변경 - 복수 비활성 수강권 관리 (Happy Path)

**Persona:** 정하은 (25세, 대학생, 영어 무제한 + 더블팩 + 일본어 무제한 비활성 3개 보유 + 보너스 레슨권 2개)

**Opening Scene:**
정하은은 이벤트 때 미리 구매한 수강권 3개가 비활성 상태로 대기 중이다. 보상으로 받은 보너스 레슨권 2개도 함께 있다. 어떤 순서로 활성화할지 정하고 싶다.

**Rising Action:**
**수강권 관리 페이지(`/tickets`)**에서 비활성 섹션에 **구매 레슨권 3개 + 보상/보너스 레슨권 2개가 모두 통합**되어 표시된다. 비활성 수강권이 2개 이상이므로 **"활성화 순서 변경"** 버튼이 나타난다.

버튼을 탭하면 **순서 변경 팝업**이 열린다. 구매 레슨권과 보상권/보너스가 모두 한 화면에서 타임라인 시각화와 함께 드래그 앤 드롭으로 카드를 재정렬할 수 있다. (source: DEV-MEETING)

> **주의:** 순서를 변경하면 체인 구조 특성상 뒤에 연결된 모든 레슨권의 날짜가 재계산된다.

**Climax:**
더블팩을 영어 무제한과 일본어 무제한 사이에 배치하려 하자 **토스트 경고**: "더블팩은 단일 언어 수강권 사이에 배치할 수 없어요"가 표시된다. 더블팩을 맨 앞이나 맨 뒤로만 배치 가능하다.

정하은은 더블팩을 맨 뒤에 배치하고 **"순서 변경 완료"**를 탭한다. 목록이 새 순서대로 재정렬된다.

이제 첫 번째 수강권(영어 무제한)을 활성화하려 한다. **"활성화"** 버튼을 탭하면 브라우저 확인 다이얼로그가 표시된다. 확인을 누르면 `POST /tickets/:id/activate`가 실행되고 수강권이 ACTIVE 상태로 변경된다.

**Resolution:**
수강기간이 즉시 시작되어 startDate와 expireDate가 설정된다. "구매한 것도 보너스도 한눈에 보이니까 관리하기 편하다"고 느낀다.

### Journey 5: 학습통계 리포트 확인 - 만료 임박 시 성과 확인 (Happy Path)

**Persona:** 박서준 (28세, 직장인, 영어 무제한 수강권 만료 25일 전)

**Opening Scene:**
박서준은 홈 팝업의 report phase CTA를 통해 학습통계 페이지에 도달했다.

**Rising Action:**
**학습통계 페이지(`/learning-stats`)** 접속 시, 활성 수강권의 잔여일이 25일(D-25)이므로 **ReportView**가 표시된다. 그라데이션 헤더에 총 수업 횟수와 학습 시간이 **실시간**으로 표시되고, **StatCard** 3장(표현력/발음/주제)이 성과를 보여준다. 학습기록은 sub_mapp에 매핑되므로 과거 수강 이력도 전부 조회된다. (source: DEV-MEETING)

**Climax:**
만료된 수강권이 있는 경우, 하단에 **과거 리포트 목록**이 표시된다. 탭하면 과거 리포트의 상세 내용을 확인할 수 있다. 활성 수강권이 없는 경우에는 **ReportListView**가 표시되며, 새 리포트 CTA 카드가 결제 페이지로 연결된다.

D-26일 이상 남은 경우에는 **PreReportView**가 표시되며, 포도 마스코트와 함께 "리포트가 D-N일 후 열립니다" 카운트다운과 현재까지의 수업 횟수/사용량이 표시된다.

**Resolution:**
박서준은 자신의 학습 성과를 확인하고, 재구매 동기가 강화된다. "이만큼 했으니 계속해야지"라는 생각이 든다.

### Journey Requirements Summary

| Journey | Required Features |
|---------|-------------------|
| 홈 팝업 리텐션 재구매 (Happy Path) | 홈 팝업 6단계 phase, 학습통계 연동, 기존 결제 페이지 UI + 프로모션 배너, 쿠폰 할인 섹션, 세그먼트 배너, 쿠폰/기간연장 상호배제, 비활성 보관, 같은 언어 일괄결제 제한 |
| 더블팩 추가 구매 (Happy Path) | 더블팩 확인 팝업, 비활성 보관, 수강권 상태 전이 |
| 더블팩 활성화 및 순서 변경 (Happy Path) | 활성화 API, 더블팩 충돌 검증, 드래그 앤 드롭 순서 변경, 구매+보상+보너스 통합 표시, 더블팩 배치 제약 |
| 학습통계 리포트 확인 (Happy Path) | D-25 리포트 게이트, PreReportView, ReportView (실시간), 과거 리포트 아카이브(sub_mapp), 결제 CTA |

---

## Domain-Specific Requirements

### 레슨권 체인 구조 (source: DEV-MEETING)

> **핵심:** 수강권은 내부적으로 N개월이면 N개의 레슨권(GT_CLASS_TICKET)으로 구성된 **체인 구조**이다.
> - 3개월 수강권 = 3개 레슨권 (월별 1개)
> - 12개월 수강권 = 12개 레슨권 (월별 1개)
> - 각 레슨권은 subscribeMappId로 하나의 SubscribeMapp에 연결
> - 보너스/보상 레슨권도 동일한 GT_CLASS_TICKET 객체로 취급 (정규/보너스 구분 필요)

- 순서 변경 시 뒤에 연결된 **모든 레슨권의 날짜가 재계산**되어야 함
- 구현 접근: 삭제 후 재생성 방식이 현실적 (source: DEV-MEETING)
- "만료일" = 체인의 마지막 레슨권(보너스 포함) end_date

### 레슨권 획득 유형 (acquisitionType)

보관중인 레슨권은 획득 경로에 따라 3가지로 구분된다:

| 유형 | enum | 설명 | 지급 주체 |
|------|------|------|----------|
| **구매** | `PURCHASE` | 유저가 직접 결제하여 구매한 레슨권 | 유저 (결제 시스템) |
| **보상** | `REWARD` | 앱 오류, 서비스 장애 등에 대한 보상으로 지급된 레슨권 | CS 운영팀 (수기 지급) |
| **보너스** | `BONUS` | 프로모션/이벤트를 통해 지급된 레슨권 | 마케터 (수기 지급) |

- 3가지 유형 모두 동일한 GT_CLASS_TICKET 객체로 저장되며, `acquisitionType` 필드로 구분
- 보관중인 레슨권 목록의 **기본 정렬 기준 = 구매/지급일(purchasedAt) 순서** (먼저 구매하거나 지급받은 레슨권이 위에 표시)
- 활성화 순서 변경 시 3가지 유형 모두 통합되어 드래그 앤 드롭으로 순서 변경 가능

### 만료 기준 정의 (source: DEV-MEETING)

- **만료 기준 = 보너스 포함 전체 종료일 (레슨권 체인의 마지막 end_date)**
- D-25, D-14, D-7, H-12 등 모든 만료 기반 타이밍은 이 기준을 따름
- 유저 관점에서 "실제로 더 들을 수 있는 마지막 날"이 기준

### 구독 결제 보관 불가 구조 및 결제 방식 분기 (source: DEV-MEETING)

구독(BILLING) 결제는 결제 즉시 ACTIVE 상태가 되어 **보관(INACTIVE) 자체가 불가능한 구조**이다. 이것이 동일 언어 중복구매 시 일괄결제(LUMP_SUM)만 허용하는 근거이다.

| 결제 방식 | 보관(INACTIVE) 가능 여부 | 비고 |
|----------|------------------------|------|
| 구독(월별 결제, BILLING) | **불가** — 결제 즉시 ACTIVE | 동일 언어 ACTIVE 존재 시 구독 중복결제 차단 |
| 일괄결제(LUMP_SUM) | **가능** — 기간 제한 없음 (무제한 보관) | 동일 언어 중복구매의 유일한 결제 방식 |

| 조건 | 허용 결제 방식 |
|------|--------------|
| 같은 언어의 ACTIVE 레슨권이 이미 있음 | 해당 언어는 **일괄결제(LUMP_SUM)만** 가능 |
| 다른 언어 | **구독결제(BILLING)도 판매 가능** |
| ACTIVE 레슨권 없음 | 모든 결제 방식 가능 |

### additional_days 기간연장 매핑 (source: DEV-MEETING)

- 가격표 페이지 이벤트 desc에 표시되는 additional_days는 **GT_SUBSCRIBE와 하드매핑**
- iPad 레슨권에 기간 추가하는 기존 패턴과 동일하게 레슨권에 직접 매핑
- 기간연장 혜택: 3개월=14일, 6개월=30일, 12개월=60일

### 연장레슨권 레거시 화면 분기 (source: DEV-MEETING)

- **연장레슨권(기존 보너스/연장 수강권)이 있으면 레거시 화면을 표시**
- 마이포도도 연장레슨권 보유 시 레거시 화면으로 표시
- 새 UI는 연장레슨권이 없는 유저에게만 적용
- **이 기능 배포 시점부터 연장레슨권은 판매 중단**된다. 기존 구매자만 레거시 분기 대상

> **[DEV 확인 필요]** 연장레슨권 판별 기준(subscribeMapp STATUS='EXTEND' vs 'BONUS' vs paymentType='EXTEND')을 개발팀에서 확인하여 정확한 SQL 조건을 확정해야 함. 레거시 분기는 유저 단위 적용.

### 기간연장 혜택 1회 제한 (source: MARKETING)

- 기간연장 혜택(additional_days)은 **언어별 1회**만 적용
- 기수강생이 해당 언어의 **첫 번째 재구매** 시에만 기간연장 혜택 적용 (3개월=14일, 6개월=30일, 12개월=60일)
- 두 번째 이후 구매(보관용 등)에는 기간연장 혜택 **미적용**
- 예: 영어 첫 재구매 → 기간연장 O / 영어 두 번째 구매 → 기간연장 X / 일본어 첫 재구매 → 기간연장 O

### 환불 정책 (약관 제15조) [carry-forward]
- 중복 보유 수강권의 환불은 **개별 수강권 단위**로 계산 (source: carry-forward, origin: BRIEF-12)
- 환불 금액은 `originPrice`(정가) 기준으로 산출 — 할인/쿠폰 적용가(subPrice)가 아닌 원래 상품 정가 기준
- 수강확인증 발급 수강권은 환불 불가 (제16조 4항)

### 더블팩 데이터 모델 정책
- **기존 2-row 패턴 유지**: 더블팩 1구매 = EN Ticket + JP Ticket 2개 행 생성 (기존 `LangUtils.separateLanguage()` 로직 동일)
- 회차권: `nPurchased = lessonCountPerMonth / 2` (언어별 분배)
- 무제한권: `nPurchased = 999` (각 언어)
- UI에서는 동일 `subscribeMappId`로 묶어서 "더블팩" 라벨로 표시
- 활성화/만료는 EN+JP Ticket이 **동시에 동일하게** 적용 (한쪽만 활성화 불가)
- **기존 일본어 더블팩 이벤트(기간 한정, JP→EN) 폐기** — 상설 더블팩(EN↔JP 양방향)으로 완전 대체

### 예약 제한 (약관 제13조) [carry-forward]
- 더블팩 보유 시 **1일 1개 언어**만 예약 가능 (같은 날 EN+JP 동시 예약 불가, 다른 날은 다른 언어 가능)
- **다중 수강권 보유 시 예약/합산/차감 규칙(무제한권 동시 예약, 회차권 합산, 더블팩+단품 교차, 노쇼 패널티 범위)은 이번 PRD 스코프 외이다.** 현행 예약 시스템을 그대로 유지하며, 별도 티켓으로 처리한다 <!-- Revised: TOP-1 예약 규칙 스코프 아웃 (PM 결정 2026-03-05) -->

### 비활성 수강권 일시정지 정책 <!-- Revised: DEV-1 개발 레벨 다운그레이드 (prd-policy-review-report) -->
- 비활성(INACTIVE) 수강권은 아직 활성화되지 않았으므로 **일시정지 대상이 아니다**. UI에서 일시정지 메뉴를 비활성화 처리한다
- 활성화(ACTIVE) 후에는 약관 제16조의 수강기간별 일시정지 규정이 그대로 적용된다

### 결제 실패 재시도 정책
- **15일간 매일 재시도** 정책 적용 (약관 기준 맞춤. 기존 payment/policies.md §3.3 참조)

### 결제 플로우 PaymentType 매핑
- 기존 회원 추가 구매, 환불-변환 등 신규 결제 플로우의 PaymentType enum 매핑 방식은 **개발팀 판단에 위임** (기존 LUMP_SUM/BILLING 재사용 vs 신규 enum 추가)

### 알림톡 발송 조건
- 리텐션 알림톡은 **마케팅 수신 동의와 무관하게 발송**된다 (알림톡은 정보성 메시지로 분류)
- 발송 제한 조건: **리텐션 쿠폰** 사용 완료 유저에게는 이후 알림톡 미발송 (FR18-7 참조). 환불로 쿠폰이 복원되어도 알림톡 **재발송하지 않음**
- 디바이스 토큰: **기존 1사용자 1디바이스 정책 유지**
- 알림톡 발송 로그 보관 기간: 고객 상담 및 서비스 지원 기록 **3년** (소비자 불만 또는 분쟁처리에 관한 기록 보관 기준 준수)

### 데이터 보관 정책

| 데이터 유형 | 보관 기간 | 법적 근거 |
|------------|----------|----------|
| 결제기록 (상품, 금액) | **5년** | 계약 또는 청약철회, 대금결제, 재화 등의 공급기록 |
| 고객 상담 및 서비스 지원 | **3년** | 소비자 불만 또는 분쟁처리에 관한 기록 |

### D-14 쿠폰 지급 기준 (source: DEV-MEETING)
- **크론이 도는 날짜** 기준으로 레슨권 end_date(보너스 포함 전체 종료일)와 비교
- 크론 실행 시점에 대상 조건에 해당하면 쿠폰이 **즉시 지급**됨
- 지급된 쿠폰은 결제 페이지 진입 시 **최상단 쿠폰 섹션**에 표시

### 환불 정책
- 첫 구매/두번째 구매 구분 없이 **기존 환불 정책(약관 제15조) 동일 적용**
- 1개월 구독 수강권: **판매 중지** (신규 구매 불가, 기존 보유자는 갱신 결제 허용. 갱신 중단 시점 안내는 스코프 외)

### SMART_TALK 수강권 제한 (source: PROTO)
- SMART_TALK 수강권은 **중복 구매 불가** (409 `TICKET_DUPLICATE_NOT_ALLOWED`)
- 기존 시스템 제약이 SMART_TALK에 한해 유지됨

---

## Technical Requirements

### Tech Stack Status

| Item | Current | Notes |
|------|---------|-------|
| **Backend** | Spring Boot (Java/Kotlin) | 기존 podo-backend |
| **Frontend** | Flutter | 기존 podo-app (프로토타입은 React+MSW) |
| **Database** | JPA + QueryDSL | 기존 ORM |
| **PG** | PortOne (v1 + v2) | 기존 PG 유지 [carry-forward] |
| **알림톡** | NotificationService (KAKAO) | 기존 알림톡 인프라 활용 |
| **MQ** | Redis MQ | 기존 MessageQueueService [carry-forward] |
| **Scheduler** | Spring Scheduler / Cron | 기존 배치 인프라 [carry-forward] |

### API Requirements

**Existing API Usage:**
> **Existing system:** TicketService (수강권 CRUD), SubscribeGateway (구독 관리), PaymentGateway (결제 처리), NotificationService (알림 발송)

- `GET /api/tickets` - 수강권 목록 조회 (existing + extension)
- `POST /api/subscribe` - 구독 생성 (existing + extension)
- `POST /api/payment` - 결제 처리 (existing)

**New APIs (Prototype-verified):**

| API | Method | Description | Priority | Source |
|-----|--------|-------------|----------|--------|
| `/api/v2/tickets/summary` | GET | 수강권 현황 (active/inactive/expired + 레슨권 기반 표시) | P0 | (source: PROTO, origin: BRIEF-3) |
| `/api/v2/tickets/:ticketId/activate` | POST | 비활성 수강권 활성화 (startDate/expireDate 설정) | P0 | (source: PROTO, origin: BRIEF-4) |
| `/api/v2/payment/existing-user` | GET | 기존 회원 결제 페이지 데이터 (현재 수강권 + 상품 목록 + 기본 혜택 + 결제 방식 분기) | P0 | (source: PROTO, origin: BRIEF-2) |
| `/api/v2/payment/existing-user/promo` | GET | 프로모션 혜택 조회 (할인쿠폰 + 기간연장 + 세그먼트 + 쿠폰 보유 여부) | P0 | (source: PROTO, origin: BRIEF-2) |
| `/api/v2/payment/existing-user/purchase` | POST | 수강권 구매 (프로모션 적용, 상태 자동 결정, 프로모션 1회 제한 검증) | P0 | (source: PROTO, origin: BRIEF-1) |
| `/api/v2/promotion/retention/schedule` | POST | 리텐션 프로모션 스케줄 생성 (D-25/D-14/D-7/H-12, 만료 기준=보너스 포함 end_date) | P0 | (source: PROTO, origin: BRIEF-7) |

### Component Structure (Prototype-derived)

```
React Prototype (→ Flutter 변환 대상)
├── App.tsx (new) — 라우터 + 네비게이션
├── pages/
│   ├── HomePage.tsx (new) — 리텐션 바텀시트 팝업, phase 로직, localStorage 상태
│   ├── MyPodoPage.tsx (new) — 프로필, 메뉴(플랜/학습통계/쿠폰/결제수단/고객센터/알림), NEW 뱃지. 연장레슨권 보유 시 레거시 표시
│   ├── TicketManagementPage.tsx (new) — 활성/비활성/만료 3섹션, 활성화/순서변경. 레슨권 기반 표시. 구매+보상+보너스 통합
│   ├── LearningStatsPage.tsx (new) — PreReportView/ReportView/ReportListView 분기. 실시간 우선
│   ├── ExistingUserPaymentPage.tsx (new) — 3단계 선택, 프로모션 배너, 더블팩 팝업, 쿠폰 최상단 섹션, 구매완료, 결제 방식 분기
├── components/
│   ├── MenuItem.tsx — 메뉴 행 (뱃지, 우측 텍스트, 화살표)
│   ├── PreReportView.tsx — D-N 카운트다운, 포도 마스코트, 현재 통계
│   ├── ReportView.tsx — 그라데이션 헤더, StatCard 3장
│   ├── ReportListView.tsx — 만료 리포트 목록 + 결제 CTA 카드
│   ├── StatCard.tsx — 제목 + 내용 카드
│   └── DevPanel.tsx (DEV only) — 상태 리셋, 스토어 조회
└── mocks/
    ├── handlers.ts — MSW 핸들러
    ├── store.ts — 인메모리 상태 (시드 데이터)
    └── types.ts — 공유 타입 정의
```

**Flutter 변환 시 구조 (expected):**

```
podo-app/ (existing + extension)
├── payment/
│   ├── existing_user_payment_page.dart (new) — 쿠폰 최상단 섹션, 결제 방식 분기 포함
│   ├── promo_benefit_widget.dart (new)
│   └── deep_link_handler.dart (existing + extension)
├── ticket/
│   ├── ticket_management_page.dart (new) — 레슨권 기반, 구매+보상+보너스 통합
│   ├── ticket_detail_view.dart (new)
│   ├── ticket_activation_order_popup.dart (new) — 보상/보너스 포함 통합 순서 변경
│   ├── ticket_status_badge.dart (new)
├── home/
│   ├── home_page.dart (existing + extension)
│   └── retention_popup_widget.dart (new)
├── learning_stats/
│   ├── learning_stats_page.dart (new) — 실시간 우선
│   ├── pre_report_view.dart (new)
│   ├── report_view.dart (new)
│   └── report_list_view.dart (new)
├── mypage/
│   ├── my_podo_page.dart (existing + extension) — 연장레슨권 시 레거시 분기
│   └── menu_item_widget.dart (new)
└── common/
    └── deep_link_router.dart (existing + extension)

podo-backend/ (existing + extension)
├── applications/
│   ├── ticket/ (existing + extension)
│   │   ├── service/TicketServiceV2Impl.java (extension) — 레슨권 체인 조회, 보너스 포함 end_date 계산
│   │   ├── domain/TicketStatus.java (extension — DEPLETED 상태 추가)
│   │   └── controller/TicketControllerV2.java (new)
│   ├── payment/ (existing + extension)
│   │   ├── gateway/ExistingUserPaymentGateway.java (new) — 결제 방식 분기 포함
│   │   └── service/PromoService.java (new) — 프로모션 1회 제한 검증 포함
│   ├── promotion/ (new)
│   │   ├── scheduler/RetentionScheduler.java (new) — 보너스 포함 end_date 기준
│   │   ├── service/RetentionPromotionService.java (new)
│   │   └── service/CouponTriggerService.java (new) — D-14 크론 기반 쿠폰 지급
│   └── notification/ (existing + extension)
│       └── service/NotificationService.java (extension)
└── modules/
    └── exception/
        └── InvalidTicketDuplicate.java (remove for general tickets / keep for SMART_TALK)
    └── payment/
        └── DUPLICATE_SUBSCRIPTION validation (remove for general tickets / keep for SMART_TALK)
```

---

## Functional Requirements

---

### 수강권 중복 구매

- **FR1:** 기존 회원이 동일 언어 수강권을 **무제한으로 중복 구매**할 수 있다 (source: PROTO, origin: BRIEF-1) [BROWNFIELD]
  - FR1-1: 시스템이 `InvalidTicketDuplicate` 제약(ticket 도메인)과 `DUPLICATE_SUBSCRIPTION` 검증(payment 도메인)을 모두 제거하여 동일 언어 중복 구매를 허용한다
  - FR1-2: 무제한(UNLIMITED), 회차(COUNT), 더블팩(DOUBLE_PACK), iPad 번들 타입에 적용된다
  - FR1-3: 스마트토크(SMART_TALK) 수강권은 중복 구매가 불가하다 (409 `TICKET_DUPLICATE_NOT_ALLOWED` 응답)
  - FR1-4: 기간연장 혜택(additional_days)은 **언어별 1회**만 적용된다. 기수강생이 해당 언어의 첫 번째 재구매 시에만 기간연장 혜택을 받고, 두 번째 이후 구매(보관용 등)에는 미적용된다 (source: MARKETING)
  - FR1-5: 수강권 타입별 중복 구매 허용 매트릭스: <!-- Revised: TOP-2 타입별 매트릭스 추가 (PM 결정 2026-03-05) -->

    | 수강권 타입 | 동일 타입 중복 | 다른 타입과 혼합 | 비고 |
    |-----------|-------------|---------------|------|
    | 무제한(UNLIMITED) | **허용** | 허용 | 동일 언어 ACTIVE 시 LUMP_SUM만 |
    | 회차(COUNT) | **허용** | 허용 | 동일 언어 ACTIVE 시 LUMP_SUM만 |
    | 더블팩(DOUBLE_PACK) | **허용** | 허용 | EN+JP 단품 ACTIVE 시 INACTIVE 보관 |
    | iPad 번들 | **허용** | 허용 | 할인 쿠폰 적용 (상한 10만원, FR8-5) |
    | 스마트토크(SMART_TALK) | **불허** (409) | 불허 | 기존 제약 유지 (FR1-3) |
    | 체험권(PODO_TRIAL) | **불허** | 불허 | 1인 1체험 유지 (ADR-002) |
- **FR2:** 구매된 수강권이 **비활성(INACTIVE) 상태로 보관**될 수 있다 (source: PROTO, origin: BRIEF-4)
  - FR2-1: 동일 언어 단품 구매 시 수강권이 INACTIVE 상태로 생성된다
  - FR2-2: 다른 언어 단품 구매 시 수강권이 ACTIVE 상태로 즉시 활성화된다
  - FR2-3: 더블팩 구매 시 EN+JP 2개의 수강권이 각각 INACTIVE 상태로 생성된다 (기존 ENJP 2-row 패턴 유지)
  - FR2-4: 비활성 수강권의 수강기간 카운트다운이 시작되지 않는다 (startDate=null)
  - FR2-5: 수강권 상태는 5가지이다: INACTIVE(미활성), ACTIVE(활성), EXPIRED(기간만료), DEPLETED(횟수소진), REFUNDED(환불완료). DEPLETED는 회차권(COUNT) 등 nRemaining=0이 되어 기간 내 사용 가능 횟수가 소진된 경우의 종료 상태이다. REFUNDED 상태 구현 방식은 **개발팀 판단에 위임** (source: PROTO)
  - FR2-6: **구독 결제 보관 불가**: 구독(BILLING) 결제는 결제 즉시 ACTIVE 상태가 되어 보관(INACTIVE) 자체가 불가능하다. 일괄(LUMP_SUM) 결제 수강권만 **기간 제한 없이** 보관 가능하다. 이것이 동일 언어 중복구매 시 일괄결제만 허용하는 근거이다 (source: DEV-MEETING)
  - FR2-7: **비활성 수강권 청약 철회 정책**: 비활성 수강권의 청약 철회 기산점은 **구매일 기준** 7일 이내이다 (약관 제15조 1항). 프로모션 혜택(할인 쿠폰, 기간연장)이 적용된 수강권은 **청약 철회 불가** 조건에 해당한다 <!-- Revised: TOP-3+5 비활성 수강권 법적 정책 (PM 결정 2026-03-05) -->

### 수강권 활성화

- **FR3:** 고객이 **원하는 시점에 비활성 수강권을 활성화**할 수 있다 (source: PROTO, origin: BRIEF-4)
  - FR3-1: 활성화 시 수강기간이 즉시 시작된다 (startDate = 활성화일, expireDate = 활성화일 + durationMonths)
  - FR3-2: 이미 ACTIVE 상태인 수강권 활성화 시도 시 409 에러가 반환된다
  - FR3-3: **ACTIVE 더블팩이 있으면 EN/JP 단품 활성화 모두 불가.** 더블팩 구매 시 INACTIVE로 보관, 기존 단품 만료 후 활성화 (약관 제13조)
  - FR3-4: 동일 언어 단품 수강권끼리는 동시 활성화 불가 (1언어 1개만 ACTIVE)
  - FR3-5: 동일 언어 ACTIVE 수강권이 **기간 만료(EXPIRED)**되면, 해당 언어의 다음 순번 INACTIVE 수강권이 자동 활성화된다. 활성화 순서는 FR15의 사용자 지정 순서를 따른다 (source: PROTO, origin: BRIEF-4)
  - FR3-6: **횟수 소진(DEPLETED)** 시에는 자동 전환하지 않는다. 유저가 수동으로 비활성 수강권을 활성화해야 한다
  - FR3-7: DEPLETED 전환 시 별도 알림/프로모션 없음

### 기존 회원 결제 페이지

- **FR6:** 기존 회원이 **기존 결제 페이지 UI를 통해 수강권을 구매**할 수 있다 (source: PROTO, origin: BRIEF-2) <!-- Revised: JP1 Comment — 별도 3단계 선택 페이지가 아닌 기존 결제 페이지 UI 활용 (2026-03-05) -->
  - FR6-1: 기존 결제 페이지의 UI/UX를 그대로 따른다 (언어, 상품 타입, 기간 선택은 기존 결제 플로우와 동일)
  - FR6-2: 쿠폰 또는 기간연장 혜택이 존재하는 경우, **결제 페이지 최상단에 프로모션 배너**가 표시된다
  - FR6-3: 프로모션 배너에는 적용 가능한 할인 쿠폰과 기간연장 혜택 정보가 포함된다
  - FR6-4: 기존 회원 여부가 자동 판별된다 (ACTIVE, INACTIVE, EXPIRED, DEPLETED 수강권 중 하나라도 보유 시 기존 회원; 기간 제한 없음. 미보유 시 403 `NOT_EXISTING_USER`)
  - FR6-5: 상품 상세 패널에 혜택 목록, 일시불 가격이 표시된다
  - FR6-6: **같은 언어의 ACTIVE 레슨권이 이미 존재**하면, 해당 언어의 중복결제는 **일괄결제(LUMP_SUM)만** 가능하다. 구독(BILLING) 결제 옵션은 미노출된다. **다른 언어는 구독결제도 판매 가능**하다 (source: DEV-MEETING)
  - FR6-7: 결제 페이지 진입 시 만료자 대상 **쿠폰 보유 여부를 확인**한다. 쿠폰이 있으면 **최상단에 쿠폰 할인 섹션**이 표시된다. 쿠폰이 없으면 **기간연장 혜택만** 표시된다. **쿠폰이 적용된 수강권에는 기간연장 혜택이 적용되지 않는다** (FR8-4 참조). 쿠폰 미적용 언어의 수강권에만 기간연장 혜택이 적용된다 (source: FR7-4/FR7-5 흡수) <!-- Revised: JP1 Comment — 쿠폰+기간연장 상호배제 명확화 (2026-03-05) -->
- **FR8:** 세그먼트 기반 **차등 할인율이 자동 적용**된다 (source: PROTO)
  - FR8-1: **언어별** 월별 평균 사용량으로 세그먼트가 자동 계산된다 (LOW: <6, MID: 6-10, HIGH: 11-15, ULTRA_HIGH: >=16). 세그먼트는 유저 전체가 아닌 **언어별** D-14 시점에 분류된다 (쿠폰 발급과 동시)
  - FR8-2: 세그먼트별 할인율이 차등 적용된다 (LOW: 30%, MID: 20%, HIGH: 20%, ULTRA_HIGH: 5%). **할인 금액 상한(discountAmountMax) = 20만원**
  - FR8-3: 할인 쿠폰은 만료 임박 활성 수강권의 **해당 언어에만** 자동 매칭된다. **D-14 시점에 크론이 실행되어 레슨권 end_date(보너스 포함 전체 종료일) 기준으로 대상 여부를 판단하고, 대상이면 1회 발급**된다. 쿠폰 유효기간은 **수강권 만료일까지**이다. 다중 언어 수강권 만료 시 **각 언어별로 각각 쿠폰이 발급**된다 (source: DEV-MEETING)
  - FR8-4: 쿠폰 적용 언어가 아닌 언어에는 기간연장 혜택이 적용된다. **1개 수강권에 할인 쿠폰 + 기간연장 중복 적용 불가.** 상호배제 UX(선택 방식, 안내 문구 등)는 **디자인 단계에서 결정** (개발팀 판단에 위임)
  - FR8-5: 물리적 번들(iPad 패키지) 상품에도 할인 쿠폰이 **적용된다**. 단, **할인 금액 상한 = 10만원**이다 <!-- Revised: JP1 Comment — iPad 패키지 할인 쿠폰 적용 대상 포함, 최대 10만원 제한 (2026-03-05) -->
  - FR8-10: 리텐션 쿠폰과 기존 쿠폰(WelcomeBack 등)은 **상호배제**이다. 리텐션 쿠폰 적용 시 기존 쿠폰은 자동 제외되며, **더 유리한 쿠폰 1개만** 적용된다 <!-- Revised: 리텐션+기존 쿠폰 상호배제 확정 (PM 결정 2026-03-05) -->
  - FR8-6: 세그먼트 계산 시 **마지막 달(현재 진행 중인 미완성 월)은 제외**된다. 마지막 달의 기준은 **만료일 기준 30일 전까지**로 정의한다. 현재 판매 중인 수강권의 최소 기간은 3개월이므로 완료 월=0 엣지케이스는 해당 없음
  - FR8-7: 세그먼트 라벨은 **내부 로직 전용**이며, 회원 UI에 절대 노출되지 않는다
  - FR8-8: 세그먼트 **미분류**(계산 불가 또는 분류 실패) 시 해당 언어의 **쿠폰은 미발급**된다
  - FR8-9: 미분류 세그먼트 **확인 크론**이 주기적으로 실행되어, 세그먼트가 분류되지 않은 대상자를 감지하고 마케팅팀에게 알린다

> **[DEV 논의 필요 — PM 미팅 요청]** 기존 WelcomeBack 세그먼트 3단계(LOW/MEDIUM/HIGH=쿠폰 배제)를 PRD 4단계(LOW/MID/HIGH/ULTRA_HIGH=5%)로 **완전 교체** 예정. 기존에 HIGH로 쿠폰 배제되던 고빈도 유저에게 ULTRA_HIGH 5% 쿠폰이 새로 지급되므로 정책 변경 영향 범위 확인 필요. 논의 사항: (1) 기존 세그먼트 데이터 마이그레이션 계획 (2) 기존 WelcomeBack 크론/로직 교체 vs 공존 기간 (3) 고빈도 유저 쿠폰 신규 지급에 따른 비용 영향

### 수강권 관리 UI

- **FR11:** 보유 수강권 목록에서 **활성/비활성/만료 3섹션으로 구분**된다 (source: PROTO, origin: BRIEF-3)
  - FR11-1: 활성(ACTIVE + DEPLETED) 수강권 섹션에 활성화 날짜, 만료 예정일, 잔여 일수, 일일 한도가 표시된다. **DEPLETED(횟수 소진)도 활성 섹션에 표시** (기간이 남아있으므로). 만료(EXPIRED) + 환불(REFUNDED)은 만료 섹션에 표시된다. **레슨권 기반으로 표시** (기존 티켓 기반에서 변경) (source: DEV-MEETING)
  - FR11-2: 비활성(INACTIVE) 수강권 섹션에 "활성화" 버튼이 제공된다 (더블팩: 충돌 없을 때만). **구매 레슨권 + 보상권 + 보너스 레슨권이 통합 표시**되며, 획득 유형별 카드 UI가 차별화된다 (source: DEV-MEETING)
    - **구매(PURCHASE)**: 풀사이즈 흰색 카드. 플랜명, 언어, 기간, 홀딩 정보 표시
    - **보상(REWARD)**: 컴팩트 그룹 카드 (점선 테두리, 슬레이트 배경). CS 뱃지 + "보상 수강권 총 N건" 헤더로 묶어 표시. 각 건은 한 줄로 언어/기간/보상 사유/지급일 표시. 1일짜리 다수 건에 최적화
    - **보너스(BONUS)**: 노란 그라데이션 카드 + "무료" 리본 + "프로모션" 뱃지. "프로모션으로 받은 무료 이용권이에요." 문구 + 지급일 표시. 프로모션 명칭은 표시하지 않음
  - FR11-3: 만료(EXPIRED) 수강권 섹션이 별도로 표시되고, 탭하면 상세 뷰로 이동한다
  - FR11-4: `?scrollTo=inactive` 파라미터로 비활성 섹션에 자동 스크롤된다
  - FR11-5: 비활성 수강권에 언어 충돌 경고 및 더블팩 충돌 경고가 표시된다. 더블팩 충돌 시 "현재 사용중인 수강권 플랜이 모두 종료되면 자동으로 활성화됩니다." 안내 + 툴팁 "영어 혹은 일본어 중 한 개라도 이용중이라면 더블팩 이용이 불가해요."
  - FR11-6: **연장레슨권(기존 보너스/연장 수강권)이 있으면 레거시 화면을 표시**한다. 새 UI는 연장레슨권이 없는 유저에게만 적용된다 (source: DEV-MEETING)
- **FR12:** 수강권 **상세 뷰**에서 상세 정보가 조회된다 (source: PROTO)
  - FR12-1: 수강권 이미지, 이름, 수강 기간, 수업 횟수, 수업 시간, 결제 정보가 표시된다
  - FR12-2: 다월 수강권의 경우 월별 결제 주기 타임라인(완료/활성/예정)이 표시된다
  - FR12-3: "수강 확인증 발급" 기능이 제공된다 (현재 stub)

---

### 활성화 순서 변경

- **FR15:** 비활성 수강권이 2개 이상일 때 **활성화 순서를 변경**할 수 있다 (source: PROTO)
  - FR15-1: 드래그 앤 드롭으로 카드를 재정렬한다
  - FR15-2: 타임라인 시각화가 제공된다
  - FR15-3: 더블팩은 단일 언어 수강권 사이에 배치할 수 없다 (맨 앞 또는 맨 뒤만 가능)
  - FR15-4: 배치 제약 위반 시 토스트 경고가 표시된다
  - FR15-5: **구매 레슨권 + 보상권 + 보너스 레슨권이 모두 한 화면에서 순서 변경** 가능하다 (source: DEV-MEETING)
  - FR15-6: 순서 변경 시 체인 구조 특성상 **뒤에 연결된 모든 레슨권의 날짜가 재계산**된다 (source: DEV-MEETING)

---

### 리텐션 홈 팝업

- **FR16:** 홈 화면에서 만료일 기준 **6단계 phase별 바텀시트 팝업**이 표시된다. **기존 extendingPaymentPopup(서버 기반 연장할인 팝업)은 폐기**하고 이 클라이언트 기반 6단계 팝업으로 완전 대체한다 (source: PROTO, origin: BRIEF-7, v3.2 카피 업데이트)
  - FR16-1: D-25 ~ D-15 (report phase) — "포도와 함께한 시간 {N}일! {이름}님과 함께한 시간을 확인해보세요." / CTA: "{언어} 리포트 보러가기" → `/learning-stats` / 하루 1회 / REPORT_CTA 클릭 시 이후 미표시
  - FR16-2: D-14 (coupon-first phase) — "{이름}님의 {언어} 수강권이 14일 남았어요." + "열심히 쌓은 {언어} 실력을 이어가실 수 있게 최대 할인 쿠폰을 쏙 넣어드렸어요!" / CTA: "나만의 할인가 확인하기" → `/payment/existing-user` / 최초 1회
  - FR16-3: D-13 ~ D-10 (coupon-soft phase) — "{이름}님의 {언어} 수강권이 {D}일 남았어요." + "열심히 쌓은 {언어} 실력을 이어가실 수 있게 쏙 넣어드린 최대 할인쿠폰을 놓치지마세요!" / CTA: "나만의 할인가 확인하기" → `/payment/existing-user` / 하루 1회 / CTA 클릭 시 이후 미표시
  - FR16-4: D-7 ~ D-2 (coupon-hard phase) — **긴급 스타일(빨간색 폰트)** 적용. "{이름}님과 포도가 함께 쌓은 외국어 실력을 잃지 말아주세요." + "{이름}님 맞춤 쿠폰이 {D}일이 지나면 사라져요." / CTA: "혜택 만료 전 확인하기" → `/payment/existing-user` / 하루 1회
  - FR16-5: D-1 (coupon-d1 phase) — **긴급 스타일**. "{이름}님, 내일이 지나면 {언어} 수강권이 끝나요." + "7일 이내 전액 환불 가능해요. 혹시 고민 중이시라면, 지금을 놓치지마세요!" / CTA: "할인 막차 타기" → `/payment/existing-user` / 하루 1회
  - FR16-6: D-0 (coupon-d0 phase) — **긴급 스타일**. "{이름}님, 오늘 자정 수강권과 혜택이 모두 사라져요" + "포도가 준비한 {이름}님만의 특별 할인은 오늘이 마지막이에요." / CTA: "오늘 할인 종료" → `/payment/existing-user` / 하루 1회
  - FR16-7: 팝업 표시/CTA 클릭 상태는 localStorage에 저장된다
  - FR16-8: **가장 만료 임박한 활성 수강권의 보너스 포함 전체 종료일(end_date)** 기준으로 잔여일이 계산되고, 이에 따라 phase가 결정된다 (source: DEV-MEETING)
  - FR16-9: 배경 탭 또는 X 버튼으로 팝업을 닫을 수 있다 (CTA 상태 변경 없음)

### 리텐션 프로모션 스케줄러

- **FR17:** 수강권 만료일 기준 **4회 타이밍별 백엔드 스케줄이 자동 생성**된다 (source: PROTO, origin: BRIEF-7)
  - FR17-1: D-25, D-14, D-7, H-12 (만료일 당일 자정 12시간 전) 4개 시점에 스케줄이 생성된다. **만료 기준 = 보너스 포함 전체 종료일(레슨권 체인의 마지막 end_date)** (source: DEV-MEETING)
  - FR17-2: 각 스케줄은 PENDING → SENT → CANCELLED/FAILED 상태로 전이된다
  - FR17-3: 이미 재구매한 고객에게는 이후 스케줄이 CANCELLED 처리된다. **"재구매" = 만료 임박 수강권과 동일 언어의 신규 ACTIVE 수강권 구매**를 의미한다. 비활성(INACTIVE) 수강권 보유는 재구매로 간주하지 않는다 <!-- Revised: TOP-10 재구매 판정 기준 (PM 결정 2026-03-05) -->
  - FR17-4: 만료일 변경 사유 발생 시 스케줄이 재계산된다. **이미 SENT 상태인 타이밍은 skip**(재발송하지 않음)하고, 새로 생성된 미래 타이밍만 발송한다 <!-- Revised: 일시정지 시 재발송 정책 (PM 결정 2026-03-05) -->
  - FR17-6: **다중 수강권 보유 시 발송 기준**: 고객별 통합 1세트만 발송한다. **가장 빨리 만료되는 활성 수강권**의 end_date 기준으로 스케줄이 생성된다. 다른 활성 수강권이 남아있어도 해당 수강권 만료 시점에 프로모션이 발송된다 <!-- Revised: TOP-10 다중 수강권 발송 기준 (PM 결정 2026-03-05) -->
  - FR17-5: **기존 3종 만료 알림톡(D-25, D-7, 당일)은 신규 4회 스케줄로 완전 대체**된다. 병행 기간 중 동일 타이밍 중복 발송을 방지하고, 신규 시스템 안정화 확인 후 기존 알림톡을 제거한다 (Architecture ADR-005 참조) <!-- Revised: TOP-9 기존 알림톡 이관 FR 명시 (prd-policy-review-report 권고) -->

### 알림톡 발송

- **FR18:** 리텐션 프로모션이 **알림톡으로 발송**된다 (source: PROTO, origin: BRIEF-8)
  - FR18-1: 앱 인앱 메시지(홈 팝업)는 FR16에서 별도 정의 (클라이언트 6단계 phase)
  - FR18-2: 백엔드 스케줄(D-25/D-14/D-7/H-12) 시점에 **알림톡**이 발송된다
  - FR18-3: 결제 완료 시 **결제완료 알림톡**이 발송된다
  - FR18-4: 알림톡은 **정보성 메시지로 카카오에 템플릿 등록을 시도**한다 (만료 안내가 주 목적). 카카오 심사에서 광고성으로 거부될 경우, 광고성으로 재등록하고 마케팅 수신 동의 유저에게만 발송하도록 전환한다 <!-- Revised: 필수통지 vs 마케팅 분류 확정 (PM 결정 2026-03-05) -->
  - FR18-7: 발송 횟수 별도 제한 없음 (스케줄대로 발송). 단, **리텐션 쿠폰을 사용한 유저에게는 이후 알림톡이 발송되지 않는다** (다른 유형 쿠폰은 무관). 환불로 쿠폰이 복원되어도 알림톡 재발송하지 않음
  - FR18-8: 쿠폰 미사용 유저만 D-14/D-7/H-12 쿠폰 계열 알림톡 대상
  - FR18-9: 채널별 발송 타이밍 배분(예: 일일 최대 발송 수, 채널 우선순위)은 **운영 설정으로 조정** 가능하도록 구현한다. 고객 피로도 최적화는 A/B 테스트로 검증한다 <!-- Revised: DEV-5 채널별 발송 배분 (prd-policy-review-report) -->
  - FR18-5: 알림톡 템플릿 상세:

    | 타이밍 | 템플릿 코드 (CSV 기준, 네이밍 변경 예정) | 템플릿 명 | 대상자 | 발송 시각 | 콘텐츠 성격 | 버튼 CTA | 딥링크 대상 |
    |--------|------------|----------|--------|----------|-----------|---------|-----------|
    | D-25 | `pd_lrn_ticket_report_d25` | [기수강생] 수강권 만료자 리포트 안내 | 활성 레슨권 만료 D-25 대상자 | 19시 | 학습 리포트 안내 | "일기장 몰래보기" | 홈 탭 |
    | D-14 | `pd_lrn_coupon_expire_d14` | [기수강생] 수강권 만료자 쿠폰 안내 -1 | 만료자 전용 쿠폰 미사용 유저 | 19시 | VIP 쿠폰 안내 | "마이쿠폰 바로가기" | 쿠폰함 |
    | D-7 | `pd_lrn_ticket_report_d7` | [기수강생] 수강권 만료자 리포트 안내 | 만료자 전용 쿠폰 미사용 유저 | 19시 | 리포트 재안내 | "내 외국어결산 보기" | 홈 탭 |
    | H-12 | `pd_lrn_coupon_expire_h12` | [기수강생] 수강권 만료자 쿠폰 안내 -2 | 만료자 전용 쿠폰 미사용 유저 | 만료일 12시간 전 | 쿠폰 긴급 안내 | "마이쿠폰 바로가기" | 쿠폰함 |
    | 결제완료 | `pd_lrn_sub_pay_dup` | [기수강생] 중복 레슨권 결제 완료 | 중복 레슨권 결제 완료자 | 즉시 | 결제 완료 확인 | "내 포도플랜 보러가기" | 마이포도 플랜 |

    > **카카오 알림톡 템플릿 등록**: 템플릿 코드는 CSV 기준에서 네이밍 변경 예정. 카카오 템플릿 승인 리드타임(1~3 영업일)은 별도 일정으로 관리.

  - FR18-6: 템플릿 변수 목록:
    - 리포트 계열(D-25/D-7): `#{studentName}`, `#{meetingMonth}`, `#{serviceUsingDate}`
    - 쿠폰 계열(D-14/H-12): `#{coupon_use_deadline}`
    - 결제완료: `#{studentName}`, `#{ClassPackageName}`, `#{Lessonterm}`, `#{ClassPackagePrice}`, `#{TicketStartDate}`, `#{TicketExpireDate}`, `#{Lessonperiod}`, `#{Paymentday}`

---

### 학습통계/리포트

- **FR19:** 학습통계 페이지에서 수강 성과 **리포트가 제공**된다 (source: PROTO, v3.2 상태 모델 재정의)
  - FR19-1: **상태 1 (NoLesson)** — 레슨 0회(nUsed=0)일 때 레슨 유도 화면이 표시된다. "포도를 시작해볼까요?" + "첫 레슨을 완료하면 {이름}님만의 학습통계가 시작됩니다" + 레슨 시작 CTA
  - FR19-2: **상태 2 (Preparing)** — 레슨 완료 후 24시간 미경과 시 리포트 준비 중 화면이 표시된다. "리포트 분석 중" + "포도가 열심히 {이름}님의 레슨을 분석하고 있어요. 조금만 기다려주세요!" + 예상 완료 시간 표시. 상태 전환 기준은 **레슨 완료 API 응답 시점**(클라이언트가 즉시 인지)
  - FR19-3: **상태 3 (Ready)** — 리포트 캐시 생성 완료(24h 경과) 시 **기존 학습통계 화면**이 표시된다. 리포트 콘텐츠는 기존 학습통계 화면을 임베딩/라우팅한다 (source: prototype reference podo-mypage-report.jsx)
  - FR19-4: 활성 수강권이 없을 때 **ReportListView**가 표시된다 (과거 리포트 목록 + 결제 CTA 카드)
  - FR19-5: 만료된 수강권의 과거 리포트를 탭하여 상세 내용을 확인할 수 있다. **학습기록은 sub_mapp에 매핑**되므로 과거 데이터도 전부 조회 가능하다 (source: DEV-MEETING)
  - FR19-6: 마이포도 메뉴에서 학습통계 항목에 NEW 뱃지가 표시된다
  - FR19-7: **실시간 데이터 조회를 우선** 구현한다. QA 과정에서 성능이 느릴 경우 캐시 시간을 조절하여 대응한다 (source: DEV-MEETING)
  - FR19-8: **멀티 리포트 탭** — 활성 수강권이 2개 이상이면 상단에 언어별 탭이 표시된다. 탭 전환으로 각 언어 리포트를 확인할 수 있다. **더블팩(ENGLISH_JAPANESE)은 영어/일본어 각각 별도 탭으로 분리**하여 표시한다. **탭 순서는 더 많이 수강한 언어가 먼저** 표시된다 (source: v3.2 프로토타입 리뷰)

---

### 마이포도 페이지

- **FR23:** 마이포도 페이지에서 **주요 기능으로의 네비게이션**이 제공된다 (source: PROTO)
  - FR23-1: 프로필 섹션에 사용자 정보가 표시된다
  - FR23-2: 마이 포도 플랜(수강권 관리) 메뉴 항목이 제공된다. **레슨권 기반 표시** (source: DEV-MEETING)
  - FR23-3: 학습통계 메뉴 항목에 NEW 뱃지가 조건부 표시된다
  - FR23-4: 마이쿠폰, 결제수단, 고객센터, 알림설정, 버전, 로그아웃 메뉴 항목이 제공된다
  - FR23-5: **연장레슨권 보유 시 마이포도도 레거시 화면으로 표시**된다 (source: DEV-MEETING)

### 환불 및 정책

- **FR24:** 중복 보유 수강권의 환불이 **개별 수강권 단위**로 처리된다 (source: carry-forward, origin: BRIEF-12)
  - FR24-1: 기존 환불 규정(약관 제15조)이 개별 수강권에 동일 적용된다. **누적결제액 = 해당 수강권의 결제액만** 기준이며, 다른 수강권의 결제 이력과 무관하다 <!-- Revised: TOP-6 환불 산정 기준 명확화 (PM 결정 2026-03-05) -->
  - FR24-2: 환불 금액은 `originPrice`(정가) 기준으로 산출된다. originPrice의 정확한 필드 매핑은 **개발팀 판단에 위임**
  - FR24-5: **비활성(미사용) 수강권 환불 시** 콘텐츠비/위약금이 적용되지 않는다 (사용한 적 없으므로). 청약 철회 기간(구매일 기준 7일) 이내이고 프로모션 혜택 미적용 시 전액 환불 가능 <!-- Revised: TOP-6 비활성 환불 정책 (PM 결정 2026-03-05) -->
  - FR24-3: 기간연장 혜택이 적용된 수강권 환불 시 **기간연장 혜택도 회수**된다
  - FR24-4: 구독(BILLING)과 일괄결제(LUMP_SUM) 수강권을 혼합 보유한 경우, **각 수강권의 결제 방식에 해당하는 약관 환불 공식을 개별 적용**한다 <!-- Revised: DEV-3 혼합 환불 개별 적용 (prd-policy-review-report) -->
- ~~**FR25 (삭제):** 1개월 구독 수강권 판매 중지로 제거~~
- **FR26:** 수강확인증 발급 시 **수강권 선택**이 가능하다 (source: carry-forward)
  - FR26-1: 여러 수강권 보유 시 어느 수강권의 수강확인증인지 선택 UI가 제공된다 [carry-forward]
  - FR26-2: 수강확인증 발급 시 **환불불가 경고 모달 없음** — 현행대로 바로 발급. 환불불가 검증은 환불 시점에 서버에서 처리

### 기간연장 혜택 (additional_days)

- **FR27:** 기간연장 혜택이 **GT_SUBSCRIBE에 하드매핑**된다 (source: DEV-MEETING)
  - FR27-1: 기간연장 일수(additional_days)가 GT_SUBSCRIBE 테이블에 직접 매핑된다
  - FR27-2: iPad 레슨권에 기간을 추가하는 기존 패턴과 동일하게 구현한다
  - FR27-3: 가격표 페이지의 이벤트 desc에 additional_days가 표시된다
  - FR27-4: 기간연장 혜택: 3개월=14일, 6개월=30일, 12개월=60일
  - FR27-5: 기간연장 혜택은 **언어별 1회**만 적용된다. 해당 언어의 첫 번째 재구매에만 적용되고, 두 번째 이후 구매에는 미적용 (FR1-4 참조)

---

## Non-Functional Requirements

### Performance

| NFR | Requirement | Measurement Method |
|-----|-------------|-------------------|
| NFR1 | 기존 회원 결제 페이지 로딩 < 2초 (p95) — 두 API 병렬 호출(existing-user + promo) 포함 | APM 모니터링 [carry-forward] |
| NFR2 | 수강권 목록 조회 API (GET /tickets/summary) 응답 < 500ms (p95) — 레슨권 기반 + 보너스 포함 | API 응답시간 로그 [carry-forward] |
| NFR4 | 프로모션 스케줄러 실행 < 5분 (전체 대상자 처리) — 보너스 포함 end_date 계산 포함 | 배치 실행 로그 [carry-forward] |
| NFR5 | 홈 팝업 phase 결정 로직 < 100ms (localStorage 읽기 + 잔여일 계산) | 클라이언트 프로파일링 (source: PROTO) |
| NFR6 | 학습통계 페이지 로딩 — **실시간 우선 구현**, QA 시 느리면 캐시 시간 조절 (source: DEV-MEETING) | API 응답시간 + 사용자 체감 성능 |

### Reliability

| NFR | Requirement | Measurement Method |
|-----|-------------|-------------------|
| NFR7 | 알림톡 발송 정시성 99% (스케줄 대비 5분 이내) | 발송 로그 타임스탬프 비교 |
| NFR9 | 수강권 상태 전이 정합성 100% (INACTIVE→ACTIVE→EXPIRED/DEPLETED, INACTIVE→REFUNDED, ACTIVE→REFUNDED, 자동 활성화 포함) | 일간 정합성 배치 검증 [carry-forward] |
| NFR10 | 결제 트랜잭션 원자성 보장 (수강권 생성 + 상태 설정) | 트랜잭션 로그 [carry-forward] |

### Integration

| NFR | Requirement | Measurement Method |
|-----|-------------|-------------------|
| NFR12 | 기존 PortOne PG 연동 호환성 유지 | 결제 성공률 모니터링 [carry-forward] |
| NFR13 | 기존 알림톡 인프라와 완전 호환 | 발송 성공률 비교 |
| NFR14 | 기존 예약 시스템과 정합성 (totalDailyLimit, totalRemaining) | 예약 성공률 + 횟수 검증 [carry-forward] |

### Security

| NFR | Requirement | Measurement Method |
|-----|-------------|-------------------|
| NFR16 | 결제 정보 암호화 전송 (기존 수준 유지) | PCI DSS 준수 확인 [carry-forward] |

### Error Handling

| NFR | Requirement | Measurement Method |
|-----|-------------|-------------------|
| NFR18 | 수강권 미보유 사용자의 결제 페이지 접근 시 명확한 에러 응답 (403 NOT_EXISTING_USER) | API 에러 로그 (source: PROTO) |
| NFR19 | 구독(BILLING) 결제 시 동일 언어 ACTIVE 존재하면 구독 옵션 미노출 + 일괄결제만 안내 | E2E 테스트 (source: DEV-MEETING) |

---

## Pre-Apply Review

### Policy Alignment

**Pass** — 정책 충돌 11건 중 전체 처리 방향 확정

- 약관 제15조 환불: 개별 수강권 단위 환불 기준 명시 (FR24-1). 비활성 수강권 전액 환불 조건 정의 (FR24-5). 혼합 결제 개별 적용 (FR24-4)
- 약관 제16조 수강확인증: 수강권 선택 UI 추가 (FR26-1). 환불불가 경고 모달 없이 현행 유지 (FR26-2)
- 약관 제13조 예약: 다중 수강권 예약 규칙은 스코프 외. 현행 시스템 유지 (TOP-1)
- 구독(BILLING) 보관 불가: 일괄결제만 중복구매 허용으로 구조적 해결 (FR2-6, FR6-6)
- 카카오 알림톡: 기존 심사 통과 템플릿 재사용으로 정보성 분류 유지 (PO 확인, CST-011)
- 청약 철회: 비활성 수강권 구매일 기준 7일, 프로모션 혜택 적용 시 불가 (FR2-7)

### Brownfield Compatibility

**Pass** — 기존 시스템 11건 충돌 전체 처리 방향 확정

- `InvalidTicketDuplicate` 예외: SMART_TALK만 유지, 나머지 제거 (CST-004 → FR1-1, FR1-3)
- `DUPLICATE_SUBSCRIPTION` 검증: SMART_TALK만 유지, 나머지 제거 (CST-005 → FR1-1)
- `TicketStatus` enum 미정의: 5상태 enum 신규 도입 (CST-006 → FR2-5)
- 수강권 관리 UI 6그룹 → 3섹션 개편: 레슨권 기반 재설계 (CST-001 → FR11)
- 홈 팝업 단일 구조 → 6단계 phase: 클라이언트 기반으로 완전 대체 (CST-002 → FR16)
- 결제 페이지 기존 회원 미지원: 프로모션 배너/쿠폰 섹션 추가 (CST-003 → FR6, FR8)
- 기존 알림톡 3종 → 신규 4종 완전 대체: 병행 기간 중복 방지 후 기존 제거 (CST-007 → FR17-5)
- `getActiveTicket()` 단일 반환 전제: 래퍼 도입 또는 시그니처 변경 (Builder 판단)

### Logic Consistency

**Pass** — 상태 전이 교차점 및 엣지케이스 검증 완료

- **상태 전이 완전성**: INACTIVE → ACTIVE → EXPIRED/DEPLETED 정방향 + INACTIVE → REFUNDED, ACTIVE → REFUNDED 역방향 전이 정의. 자동 활성화(EXPIRED 시 다음 INACTIVE → ACTIVE) 포함
- **DEPLETED vs EXPIRED 분기**: DEPLETED 시 자동 전환 없음(수동 활성화 필요), EXPIRED 시 자동 활성화. 이 차이가 FR3-5, FR3-6에 명시적으로 구분
- **구독/일괄결제 분기**: 같은 언어 ACTIVE 시 구독 미노출(FR6-6), 구독은 즉시 ACTIVE(FR2-6). 순환 참조 없음
- **쿠폰/기간연장 상호배제**: 1수강권에 중복 적용 불가(FR8-4). 쿠폰 적용 언어 ≠ 기간연장 적용 언어
- **더블팩 충돌**: EN 또는 JP 중 하나라도 ACTIVE면 더블팩 활성화 불가(FR3-3). 배치 제약(FR15-3)과 일관
- **알림톡 중복 방지**: 기존 3종 폐기 + 신규 4종 대체(FR17-5). 쿠폰 사용 유저 이후 미발송(FR18-7)
- **미검증 가정 5건**: H1(리포트→재구매), H2(긴급→전환율), H3(순서 변경 니즈)는 출시 후 검증. H8(getActiveTicket 수정), H9(알림톡 마이그레이션)은 Builder 판단

---

## QA Considerations

### 수강권 중복 구매 (P0)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA1 | 동일 언어 수강권 2개 이상 구매 | 정상 구매 완료, 동일 언어 → INACTIVE, 다른 언어 → ACTIVE (source: PROTO) |
| QA2 | SMART_TALK 수강권 중복 구매 시도 | 409 `TICKET_DUPLICATE_NOT_ALLOWED` 에러 반환 (source: PROTO) |
| QA3 | 더블팩 구매 시 활성 단품 존재 | 더블팩 확인 팝업 표시, 활성화 가능 시점 계산 (source: PROTO) |
| QA6 | 만료된 수강권이 있는 상태에서 신규 구매 | 만료 수강권 별도 표시, 신규는 INACTIVE 보관 |
| QA7 | 동일 프로모션 2회 구매 시도 | 두 번째 시도 차단 (1회 제한) (source: MARKETING) |

### 수강권 활성화 및 순서 변경 (P0)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA8 | 비활성 수강권 활성화 | startDate/expireDate 정상 설정, 상태 ACTIVE 전이 (source: PROTO) |
| QA9 | 이미 활성 수강권 재활성화 시도 | 409 에러 반환 (source: PROTO) |
| QA11 | 활성화 순서에서 더블팩을 단품 사이 배치 | 토스트 경고 표시, 배치 거부 (source: PROTO) |
| QA12 | 구매 레슨권 + 보상/보너스 레슨권 통합 순서 변경 | 모든 타입이 한 화면에서 정상 정렬 (source: DEV-MEETING) |
| QA13 | 순서 변경 후 뒤 레슨권 날짜 재계산 | 체인 구조에 따라 정확히 재계산 (source: DEV-MEETING) |
| QA14 | `?scrollTo=inactive` 파라미터로 진입 | 비활성 섹션으로 자동 스크롤 (source: PROTO) |

### 구독 보관 불가 구조 검증 (P0, source: DEV-MEETING)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA15 | 동일 언어 ACTIVE 존재 시 구독(BILLING) 결제 시도 | 구독 결제 옵션 미노출, 일괄결제만 표시 |
| QA16 | 일괄 결제 수강권 보관 2년 | 정상 보관 유지 (기간 제한 없음) |
| QA17 | 구독 결제로 구매한 수강권 상태 확인 | 결제 즉시 ACTIVE (INACTIVE 상태 불가) |

### 결제 방식 분기 (P0, source: DEV-MEETING)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA18 | 같은 언어 ACTIVE 레슨권 있는 상태에서 해당 언어 구매 | 일괄결제만 노출, 구독 옵션 미표시 |
| QA19 | 같은 언어 ACTIVE 레슨권 있는 상태에서 다른 언어 구매 | 구독/일괄 모두 노출 |
| QA20 | ACTIVE 레슨권 없는 상태에서 구매 | 모든 결제 방식 노출 |

### 결제 페이지 (P0)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA23 | 기존 회원 결제 페이지 진입 + 쿠폰 보유 | 최상단 쿠폰 할인 섹션 표시. 쿠폰 적용 언어는 기간연장 미적용, 쿠폰 미적용 언어만 기간연장 적용 (FR8-4) |
| QA24 | 기존 회원 결제 페이지 진입 + 쿠폰 미보유 | 기간연장 혜택만 표시 |
| QA25 | 신규 회원이 기존 회원 결제 URL 접근 | 403 NOT_EXISTING_USER 에러 (source: PROTO) |
| QA26 | iPad 번들 상품에 할인 쿠폰 적용 시도 | 쿠폰 적용 (최대 10만원 할인), 쿠폰 적용 시 기간연장 미적용 (FR8-5) |

### 홈 팝업 (P0)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA27 | D-25 시점 홈 진입 (최초) | report phase 팝업 표시, localStorage 기록 (source: PROTO) |
| QA28 | D-14 시점 홈 진입 (최초) | coupon-first phase 팝업 표시 (1회성) (source: PROTO) |
| QA29 | D-7 시점 홈 진입 (당일 재진입) | coupon-hard phase 이미 표시됨 → 미표시 (source: PROTO) |
| QA30 | report phase CTA 클릭 후 재진입 | report phase 팝업 미표시 (영구) (source: PROTO) |
| QA31 | 활성 수강권 없음 | 팝업 미표시 (source: PROTO) |
| QA32 | 활성 수강권 잔여일 26일 이상 | 팝업 미표시 (범위: 0~25일만) (source: PROTO) |
| QA33 | 보너스 포함 전체 종료일 기준 D-25 | 정규 수강권 만료보다 늦게 팝업 시작 (보너스 기간 반영) (source: DEV-MEETING) |

### 학습통계 (P1)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA34 | 활성 수강권 D-25 이하 | ReportView 표시 (실시간 데이터) (source: PROTO) |
| QA35 | 활성 수강권 D-26 이상 | PreReportView 표시 (source: PROTO) |
| QA36 | 활성 수강권 없음 | ReportListView + 결제 CTA (source: PROTO) |
| QA37 | 만료 수강권 리포트 상세 조회 | 과거 리포트 정상 표시 (sub_mapp 기반) (source: DEV-MEETING) |

### 연장레슨권 레거시 분기 (P0, source: DEV-MEETING)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA38 | 연장레슨권 보유 유저 - 마이포도 진입 | 레거시 마이포도 화면 표시 |
| QA39 | 연장레슨권 보유 유저 - 수강권 관리 진입 | 레거시 수강권 관리 화면 표시 |
| QA40 | 연장레슨권 미보유 유저 | 새 UI(레슨권 기반 3섹션) 표시 |

---

## Event Tracking

### 홈 팝업 이벤트 (source: PROTO)

| Event | Parameters | Trigger |
|-------|-----------|---------|
| POPUP_SHOWN | phase, daysRemaining | 팝업 표시 |
| POPUP_CTA_CLICK | phase, ctaTarget | CTA 버튼 클릭 |
| POPUP_DISMISS | phase | 배경 탭 또는 X 버튼 |

---

## Appendix

### Traceability Matrix (CST → FR 매핑)

| CST-ID | 관점 | 요약 | 처리 방향 | 관련 FR |
|--------|------|------|----------|---------|
| CST-001 | Experience | 수강권 관리 UI에 비활성(INACTIVE) 상태 개념 없음 | 3섹션(활성/비활성/만료) 개편 | FR11-1, FR11-2 |
| CST-002 | Experience | 홈 팝업 단일 구조 — 6단계 phase별 분기 없음 | 클라이언트 기반 6단계 팝업으로 완전 대체 | FR16-1~FR16-9 |
| CST-003 | Experience | 결제 페이지 기존 회원 프로모션 미지원 | 프로모션 배너/쿠폰 섹션 추가 | FR6-2, FR6-7, FR8 |
| CST-004 | Code | InvalidTicketDuplicate 예외 — getActiveTicket() 전면 수정 | SMART_TALK만 유지, 나머지 제거 + 래퍼/시그니처 변경 | FR1-1, FR1-3 |
| CST-005 | Code | DUPLICATE_SUBSCRIPTION 검증 차단 | SMART_TALK만 유지, 나머지 제거 | FR1-1 |
| CST-006 | Code | TicketStatus enum 미정의 | 5상태 enum 도입 (INACTIVE/ACTIVE/EXPIRED/DEPLETED/REFUNDED) | FR2-5 |
| CST-007 | Code | 기존 알림톡 3종과 신규 4종 중복 발송 위험 | 신규 시스템으로 완전 대체, 병행 기간 중복 방지 | FR17-5 |
| CST-008 | Policy | 약관 제15조 환불 — 복수 수강권 산정 기준 모호 | 개별 수강권 단위 환불, 누적결제액=해당 수강권만 | FR24-1, FR24-5 |
| CST-009 | Policy | 수강확인증 발급 시 수강권 선택 필요 | 수강권 선택 드롭다운 UI 추가 | FR26-1 |
| CST-010 | Policy | 구독(BILLING) 즉시 ACTIVE — 일괄결제만 허용 | 결제 페이지에서 ACTIVE 존재 시 구독 미노출 | FR2-6, FR6-6 |
| CST-011 | Policy | 카카오 알림톡 정보성/광고성 분류 미확정 | 기존 템플릿 재사용으로 이슈 없음 (PO 확인) | FR18-4 |

### Prototype-to-Brief Traceability Matrix

| Brief Sentence ID | Brief Text | Prototype Coverage | Primary FRs |
|-------------------|-----------|-------------------|-------------|
| BRIEF-1 | 동일 언어 수강권 중복 구매 가능하도록 시스템 제약 제거 | Full — purchase API, SMART_TALK 예외, 1회 제한 | FR1 |
| BRIEF-2 | 기존 회원 결제 페이지 신규 개발 (Deep Link 파라미터로 혜택 분기) | Full — 3단계 선택, promo 분기, 세그먼트, 폴백, 결제 방식 분기 | FR6, FR7, FR8 |
| BRIEF-3 | 수강권 보유 목록 UI 개선 (활성/비활성 상태 구분, 활성화 날짜, 만료 예정일 표시) | Full — 3섹션 구분, 레슨권 기반, 상세 뷰, 결제 이력, 연장레슨권 레거시 분기 | FR11, FR12 |
| BRIEF-4 | 수강권 활성화 기능 (고객이 원하는 시점에 활성화 가능) | Full — activate API, 더블팩 충돌 검증, 비활성 보관 (일괄결제만), 구독 즉시 ACTIVE | FR2, FR3 |
| BRIEF-7 | 리텐션 프로모션 타이밍별 자동 발송 | Refined — 백엔드 스케줄 D-25/D-14/D-7/H-12 (4회, 보너스 포함 end_date 기준) + 클라이언트 팝업 6단계 + 결제완료 알림 | FR16, FR17 |
| BRIEF-8 | 커뮤니케이션 채널 구현 | Refined — 인앱 홈 팝업(FR16) + 알림톡(FR18). 앱 푸시/SMS는 스코프 외 | FR16, FR18 |
| BRIEF-11 | 프로모션 랜딩 페이지 (선택사항) | Not implemented — 결제 페이지 직접 진입으로 대체 | N/A |
| BRIEF-12 | 환불 정책 (기존 환불 규정 동일 적용) | Partial — refund-convert 구현, 일반 환불은 carry-forward | FR24 |

### Prototype-Only Features (Beyond Brief)

| Feature | FRs | Rationale |
|---------|-----|-----------|
| 활성화 순서 변경 (드래그 앤 드롭, 구매+보상+보너스 통합) | FR15 | 복수 비활성 수강권 관리 편의 (source: DEV-MEETING 확장) |
| 세그먼트 기반 차등 할인 | FR8 | 고객 가치 기반 혜택 최적화 |
| 학습통계 리포트 (D-25 게이트, 실시간) | FR19 | 학습 성과 확인 → 재구매 동기 부여 |
| 마이포도 페이지 | FR23 | 주요 기능 허브 네비게이션 |
| 수강권 상세 뷰 (결제 이력) | FR12 | 투명한 결제/수강 정보 제공 |
| SMART_TALK 중복 구매 차단 | FR1-3 | 상품 특성상 중복 불필요 |
| 구독 보관 불가 구조 (일괄결제만 보관 가능) | FR2-6 | 구독은 즉시 ACTIVE → 동일 언어 중복구매 시 일괄결제만 허용하는 근거 (source: DEV-MEETING) |
| 결제 방식 분기 (같은 언어 일괄결제) | FR6-6 | 구독 중복 방지 (source: DEV-MEETING) |
| 연장레슨권 레거시 화면 분기 | FR11-6, FR23-5 | 하위 호환성 (source: DEV-MEETING) |
| additional_days GT_SUBSCRIBE 하드매핑 | FR27 | 기간연장 혜택 기술 매핑 (source: DEV-MEETING) |
| 프로모션 1회 제한 | FR1-4 | 프로모션 악용 방지 (source: MARKETING) |

### v3.8 Changes

| # | Decision | Impact | Source |
|---|----------|--------|--------|
| v3.8-1 | FR6: 별도 3단계 선택 결제 페이지 → 기존 결제 페이지 UI 활용 + 프로모션 배너 상단 표시 | FR6 전면 수정 | JP1 Comment |
| v3.8-2 | FR8-5: iPad 패키지 할인 쿠폰 미적용 → 적용 (최대 10만원 제한) | FR8-5, FR1-5 수정 | JP1 Comment |

### v3.7 Changes

| # | Decision | Impact | Source |
|---|----------|--------|--------|
| TOP-1 | 예약/합산/차감 규칙 스코프 아웃 | 현행 예약 시스템 유지 | PM 결정 |
| TOP-2 | FR1-5 타입별 중복 구매 허용 매트릭스 | 체험권 불허 포함 | PM 결정 |
| TOP-3+5 | FR2-7 비활성 수강권 청약 철회 정책 | 구매일 기준 + 프로모션 혜택 시 불가 | PM 결정 |
| TOP-6 | FR24-1 누적결제액=개별 수강권 결제액만, FR24-5 비활성 환불 | 환불 정책 명확화 | PM 결정 |
| TOP-9 | FR17-5 기존 3종 알림톡 폐기/이관 | ADR-005 참조 | PM 결정 |
| TOP-10 | FR17-3 재구매 판정 기준, FR17-6 다중 수강권 통합 발송 | 발송 기준 명확화 | PM 결정 |
| DEV-1 | 비활성 수강권 일시정지 불가 정책 | Domain Requirements 추가 | prd-policy-review |
| DEV-3 | FR24-4 혼합 결제 방식 환불 개별 적용 | 환불 정책 추가 | prd-policy-review |
| DEV-5 | FR18-9 채널별 발송 배분 운영 설정 | 운영 유연성 추가 | prd-policy-review |

### v3.2 Changes (Prototype Review)

| # | Decision | Impact | Source |
|---|----------|--------|--------|
| 19 | FR9 더블팩 확인 팝업 완전 삭제 | FR9 전체 삭제. 더블팩도 일반 구매와 동일 플로우 | v3.2 프로토타입 리뷰 |
| 20 | FR19 학습통계 3가지 상태 모델 | FR19-1~3 재정의 (NoLesson/Preparing/Ready). 24h 캐시 기준. 레슨 완료 API 응답으로 상태 전환 | v3.2 프로토타입 리뷰 |
| 21 | FR19 더블팩 리포트 언어별 분리 | FR19-8 추가. ENGLISH_JAPANESE → 영어탭 + 일본어탭 | v3.2 프로토타입 리뷰 |
| 22 | FR16 바텀시트 카피 전면 업데이트 | FR16-1~6 카피 변경. 개인 맞춤 혜택 톤. D-7부터 긴급 스타일(빨간색) | v3.2 프로토타입 리뷰 |
| 23 | FR16-5 D-1 환불 안내 문구 | "7일 이내 전액 환불 가능" 문구 추가. CTA: "할인 막차 타기" | v3.2 프로토타입 리뷰 |

### v3.1 Changes

| # | Decision | Impact | Source |
|---|----------|--------|--------|
| 16 | FR9/FR10 (투카드 UI/환불-변환) 삭제 | FR9 간소화, FR10 삭제, Journey 2 간소화, QA4/QA5 삭제, NFR11 삭제, refund-convert API 삭제 | v3.1 |
| 17 | 학습통계 리포트 콘텐츠 = 기존 학습통계 화면 활용 | FR19-7 추가 (게이팅만 신규, 콘텐츠는 기존) | prototype reference |
| 18 | Phase 1 단일화 | Product Scope + FR 섹션 통합 | v3.1 |

### Developer Meeting Decisions (v3.0)

| # | Decision | Impact | Source |
|---|----------|--------|--------|
| 1 | 홀딩(FR13/FR14) 삭제 | FR/Journey/QA 제거, 상태 HELD 제거 | DEV-MEETING |
| 2 | 구독 보관 불가 구조 명확화 + 일괄결제만 보관 가능 (무제한) | FR2-6 수정 | DEV-MEETING |
| 3 | 만료 기준 = 보너스 포함 전체 종료일 | FR16-8, FR17-1 수정, Domain Requirements 추가 | DEV-MEETING |
| 4 | 레슨권 기반 표시 (마이포도플랜) | FR11-1, FR23-2 수정 | DEV-MEETING |
| 5 | 순서 변경: 구매+보상+보너스 통합 | FR15-5 추가 | DEV-MEETING |
| 6 | 같은 언어 ACTIVE 시 일괄결제만 | FR6-6 추가 | DEV-MEETING |
| 7 | D-14 쿠폰: 크론 날짜 기준 end_date | FR8-3, Domain Requirements 수정 | DEV-MEETING |
| 8 | 쿠폰 지급 시 결제창 최상단 섹션 | FR7-5 추가 | DEV-MEETING |
| 9 | additional_days GT_SUBSCRIBE 하드매핑 | FR27 추가 | DEV-MEETING |
| 10 | 연장레슨권 레거시 화면 분기 | FR11-6, FR23-5 추가 | DEV-MEETING |
| 11 | 학습통계 실시간 우선 + sub_mapp 과거 조회 | FR19-4, FR19-6, NFR6 수정 | DEV-MEETING |
| 12 | 프로모션 1회 제한 | FR1-4 추가 | MARKETING |
| 13 | 레슨권 체인 구조 명시 (N개월=N티켓) | Domain Requirements 추가 | DEV-MEETING |
| 14 | 보너스 선소진 → 스코프 외 | Scope 명시 | DEV-MEETING |
| 15 | 해지유도 페이지 → 스코프 외 | Scope 명시 | DEV-MEETING |

---

### 텍스트 와이어프레임

> 모든 화면은 모바일 기준 max-width 420px. 프로토타입(React+MSW)에서 파생되었으며, 실제 구현은 Flutter 앱으로 변환됨.
> 디자인 토큰: Primary Green `#C5F467` / Dark `#1A1A1A` / Purple `#7C3AED` / Red `#DC2626` / Amber `#F59E0B`

---

### W1. 홈 화면 (HomePage, `/home`) — FR16

```
┌─────────────────────────────────────────┐
│  포도∞스피킹              [잔여수강권] [구매] │  ← 상단 고정 헤더
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  프로모션 배너 (그린 그라데이션)        │ │
│ │  "기존 회원 전용 특별 혜택"             │ │
│ │                          [썸네일]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  (다크 카드)                          │ │
│ │  "안녕하세요, {이름}님!"              │ │
│ │  "오늘도 포도와 함께 성장해요"          │ │
│ │         (마스코트 80px)               │ │
│ │  ┌─────────────────────────────┐    │ │
│ │  │      예약하기 (Green CTA)        │    │ │
│ │  └─────────────────────────────┘    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  레슨 준비                               │
│ ┌──────────┐┌──────────┐┌──────────┐   │
│ │레벨테스트  ││학습가이드  ││발음학습북  │   │
│ └──────────┘└──────────┘└──────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  홈    레슨    예약    마이포도            │  ← 하단 고정 네비게이션
└─────────────────────────────────────────┘
```

#### W1-P. 리텐션 바텀시트 팝업 (6단계 Phase별) — FR16-1~FR16-9

```
┌─────────────────────────────────────────┐
│                                         │
│         (반투명 다크 오버레이)              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                              [X]   │ │  ← X 닫기 버튼
│ │                                     │ │
│ │              (이모지)                │ │
│ │                                     │ │
│ │    "{이름}님의 {언어} 수강권이          │ │  ← 타이틀 (17px bold)
│ │     {D}일 남았어요."                  │ │     D-7~ : 빨간 폰트
│ │                                     │ │
│ │    "열심히 쌓은 {언어} 실력을           │ │  ← 서브타이틀 (14px gray)
│ │     이어가실 수 있게..."               │ │
│ │                                     │ │
│ │  ┌─────────────────────────────┐    │ │
│ │  │    {Phase별 CTA 텍스트}          │    │ │  ← CTA 버튼
│ │  └─────────────────────────────┘    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Phase별 콘텐츠:
┌──────────────┬────────────────────────────────────────────────┬──────────────────────┬─────────┐
│ Phase        │ 타이틀 + 서브타이틀                                │ CTA 텍스트            │ CTA 색상 │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ report       │ "포도와 함께한 시간 {N}일!"                        │ "{언어} 리포트         │ Green   │
│ D-25~D-15    │ + "{이름}님과 함께한 시간을 확인해보세요."              │  보러가기"            │ #C5F467 │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ coupon-first │ "{이름}님의 {언어} 수강권이 14일 남았어요."           │ "나만의 할인가         │ Dark    │
│ D-14         │ + "최대 할인 쿠폰을 쏙 넣어드렸어요!"                 │  확인하기"            │ #1A1A1A │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ coupon-soft  │ "{이름}님의 {언어} 수강권이 {D}일 남았어요."          │ "나만의 할인가         │ Dark    │
│ D-13~D-10   │ + "쏙 넣어드린 최대 할인쿠폰을 놓치지마세요!"           │  확인하기"            │ #1A1A1A │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ coupon-hard  │ "포도가 함께 쌓은 외국어 실력을 잃지 말아주세요."       │ "혜택 만료 전          │ Red     │
│ D-7~D-2     │ + "맞춤 쿠폰이 {D}일이 지나면 사라져요." 빨간폰트     │  확인하기"            │ #DC2626 │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ coupon-d1    │ "내일이 지나면 {언어} 수강권이 끝나요." 빨간폰트      │ "할인 막차 타기"       │ Red     │
│ D-1          │ + "7일 이내 전액 환불 가능해요."                     │                      │ #DC2626 │
├──────────────┼────────────────────────────────────────────────┼──────────────────────┼─────────┤
│ coupon-d0    │ "오늘 자정 수강권과 혜택이 모두 사라져요" 빨간폰트     │ "오늘 할인 종료"       │ Red     │
│ D-0          │ + "특별 할인은 오늘이 마지막이에요."                   │                      │ #DC2626 │
└──────────────┴────────────────────────────────────────────────┴──────────────────────┴─────────┘
```

---

### W2. 마이포도 페이지 (MyPodoPage, `/mypage`) — FR23

```
┌─────────────────────────────────────────┐
│  마이 포도                               │  ← h1 (20px bold)
├─────────────────────────────────────────┤
│                                         │
│  (56px 아바타)  홍길동                    │
│                   hong@email.com    >   │
│                                         │
├─────────────────────────────────────────┤
│  레슨권 및 결제                    (그룹)  │
│─────────────────────────────────────────│
│  마이 포도 플랜          2개 이용중 (초록) > │  ← FR23-2 (레슨권 기반)
│─────────────────────────────────────────│
│  학습통계  NEW                         > │  ← FR23-3 (NEW 뱃지)
│─────────────────────────────────────────│
│  마이쿠폰                    1개 (초록) > │
│─────────────────────────────────────────│
│  결제수단                  현대카드 (초록) > │
├─────────────────────────────────────────┤
│  문의                          (그룹)  │
│─────────────────────────────────────────│
│  고객센터                              > │
├─────────────────────────────────────────┤
│  설정                          (그룹)  │
│─────────────────────────────────────────│
│  공지사항                              > │
│─────────────────────────────────────────│
│  알림설정                              > │
│─────────────────────────────────────────│
│  버전확인                        2.0.9 > │
│─────────────────────────────────────────│
│  로그아웃                              > │
│                                         │
├─────────────────────────────────────────┤
│ 홈  레슨  예약  AI학습  마이포도           │  ← 하단 고정, 마이포도 활성(보라)
└─────────────────────────────────────────┘

※ 연장레슨권 보유 시: 전체 화면이 레거시 마이포도로 대체 (FR23-5)
```

---

### W3. 수강권 관리 페이지 (TicketManagementPage, `/tickets`) — FR11, FR12, FR15

#### W3-A. 메인 목록 뷰

```
┌─────────────────────────────────────────┐
│  마이 포도 플랜                          │  ← h1 (20px bold)
├─────────────────────────────────────────┤
│                                         │
│  * 사용중인 포도 플랜                     │  ← 활성 섹션 (FR11-1)
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 영어 무제한 레슨권 6개월    [ACTIVE]  │ │  ← 상태 뱃지 (초록)
│  │                                     │ │
│  │ 3/6개월 진행중              D-45 남음 │ │
│  │ ████████░░░░░░░░░░░░░░░░░░          │ │  ← 진행 프로그레스 바
│  │ 2026.01.01          2026.07.01      │ │
│  │                                     │ │
│  │ 이번 달 수업: 8회 / 무제한            │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← DEPLETED도 활성 섹션
│  │ 일본어 회차 레슨권 3개월  [DEPLETED]  │ │     (기간 남아있으므로)
│  │ 0회 남음 / 기간: D-12 남음            │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  * 보관중인 포도 플랜     [활성화 순서 변경] │  ← 비활성 섹션 (FR11-2)
│                           (2개 이상 시)  │     순서변경 버튼 (FR15)
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 구매(PURCHASE) 카드
│  │ (1) 영어 무제한 레슨권 12개월          │ │     풀사이즈 흰색
│  │    INACTIVE          일괄결제         │ │
│  │    기간: 12개월                       │ │
│  │  ┌───────────────────────────────┐  │ │
│  │  │ i 현재 영어 수강권 사용중.         │  │ │  ← 같은 언어 활성 시
│  │  │   자동으로 활성화됩니다.           │  │ │     초록 안내 박스
│  │  └───────────────────────────────┘  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 보너스(BONUS) 카드
│  │ 무료 ──────── [프로모션]              │ │     노란 그라데이션
│  │    프로모션으로 받은 무료 이용권이에요.  │ │     무료 리본 + 뱃지
│  │    영어 · 1일                        │ │
│  │    지급일: 2026.02.01                │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │  ← 보상(REWARD) 그룹 카드
│  │ 보상 수강권 총 3건                   │ │     점선 테두리, 슬레이트 배경
│  │───────────────────────────────────  │ │     컴팩트 행
│  │ · 영어 1일 · CS 보상 · 02.10        │ │
│  │ · 영어 1일 · CS 보상 · 02.12        │ │
│  │ · 일본어 1일 · CS 보상 · 02.15      │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 더블팩 카드 (충돌 시)
│  │ (2) 영어&일본어 더블팩 6개월           │ │
│  │    INACTIVE                         │ │
│  │  ┌───────────────────────────────┐  │ │
│  │  │ ! 현재 사용중인 수강권 플랜이      │  │ │  ← 노란 경고 박스
│  │  │   모두 종료되면 자동으로          │  │ │
│  │  │   활성화됩니다.         [i]      │  │ │  ← 툴팁 버튼
│  │  └───────────────────────────────┘  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 더블팩 (충돌 없을 때)
│  │ (3) 영어&일본어 더블팩 3개월           │ │
│  │    INACTIVE                         │ │
│  │  ┌───────────────────────────────┐  │ │
│  │  │ i 지금 바로 활성화할 수 있어요.    │  │ │  ← 파란 안내 박스
│  │  │           [활성화]                │  │ │     + 초록 활성화 버튼
│  │  └───────────────────────────────┘  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  * 종료된 포도 플랜                      │  ← 만료 섹션 (FR11-3)
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 반투명 (opacity 0.7)
│  │ 영어 무제한 3개월       [EXPIRED]    │ │
│  │ 2025.09.01 ~ 2025.12.01  수업 24회  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 일본어 회차 6개월       [REFUNDED]   │ │
│  │ 2025.06.01 ~ 2025.12.01  수업 12회  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────────┐│
│ │        레슨권 구매하기 (Green)          ││  ← 하단 고정 버튼
│ └───────────────────────────────────────┘│
└─────────────────────────────────────────┘

※ 연장레슨권 보유 시: 전체 화면이 레거시 수강권 관리로 대체 (FR11-6)
※ ?scrollTo=inactive 파라미터: 비활성 섹션으로 자동 스크롤 (FR11-4)
```

#### W3-B. 수강권 상세 뷰 (Detail View) — FR12

```
┌─────────────────────────────────────────┐
│  < (뒤로)                               │
├─────────────────────────────────────────┤
│                                         │
│        ┌──────────────────┐             │
│        │  (수강권 이미지)    │             │  ← 120x80px, 보라 그라데이션
│        │   -6도 회전        │             │     살짝 기울어진 카드
│        └──────────────────┘             │
│                                         │
│       영어 무제한 레슨권 6개월             │  ← 20px bold, 가운데 정렬
│     2026.01.01 ~ 2026.07.01             │  ← 14px gray
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │       수강 확인증 발급                 │ │  ← 아웃라인 버튼 (FR26)
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 레슨권 상세정보                       │ │
│  │─────────────────────────────────────│ │
│  │ 레슨명          영어 무제한 6개월     │ │
│  │ 레슨기간        2026.01 ~ 2026.07   │ │
│  │ 레슨횟수        무제한               │ │
│  │ 레슨시간        25분                 │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 결제 정보                            │ │
│  │─────────────────────────────────────│ │
│  │ 결제수단        현대카드              │ │
│  │ 결제일시        2026.01.01 14:30     │ │
│  │ 결제금액        W594,000             │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 다월 수강권만 표시
│  │ 월별 이용 현황                        │ │     (FR12-2)
│  │─────────────────────────────────────│ │
│  │ ┌───────────────────────────────┐   │ │
│  │ │ 1월 (완료)  수업 12회          │   │ │  ← 완료 월: 뮤트 스타일
│  │ └───────────────────────────────┘   │ │
│  │ ┌───────────────────────────────┐   │ │
│  │ │ 2월 (진행중) 수업 8회          │   │ │  ← 활성 월: 초록 테두리
│  │ └───────────────────────────────┘   │ │
│  │ ┌───────────────────────────────┐   │ │
│  │ │ 3월 (예정)                     │   │ │  ← 예정 월: 기본 스타일
│  │ └───────────────────────────────┘   │ │
│  │         ... (4~6월)                 │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### W3-C. 활성화 순서 변경 팝업 — FR15

```
┌─────────────────────────────────────────┐
│          (반투명 다크 오버레이)             │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 그라데이션 헤더                       │ │
│  │  활성화 순서 변경                     │ │
│  │  "드래그하여 순서를 변경하세요"         │ │
│  │                                     │ │
│  │  ┌───────────────────────────────┐  │ │  ← 더블팩 있을 때만
│  │  │ ! 더블팩은 맨 앞 또는 맨 뒤에만   │  │ │     노란 경고 박스
│  │  │   배치할 수 있습니다.            │  │ │
│  │  └───────────────────────────────┘  │ │
│  │─────────────────────────────────────│ │
│  │                                     │ │
│  │  │ (타임라인 세로선 초록→회색)        │ │
│  │  │                                 │ │
│  │  (1) 영어 무제한 12개월    드래그     │ │  ← 드래그 핸들
│  │  │   PURCHASE · 비활성               │ │
│  │  │                                 │ │
│  │  (2) 일본어 회차 6개월     드래그     │ │
│  │  │   PURCHASE · 비활성               │ │
│  │  │                                 │ │
│  │  (3) 영어 1일 (보상)       드래그     │ │  ← 보상권 (파란 뱃지)
│  │  │   REWARD · CS 보상                │ │
│  │  │                                 │ │
│  │  (4) 영어 1일 (프로모션)    드래그     │ │  ← 보너스 (노란 뱃지)
│  │  │   BONUS · 무료                    │ │
│  │  │                                 │ │
│  │  (5) 영어&일본어 더블팩 6개월 드래그    │ │
│  │     PURCHASE · 비활성                │ │
│  │                                     │ │
│  │  ┌─────────────────────────────┐    │ │
│  │  │    순서 변경 완료 (Green)         │    │ │
│  │  └─────────────────────────────┘    │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

※ 더블팩을 단품 사이로 이동 시: 토스트 "더블팩은 단일 언어 수강권 사이에 배치할 수 없어요" (FR15-3~4)
※ 순서 변경 확정 시 체인 구조에 따라 뒤 레슨권 전체 날짜 재계산 (FR15-6)
```

#### W3-D. 더블팩 충돌 툴팁 (FR11-5)

```
┌─────────────────────────────────────────┐
│  ! 현재 사용중인 수강권 플랜이 모두        │
│    종료되면 자동으로 활성화됩니다.  [i]    │
│                                         │
│    ┌─────────────────────────────────┐  │  ← i 탭 시 펼침
│    │ "영어 혹은 일본어 중 한 개라도     │  │
│    │  이용중이라면 더블팩 이용이         │  │
│    │  불가해요."                       │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### W4. 기존 회원 결제 페이지 (ExistingUserPaymentPage, `/payment/existing-user`) — FR6, FR8

#### W4-A. 결제 메인 폼

```
┌─────────────────────────────────────────┐
│           레슨권 구매                     │  ← 18px bold, 가운데 정렬
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 쿠폰 보유 시만 표시
│  │ 세그먼트 프로모션 배너                  │ │     (FR6-7, FR8)
│  │ (다크 #1A1A1A 카드)                  │ │
│  │                                     │ │
│  │ ┌──────────┐                        │ │
│  │ │ {이름}님  │ (초록 칩)               │ │
│  │ └──────────┘                        │ │
│  │                                     │ │
│  │  영어 30% 할인쿠폰                   │ │  ← 20px bold, 초록 텍스트
│  │  영어 수강권 전용 · ~2026.03.15       │ │
│  │  ─────────────────────────────────  │ │
│  │  기간연장 혜택                        │ │
│  │  "재구매 시 추가 무료 수강일 제공"      │ │
│  │  3개월 → +14일                      │ │
│  │  6개월 → +30일                      │ │
│  │  12개월 → +60일                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ── STEP 1: 언어 선택 ──────────────────  │  ← FR6-1
│  "정복하고 싶은 언어를 선택하세요."         │
│                                         │
│  ┌──────────┐┌──────────┐┌──────────┐  │
│  │  영어 [v] ││  일본어   ││ 영어&일본어│  │  ← 선택됨: 초록 테두리
│  └──────────┘└──────────┘└──────────┘  │
│                                         │
│  ── STEP 2: 상품 타입 선택 ─────────────  │  ← FR6-2
│  "원하시는 상품 구성을 선택하세요."         │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 무제한 레슨권 [v]           [BEST]   │ │  ← BEST 핑크 뱃지
│  │   (초록 bg)                          │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 라이트 레슨권                         │ │
│  │   (노란 bg)                          │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │  ← iPad 상품 있을 때만
│  │ iPad 패키지                          │ │
│  │   (인디고 bg)                        │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ── STEP 3: 기간 선택 ─────────────────  │  ← FR6-3
│  "기간을 선택하세요."                     │
│                                         │
│  ┌──────────┐┌──────────┐┌──────────┐  │
│  │          ││  [인기]   ││  [최저가]  │  │
│  │  3개월   ││  6개월 [v]││  12개월   │  │
│  └──────────┘└──────────┘└──────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 상품 상세 패널 (FR6-5)
│  │ [무제한] 영어 무제한 레슨권 6개월      │ │
│  │                                     │ │
│  │ v 매일 영어로 말할 수 있는 환경        │ │
│  │ v 원어민 튜터 1:1 수업 25분           │ │
│  │ v AI 학습 리포트 제공                 │ │
│  │ v 수업 녹음 파일 제공                 │ │
│  │                                     │ │
│  │  ┌───────────────────────────────┐  │ │  ← 쿠폰 적용 시
│  │  │ 쿠폰 적용                        │  │ │
│  │  │ "영어 30% 할인이 적용됩니다"      │  │ │
│  │  └───────────────────────────────┘  │ │
│  │                                     │ │
│  │  ── 한 번에 결제 ──────────────────  │ │  ← 일괄결제 카드
│  │  ┌───────────────────────────────┐  │ │
│  │  │          절약 W120,000        │  │ │
│  │  │ 일시불          [쿠폰 적용]    │  │ │
│  │  │ "12개월 무이자 할부 가능"       │  │ │
│  │  │ W990,000 (취소선)             │  │ │
│  │  │ -30%  W115,500 /월            │  │ │  ← 할인율 빨강
│  │  │                               │  │ │
│  │  │ ┌───────────────────────┐     │  │ │
│  │  │ │   구매하기 (Green)          │     │  │ │
│  │  │ └───────────────────────┘     │  │ │
│  │  └───────────────────────────────┘  │ │
│  │                                     │ │
│  │  ── 월별 결제 ────────────────────  │ │  ← 구독결제 카드
│  │  ┌───────────────────────────────┐  │ │     (FR6-6: 같은 언어
│  │  │ 월별 정기결제                   │  │ │      ACTIVE 시 미표시)
│  │  │ W165,000 /월                  │  │ │
│  │  │                               │  │ │
│  │  │ ┌───────────────────────┐     │  │ │
│  │  │ │   구매하기 (Purple)         │     │  │ │
│  │  │ └───────────────────────┘     │  │ │
│  │  └───────────────────────────────┘  │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

※ 같은 언어 ACTIVE 존재 시: 구독결제(월별 결제) 카드 미표시, 일괄결제만 노출 (FR6-6)
※ iPad 번들 상품: 할인 쿠폰 적용 (최대 10만원), 쿠폰 적용 시 기간연장 미적용 (FR8-5)
※ 쿠폰 미보유 시: 세그먼트 프로모션 배너 미표시, 기간연장 혜택만 표시 (FR6-7)
```

#### W4-B. 구매 완료 화면

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           ┌──────┐                      │
│           │  [v] │  (64px 초록 원)        │
│           └──────┘                      │
│                                         │
│            구매 완료                      │  ← h1
│                                         │
│   "새 수강권이 비활성 상태로 보관되었습니다.  │
│    현재 수강권 만료 후 활성화하세요."        │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 영어 무제한 레슨권 6개월              │ │  ← 요약 카드
│  │ 상태: INACTIVE                      │ │
│  │ 구매일: 2026.02.15                  │ │
│  │ ┌──────────────────┐               │ │
│  │ │ 30% 할인 적용      │ (초록 뱃지)    │ │  ← 혜택 적용 시
│  │ └──────────────────┘               │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │   마이 포도 플랜으로 이동 (Green)       │ │  ← CTA → /tickets
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### W5. 학습통계 페이지 (LearningStatsPage, `/learning-stats`) — FR19

#### W5-A. PreReportView (D-26 이상, 리포트 미오픈) — FR19 진입 전 상태

```
┌─────────────────────────────────────────┐
│  < (뒤로)    학습통계                     │
├─────────────────────────────────────────┤
│                                         │
│ [영어 탭 [v]] [일본어 탭]                  │  ← 멀티 탭 (2개+ 활성 시)
│                                         │
│           ┌──────────┐                  │
│           │  마스코트  │  (120px 원)       │  ← 초록 그라데이션 bg
│           └──────────┘                  │
│                                         │
│        리포트가 D-N일 후 열립니다           │  ← h2
│                                         │
│  "포도가 {이름}님의 학습 여정을 분석하고     │
│   있어요. 조금만 기다려주세요!"              │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 현재까지 수업: 15회                   │ │  ← 현재 진행 통계
│  │ 사용량: 62%                          │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### W5-B. NoLessonView (레슨 0회) — FR19-1

```
┌─────────────────────────────────────────┐
│  < (뒤로)    학습통계                     │
├─────────────────────────────────────────┤
│                                         │
│           ┌──────────┐                  │
│           │          │  (120px 원)       │  ← 회색 bg
│           └──────────┘                  │
│                                         │
│        포도를 시작해볼까요?                │  ← h2
│                                         │
│  "첫 레슨을 완료하면 {이름}님만의           │
│   학습통계가 시작됩니다"                   │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 현재 수강권: 영어 무제한 6개월         │ │
│  │ 기간: 2026.01.01 ~ 2026.07.01      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │       레슨 시작하기 (Green)            │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### W5-C. PreparingView (레슨 완료 후 24h 미경과) — FR19-2

```
┌─────────────────────────────────────────┐
│  < (뒤로)    학습통계                     │
├─────────────────────────────────────────┤
│                                         │
│           ┌──────────┐                  │
│           │  분석중   │  (120px 원)       │  ← 초록 그라데이션 bg
│           └──────────┘                  │
│                                         │
│          리포트 분석 중                   │  ← h2
│                                         │
│  "포도가 열심히 {이름}님의 레슨을           │
│   분석하고 있어요. 조금만 기다려주세요!"      │
│                                         │
│        ┌──────────────┐                 │
│        │  약 18시간    │                 │  ← 32px 초록 텍스트
│        │  (예상 완료)  │                 │     카운트다운
│        └──────────────┘                 │
│                                         │
└─────────────────────────────────────────┘
```

#### W5-D. ReportView (리포트 준비 완료, D-25 이하) — FR19-3

```
┌─────────────────────────────────────────┐
│  < (뒤로)    학습통계                     │
├─────────────────────────────────────────┤
│                                         │
│ [영어 탭 [v]] [일본어 탭]                  │  ← 멀티 탭 (FR19-8)
│                                         │
│  2026.01.01 ~ 2026.07.01               │  ← 기간 (회색)
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 보라 그라데이션 헤더                   │ │  ← #7C3AED → #A78BFA
│  │                                     │ │
│  │  "45일간의 학습 여정"                 │ │
│  │  "{이름}님의 성장 리포트"             │ │  ← h2 (흰색)
│  │                                     │ │
│  │ ┌────────────┐ ┌────────────┐      │ │  ← 반투명 흰색 카드
│  │ │ 총 레슨 횟수  │ │누적 학습 시간│      │ │
│  │ │    32회     │ │   13.3시간  │      │ │
│  │ └────────────┘ └────────────┘      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← StatCard #1
│  │ 가장 많이 사용한 표현                  │ │
│  │─────────────────────────────────────│ │
│  │ "How about ~"  15회                 │ │
│  │ "I think ~"    12회                 │ │
│  │ "Could you ~"   9회                 │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← StatCard #2
│  │ 향상된 발음                           │ │
│  │─────────────────────────────────────│ │
│  │ R/L 발음 정확도  +15%               │ │
│  │ 전체 발음 점수   82점                │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← StatCard #3
│  │ 선호 주제                            │ │
│  │─────────────────────────────────────│ │
│  │ 비즈니스 영어     40%               │ │
│  │ 일상 대화        35%                │ │
│  │ 여행 회화        25%                │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ── 이전 학습 기록 ─────────────────────  │  ← 만료 리포트 있을 때
│  ┌─────────────────────────────────────┐ │     (FR19-5)
│  │ 나만의 영어 학습 성과                  │ │
│  │ 2025.09 ~ 2025.12                 > │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘

※ 더블팩(ENGLISH_JAPANESE): 영어/일본어 각 별도 탭으로 분리 (FR19-8)
※ 탭 순서: 더 많이 수강한 언어가 먼저 (FR19-8)
※ 리포트 콘텐츠: 기존 학습통계 화면 임베딩/라우팅 (FR19-3)
```

#### W5-E. ReportListView (활성 수강권 없음) — FR19-4

```
┌─────────────────────────────────────────┐
│  < (뒤로)    학습통계                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 나만의 영어 학습 성과                  │ │  ← 과거 리포트 카드 1
│  │ 2025.09 ~ 2025.12                 > │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 나만의 일본어 학습 성과                │ │  ← 과거 리포트 카드 2
│  │ 2025.06 ~ 2025.12                 > │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │  ← 결제 CTA 카드
│  │ 다음 성장 리포트                      │ │     (초록 그라데이션 테두리)
│  │                                     │ │
│  │ "새로운 학습 여정을 시작하고            │ │
│  │  나만의 성장 리포트를 받아보세요"        │ │
│  │                                     │ │
│  │ ┌─────────────────────────────┐     │ │
│  │ │  수강권 둘러보기 (Dark+Green)     │     │ │  ← → /payment/existing-user
│  │ └─────────────────────────────┘     │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### W6. 수강확인증 발급 (수강권 선택) — FR26

```
┌─────────────────────────────────────────┐
│  수강 확인증 발급                         │
├─────────────────────────────────────────┤
│                                         │
│  "어느 수강권의 수강확인증을               │
│   발급하시겠습니까?"                      │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ ( ) 영어 무제한 6개월                 │ │  ← 라디오 선택
│  │   2026.01.01 ~ 2026.07.01           │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ ( ) 영어 무제한 3개월                 │ │
│  │   2025.09.01 ~ 2025.12.01 (만료)    │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ ( ) 일본어 회차 6개월                 │ │
│  │   2025.06.01 ~ 2025.12.01 (만료)    │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │       발급하기                         │ │  ← 환불불가 경고 없이
│  └─────────────────────────────────────┘ │     바로 발급 (FR26-2)
│                                         │
└─────────────────────────────────────────┘

※ 수강권 1개 보유 시: 선택 UI 없이 바로 발급
※ 환불불가 경고 모달 없음 — 환불불가 검증은 환불 시점에 서버에서 처리 (FR26-2)
```

---

### W7. 알림톡 템플릿 (5종) — FR18

```
┌─────────────────────────────────────────┐
│ 카카오 알림톡                             │
├─────────────────────────────────────────┤
│                                         │
│ ── D-25 (pd_lrn_ticket_report_d25) ──  │
│ [기수강생] 수강권 만료자 리포트 안내        │
│ "#{studentName}님, #{meetingMonth}개월    │
│  동안 #{serviceUsingDate}일 학습했어요!"   │
│ [일기장 몰래보기] → 홈 탭                 │
│                                         │
│ ── D-14 (pd_lrn_coupon_expire_d14) ──  │
│ [기수강생] 수강권 만료자 쿠폰 안내 -1      │
│ "VIP 전용 할인 쿠폰이 도착했습니다!        │
│  #{coupon_use_deadline}까지 사용 가능"    │
│ [마이쿠폰 바로가기] → 쿠폰함              │
│                                         │
│ ── D-7 (pd_lrn_ticket_report_d7) ──    │
│ [기수강생] 수강권 만료자 리포트 안내        │
│ "#{studentName}님의 외국어 성장을          │
│  확인해보세요!"                           │
│ [내 외국어결산 보기] → 홈 탭              │
│                                         │
│ ── H-12 (pd_lrn_coupon_expire_h12) ──  │
│ [기수강생] 수강권 만료자 쿠폰 안내 -2      │
│ "쿠폰이 곧 만료됩니다!                    │
│  #{coupon_use_deadline} 마감"            │
│ [마이쿠폰 바로가기] → 쿠폰함              │
│                                         │
│ ── 결제완료 (pd_lrn_sub_pay_dup) ──     │
│ [기수강생] 중복 레슨권 결제 완료           │
│ "#{studentName}님, #{ClassPackageName}   │
│  결제가 완료되었습니다.                    │
│  기간: #{Lessonterm}                     │
│  금액: #{ClassPackagePrice}              │
│  시작: #{TicketStartDate}               │
│  종료: #{TicketExpireDate}"              │
│ [내 포도플랜 보러가기] → 마이포도 플랜      │
│                                         │
└─────────────────────────────────────────┘

발송 조건:
- D-25/D-7: 활성 레슨권 만료 대상자 전원 (19시)
- D-14/H-12: 만료자 전용 쿠폰 미사용 유저만 (FR18-8)
- 결제완료: 즉시 발송
- 리텐션 쿠폰 사용 유저: 이후 알림톡 미발송 (FR18-7)
```

---

### W8. 화면 네비게이션 맵 (전체 플로우)

```
                    ┌──────────┐
                    │  앱 시작   │
                    └────┬─────┘
                         │
              연장레슨권 보유?
              ┌──YES──┤──NO──┐
              │              │
        레거시 화면       신규 화면
              │              │
              v              v
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐     │
│  │   홈 (W1)   │───→│ 학습통계    │    │  마이포도   │     │
│  │            │    │  (W5)      │    │  (W2)      │     │
│  │ 팝업(W1-P) │    └────────────┘    └──────┬─────┘     │
│  └──────┬─────┘                             │           │
│         │                                    │           │
│    CTA 클릭                          "마이 포도 플랜"     │
│         │                                    │           │
│         v                                    v           │
│  ┌────────────────┐              ┌────────────────┐     │
│  │ 기존 회원 결제    │              │  수강권 관리     │     │
│  │ (W4-A)          │─── 구매 ──→│  (W3-A)         │     │
│  │                │   완료      │                │     │
│  │                │  (W4-B)     │ ┌────────────┐ │     │
│  └────────────────┘             │ │ 상세 뷰     │ │     │
│                                  │ │ (W3-B)     │ │     │
│         알림톡 (W7)               │ └────────────┘ │     │
│         D-25/D-14/D-7/H-12      │                │     │
│              │                   │ ┌────────────┐ │     │
│              │ 딥링크             │ │ 순서 변경    │ │     │
│              v                   │ │ (W3-C)     │ │     │
│         홈 탭 / 쿠폰함            │ └────────────┘ │     │
│                                  │                │     │
│                                  │ ┌────────────┐ │     │
│                                  │ │ 수강확인증   │ │     │
│                                  │ │ (W6)       │ │     │
│                                  │ └────────────┘ │     │
│                                  └────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘

하단 네비게이션: 홈 <-> 레슨 <-> 예약 <-> (AI학습) <-> 마이포도
```
