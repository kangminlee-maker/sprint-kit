---
scope_id: "expired-user-promotion-mkt-20260319-001"
version: "1.0"
status: "compiled"
created_at: "2026-03-19T04:29:20Z"
compiled_at: "2026-03-19T06:15:00Z"
projectInfo:
  name: "만료자 대상 프로모션 강화"
  service_type: "EdTech — 1:1 영어회화 플랫폼"
  domain_entities:
    - "수강권 (Ticket): INACTIVE/ACTIVE/EXPIRED/DEPLETED/REFUNDED"
    - "쿠폰 (Coupon): ACTIVE/USED/HIDDEN/DELETED"
    - "세그먼트 (WelcomeBackPromotion): LOW/MEDIUM/null"
  target_stack: "Next.js 15, React 19, Tailwind CSS v3, Spring Boot (백엔드)"
inputDocuments:
  brief: { path: "inputs/brief.md" }
  align_packet: { path: "build/align-packet.md" }
  draft_packet: { path: "build/draft-packet.md" }
  build_spec: { path: "build/build-spec.md" }
  validation_plan: { path: "build/validation-plan.md" }
constraintSummary:
  total: 3
  inject: 3
  defer: 0
  override: 0
  invalidated: 0
changeLog:
  - { event: "scope.created", date: "2026-03-19", summary: "scope 생성 및 grounding 완료" }
  - { event: "align.locked", date: "2026-03-19", summary: "방향 확정 — 손실 회피 + 가격 강조 메시지로 팝업 교체" }
  - { event: "surface.confirmed", date: "2026-03-19", summary: "풀페이지 팝업 mockup 확정 (수정 0회)" }
  - { event: "compile.completed", date: "2026-03-19", summary: "compile 완료 — violation 0, warning 2 (L3)" }
---

# Product Requirements Document — 만료자 대상 프로모션 강화 및 메시지 테스트를 통한 rebuy 개선

## Brownfield Sources

| 소스 | 유형 | 핵심 발견 |
|------|------|----------|
| podo-backend | github-tarball | MarketingController(GET /welcomeback-promotion) + WelcomeBackPromotionDto로 세그먼트 판별. marketing-config.yml에서 팝업 콘텐츠 관리 |
| podo-app | github-tarball | 프론트엔드 팝업 렌더링. 서버에서 내려받은 콘텐츠를 풀페이지로 표시 |
| sources/terms-of-service.md | 로컬 | 광고/프로모션 문구 제한 조항 없음. 수강권 만료 시 자동 소멸 (제13조 4항) |
| ClickHouse | MCP | D+4 이후 앱 오픈율: 최근 3개월 32.36% (3,386/10,462명) |

## Executive Summary

포도스피킹의 수강권 만료자(EXPIRED) 중 LOW/MEDIUM 세그먼트 사용자의 재구매율이 현재 2.21%에 머물고 있습니다. 만료일 D+4 이후 앱을 열면 풀페이지 팝업이 자동 노출되는데, 현재 메시지는 "신규기능 런칭" 내용으로 재구매와 직접적 연관이 약합니다.

이번 변경은 팝업 메시지를 **손실 회피("외국어 실력이 사라지고 있어요") + 가격 강조("월 4만원대")**로 교체하여, 만료자의 재구매 전환율을 높이는 것이 목적입니다. 성과는 메시지 교체 후 **2주간 최종 결제 전환율**로 측정하며, 마케팅 CRM 성과와 자연 유입 성과를 별도로 확인합니다.

### Goal Metrics

| Metric | Current | Target | 측정 기간 |
|--------|---------|--------|----------|
| 만료자 재구매율 (결제 전환율) | 2.21% | 개선 (구체적 목표치 미설정) | 2주 |
| D+4 이후 앱 오픈율 | 32.36% (최근 3개월) | 유지 | 2주 |

## Success Criteria

### User Success
- 만료자가 앱을 열었을 때, 재구매 동기를 느끼는 메시지를 즉시 인지할 수 있다
- CTA를 탭하면 세그먼트에 맞는 프로모션 페이지로 바로 이동하여 결제할 수 있다
- 원하지 않으면 "할인 혜택 포기하기"로 당일 팝업을 닫을 수 있다

### Business Success
- 재구매율(결제 전환율)이 2.21% 대비 상승
- 메시지 테스트를 통해 만료자 대상 효과적인 커뮤니케이션 패턴을 발견

