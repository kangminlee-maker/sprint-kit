# Build Spec: 홈 화면 체험 상태 기반 동적 전환

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | homeui-20260311-001 |
| 제목 | 홈 화면 체험 상태 기반 동적 전환 |
| 방향 | 홈 화면의 상태 분기 로직을 현재 4가지에서 체험 흐름 전체(미신청→대기→레슨 중→완료→예외)를 커버하는 구조로 확장하고, 각 상태에 맞는 메인 문구·프로그레스바·본문 카드·플로팅 CTA를 구성한다. |
| scope type | experience |

**범위 — 포함:**
- 홈 화면 상태 분기 로직 확장 (4가지 → 6~7가지 세분화)
- 체험 프로그레스바 컴포넌트 신규 구현 (신청→예습→레슨→완료 단계 표시)
- 상태별 본문 카드 영역 콘텐츠 전환 (인사 카드, 예습 진행률, 레슨 입장, 결제 혜택 카드)
- 하단 플로팅 CTA 버튼 상태별 라벨·동작 전환
- 예외 상태 처리 (튜터 노쇼 → 재신청, 학생 노쇼/취소 → 잔여 횟수 안내, 3회 소진 → 유료 체험 안내)
- GNB 수강신청 버튼을 통한 상시 결제 접근 경로 유지

**범위 — 제외:**
- 백엔드 API 신규 개발 (기존 API의 응답 데이터 활용 범위 내에서 해결, 부족 시 별도 scope)
- 정규 수강생(결제 완료 후) 홈 화면 변경
- 레슨룸(강의실) 내부 UI 변경
- 예약/결제 페이지 자체의 UI 변경
- AI 학습(스마트톡) 페이지 변경
- 노쇼 판정 로직 변경 (외부 시스템 영역)

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `7fe96cd3c59ff289fc0fd453cfd9104aa55eeae4c722aa67fc9bd15d918524cb`

**시나리오 요약:**
체험 7상태 분기 + 프로그레스바 + 본문 카드 + 플로팅 CTA. 수강권 유형 1차 분기로 정규 UI 보존.

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Experience | 현재 홈 화면 상태 분기가 4가지뿐이어서 brief가 요구하는 세분화된 체험 상태(6~7가지)를 표현할 수 없음 | inject | Section 4에서 구현. 상태 모델 확장 (4가지 → 7가지) |
| CST-002 | Experience | 현재 홈 화면에 프로그레스바(단계 표시기)가 존재하지 않아 신규 구현 필요 | inject | Section 4에서 구현. 프로그레스바 컴포넌트 신규 구현 |
| CST-003 | Experience | 플로팅 CTA 버튼이 현재 홈 화면에 없음 — StickyBottom 컴포넌트는 존재하나 홈에서 미사용 | inject | Section 4에서 구현. StickyBottom 플로팅 CTA 추가 |
| CST-004 | Code | 체험 레슨 상태 판별에 필요한 API 응답 데이터가 현재 홈 화면 쿼리에 부재 — 노쇼 여부, 잔여 체험 횟수, 체험 완료 후 결제 상태를 별도 조회해야 함 | inject | Section 4에서 구현. 레슨 이력 API 추가 호출 |
| CST-005 | Code | Lesson 엔티티가 invoiceStatus와 status(LectureStatus) 두 개의 독립 상태 필드를 가지며, classState 보조 필드까지 3중 상태 구조 | inject | Section 4에서 구현. 3중 상태 → TrialStatus 매핑 로직 구현 |
| CST-006 | Code | 노쇼 처리가 외부 시스템(레거시 PHP, 어드민 도구)에서 수행되어 백엔드 Java 코드에 상태 전이 로직이 없음 | inject | Section 4에서 구현. invoiceStatus 읽기로 노쇼 판별 |
| CST-007 | Code | SubscribeMappStatus에 TRIAL 상태가 있으나 무료체험 횟수(3회) 추적과 유료체험(5,000원/3회) 전환을 위한 전용 필드/API가 코드에서 확인되지 않음 | inject | Section 4에서 구현. 레슨 이력에서 체험 횟수 계산 |
| CST-008 | Policy | 이용약관 제14조의 노쇼 패널티(무제한권 72시간 예약 차단)가 홈 화면 상태 분기에 영향 — 노쇼 후 "재신청" 표시 시 패널티 기간 확인 필요 | — | 해당 없음. 사유: 무료체험은 수강권(무제한권/회차권)과 별개 상품. 이용약관 제14조의 72시간 예약 차단 패널티는 무제한권에만 적용되며, 이 scope 대상인 무료체험 학생에게는 적용되지 않음. |
| CST-009 | Policy | 체험수업은 정규구독 결제 시 자동 만료(취소)되는 정책이 존재 — 홈 화면에서 체험 상태와 결제 유도를 동시에 표시할 때 상태 충돌 가능 | inject | Section 4에서 구현. 결제 완료 후 쿼리 무효화 |
| CST-010 | Experience | Surface의 7가지 상태와 기존 앱의 4가지 상태를 매핑하는 전환 로직이 필요 — 기존 정규 수강생 상태(RECOMMEND_BOOKING_REGULAR, SCHEDULED_CLASS with regular ticket)와의 공존 방식 결정 필요 | inject | Section 4에서 구현. 수강권 유형으로 1차 분기 |
| CST-011 | Code | 체험 프로그레스바의 단계(신청→예습→레슨→완료)가 백엔드 InvoiceStatus 전이와 정확히 일치하지 않음 — CREATED→RESERVED 사이에 "예습" 단계가 별도 상태로 존재하지 않음 | inject | Section 4에서 구현. classState/pre_study_time으로 예습 단계 판별 |

