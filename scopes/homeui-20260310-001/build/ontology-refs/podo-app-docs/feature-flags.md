# 피처 플래그 (Feature Flags) 문서

## 개요

포도 서비스는 [Flagsmith](https://www.flagsmith.com/)를 사용하여 피처 플래그를 관리합니다. 피처 플래그를 통해 배포 없이 기능을 켜고 끌 수 있으며, A/B 테스트, 점진적 롤아웃, 긴급 기능 비활성화 등을 수행할 수 있습니다.

### 주요 목적

- **배포 없는 기능 제어**: 코드 배포 없이 실시간으로 기능 활성화/비활성화
- **점진적 출시**: 특정 사용자 그룹에게만 새 기능 제공
- **A/B 테스트**: 다양한 기능 버전 테스트
- **긴급 대응**: 문제 발생 시 신속한 기능 비활성화
- **마이그레이션 제어**: 레거시 시스템에서 새 시스템으로의 점진적 마이그레이션

### 환경별 설정

| 환경 | Flagsmith 환경 | 설명 |
|------|---------------|------|
| local | development | 로컬 개발 환경 (Flagsmith API 직접 호출) |
| development | development | 개발 서버 환경 |
| staging | staging | 스테이징 환경 |
| production | production | 프로덕션 환경 |
| temp | temp | 임시 환경 |

환경 변수: `FLAGSMITH_ENVIRONMENT_ID`

---

## 아키텍처

### 데이터 흐름

```
Flagsmith Dashboard (관리자)
    ↓
Flagsmith API
    ↓
Redis Cache (flagsmith:podo-app:{env}:features)
    ↓
Web App / Server
```

### 주요 컴포넌트

#### 1. 서버 사이드 (SSR/API Routes)

**파일**: `apps/web/src/entities/src/feature-flag/api/feature-flag.api.ts`

- `isEnabled(flagName)`: 플래그 활성화 여부 확인
- `getFeatureFlagValue(flagName)`: 플래그 값 가져오기
- `createFeatureFlagInstance()`: Flagsmith 인스턴스 생성

```typescript
// 예시: 서버 컴포넌트에서 사용
import { isEnabled } from '@entities/feature-flag'

const isReactHomeEnabled = await isEnabled('enable_react_home')
if (!isReactHomeEnabled) {
  redirect('/app/user/podo/home')
}
```

#### 2. 클라이언트 사이드 (React Components)

**파일**: `apps/web/src/shared/src/hooks/use-feature-flag.ts`

```typescript
// 예시: 클라이언트 컴포넌트에서 사용
'use client'

import { useFeatureFlag } from '@shared/hooks'
import { FEATURE_FLAG_KEYS } from '@shared/constants'

const { enabled, value, isTestableEnabled } = useFeatureFlag(
  FEATURE_FLAG_KEYS.APPLE_LOGIN,
  userId
)
```

#### 3. Provider

**파일**: `apps/web/src/core/src/providers/feature-flag.provider.tsx`

루트 레이아웃(`apps/web/src/app/layout.tsx`)에서 전역으로 Flagsmith 상태를 제공합니다.

#### 4. Redis 캐싱

**파일**: `packages/flags/src/index.ts`

- Redis에 피처 플래그 데이터를 캐시하여 Flagsmith API 호출을 최소화
- 캐시 키 형식: `flagsmith:podo-app:{environment}:features`

---

## 피처 플래그 목록

### 1. 인증 & 로그인

#### `apple_login`
- **목적**: Apple 로그인 기능 활성화
- **타입**: Boolean
- **영향 받는 화면**: 로그인 페이지
- **사용 위치**: `apps/web/src/views/login/view.tsx`
- **설명**: iOS 네이티브 앱에서 Apple 로그인 버튼 표시 여부 제어. `submitting_runtime_version`과 함께 사용하여 특정 앱 버전에서만 활성화.

#### `submitting_runtime_version`
- **목적**: 제출된 앱 런타임 버전 관리
- **타입**: String (버전 번호)
- **영향 받는 화면**: 로그인 페이지
- **사용 위치**: `apps/web/src/views/login/view.tsx`
- **설명**: Apple 로그인 등 네이티브 기능의 최소 앱 버전 요구사항 지정.

---

### 2. 홈 & 네비게이션

#### `enable_react_home`
- **목적**: React 기반 새 홈 화면 활성화
- **타입**: Boolean
- **영향 받는 화면**: 홈 페이지 (`/home`)
- **사용 위치**:
  - `apps/web/src/app/(internal)/home/page.tsx`
  - `apps/web/src/views/trial-subscribes/view.tsx`
- **설명**: 레거시 Nuxt.js 홈에서 새 React 홈으로 마이그레이션. 비활성화 시 `/app/user/podo/home`으로 리디렉트.

#### `app_gateway_loading_enabled`
- **목적**: 앱 게이트웨이 로딩 화면 표시
- **타입**: Boolean
- **영향 받는 화면**: 앱 진입점 게이트웨이
- **사용 위치**: `apps/web/src/views/gateway/ui/app-gateway/view.tsx`
- **설명**: 인증 리디렉션 중 로딩 화면 표시 여부 제어.

---

### 3. 레슨 예약 & 재생

#### `reservation_migration` (구현 예상)
- **목적**: 예약 시스템 마이그레이션 제어
- **타입**: Boolean
- **영향 받는 화면**: 예약 관련 페이지
- **설명**: 새 예약 시스템으로의 점진적 마이그레이션.

#### `migration_booking_react`
- **목적**: React 기반 예약 페이지 마이그레이션
- **타입**: Boolean
- **영향 받는 화면**: 예약 페이지 (`/booking`)
- **사용 위치**: `apps/web/src/app/(internal)/booking/page.tsx`
- **설명**: 레거시 예약 페이지에서 React 버전으로 마이그레이션. 비활성화 시 `/app/user/podo/class-booking`으로 리디렉트.

#### `lesson_replay_visible`
- **목적**: 레슨 다시보기 기능 표시
- **타입**: Boolean
- **영향 받는 화면**: 레슨 상세/리포트 페이지
- **설명**: 완료된 레슨의 다시보기 기능 활성화 여부.

---

### 4. AI 학습 (포도링고)

#### `podolingo_enabled`
- **목적**: 포도링고(AI 학습) 기능 활성화
- **타입**: Boolean
- **영향 받는 화면**: AI 학습 페이지 (`/ai-learning`)
- **사용 위치**: `apps/web/src/app/(internal)/ai-learning/page.tsx`
- **설명**: 포도링고 기능 전체 활성화. 비활성화 시 404 페이지 반환.

#### `podolingo_banner`
- **목적**: 포도링고 배너 표시
- **타입**: Boolean
- **영향 받는 화면**: 홈 화면 등
- **설명**: 포도링고 프로모션 배너 표시 여부.

#### `ai_home_banner_image`
- **목적**: AI 홈 배너 이미지 설정
- **타입**: String (이미지 URL)
- **영향 받는 화면**: AI 캐릭터 채팅 홈
- **사용 위치**: `apps/web/src/views/character-chat-home/character-chat-onboarding-section.tsx`
- **설명**: AI 학습 홈 화면의 배너 이미지 동적 변경.

---

### 5. 결제 & 구독

#### `subscribe_tickets_enabled`
- **목적**: 구독 결제 레슨권 구매 활성화
- **타입**: Boolean
- **영향 받는 화면**: 레슨권 구매 페이지 (`/subscribes/tickets`)
- **사용 위치**: `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`
- **설명**: 구독 결제 탭 표시 여부.

#### `subscribe_tickets_url_enabled`
- **목적**: 구독 결제 URL 접근 제어
- **타입**: Boolean 또는 String (접근 제어 값)
- **영향 받는 화면**: 레슨권 구매 페이지
- **사용 위치**: `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`
- **설명**: 특정 URL 파라미터를 통한 구독 결제 페이지 직접 접근 제어.

#### `payback_tickets_enabled`
- **목적**: 페이백 레슨권 구매 활성화
- **타입**: Boolean
- **영향 받는 화면**: 레슨권 구매 페이지
- **사용 위치**:
  - `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`
  - `apps/web/src/app/(internal)/subscribes/tickets/payback/page.tsx`
- **설명**: 페이백 프로모션 탭 표시 여부.

#### `payback_tickets_url_enabled`
- **목적**: 페이백 레슨권 URL 접근 제어
- **타입**: Boolean 또는 String
- **영향 받는 화면**: 레슨권 구매 페이지
- **설명**: 페이백 프로모션 페이지 직접 접근 제어.

#### `ui_tab_business_enabled`
- **목적**: 비즈니스 레슨권 탭 표시
- **타입**: Boolean
- **영향 받는 화면**: 레슨권 구매 페이지
- **사용 위치**: `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`
- **설명**: 비즈니스 고객용 레슨권 탭 표시.

#### `business_tickets_url_enabled`
- **목적**: 비즈니스 레슨권 URL 접근 제어
- **타입**: Boolean 또는 String
- **영향 받는 화면**: 레슨권 구매 페이지
- **설명**: 비즈니스 레슨권 페이지 직접 접근 제어.

#### `smart_talk_tickets_purchase_enabled`
- **목적**: 스마트톡 레슨권 구매 활성화
- **타입**: Boolean
- **영향 받는 화면**: 스마트톡 레슨권 구매 페이지
- **사용 위치**: `apps/web/src/app/(internal)/subscribes/tickets/smart-talk/page.tsx`
- **설명**: 스마트톡 전용 레슨권 구매 기능.

#### `ui_payment_naver_enabled`
- **목적**: 네이버페이 결제 UI 표시
- **타입**: Boolean
- **영향 받는 화면**: 결제 수단 선택 화면
- **설명**: 네이버페이 결제 옵션 표시 여부.

#### `page_subscribe_ticket_v2_enabled`
- **목적**: 레슨권 구매 페이지 V2 활성화
- **타입**: Boolean
- **영향 받는 화면**: 레슨권 구매 페이지
- **사용 위치**: `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`
- **설명**: 새로운 레슨권 구매 페이지 V2 활성화. 활성화 시 `SubscribesTicketsV2View` 렌더링, 비활성화 시 V1 렌더링.

---

### 6. 무료 체험

#### `trial_free`
- **목적**: 무료 체험 프로모션 활성화
- **타입**: Boolean
- **영향 받는 화면**: 로그인 페이지, 무료 체험 페이지
- **사용 위치**:
  - `apps/web/src/views/login/view.tsx`
  - `apps/web/src/app/(internal)/subscribes/trial/smart-talk/page.tsx`
- **설명**: 무료 체험 프로모션 배너 및 체험 기능 표시.

#### `smart_talk_trial_term_messages`
- **목적**: 스마트톡 무료 체험 약관 메시지
- **타입**: String (약관 텍스트)
- **영향 받는 화면**: 스마트톡 무료 체험 페이지
- **설명**: 스마트톡 무료 체험 약관 동적 텍스트 제공.

---

### 7. 약관 & 메시지

#### `subscribe_term_messages`
- **목적**: 구독 결제 약관 메시지
- **타입**: String
- **영향 받는 화면**: 구독 결제 약관 동의 화면
- **설명**: 구독 결제 시 표시되는 약관 텍스트.

#### `lump_sum_term_messages`
- **목적**: 일시불 결제 약관 메시지
- **타입**: String
- **영향 받는 화면**: 일시불 결제 약관 동의 화면
- **설명**: 일시불 결제 시 표시되는 약관 텍스트.

#### `terms_payback_messages`
- **목적**: 페이백 약관 메시지
- **타입**: String
- **영향 받는 화면**: 페이백 구매 약관 동의 화면
- **설명**: 페이백 프로모션 관련 약관 텍스트.

#### `ipad_term_messages`
- **목적**: iPad 패키지 약관 메시지
- **타입**: String
- **영향 받는 화면**: iPad 패키지 구매 약관 동의 화면
- **설명**: iPad 패키지 구매 시 표시되는 약관 텍스트.

#### `business_term_messages`
- **목적**: 비즈니스 레슨권 약관 메시지
- **타입**: String
- **영향 받는 화면**: 비즈니스 레슨권 구매 약관 동의 화면
- **설명**: 비즈니스 레슨권 관련 약관 텍스트.

#### `naver_pay_term_messages`
- **목적**: 네이버페이 약관 메시지
- **타입**: String
- **영향 받는 화면**: 네이버페이 결제 약관 동의 화면
- **설명**: 네이버페이 결제 시 표시되는 약관 텍스트.

#### `payment_terms_information`
- **목적**: 결제 약관 정보
- **타입**: String
- **영향 받는 화면**: 모든 결제 페이지
- **설명**: 결제 시 공통으로 표시되는 약관 정보.

---

### 8. 쿠폰 & 에러 메시지

#### `coupon_publish_guide_text`
- **목적**: 쿠폰 발급 안내 텍스트
- **타입**: String
- **영향 받는 화면**: 쿠폰 입력/발급 화면
- **설명**: 쿠폰 사용 관련 안내 메시지.

#### `coupon_error_message`
- **목적**: 쿠폰 에러 메시지
- **타입**: String
- **영향 받는 화면**: 쿠폰 입력 화면
- **설명**: 쿠폰 적용 실패 시 표시되는 에러 메시지.

#### `validate_subscribe_error_message`
- **목적**: 구독 검증 에러 메시지
- **타입**: String
- **영향 받는 화면**: 구독 관련 화면
- **설명**: 구독 검증 실패 시 표시되는 에러 메시지.

---

### 9. 테스트 & 개발

#### `testable_user_id_list`
- **목적**: 테스트 가능한 사용자 ID 리스트
- **타입**: JSON Array (문자열 배열)
- **영향 받는 화면**: 모든 화면 (프로덕션 환경에서 특정 기능 테스트)
- **사용 위치**: `apps/web/src/shared/src/hooks/use-feature-flag.ts`
- **설명**: 프로덕션 환경에서 특정 사용자에게만 실험적 기능 제공. `useFeatureFlag`의 `isTestableEnabled` 함수에서 사용.

**예시 값**:
```json
["12345", "67890", "11111"]
```

**동작 방식**:
- **프로덕션**: 플래그가 활성화되어 있고, 현재 사용자 ID가 리스트에 포함된 경우에만 `isTestableEnabled = true`
- **기타 환경**: 플래그 활성화 여부만 확인 (리스트 무시)

---

## 사용 패턴

### 서버 사이드 사용 (Server Components, API Routes)

```typescript
// 1. 불리언 플래그 확인
import { isEnabled } from '@entities/feature-flag'

const isReactHomeEnabled = await isEnabled('enable_react_home')
if (!isReactHomeEnabled) {
  redirect('/app/user/podo/home')
}

// 2. 플래그 값 가져오기
import { getFeatureFlagValue } from '@entities/feature-flag'

const subscribeTicketsUrlValue = await getFeatureFlagValue('subscribe_tickets_url_enabled')
console.log(subscribeTicketsUrlValue) // 예: "production-ready"
```

**파일 위치**:
- `apps/web/src/entities/src/feature-flag/api/feature-flag.api.ts`

---

### 클라이언트 사이드 사용 (Client Components)

#### 방법 1: `useFeatureFlag` 훅 (권장)

```typescript
'use client'

import { useFeatureFlag } from '@shared/hooks'
import { FEATURE_FLAG_KEYS } from '@shared/constants'
import { useAuthorization } from '@entities/authentication'

export const MyComponent = () => {
  const { uid: userId } = useAuthorization()

  const { enabled, value, isTestableEnabled } = useFeatureFlag(
    FEATURE_FLAG_KEYS.APPLE_LOGIN,
    userId
  )

  // 일반 활성화 여부
  if (!enabled) return null

  // 프로덕션 테스트 사용자 확인
  if (env.NEXT_PUBLIC_APP_ENV === 'production' && !isTestableEnabled) {
    return <p>이 기능은 곧 출시됩니다.</p>
  }

  return <div>Apple 로그인: {value}</div>
}
```

**파일 위치**:
- `apps/web/src/shared/src/hooks/use-feature-flag.ts`

#### 방법 2: Flagsmith의 `useFlags` 훅

```typescript
'use client'

import { useFlags } from 'flagsmith/react'
import { FEATURE_FLAG_KEYS } from '@shared/constants'

export const MyComponent = () => {
  const {
    apple_login: appleLoginFlag,
    enable_react_home: enableReactHome
  } = useFlags([
    FEATURE_FLAG_KEYS.APPLE_LOGIN,
    FEATURE_FLAG_KEYS.ENABLE_REACT_HOME
  ])

  return (
    <div>
      <p>Apple Login: {appleLoginFlag.enabled ? 'Yes' : 'No'}</p>
      <p>React Home: {enableReactHome.enabled ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

---

### 상수 정의

모든 피처 플래그 키는 중앙에서 관리됩니다.

**파일**: `apps/web/src/shared/src/constants/feature-flags.ts`

```typescript
export const FEATURE_FLAG_KEYS = {
  APPLE_LOGIN: 'apple_login',
  ENABLE_REACT_HOME: 'enable_react_home',
  PODOLINGO_ENABLED: 'podolingo_enabled',
  // ... 나머지 플래그들
} as const
```

**사용 시 장점**:
- 타입 안전성
- IDE 자동완성
- 오타 방지
- 리팩토링 용이

---

### 캐싱 및 성능

#### Redis 캐싱

피처 플래그는 Redis에 캐시되어 Flagsmith API 호출을 최소화합니다.

**캐시 키 형식**:
```
flagsmith:podo-app:{environment}:features
```

예시:
- `flagsmith:podo-app:production:features`
- `flagsmith:podo-app:staging:features`

**파일 위치**: `packages/flags/src/index.ts`

```typescript
import { getCachedFeatureFlagV2 } from '@podo/flags'

const cacheKey = `flagsmith:podo-app:${featureFlagEnvSchemaMap[env.APP_ENV]}:features`
const featureFlag = await getCachedFeatureFlagV2(redis, cacheKey)
```

#### 로컬 환경 처리

로컬 개발 환경(`local`)에서는 Redis 캐시를 사용하지 않고 Flagsmith API를 직접 호출합니다.

**파일**: `apps/web/src/app/(external)/api/feature-flag/route.ts`

```typescript
if (env.APP_ENV === 'local') {
  const response = await fetch('https://edge.api.flagsmith.com/api/v1/flags', {
    headers: {
      'Content-Type': 'application/json',
      'X-Environment-Key': env.FLAGSMITH_ENVIRONMENT_ID,
    },
  })
  const featureFlag = await response.json()
  return NextResponse.json(featureFlag, { status: 200 })
}
```

---

## API 엔드포인트

### `GET /api/feature-flag`

피처 플래그 데이터를 조회하는 내부 API 엔드포인트입니다.

**파일**: `apps/web/src/app/(external)/api/feature-flag/route.ts`

**요청 헤더**:
```
x-feature-flag-key: {REVALIDATE_KEY}
```

**응답**:
```json
{
  "count": 34,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 12345,
      "name": "enable_react_home",
      "type": "FLAG",
      "environment_feature_state": {
        "id": 67890,
        "feature_state_value": null,
        "environment": 1,
        "identity": null,
        "feature_segment": null,
        "enabled": true
      }
    }
  ],
  "isSuccess": true
}
```

---

## 관리 및 운영

### Flagsmith 대시보드

피처 플래그는 Flagsmith 웹 대시보드에서 관리됩니다.

**주요 기능**:
- 플래그 생성/수정/삭제
- 환경별 플래그 값 설정
- 사용자 세그먼트 기반 타겟팅
- 플래그 활성화 히스토리 확인

### 환경 변수 설정

**필수 환경 변수**:
```bash
FLAGSMITH_ENVIRONMENT_ID={your_environment_id}
```

**환경별 ID 관리**:
- 각 환경(development, staging, production, temp)마다 다른 Flagsmith Environment ID 사용
- ID는 `.env` 파일에 저장 (Git에 커밋하지 않음)
- AWS S3를 통해 환경 변수 동기화: `pnpm -C apps/web env:download`

---

## 모범 사례

### 1. 플래그 네이밍 규칙

- **활성화 플래그**: `{feature}_enabled` (예: `podolingo_enabled`)
- **UI 표시**: `ui_{element}_{feature}_enabled` (예: `ui_tab_business_enabled`)
- **URL 접근**: `{feature}_url_enabled` (예: `subscribe_tickets_url_enabled`)
- **마이그레이션**: `migration_{feature}` (예: `migration_booking_react`)
- **약관/메시지**: `{feature}_term_messages` (예: `smart_talk_term_messages`)

### 2. 플래그 사용 시 주의사항

- **서버/클라이언트 구분**:
  - Server Components에서는 `isEnabled()` 또는 `getFeatureFlagValue()` 사용
  - Client Components에서는 `useFeatureFlag()` 또는 `useFlags()` 사용

- **타입 안전성**:
  - 항상 `FEATURE_FLAG_KEYS` 상수 사용
  - 직접 문자열 하드코딩 금지

- **폴백 처리**:
  - 플래그를 가져오지 못한 경우 기본값 처리
  - 사용자에게 명확한 안내 메시지 제공

### 3. 플래그 라이프사이클

```
1. 기획 → 플래그 이름 정의
2. 개발 → 코드에 플래그 적용
3. 배포 → Flagsmith에서 플래그 생성 (비활성화 상태)
4. 테스트 → `testable_user_id_list`를 사용하여 특정 사용자 테스트
5. 출시 → 점진적 활성화 (10% → 50% → 100%)
6. 안정화 → 플래그 제거 및 코드 정리 (기술 부채 방지)
```

### 4. 기술 부채 방지

- 플래그는 **임시 메커니즘**입니다
- 기능이 안정화되면 플래그를 제거하고 코드를 정리하세요
- 주기적으로 사용하지 않는 플래그 정리

---

## 트러블슈팅

### Redis 연결 오류

**증상**: 피처 플래그를 가져올 수 없음

**해결**:
1. Redis 서버 상태 확인
2. `DATABASE_URL` 환경 변수 확인
3. 로컬 환경에서는 Flagsmith API 직접 호출로 폴백

### 플래그 값이 업데이트되지 않음

**원인**: Redis 캐시

**해결**:
1. Flagsmith에서 플래그 값 변경
2. Redis 캐시 무효화:
   - 캐시 키 삭제: `DEL flagsmith:podo-app:{env}:features`
   - 또는 서버 재시작

### 프로덕션에서 테스트 사용자가 기능을 볼 수 없음

**확인 사항**:
1. `testable_user_id_list` 플래그에 사용자 ID 추가 여부
2. 사용자 ID가 문자열 배열 형태인지 확인: `["12345", "67890"]`
3. `useFeatureFlag`의 `isTestableEnabled` 사용 여부

---

## 관련 파일 경로

### 핵심 파일

| 경로 | 설명 |
|------|------|
| `packages/flags/src/index.ts` | Redis 캐싱 로직 |
| `apps/web/src/entities/src/feature-flag/` | 피처 플래그 엔티티 |
| `apps/web/src/shared/src/constants/feature-flags.ts` | 플래그 키 상수 정의 |
| `apps/web/src/shared/src/hooks/use-feature-flag.ts` | 클라이언트 훅 |
| `apps/web/src/core/src/providers/feature-flag.provider.tsx` | Flagsmith Provider |
| `apps/web/src/app/(external)/api/feature-flag/route.ts` | 피처 플래그 API 엔드포인트 |
| `apps/web/src/app/layout.tsx` | 루트 레이아웃 (Provider 설정) |
| `apps/web/src/shared/config/env/index.ts` | 환경 변수 스키마 |

### 사용 예시 파일

- `apps/web/src/app/(internal)/home/page.tsx` - 홈 마이그레이션
- `apps/web/src/app/(internal)/booking/page.tsx` - 예약 마이그레이션
- `apps/web/src/views/login/view.tsx` - 로그인 플래그
- `apps/web/src/app/(internal)/subscribes/tickets/page.tsx` - 구독 플래그 (가장 복잡한 예시)
- `apps/web/src/app/(internal)/ai-learning/page.tsx` - 포도링고 플래그

---

## 요약

포도 서비스의 피처 플래그 시스템은 Flagsmith를 기반으로 하며, Redis 캐싱을 통해 성능을 최적화합니다. 서버 사이드와 클라이언트 사이드 모두에서 사용 가능하며, 프로덕션 환경에서도 특정 사용자를 대상으로 안전하게 테스트할 수 있습니다.

**기획자/디자이너를 위한 핵심 요약**:
- 피처 플래그를 통해 **배포 없이** 기능을 켜고 끌 수 있습니다
- Flagsmith 대시보드에서 실시간으로 기능 제어 가능
- 특정 사용자 그룹에게만 기능 제공 가능 (`testable_user_id_list`)
- 문제 발생 시 즉시 기능 비활성화 가능

**개발자를 위한 핵심 요약**:
- 서버: `isEnabled()`, `getFeatureFlagValue()`
- 클라이언트: `useFeatureFlag()`, `useFlags()`
- 상수: `FEATURE_FLAG_KEYS`
- 캐시: Redis (`flagsmith:podo-app:{env}:features`)
- 환경 변수: `FLAGSMITH_ENVIRONMENT_ID`