### Technical Success
- 서버 설정 변경만으로 팝업 콘텐츠가 교체됨 (앱 업데이트 불필요)
- 기존 팝업 노출 조건/종료 로직이 정상 작동

### Measurable Outcomes
- 2주 후 결제 전환율 측정
- CRM 경유 성과 vs 자연 유입 성과 분리 측정

## Product Scope

### Phase 1: 만료자 풀페이지 팝업 메시지 교체

| Feature | Description | Related FRs |
|---------|-------------|-------------|
| 헤드라인 교체 | "지금 역대 최대 할인가로 다시 시작하세요!" | FR1 |
| 서브카피 교체 | "포도와 열심히 쌓은 외국어 실력이 사라지고 있어요ㅠㅠ" | FR2 |
| 가격 이미지 삽입 | 월 4만원대 이미지 (CTA 위) | FR3 |
| CTA 교체 | "4만원대로 다시 시작 >" → 세그먼트별 URL | FR4 |
| 닫기 문구 교체 | "할인 혜택 포기하기" | FR5 |

## User Journeys

### Journey 1: 재구매 성공 (Happy Path)

**Persona:** 수진 (32세, 마케터, 3개월 수강 후 만료 5일 경과)

**Opening Scene:** 수진은 포도스피킹으로 3개월간 영어 회화를 공부했습니다. 수강권이 만료된 지 5일이 지났고, 출퇴근 중에 무심코 포도스피킹 앱을 열었습니다. 수진은 LOW 세그먼트(월 6회 미만 수강)로 분류되어 있습니다.

**Rising Action:** 앱이 열리자마자 풀페이지 팝업이 나타납니다. 화면 중앙에 큰 글씨로 **"지금 역대 최대 할인가로 다시 시작하세요!"**가 보입니다. 바로 아래에 **"포도와 열심히 쌓은 외국어 실력이 사라지고 있어요ㅠㅠ"**라는 메시지가 있습니다. 수진은 지난 3개월간 꾸준히 올린 실력이 떨어질 수 있다는 생각에 아쉬움을 느낍니다. 화면 중간에는 **"월 4만원대"**가 크게 표시된 이미지가 있고, 정가 대비 얼마나 저렴한지 한눈에 들어옵니다.

**Climax:** 수진은 하단의 **"4만원대로 다시 시작 >"** 버튼을 탭합니다. LOW 세그먼트에 맞는 외부 프로모션 페이지로 이동합니다. 할인이 적용된 가격을 확인하고 결제를 완료합니다.

**Resolution:** 결제가 완료되면 수진의 수강권이 활성화됩니다. 다음에 앱을 열 때는 풀페이지 팝업이 더 이상 나타나지 않습니다. 수진은 다시 레슨을 예약할 수 있게 되어 안심합니다.

### Journey 2: 팝업 닫기 → 다음날 재노출 (Alternative Path)

**Persona:** 민호 (28세, 개발자, 만료 6일 경과)

**Opening Scene:** 민호는 MEDIUM 세그먼트(월 6~15회 수강)로 분류된 만료자입니다. 출근 중 지하철에서 포도스피킹 앱을 열었습니다.

**Rising Action:** 풀페이지 팝업이 나타납니다. "지금 역대 최대 할인가로 다시 시작하세요!" 메시지와 월 4만원대 이미지를 봅니다. 민호는 관심이 있지만, 지금 당장 결제할 상황이 아닙니다.

**Climax:** 하단의 **"할인 혜택 포기하기"**를 탭합니다. 팝업이 닫히고 앱의 홈 화면이 보입니다.

**Resolution:** 그날은 팝업이 다시 나타나지 않습니다. 다음날 저녁, 민호가 다시 앱을 열면 같은 풀페이지 팝업이 다시 나타납니다. 이번에는 여유가 있어 CTA를 탭하고 프로모션 페이지를 확인합니다.

### Journey 3: 세그먼트 미분류 만료자 (Exception Path)

**Persona:** 하영 (25세, 대학생, 체험 후 미구매 상태에서 만료)

**Opening Scene:** 하영은 세그먼트가 null(미분류)인 만료자입니다. 월평균 레슨 횟수가 분류 기준에 미달합니다.

**Rising Action:** 앱을 열어도 풀페이지 팝업이 나타나지 않습니다. 기존 WelcomeBackPromotion 미대상 로직에 따라 팝업이 미노출됩니다.

