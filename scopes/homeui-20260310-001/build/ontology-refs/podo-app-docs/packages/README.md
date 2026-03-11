# Podo 모노레포 패키지 상세 문서

> **RAG 최적화 문서** - 각 패키지의 목적, API, 파일 구조, 사용 방법이 인덱싱되어 있습니다.

**키워드**: monorepo, pnpm workspace, shared packages, design system, feature flags, navigation, assets, icons, lottie, configuration

## 목차

- [1. @podo/assets - SVG 아이콘 및 Lottie 애니메이션](#1-podoassets)
- [2. @podo-app/design-system-temp - 임시 디자인 시스템](#2-podo-appdesign-system-temp)
- [3. @packages/design-token - 디자인 토큰 시스템](#3-packagesdesign-token)
- [4. @podo/flags - 피처 플래그 유틸리티](#4-podoflags)
- [5. @packages/navigation - 네비게이션 유틸리티](#5-packagesnavigation)
- [6. 환경 설정 (apps/web 통합)](#6-환경-설정-apps-web-통합)
- [7. @podo-app/eslint-config - ESLint 설정](#7-podo-appeslint-config)
- [8. @podo-app/prettier-config - Prettier 설정](#8-podo-appprettier-config)
- [9. @podo-app/typescript-config - TypeScript 설정](#9-podo-apptypescript-config)

---

## 1. @podo/assets

**위치**: `/packages/assets/`
**package.json**: `/packages/assets/package.json`

### 목적
SVG 아이콘과 Lottie 애니메이션 파일을 React 컴포넌트로 자동 변환하여 제공하는 패키지.

### 주요 기능
- **SVG → React 컴포넌트 자동 변환** (@svgr/core 사용)
- **Lottie JSON → React 컴포넌트 자동 변환** (react-lottie-player 사용)
- **빌드 시점 코드 생성** (tsx 스크립트)

### 빌드 프로세스

**파일**: `/packages/assets/scripts/build.ts`

```typescript
// 빌드 프로세스:
// 1. src/assets/*.svg 스캔
// 2. src/lottie/*.json 스캔
// 3. SVG → TSX 컴포넌트 생성 (PascalCaseIcon)
// 4. Lottie → TSX 컴포넌트 생성 (PascalCaseIconLottie)
// 5. src/index.ts에 모든 export 자동 생성
```

**명령어**:
```bash
pnpm -C packages/assets build
```

### 파일 구조

```
packages/assets/
├── src/
│   ├── assets/          # SVG 원본 파일
│   │   ├── app-icon.svg
│   │   ├── arrow-right.svg
│   │   ├── bell-icon.svg
│   │   └── ... (60+ SVG files)
│   ├── lottie/          # Lottie JSON 파일
│   │   ├── business-main.json
│   │   ├── level-up.json
│   │   ├── loading.json
│   │   └── ... (30+ Lottie files)
│   ├── components/      # 생성된 React 컴포넌트
│   │   ├── AppIconIcon.tsx
│   │   ├── ArrowRightIcon.tsx
│   │   ├── BusinessMainIconLottie.tsx
│   │   └── ...
│   └── index.ts         # 자동 생성된 export 파일
├── scripts/
│   └── build.ts         # 빌드 스크립트
└── package.json
```

### Exports

**주요 export**: `/packages/assets/src/index.ts`

130개 이상의 아이콘 컴포넌트:
- SVG 아이콘: `AppIconIcon`, `ArrowRightIcon`, `BellIconIcon`, ...
- Lottie 애니메이션: `AiPodoIconLottie`, `LoadingIconLottie`, `SuccessIconLottie`, ...

### 사용 방법

```tsx
// SVG 아이콘 사용
import { ArrowRightIcon, BellIconIcon } from '@podo/assets'

function MyComponent() {
  return (
    <div>
      <ArrowRightIcon className="w-6 h-6" />
      <BellIconIcon style={{ color: 'red' }} />
    </div>
  )
}

// Lottie 애니메이션 사용
import { LoadingIconLottie, SuccessIconLottie } from '@podo/assets'

function LoadingState() {
  return (
    <LoadingIconLottie
      loop={true}
      play={true}
      speed={1.5}
      className="w-24 h-24"
    />
  )
}
```

### 의존성

- `@svgr/core`: SVG를 React 컴포넌트로 변환
- `tsx`: TypeScript 실행
- `react-lottie-player` (peer dependency): Lottie 애니메이션 재생
- `next/dynamic` (peer dependency): 동적 import 지원

### 주요 특징

1. **자동화된 빌드**: SVG/Lottie 파일 추가 시 자동으로 컴포넌트 생성
2. **타입 안전성**: TypeScript로 생성된 컴포넌트
3. **중복 방지**: 같은 이름의 컴포넌트 자동 감지 및 스킵
4. **SSR 지원**: Lottie 컴포넌트는 `dynamic import`로 클라이언트 전용 렌더링

---

## 2. @podo-app/design-system-temp

**위치**: `/packages/design-system-temp/`
**package.json**: `/packages/design-system-temp/package.json`

### 목적
Podo 앱의 임시 디자인 시스템. Radix UI 기반의 UI 컴포넌트 라이브러리.

### 주요 컴포넌트 카테고리

#### Layout 컴포넌트
- **Box** (`/src/components/layout/box/`)
- **Flex** (`/src/components/layout/flex/`)
- **Stack** (`/src/components/layout/stack/`) - HStack, VStack
- **Divider** (`/src/components/layout/divider/`)
- **Spacer** (`/src/components/layout/spacer/`)

#### Typography 컴포넌트
- **Heading**, **Text**, **Label** (`/src/components/typography/`)

#### Form 컴포넌트
- **Button** (`/src/components/button/`) - v1, v2
- **Input** (`/src/components/input/`)
- **Checkbox** (`/src/components/checkbox/`) - v1, v2
- **Radio** (`/src/components/radio/`)
- **Toggle** (`/src/components/toggle/`)

#### Feedback 컴포넌트
- **Badge** (`/src/components/badge/`) - v1, v2
- **Chip** (`/src/components/chip/`) - v1, v2, v3
- **Progress** (`/src/components/progress/`)
- **Toaster** (`/src/components/toaster/`) - Sonner 기반
- **FeedbackList** (`/src/components/feedback-list/`)

#### Dialog 컴포넌트
- **AlertDialog** (`/src/components/alert-dialog/`) - v1, v2
- **ConfirmDialog** (`/src/components/confirm-dialog/`) - v1, v2
- **BottomSheet** (`/src/components/bottom-sheet/`) - Vaul 기반
- **Popover** (`/src/components/popover/`)

#### Navigation 컴포넌트
- **Tabs** (`/src/components/tabs/`) - v1, v2
- **SubTab** (`/src/components/sub-tab/`)
- **Stepper** (`/src/components/stepper/`)

#### 기타 컴포넌트
- **Icon** (`/src/components/icon/`)
- **Separator** (`/src/components/separator/`)
- **SelectableCard** (`/src/components/selectable-card/`)

### Exports

**파일**: `/packages/design-system-temp/src/index.ts`

```typescript
// 컴포넌트
export * from './components'

// 타입
export * from './types'

// 유틸리티
export * from './lib'

// 토큰
export * from './tokens'
```

**주요 export points**:
- `.` - 메인 컴포넌트
- `./third-party` - 서드파티 래퍼
- `./tailwind-configuration` - Tailwind 설정
- `./styles` - 글로벌 CSS
- `./podo-tailwind.config.ts` - Podo Tailwind 설정
- `./podo-design-token` - Podo 디자인 토큰 CSS
- `./tokens` - 토큰 유틸리티

### 파일 구조

```
packages/design-system-temp/
├── src/
│   ├── components/
│   │   ├── layout/        # Box, Flex, Stack, Divider, Spacer
│   │   ├── typography/    # Heading, Text, Label
│   │   ├── button/        # Button (v1, v2)
│   │   ├── input/         # Input
│   │   ├── checkbox/      # Checkbox (v1, v2)
│   │   ├── radio/         # Radio
│   │   ├── toggle/        # Toggle (Switch)
│   │   ├── badge/         # Badge (v1, v2)
│   │   ├── chip/          # Chip (v1, v2, v3)
│   │   ├── alert-dialog/  # AlertDialog (v1, v2)
│   │   ├── confirm-dialog/# ConfirmDialog (v1, v2)
│   │   ├── bottom-sheet/  # BottomSheet
│   │   ├── popover/       # Popover
│   │   ├── tabs/          # Tabs (v1, v2)
│   │   ├── sub-tab/       # SubTab
│   │   ├── toaster/       # Toaster (Sonner)
│   │   ├── progress/      # Progress
│   │   ├── feedback-list/ # FeedbackList
│   │   ├── icon/          # Icon
│   │   ├── separator/     # Separator
│   │   ├── stepper/       # Stepper
│   │   └── selectable-card/# SelectableCard
│   ├── types/
│   │   ├── polymorphic.type.ts
│   │   └── utility.type.ts
│   ├── lib/
│   │   └── utils.ts       # cn(), 기타 유틸리티
│   ├── tokens/
│   │   ├── vars/          # CSS 변수
│   │   └── utils/         # 토큰 유틸리티
│   ├── styles/
│   │   ├── global.css
│   │   └── podo-variables.css
│   └── index.ts
├── tailwind.config.ts
├── podo-tailwind.config.ts
└── package.json
```

### 사용 방법

```tsx
import { Button, Input, Checkbox } from '@podo-app/design-system-temp'
import { Box, Flex, Stack } from '@podo-app/design-system-temp'

function MyForm() {
  return (
    <Flex direction="column" gap="4">
      <Input placeholder="이름을 입력하세요" />
      <Checkbox label="동의합니다" />
      <Button variant="primary" size="lg">
        제출
      </Button>
    </Flex>
  )
}
```

**Tailwind 설정 import**:
```js
// tailwind.config.js
import podoConfig from '@podo-app/design-system-temp/podo-tailwind.config.ts'

export default podoConfig
```

**CSS 변수 import**:
```css
/* app.css */
@import '@podo-app/design-system-temp/podo-design-token';
```

### 의존성

**UI 라이브러리**:
- `@radix-ui/*`: 14개 Radix UI 패키지 (dialog, popover, tabs, switch 등)
- `sonner`: Toast 알림
- `vaul`: 바텀시트
- `lucide-react`: 아이콘

**스타일링**:
- `tailwindcss`: CSS 프레임워크
- `class-variance-authority` (CVA): 컴포넌트 variant 관리
- `tailwind-merge`: Tailwind 클래스 병합
- `clsx`: 클래스명 조건부 처리

**유틸리티**:
- `es-toolkit`: 유틸리티 함수

### 주요 특징

1. **버전 관리**: 컴포넌트별 v1, v2, v3 버전 유지 (하위 호환성)
2. **Radix UI 기반**: 접근성과 키보드 내비게이션 지원
3. **Tailwind CSS**: 유틸리티 기반 스타일링
4. **타입 안전성**: TypeScript 완전 지원
5. **Polymorphic 컴포넌트**: `asChild` prop으로 렌더링 요소 변경 가능
6. **디자인 토큰 통합**: `@packages/design-token` 패키지 의존

---

## 3. @packages/design-token

**위치**: `/packages/design-token/`
**package.json**: `/packages/design-token/package.json`

### 목적
디자인 토큰 시스템. 3단계 토큰 계층 구조로 일관된 디자인 시스템 제공.

### 토큰 계층 구조

```
Static Tokens (정적)
    ↓
Semantic Tokens (의미론적)
    ↓
Scale Tokens (스케일) - Podo/Tutor 브랜드별
```

#### 1. Static Tokens
**파일**: `/packages/design-token/src/vars/static/`

기본적인 원자 단위 토큰:
- **Color** (`color.ts`): 원색 팔레트 (primary, secondary, gray, red, ...)
- **Typography** (`typography.ts`): 폰트 크기, 라인 높이, 폰트 패밀리
- **Space** (`space.ts`): 간격 단위 (0, 1, 2, 4, 8, ...)
- **Size** (`size.ts`): 크기 단위
- **Border** (`border.ts`): 테두리 반경, 너비
- **Elevation** (`elevation.ts`): 그림자 스타일
- **Layer** (`layer.ts`): z-index 레이어
- **Motion** (`motion.ts`): 애니메이션 duration, easing

#### 2. Semantic Tokens
**파일**: `/packages/design-token/src/vars/semantic/`

의미론적 토큰 (Static을 참조):
- **Color** (`color.ts`): `text-primary`, `bg-surface`, `border-default`
- **Typography** (`typography.ts`): `heading-lg`, `body-md`, `caption-sm`
- **Space** (`space.ts`): `spacing-component`, `spacing-layout`
- **Elevation** (`elevation.ts`): `shadow-sm`, `shadow-md`, `shadow-lg`
- **Layer** (`layer.ts`): `layer-modal`, `layer-dropdown`
- **Motion** (`motion.ts`): `transition-fast`, `transition-normal`

#### 3. Scale Tokens (브랜드별)
**파일**: `/packages/design-token/src/vars/scale/`

브랜드별 최종 토큰:

**Podo**: `/packages/design-token/src/vars/scale/podo/index.ts`
**Tutor**: `/packages/design-token/src/vars/scale/tutor/`
- `button.ts`: 버튼 스타일
- `color.ts`: 브랜드 색상
- `typography.ts`: 브랜드 타이포그래피

### Exports

**파일**: `/packages/design-token/src/index.ts`

```typescript
export { tailwindColors } from './tailwind-colors'
export * as utils from './utils'
export * as vars from './vars'
```

**Export points**:
- `.` - 메인 엔트리
- `./podo-tailwind.config.ts` - Podo Tailwind 설정
- `./podo-design-token` - Podo CSS 변수 파일

### 빌드 프로세스

**명령어**:
```bash
pnpm -C packages/design-token build
```

**빌드 단계**:
1. `tsup`: TypeScript → JavaScript/MJS 번들링
2. `build:podo-token`: Style Dictionary로 토큰 → CSS 변수 생성
3. `build:podo-tailwind`: Tailwind 설정 파일 생성

**Style Dictionary 설정**: `/packages/design-token/config/podo-style-dictionary.ts`
**Tailwind 설정**: `/packages/design-token/config/podo.tailwindcss.ts`

**생성 결과**:
- `/build/css/podo-variables.css` - CSS 변수
- `/build/podo-tailwind.config.ts` - Tailwind 설정

### 파일 구조

```
packages/design-token/
├── src/
│   ├── vars/
│   │   ├── static/         # Static 토큰
│   │   │   ├── color.ts
│   │   │   ├── typography.ts
│   │   │   ├── space.ts
│   │   │   ├── size.ts
│   │   │   ├── border.ts
│   │   │   ├── elevation.ts
│   │   │   ├── layer.ts
│   │   │   └── motion.ts
│   │   ├── semantic/       # Semantic 토큰
│   │   │   ├── color.ts
│   │   │   ├── typography.ts
│   │   │   ├── space.ts
│   │   │   ├── elevation.ts
│   │   │   ├── layer.ts
│   │   │   └── motion.ts
│   │   └── scale/          # Scale 토큰
│   │       ├── podo/
│   │       │   └── index.ts
│   │       └── tutor/
│   │           ├── button.ts
│   │           ├── color.ts
│   │           └── typography.ts
│   ├── utils/
│   │   ├── extractCssVarName.ts
│   │   └── index.ts
│   ├── tailwind-colors.ts
│   └── index.ts
├── tokens/
│   ├── podo-web/v1/podo-design-token.json
│   └── podo-web/v2/podo-design-token.json
├── config/
│   ├── constants.ts
│   ├── podo-style-dictionary.ts
│   └── podo.tailwindcss.ts
├── build/                  # 빌드 결과 (생성됨)
│   ├── css/
│   │   └── podo-variables.css
│   └── podo-tailwind.config.ts
└── package.json
```

### 사용 방법

**CSS 변수 사용**:
```css
/* CSS에서 직접 사용 */
.my-component {
  color: var(--podo-color-text-primary);
  background: var(--podo-color-bg-surface);
  padding: var(--podo-space-4);
  border-radius: var(--podo-border-radius-md);
}
```

**TypeScript에서 사용**:
```typescript
import { vars } from '@packages/design-token'

const { $static, $semantic, $scale } = vars

console.log($static.color.primary500) // '#3B82F6'
console.log($semantic.color.textPrimary) // 'var(--color-text-primary)'
```

**Tailwind 설정**:
```js
// tailwind.config.js
import podoConfig from '@packages/design-token/podo-tailwind.config.ts'

export default {
  ...podoConfig,
  // 추가 설정
}
```

### 의존성

- `style-dictionary`: 디자인 토큰 빌드 도구
- `tailwindcss`: Tailwind CSS 설정 생성
- `tsup`: TypeScript 번들러

### 주요 특징

1. **3단계 토큰 계층**: Static → Semantic → Scale
2. **브랜드별 커스터마이징**: Podo/Tutor 각각 별도 토큰
3. **자동 CSS 변수 생성**: Style Dictionary 활용
4. **Tailwind 통합**: Tailwind 설정 자동 생성
5. **타입 안전성**: TypeScript로 토큰 정의

---

## 4. @podo/flags

**위치**: `/packages/flags/`
**package.json**: `/packages/flags/package.json`

### 목적
Flagsmith 기반 피처 플래그 시스템. Redis 캐싱을 통한 고성능 피처 플래그 관리.

### 주요 기능

1. **Redis 캐싱**: 피처 플래그를 Redis에 캐싱하여 성능 향상
2. **타입 안전성**: TypeScript 타입 정의
3. **에러 처리**: 안전한 폴백 값 제공

### Exports

**파일**: `/packages/flags/src/index.ts`

```typescript
export const getCachedFeatureFlagV2 = async (
  redis: IoRedis,
  key: string
): Promise<FeatureFlagResponse>

export type FeatureFlag = {
  id: number
  name: string
  type: string
  default_enabled: boolean
  environment_feature_state: {
    enabled: boolean
    feature_state_value: string
  }
  // ... 기타 필드
}

export type FeatureFlagResponse = {
  count: number
  results: FeatureFlag[]
  isSuccess: boolean
}
```

### 파일 구조

```
packages/flags/
├── src/
│   └── index.ts          # 메인 유틸리티
└── package.json
```

### 사용 방법

```typescript
import { getCachedFeatureFlagV2 } from '@podo/flags'
import Redis from 'ioredis'

const redis = new Redis()

// 피처 플래그 가져오기
const flags = await getCachedFeatureFlagV2(redis, 'feature-flags:v2:prod')

if (flags.isSuccess) {
  const enabledFlags = flags.results.filter(
    (flag) => flag.environment_feature_state.enabled
  )
  console.log('Enabled flags:', enabledFlags)
}

// 특정 플래그 확인
const myFeature = flags.results.find((f) => f.name === 'my-feature')
if (myFeature?.environment_feature_state.enabled) {
  // 기능 활성화
}
```

### 의존성

- `ioredis`: Redis 클라이언트
- `pino`: 로깅 라이브러리
- `pino-pretty`: 로그 포매터

### 주요 특징

1. **캐싱 우선**: Redis 캐시를 먼저 확인하여 성능 최적화
2. **안전한 폴백**: Redis 에러 시 빈 응답 반환
3. **타입 안전성**: FeatureFlag, FeatureFlagResponse 타입 제공

---

## 5. @packages/navigation

**위치**: `/packages/navigation/`
**package.json**: `/packages/navigation/package.json`

### 목적
라우팅 및 네비게이션 유틸리티. 피처 플래그 기반 동적 라우팅 지원.

### 주요 모듈

#### 1. URL Builders
**위치**: `/packages/navigation/src/builders/`

타입 안전한 URL 생성:
- `buildBookingUrl`: 예약 페이지 URL
- `buildClassroomUrl`: 클래스룸 URL
- `buildFeatureFlagUrl`: 피처 플래그 기반 URL
- `buildFeatureFlagBookingUrl`: 피처 플래그 기반 예약 URL
- `buildHomeUrl`: 홈 URL
- `buildReservationUrl`: 예약 관리 URL
- `buildTopicSelectUrl`: 주제 선택 URL
- `buildSubscribesUrl`: 구독 URL

#### 2. Validators
**위치**: `/packages/navigation/src/validators/`

Zod 기반 파라미터 검증:
- `bookingParamsSchema`: 예약 파라미터 검증
- `classroomParamsSchema`: 클래스룸 파라미터 검증

#### 3. React Hooks
**위치**: `/packages/navigation/src/react/hooks/`

React에서 사용할 수 있는 네비게이션 훅:
- `useBookingNavigation`: 예약 네비게이션
- `useClassroomNavigation`: 클래스룸 네비게이션
- `useFeatureFlagNavigation`: 피처 플래그 네비게이션
- `useFeatureAwareUrls`: 피처 플래그 인식 URL

#### 4. Utilities
**위치**: `/packages/navigation/src/utils/`

- `navigateToHome`: 홈으로 이동
- `cross-framework-bridge`: 프레임워크 간 브릿지
- `parameter-serializer`: 파라미터 직렬화
- `feature-flag-resolver`: 피처 플래그 해석

### Exports

**파일**: `/packages/navigation/src/index.ts`

```typescript
// Builders
export * from './builders'
export { buildFeatureFlagBookingUrl } from './builders/feature-flag-booking-url'

// Types
export * from './types'

// Utils
export * from './utils'
export { navigateToHome } from './utils/navigation'

// Validators
export * from './validators'
```

**Export points**:
- `.` - 코어 유틸리티
- `./react` - React 전용 훅

### 파일 구조

```
packages/navigation/
├── src/
│   ├── builders/
│   │   ├── booking-url.ts
│   │   ├── classroom-url.ts
│   │   ├── feature-flag-booking-url.ts
│   │   ├── feature-flag-url.ts
│   │   ├── home-url.ts
│   │   ├── reservation-url.ts
│   │   ├── topic-select-url.ts
│   │   ├── subscribes-url.ts
│   │   └── index.ts
│   ├── validators/
│   │   ├── booking-params.ts
│   │   ├── classroom-params.ts
│   │   └── index.ts
│   ├── react/
│   │   ├── hooks/
│   │   │   ├── use-booking-navigation.ts
│   │   │   ├── use-classroom-navigation.ts
│   │   │   ├── use-feature-flag-navigation.ts
│   │   │   ├── use-feature-aware-urls.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── cross-framework-bridge.ts
│   │   ├── navigation.ts
│   │   ├── parameter-serializer.ts
│   │   ├── feature-flag-resolver.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── navigation.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

### 사용 방법

**URL 빌더 사용**:
```typescript
import { buildBookingUrl, buildClassroomUrl } from '@packages/navigation'

// 예약 URL 생성
const bookingUrl = buildBookingUrl({
  scheduleId: '123',
  tutorId: '456',
})
// → '/booking?scheduleId=123&tutorId=456'

// 클래스룸 URL 생성
const classroomUrl = buildClassroomUrl({
  classroomId: '789',
})
// → '/classroom/789'
```

**React 훅 사용**:
```tsx
import { useBookingNavigation } from '@packages/navigation/react'

function BookingButton() {
  const { navigateToBooking } = useBookingNavigation()

  const handleClick = () => {
    navigateToBooking({
      scheduleId: '123',
      tutorId: '456',
    })
  }

  return <button onClick={handleClick}>예약하기</button>
}
```

**피처 플래그 기반 네비게이션**:
```typescript
import { buildFeatureFlagBookingUrl } from '@packages/navigation'

// 피처 플래그에 따라 다른 URL 생성
const url = buildFeatureFlagBookingUrl(
  { scheduleId: '123' },
  { newBookingFlow: true } // 피처 플래그
)
// newBookingFlow가 true면 → '/booking/v2?scheduleId=123'
// newBookingFlow가 false면 → '/booking?scheduleId=123'
```

### 의존성

- `zod`: 파라미터 검증
- `react` (peer): React 훅 지원
- `vitest`: 유닛 테스트

### 주요 특징

1. **타입 안전성**: Zod로 파라미터 검증
2. **피처 플래그 통합**: 동적 라우팅 지원
3. **프레임워크 독립적**: Next.js, Nuxt.js 모두 지원
4. **React 훅 제공**: React 프로젝트에서 쉽게 사용
5. **테스트 가능**: Vitest로 유닛 테스트 작성

---

## 6. 환경 설정 (apps/web 통합)

**위치**: `apps/web/src/shared/config/env/`

### 목적
환경 변수 검증 및 타입 안전성 제공. `@t3-oss/env-nextjs`와 Zod를 사용하여 런타임 환경 변수 검증.

### 환경 변수 카테고리

#### 1. Server-side 환경 변수
- **데이터베이스**: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- **인증**: `JWT_SECRET`
- **AWS**: `AWS_ACCOUNT_ID`, `SQS_QUEUE_URL`
- **결제 (IamPort)**: `IMP_KEY`, `IMP_SECRET`, `IMP_*_CHANNEL_KEY`
- **OAuth**: `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_OAUTH_KEY`
- **기타**: `REVALIDATE_KEY`, `CDN_BASE_URL`, `NOTION_API_KEY`

#### 2. Client-side 환경 변수
- **URL**: `NEXT_PUBLIC_PODO_APP_URL`, `NEXT_PUBLIC_PODO_WEB_URL`, `NEXT_PUBLIC_PODO_ADMIN_URL`
- **결제**: `NEXT_PUBLIC_IMP_CUSTOMER_KEY`, `NEXT_PUBLIC_IMP_*_CHANNEL_KEY`
- **외부 서비스**: `NEXT_PUBLIC_KAKAO_CLIENT_ID`, `NEXT_PUBLIC_KAKAO_JS_SDK_KEY`
- **분석**: `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`

#### 3. Shared 환경 변수
- `NODE_ENV`: 환경 (development, production, test)
- `NEXT_PUBLIC_APP_ENV`: 앱 환경 (local, development, staging, production, temp)
- `NEXT_PUBLIC_API_URL`: API 서버 URL
- `NEXT_PUBLIC_PODO_API_URL`: Podo API URL

### Exports

**파일**: `apps/web/src/shared/config/env/index.ts`

```typescript
export const env = {
  // Server
  DATABASE_URL: string
  JWT_SECRET: string
  // ... 기타 서버 변수

  // Client
  NEXT_PUBLIC_PODO_APP_URL: string
  NEXT_PUBLIC_KAKAO_CLIENT_ID: string
  // ... 기타 클라이언트 변수

  // Shared
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_ENV: 'local' | 'development' | 'staging' | 'production' | 'temp'
}

export type Env = typeof env

export const featureFlagEnvSchemaMap = {
  local: 'development',
  development: 'development',
  staging: 'staging',
  production: 'production',
  temp: 'temp',
} as const

export * from './schemas'
```

### 파일 구조

```
apps/web/src/shared/config/env/
├── index.ts           # env 객체 (createEnv)
└── schemas.ts         # 공통 스키마 정의
```

### 사용 방법

```typescript
// Next.js 앱에서 사용
import { env } from '@shared/config/env'

// Server-side에서만 사용 가능
console.log(env.DATABASE_URL)
console.log(env.JWT_SECRET)

// Client-side에서 사용 가능
console.log(env.NEXT_PUBLIC_PODO_APP_URL)
console.log(env.NEXT_PUBLIC_KAKAO_CLIENT_ID)

// Shared (어디서나 사용 가능)
console.log(env.NODE_ENV)
console.log(env.NEXT_PUBLIC_APP_ENV)
```

### 검증 동작

```typescript
// 환경 변수가 누락되면 빌드 타임에 에러 발생
// .env 파일 예시:
// DATABASE_URL=postgresql://...
// JWT_SECRET=secret123
// NEXT_PUBLIC_PODO_APP_URL=https://podo.app

// 잘못된 형식이면 에러 발생
// DATABASE_URL=invalid-url  // ❌ URL 형식 아님
// DATABASE_URL=postgresql://... // ✅
```

### 의존성

- `@t3-oss/env-nextjs`: Next.js 환경 변수 검증
- `zod`: 스키마 검증

### 주요 특징

1. **타입 안전성**: TypeScript로 env 타입 제공
2. **런타임 검증**: Zod로 환경 변수 검증
3. **서버/클라이언트 분리**: 서버 변수가 클라이언트에 노출되지 않도록 보호
4. **멀티 환경 지원**: local, development, staging, production, temp

---

## 7. @podo-app/eslint-config

**위치**: `/packages/config/eslint/`
**package.json**: `/packages/config/eslint/package.json`

### 목적
모노레포 전체에 적용되는 ESLint 설정. ESLint 9 Flat Config 형식 사용.

### 설정 파일

#### 1. Base Config
**파일**: `/packages/config/eslint/base.mjs`

기본 JavaScript/TypeScript 린팅 규칙:
- **JavaScript**: ESLint recommended, no-var, prefer-const, eqeqeq
- **TypeScript**: typescript-eslint recommended, naming-convention
- **Import**: simple-import-sort, import-plugin
- **Prettier**: prettier-recommended

#### 2. React Config
**파일**: `/packages/config/eslint/react.mjs`

React 전용 규칙:
- **React**: react-hooks, react-refresh
- **JSX**: jsx-a11y (접근성)

#### 3. Next Config
**파일**: `/packages/config/eslint/next.mjs`

Next.js 전용 규칙:
- **Next.js**: @next/eslint-plugin-next
- **Feature-Sliced Design**: boundaries, import-organization

### Exports

**파일**: `/packages/config/eslint/package.json`

```json
{
  "exports": {
    "./base": "./base.mjs",
    "./react": "./react.mjs",
    "./next": "./next.mjs"
  }
}
```

### 파일 구조

```
packages/config/eslint/
├── base.mjs              # 기본 설정
├── react.mjs             # React 설정
├── next.mjs              # Next.js 설정
├── .eslintrc.cjs         # 레거시 설정 (deprecated)
└── package.json
```

### 주요 규칙

**JavaScript**:
- `curly: ['warn', 'all']` - 모든 블록에 중괄호 필수
- `eqeqeq: 'error'` - `===` 사용 강제
- `no-console: ['warn', { allow: ['warn', 'error'] }]` - console.log 경고
- `prefer-const: 'warn'` - const 사용 권장

**TypeScript**:
- `@typescript-eslint/naming-convention` - 네이밍 규칙 강제
- `@typescript-eslint/no-explicit-any: 'warn'` - any 사용 경고
- `@typescript-eslint/no-unused-vars` - 미사용 변수 에러

**Import**:
- `simple-import-sort/imports: 'warn'` - import 자동 정렬
- `simple-import-sort/exports: 'warn'` - export 자동 정렬
- `import/newline-after-import: 'warn'` - import 후 빈 줄

**React**:
- `react-hooks/rules-of-hooks: 'error'` - 훅 규칙
- `react-hooks/exhaustive-deps: 'warn'` - 의존성 배열

### 사용 방법

**Base 설정**:
```js
// eslint.config.js
import baseConfig from '@podo-app/eslint-config/base'

export default [
  ...baseConfig,
  // 추가 설정
]
```

**React 설정**:
```js
// eslint.config.js
import reactConfig from '@podo-app/eslint-config/react'

export default [
  ...reactConfig,
  // 추가 설정
]
```

**Next.js 설정**:
```js
// eslint.config.js
import nextConfig from '@podo-app/eslint-config/next'

export default [
  ...nextConfig,
  // 추가 설정
]
```

### 의존성

**ESLint 코어**:
- `eslint`: 린터
- `@eslint/js`: JavaScript 규칙
- `typescript-eslint`: TypeScript 지원

**플러그인**:
- `eslint-plugin-import`: import/export 규칙
- `eslint-plugin-simple-import-sort`: import 자동 정렬
- `eslint-plugin-prettier`: Prettier 통합
- `eslint-plugin-react`: React 규칙
- `eslint-plugin-react-hooks`: React Hooks 규칙
- `eslint-plugin-jsx-a11y`: 접근성 규칙
- `@next/eslint-plugin-next`: Next.js 규칙
- `eslint-plugin-boundaries`: 아키텍처 경계

### 주요 특징

1. **ESLint 9 Flat Config**: 최신 설정 형식
2. **모노레포 공유**: 모든 앱/패키지에서 동일한 규칙
3. **TypeScript 완전 지원**: typescript-eslint 통합
4. **Import 자동 정렬**: simple-import-sort 플러그인
5. **Prettier 통합**: 코드 포매팅 자동화
6. **아키텍처 강제**: boundaries 플러그인으로 Feature-Sliced Design 적용

---

## 8. @podo-app/prettier-config

**위치**: `/packages/config/prettier/`
**package.json**: `/packages/config/prettier/package.json`

### 목적
모노레포 전체에 적용되는 Prettier 설정. 일관된 코드 포매팅 규칙 제공.

### 설정 내용

**파일**: `/packages/config/prettier/base.cjs`

```js
module.exports = {
  printWidth: 120,           // 한 줄 최대 길이 120
  tabWidth: 2,               // 탭 너비 2칸
  useTabs: false,            // 스페이스 사용
  semi: false,               // 세미콜론 생략
  singleQuote: true,         // 싱글 쿼트 사용
  trailingComma: 'all',      // 후행 쉼표 항상
  arrowParens: 'always',     // 화살표 함수 괄호 항상
  endOfLine: 'lf',           // LF 줄바꿈

  plugins: ['prettier-plugin-packagejson'], // package.json 정렬
}
```

### Exports

**파일**: `/packages/config/prettier/package.json`

```json
{
  "main": "base.cjs"
}
```

### 파일 구조

```
packages/config/prettier/
├── base.cjs              # 설정 파일
└── package.json
```

### 사용 방법

**package.json에서 참조**:
```json
{
  "prettier": "@podo-app/prettier-config"
}
```

**또는 .prettierrc.js**:
```js
module.exports = require('@podo-app/prettier-config')
```

**VSCode 설정**:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### 의존성

- `prettier`: 코드 포매터
- `prettier-plugin-packagejson`: package.json 정렬 플러그인

### 주요 특징

1. **일관된 포매팅**: 모노레포 전체 동일한 규칙
2. **자동 정렬**: package.json 자동 정렬
3. **세미콜론 생략**: 간결한 코드 스타일
4. **싱글 쿼트**: 일관된 문자열 표기

---

## 9. @podo-app/typescript-config

**위치**: `/packages/config/typescript/`
**package.json**: `/packages/config/typescript/package.json`

### 목적
모노레포 전체에 적용되는 TypeScript 설정. 프로젝트 타입별로 다른 설정 제공.

### 설정 파일

#### 1. Base Config
**파일**: `/packages/config/typescript/base.json`

모든 프로젝트의 기본 설정:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

#### 2. React Config
**파일**: `/packages/config/typescript/react.json`

React 프로젝트용:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```

#### 3. Next.js Config
**파일**: `/packages/config/typescript/nextjs.json`

Next.js 프로젝트용:
```json
{
  "extends": "./react.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "esnext",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 4. React Native Config
**파일**: `/packages/config/typescript/react-native.json`

React Native 프로젝트용:
```json
{
  "extends": "./react.json",
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "commonjs"
  }
}
```

### 파일 구조

```
packages/config/typescript/
├── base.json             # 기본 설정
├── react.json            # React 설정
├── nextjs.json           # Next.js 설정
├── react-native.json     # React Native 설정
└── package.json
```

### 사용 방법

**Next.js 프로젝트**:
```json
// tsconfig.json
{
  "extends": "@podo-app/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**React 프로젝트**:
```json
// tsconfig.json
{
  "extends": "@podo-app/typescript-config/react.json",
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**패키지 (라이브러리)**:
```json
// tsconfig.json
{
  "extends": "@podo-app/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 주요 특징

1. **엄격한 타입 체크**: `strict: true`, `strictNullChecks: true`
2. **프로젝트별 최적화**: Next.js, React, React Native 각각 최적 설정
3. **모듈 해석**: Node 방식 모듈 해석
4. **선언 파일 생성**: `declaration: true`, `declarationMap: true`
5. **일관성 강제**: `forceConsistentCasingInFileNames: true`

---

## 패키지 간 의존성 그래프

```
apps/web
├── @podo/assets
├── @podo-app/design-system-temp
│   └── @packages/design-token
├── @podo/flags
├── @packages/navigation
├── @podo-app/eslint-config
├── @podo-app/prettier-config
└── @podo-app/typescript-config

apps/native
├── @podo/assets
├── @podo/flags
├── @packages/navigation
└── ... (기타 설정)

design-system/*
├── @packages/design-token
└── ... (기타 설정)
```

---

## 검색 키워드 인덱스

### 아이콘 및 애셋
- SVG icon, Lottie animation, @podo/assets
- react component generation, @svgr/core
- icon library, asset management

### 디자인 시스템
- design system, UI components, Radix UI
- @podo-app/design-system-temp, design tokens
- Tailwind CSS, CVA, class-variance-authority
- button, input, checkbox, dialog, toast

### 디자인 토큰
- design tokens, CSS variables, Style Dictionary
- @packages/design-token, static semantic scale
- Podo tokens, Tutor tokens, brand tokens
- color, typography, spacing, elevation

### 피처 플래그
- feature flags, Flagsmith, Redis caching
- @podo/flags, feature toggle
- runtime configuration, A/B testing

### 네비게이션
- navigation, routing, URL builder
- @packages/navigation, feature flag routing
- React hooks, type-safe navigation
- Zod validation, parameter serialization

### 환경 설정
- environment variables, env config, @t3-oss/env-nextjs
- apps/web/src/shared/config/env, Zod validation
- server-side env, client-side env, shared env
- runtime validation, type-safe env

### 코드 품질
- ESLint config, Prettier config, TypeScript config
- @podo-app/eslint-config, @podo-app/prettier-config
- @podo-app/typescript-config
- linting rules, code formatting, type checking
- monorepo configuration, shared config

### 빌드 및 도구
- pnpm workspace, monorepo, Turbo
- tsup, Style Dictionary, @svgr/core
- build tools, code generation, bundling

---

## 관련 파일 경로 인덱스

### @podo/assets
- `/packages/assets/package.json`
- `/packages/assets/src/index.ts`
- `/packages/assets/src/assets/` (SVG 파일)
- `/packages/assets/src/lottie/` (Lottie JSON)
- `/packages/assets/src/components/` (생성된 컴포넌트)
- `/packages/assets/scripts/build.ts`

### @podo-app/design-system-temp
- `/packages/design-system-temp/package.json`
- `/packages/design-system-temp/src/index.ts`
- `/packages/design-system-temp/src/components/`
- `/packages/design-system-temp/src/tokens/`
- `/packages/design-system-temp/src/lib/`
- `/packages/design-system-temp/tailwind.config.ts`
- `/packages/design-system-temp/podo-tailwind.config.ts`

### @packages/design-token
- `/packages/design-token/package.json`
- `/packages/design-token/src/index.ts`
- `/packages/design-token/src/vars/static/`
- `/packages/design-token/src/vars/semantic/`
- `/packages/design-token/src/vars/scale/`
- `/packages/design-token/config/podo-style-dictionary.ts`
- `/packages/design-token/config/podo.tailwindcss.ts`
- `/packages/design-token/build/` (빌드 결과)

### @podo/flags
- `/packages/flags/package.json`
- `/packages/flags/src/index.ts`

### @packages/navigation
- `/packages/navigation/package.json`
- `/packages/navigation/src/index.ts`
- `/packages/navigation/src/builders/`
- `/packages/navigation/src/validators/`
- `/packages/navigation/src/react/hooks/`
- `/packages/navigation/src/utils/`

### 환경 설정 (apps/web 통합)
- `apps/web/src/shared/config/env/index.ts`
- `apps/web/src/shared/config/env/schemas.ts`

### @podo-app/eslint-config
- `/packages/config/eslint/package.json`
- `/packages/config/eslint/base.mjs`
- `/packages/config/eslint/react.mjs`
- `/packages/config/eslint/next.mjs`

### @podo-app/prettier-config
- `/packages/config/prettier/package.json`
- `/packages/config/prettier/base.cjs`

### @podo-app/typescript-config
- `/packages/config/typescript/package.json`
- `/packages/config/typescript/base.json`
- `/packages/config/typescript/react.json`
- `/packages/config/typescript/nextjs.json`
- `/packages/config/typescript/react-native.json`

---

## 빠른 참조

### 새 아이콘 추가
1. SVG 파일을 `/packages/assets/src/assets/` 추가
2. `pnpm -C packages/assets build` 실행
3. `@podo/assets`에서 자동으로 export됨

### 새 디자인 토큰 추가
1. `/packages/design-token/src/vars/static/` 또는 `semantic/`에 토큰 정의
2. `pnpm -C packages/design-token build` 실행
3. CSS 변수와 Tailwind 설정 자동 생성됨

### 새 컴포넌트 추가
1. `/packages/design-system-temp/src/components/` 아래에 컴포넌트 생성
2. `/packages/design-system-temp/src/components/index.ts`에 export 추가
3. `@podo-app/design-system-temp`에서 사용 가능

### 환경 변수 추가
1. `apps/web/src/shared/config/env/schemas.ts`에 스키마 정의
2. `apps/web/src/shared/config/env/index.ts`에 추가
3. 앱의 `.env` 파일에 값 추가

### ESLint 규칙 수정
1. `/packages/config/eslint/base.mjs` (또는 react.mjs, next.mjs) 수정
2. 모든 앱에 자동 적용됨 (재시작 필요)