**무효화된 항목:**
- CST-008: 무료체험은 수강권(무제한권/회차권)과 별개 상품. 이용약관 제14조의 72시간 예약 차단 패널티는 무제한권에만 적용되며, 이 scope 대상인 무료체험 학생에게는 적용되지 않음.

## 4. Implementation Plan

### IMPL-001 | CST-001, CST-010

- **요약:** 홈 화면 상태 모델 확장
- **변경 대상:** apps/web/src/widgets/greeting/model/status.ts
- **변경 내용:** greetingStatusSchema에 체험 7상태 추가. 수강권 유형 1차 분기 타입 추가.

### IMPL-002 | CST-001, CST-004, CST-007, CST-010, CST-006

- **요약:** useGreetingStatus 훅 확장
- **변경 대상:** apps/web/src/widgets/greeting/hooks/use-greeting-status.ts
- **변경 내용:** 레슨 이력 API 병렬 호출 + 수강권 유형 1차 분기 + 체험 7상태 판별 + 횟수 계산 + 노쇼 판별.

### IMPL-003 | CST-005, CST-011

- **요약:** 3중 상태 → TrialStatus 매핑 함수
- **변경 대상:** apps/web/src/widgets/greeting/model/trial-status-mapper.ts
- **변경 내용:** invoiceStatus+status+classState → TrialStatus 매핑 순수 함수.

### IMPL-004 | CST-002

- **요약:** 체험 프로그레스바 컴포넌트
- **변경 대상:** apps/web/src/features/home-greeting/ui/components/trial-progress-bar.tsx
- **변경 내용:** 4단계 프로그레스바. green-500 활성, gray-300 비활성.

### IMPL-005 | CST-003

- **요약:** StickyBottom 플로팅 CTA
- **변경 대상:** apps/web/src/features/home-greeting/ui/components/trial-sticky-cta.tsx
- **변경 내용:** StickyBottom + ButtonPrimary. 상태별 라벨/동작 전환.

### IMPL-006 | CST-001

- **요약:** 체험 상태별 본문 카드 7종
- **변경 대상:** apps/web/src/features/home-greeting/ui/states/
- **변경 내용:** 7가지 상태별 본문 카드 컴포넌트.

### IMPL-007 | CST-006

- **요약:** 노쇼 상태 표시
- **변경 대상:** apps/web/src/widgets/greeting/hooks/use-greeting-status.ts
- **변경 내용:** invoiceStatus NOSHOW_S/CANCEL_NOSHOW_T 판별.

### IMPL-008 | CST-009

- **요약:** 결제 완료 후 쿼리 무효화
- **변경 대상:** apps/web/src/features/payment/hooks/use-payment-complete.ts
- **변경 내용:** queryClient.invalidateQueries() 호출.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 10건, modify 5건
- **content hash**: `93499757f3369f43a3d360d1a7d79f0ddba3a39f8dcf6ee1db228f59cbb92565`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 10건
- **content hash**: `cdaa818179faf1d493d0b1d594ea7a6114d9708693588358ba5ff8af42395a55`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `35766df0`)

### 변경 대상 파일 (8건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `apps/web/src/widgets/greeting/model/status.ts` | state model (수정 대상) | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/widgets/greeting/hooks/use-greeting-status.ts` | state hook (수정 대상) | [→ 상세](brownfield-detail.md##상태-판별-훅) |
| `apps/web/src/widgets/greeting/ui/greeting-content.tsx` | view layer (수정 대상) | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/views/home/view.tsx` | page view (수정 대상) | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/features/home-greeting/ui/states/no-ticket-state.tsx` | existing state component | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/features/home-greeting/ui/states/recommend-trial-lesson.tsx` | existing state component | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/features/home-greeting/ui/states/scheduled-class-state.tsx` | existing state component | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| `apps/web/src/shared/ui/bottom-navigation/bottom-navigation.tsx` | GNB (참조만) | [→ 상세](brownfield-detail.md##디자인-시스템) |

### 직접 의존 모듈 (5건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| @widgets/greeting | @entities/subscribes | [→ 상세](brownfield-detail.md##상태-판별-훅) |
| @widgets/greeting | @entities/lesson | [→ 상세](brownfield-detail.md##상태-판별-훅) |
| @widgets/greeting | @entities/users | [→ 상세](brownfield-detail.md##상태-판별-훅) |
| @features/home-greeting | @widgets/greeting | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |
| @views/home | @widgets/greeting | [→ 상세](brownfield-detail.md##현재-홈-화면-구조) |