**Resolution:** 하영은 일반 홈 화면을 봅니다. 이 사용자에게는 다른 경로(마케팅팀 CRM 등)로 접근해야 합니다.

## Domain-Specific Requirements

### 수강권 만료 후 세그먼트 분류 (source: WelcomeBackPromotionDto)
- 수강권 만료 시 월평균 레슨 횟수를 기준으로 세그먼트 분류
- LOW: 월 6회 미만 | MEDIUM: 월 6~15회 | null: 미대상
- [BROWNFIELD] 기존 로직 변경 없음

### 팝업 노출 조건 (source: 기존 시스템)
- D+4 이후 앱 오픈 시 노출
- "할인 혜택 포기하기" 탭 시 당일 미노출, 다음날 재노출
- 활성 수강권 보유 시 팝업 종료
- [BROWNFIELD] 기존 로직 변경 없음

### 프로모션 가격 정책 (source: PO 확인)
- 모든 세그먼트(LOW/MEDIUM)에서 최저가 수강권 + 쿠폰 적용 시 월 4만원대
- "역대 최대 할인가"는 이용 시점까지 개인별 가장 큰 할인 — 사실

## Technical Requirements

### Tech Stack Status
- **백엔드**: Spring Boot — MarketingController, marketing-config.yml
- **프론트엔드**: Next.js 15 + React 19 + Tailwind CSS v3
- **API**: GET /welcomeback-promotion → WelcomeBackPromotionDto
- **이미지**: CDN 호스팅 (디자이너 제작 후 업로드)

### API Requirements
- GET /welcomeback-promotion 응답 구조 변경 없음 [BROWNFIELD]
- 팝업 콘텐츠(헤드라인, 서브카피, 이미지 URL, CTA 텍스트, CTA URL, 닫기 텍스트)는 서버 설정으로 관리

### Component Structure
- 풀페이지 팝업 컴포넌트: 기존 컴포넌트 재사용, 콘텐츠만 교체
- 서버에서 내려주는 콘텐츠를 렌더링하는 구조 유지

## Functional Requirements

### 풀페이지 팝업 (만료자 D+4 이후)

- **FR1:** 팝업 헤드라인에 "지금 역대 최대 할인가로 다시 시작하세요!"가 표시된다 (source: CST-002)
- **FR2:** 팝업 서브카피에 "포도와 열심히 쌓은 외국어 실력이 사라지고 있어요ㅠㅠ"가 표시된다 (source: CST-001)
- **FR3:** CTA 위에 월 4만원대가 잘 보이는 이미지가 표시된다 (source: CST-001)
  - FR3-1: 이미지는 디자이너가 제작하여 CDN에 업로드한다
  - FR3-2: 이미지 URL은 서버 설정(marketing-config.yml)에서 관리한다
- **FR4:** CTA 버튼에 "4만원대로 다시 시작 >"가 표시되고, 탭 시 세그먼트별 외부 프로모션 URL로 이동한다 (source: CST-001, CST-003)
  - FR4-1: LOW 세그먼트 → LOW 전용 프로모션 URL [BROWNFIELD]
  - FR4-2: MEDIUM 세그먼트 → MEDIUM 전용 프로모션 URL [BROWNFIELD]
- **FR5:** 닫기 영역에 "할인 혜택 포기하기"가 표시되고, 탭 시 당일 팝업이 미노출된다 (source: CST-001)
  - FR5-1: 다음날 앱 오픈 시 팝업이 다시 노출된다 [BROWNFIELD]
- **FR6:** 활성 수강권을 보유하면 팝업이 노출되지 않는다 [BROWNFIELD]
- **FR7:** 세그먼트 null(미대상) 사용자에게는 팝업이 노출되지 않는다 [BROWNFIELD]

## Non-Functional Requirements

### Performance
- 팝업 콘텐츠 로딩이 앱 오픈 후 1초 이내에 완료되어야 함
- 이미지 에셋 CDN 캐싱 적용

### Reliability
- 서버 설정 변경 후 즉시 반영 (또는 앱 재시작 시 반영)
- 설정 오류 시 기존 메시지로 fallback

### Integration
- 기존 WelcomeBackPromotion 세그먼트 판별 로직과 정합 유지
- 기존 외부 프로모션 URL과 정합 유지

### Guardrails
- 팝업 노출 조건(D+4, 당일 미노출, 활성 수강권 종료)은 기존 로직을 변경하지 않는다
- 세그먼트 분류 로직(LOW/MEDIUM)은 변경하지 않는다
- 쿠폰 금액/종류는 기존 세그먼트별 금액을 유지한다
- 외부 프로모션 URL은 기존 것을 사용한다

## Pre-Apply Review

### Policy Alignment
✓ inject 결정 3건 모두 이용약관과 양립합니다.
- 이용약관에 광고/프로모션 문구 제한 조항 없음
- "역대 최대 할인가" 표현은 개인별 최대 할인이 사실이므로 근거 있음

### Brownfield Compatibility
✓ GET /welcomeback-promotion API 응답 구조 변경 없음. invariant 유지.
- WelcomeBackPromotionDto 구조 변경 없음
- 팝업 노출/종료 로직 변경 없음

### Logic Consistency
✓ 팝업 콘텐츠만 교체. 노출 조건/종료 로직 변경 없음. edge case 커버됨.
- 세그먼트 null → 팝업 미노출 (기존 로직)
- 쿠폰 만료 → 랜딩페이지에서 정확한 가격 확인

## QA Considerations

### 가격 표시 정합성 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA-1 | LOW 세그먼트 만료자 팝업 노출 | "4만원대" 표시, CTA → LOW 프로모션 URL |
| QA-2 | MEDIUM 세그먼트 만료자 팝업 노출 | "4만원대" 표시, CTA → MEDIUM 프로모션 URL |
| QA-3 | 세그먼트 null 만료자 | 팝업 미노출 |
| QA-4 | 쿠폰 만료된 만료자 | 팝업 노출, 랜딩페이지에서 정가 표시 |

### 팝업 노출/닫기 로직 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA-5 | D+4 이후 앱 오픈 | 풀페이지 팝업 자동 노출 |
| QA-6 | D+3 앱 오픈 | 팝업 미노출 |
| QA-7 | "할인 혜택 포기하기" 탭 후 같은 날 재오픈 | 팝업 미노출 |
| QA-8 | "할인 혜택 포기하기" 탭 후 다음날 재오픈 | 팝업 재노출 |
| QA-9 | 활성 수강권 보유 중 앱 오픈 | 팝업 미노출 |

### 서버 콘텐츠 교체 (Medium Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| QA-10 | 서버 설정 변경 후 앱 오픈 | 새 콘텐츠(헤드라인/서브카피/이미지/CTA) 표시 |
| QA-11 | 캐시된 이전 콘텐츠 | 앱 재시작 또는 캐시 만료 후 새 콘텐츠 표시 |

## Event Tracking

### 팝업 노출/행동 이벤트

| Event | Parameters | Trigger |
|-------|-----------|---------|
| welcomeback_popup_shown | segment (LOW/MEDIUM), message_version | 팝업이 화면에 표시될 때 |
| welcomeback_popup_cta_clicked | segment, message_version, promo_url | CTA 버튼 탭 |
| welcomeback_popup_dismissed | segment, message_version | "할인 혜택 포기하기" 탭 |
| welcomeback_purchase_completed | segment, message_version, ticket_type, amount | 프로모션 URL 경유 결제 완료 |

## Appendix

### Traceability Matrix

| CST-ID | Decision | IMPL-ID | CHG-IDs | VAL-ID |
|--------|----------|---------|---------|--------|
| CST-001 | inject | IMPL-001, IMPL-002 | CHG-001, CHG-002 | VAL-001 |
| CST-002 | inject | IMPL-001 | CHG-001 | VAL-002 |
| CST-003 | inject | IMPL-001 | CHG-001 | VAL-003 |

### 텍스트 와이어프레임

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│   지금 역대 최대 할인가로        │  ← 헤드라인 (text-xl bold)
│   다시 시작하세요!               │
│                                 │
│   포도와 열심히 쌓은 외국어       │  ← 서브카피 (text-base gray-500)
│   실력이 사라지고 있어요ㅠㅠ      │
│                                 │
│  ┌─────────────────────────┐    │
│  │     하루 약 1,300원으로    │    │
│  │      월 4만원 대          │    │  ← 가격 이미지 (dark bg)
│  │      정가 ₩59,000        │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  4만원대로 다시 시작 >    │    │  ← CTA (podo-green)
│  └─────────────────────────┘    │
│                                 │
│       할인 혜택 포기하기          │  ← 닫기 (gray-400)
│                                 │
└─────────────────────────────────┘
```
