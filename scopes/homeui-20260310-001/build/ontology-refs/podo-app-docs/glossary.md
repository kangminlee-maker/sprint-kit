# 포도 서비스 용어집 (Glossary)

> 기획자와 디자이너를 위한 포도 서비스 용어 설명서

---

## 1. 서비스 용어

### 비즈니스 핵심 용어

#### 수업 (Lesson)
- **설명**: 튜터와 학생이 진행하는 영어 학습 세션
- **유형**:
  - **정규 수업 (Regular Lesson)**: 구독 중인 학생의 일반 수업
  - **체험 수업 (Trial Lesson)**: 신규 가입자를 위한 무료 체험 수업
  - **AI 학습 (AI Learning)**: AI 캐릭터와 진행하는 자동화 학습
- **관련 화면**: `/lessons/regular`, `/lessons/trial`, `/lessons/ai`
- **관련 파일**: `apps/web/src/features/src/lesson`, `apps/web/src/entities/src/lesson`

#### 예약 (Booking)
- **설명**: 수업 일정을 선택하고 확정하는 프로세스
- **기능**: 수업 시간 선택, 튜터 선택, 예약 변경/취소
- **관련 화면**: `/booking`
- **관련 파일**: `apps/web/src/features/src/booking-lesson`, `apps/web/src/views/booking`

#### 구독 (Subscribe/Subscription)
- **설명**: 정기 결제를 통한 수업 이용권 구매
- **유형**:
  - **정기 구독 (Regular Subscribe)**: 월 단위 자동 결제
  - **이용권 (Ticket)**: 횟수 기반 수업권
  - **스마트톡 (Smart Talk)**: 특정 패키지 상품
- **관련 화면**: `/subscribes`, `/subscribes/tickets`, `/subscribes/trial`
- **관련 파일**: `apps/web/src/features/src/subscribes`, `apps/web/src/entities/src/subscribes`

#### 교실 (Classroom)
- **설명**: 실시간 화상 수업이 진행되는 가상 공간
- **기능**: 화상 통화, 화이트보드, 수업 자료 공유
- **관련 화면**: `/lessons/classroom/[classID]`
- **관련 파일**: `apps/web/src/views/class-room`

#### 레슨 리포트 (Lesson Report)
- **설명**: 수업 완료 후 튜터가 작성하는 피드백 리포트
- **포함 내용**: 학습 평가, 강점/약점, 다음 수업 추천사항
- **관련 화면**: `/lessons/classroom/[classID]/report`
- **관련 파일**: `apps/web/src/features/src/lesson-report`, `apps/web/src/views/lesson-report`

#### 수업 리뷰 (Lesson Review)
- **설명**: 학생이 수업 완료 후 작성하는 평가 및 피드백
- **관련 화면**: `/lessons/classroom/[classID]/review`
- **관련 파일**: `apps/web/src/features/src/lesson-review`, `apps/web/src/views/lesson-review`

#### 쿠폰 (Coupon)
- **설명**: 결제 시 할인 또는 혜택을 제공하는 프로모션 코드
- **기능**: 쿠폰 등록, 사용 가능 쿠폰 조회, 사용 내역
- **관련 화면**: `/my-podo/coupon`
- **관련 파일**: `apps/web/src/features/src/coupon`, `apps/web/src/entities/src/coupon`

---

### 사용자 유형

#### 학생 (Student/User)
- **설명**: 영어 학습 서비스를 이용하는 주 사용자 (부모 포함)
- **주요 기능**: 수업 예약, 수업 참여, 학습 진도 확인
- **관련 파일**: `apps/web/src/entities/src/users`

#### 튜터 (Tutor)
- **설명**: 영어 수업을 진행하는 강사
- **주요 기능**: 수업 진행, 리포트 작성, 프로필 관리
- **참고**: 튜터용 앱은 별도의 React Native 앱으로 제공 (`apps/native`)
- **관련 파일**: `apps/web/src/entities/src/tutor`

---

## 2. 페이지/화면 용어

### 메인 화면

#### 홈 (Home)
- **경로**: `/home`
- **목적**: 서비스의 메인 랜딩 페이지
- **주요 기능**:
  - 인사말 섹션 (Greeting)
  - 다음 수업 안내
  - 학습 진도 현황
  - 튜터 추천
- **관련 파일**: `apps/web/src/app/(internal)/home/page.tsx`, `apps/web/src/views/home`
- **피처 플래그**: `enable_react_home` (React 버전 홈 활성화)

#### 예약 페이지 (Booking)
- **경로**: `/booking`
- **목적**: 수업 일정 선택 및 예약
- **주요 기능**:
  - 타임블록 선택
  - 튜터 선택
  - 예약 확정/수정/취소
- **관련 파일**: `apps/web/src/app/(internal)/booking/page.tsx`, `apps/web/src/views/booking`
- **피처 플래그**: `migration_booking_react` (React 버전 예약 페이지 활성화)

#### 예약 현황 (Reservation)
- **경로**: `/reservation`
- **목적**: 예약된 수업 목록 및 관리
- **주요 기능**: 예약 조회, 취소, 변경
- **관련 파일**: `apps/web/src/app/(internal)/reservation/page.tsx`, `apps/web/src/views/reservation`

---

### 수업 관련 화면

#### AI 학습 홈 (AI Learning)
- **경로**: `/ai-learning`, `/home/ai`
- **목적**: AI 캐릭터와 진행하는 자율 학습
- **주요 기능**: AI 대화, 학습 코스 선택, 진도 확인
- **관련 파일**: `apps/web/src/app/(internal)/ai-learning/page.tsx`, `apps/web/src/views/ai-learning`

#### 정규 수업 상세 (Regular Lesson Detail)
- **경로**: `/lessons/regular`
- **목적**: 예약된 정규 수업 상세 정보
- **관련 파일**: `apps/web/src/app/(internal)/lessons/regular/page.tsx`

#### 체험 수업 상세 (Trial Lesson Detail)
- **경로**: `/lessons/trial`
- **목적**: 체험 수업 신청 및 상세 정보
- **관련 파일**: `apps/web/src/app/(internal)/lessons/trial/page.tsx`

#### 교실 (Classroom)
- **경로**: `/lessons/classroom/[classID]`
- **목적**: 실시간 화상 수업 진행
- **주요 기능**: 화상 통화, 화이트보드, 자료 공유
- **관련 파일**: `apps/web/src/app/(internal)/lessons/classroom/[classID]/page.tsx`

#### 수업 준비 (Class Preparation / Pre-study)
- **설명**: 수업 전 사전 학습 콘텐츠
- **주요 기능**: 사전 학습 완료 여부 체크, 알림
- **관련 파일**: `apps/web/src/features/src/class-preparation`, `apps/web/src/entities/src/pre-study`

---

### 마이 페이지

#### 마이 포도 (My Podo)
- **경로**: `/my-podo`
- **목적**: 개인 설정 및 계정 관리
- **주요 섹션**:
  - 프로필 (Profile Section)
  - 구독 관리 (Subscription Section)
  - 고객센터 (Customer Center Section)
  - 설정 (Setting Section)
- **관련 파일**: `apps/web/src/app/(internal)/my-podo/page.tsx`, `apps/web/src/features/src/my-podo-sections`

#### 공지사항 (Notices)
- **경로**: `/my-podo/notices`
- **목적**: 서비스 공지 및 업데이트 확인
- **관련 파일**: `apps/web/src/app/(internal)/my-podo/notices/page.tsx`, `apps/web/src/entities/src/notice`

#### 알림 설정 (Notification Settings)
- **경로**: `/my-podo/notification-settings`
- **목적**: 푸시 알림 및 이메일 수신 설정
- **관련 파일**: `apps/web/src/app/(internal)/my-podo/notification-settings/page.tsx`

#### 결제 수단 관리 (Payment Methods)
- **경로**: `/my-podo/payment-methods`
- **목적**: 신용카드 등 결제 수단 등록/관리
- **관련 파일**: `apps/web/src/app/(internal)/my-podo/payment-methods/page.tsx`, `apps/web/src/features/src/payment-methods`

---

### 구독/결제 화면

#### 구독 목록 (Subscribe List)
- **경로**: `/subscribes`
- **목적**: 이용 가능한 구독 상품 목록
- **관련 파일**: `apps/web/src/app/(internal)/subscribes/page.tsx`

#### 이용권 (Tickets)
- **경로**: `/subscribes/tickets`, `/subscribes/tickets-v2`
- **목적**: 횟수 기반 수업 이용권 구매
- **관련 파일**: `apps/web/src/app/(internal)/subscribes/tickets/page.tsx`

#### 결제 (Payment)
- **경로**: `/subscribes/payment/[subscribeId]`
- **목적**: 구독 상품 결제 진행
- **주요 기능**: 결제 수단 선택, 쿠폰 적용, 최종 결제
- **관련 파일**: `apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx`, `apps/web/src/features/src/payment`

#### 결제 완료 (Payment Success)
- **경로**: `/subscribes/payment/[subscribeId]/success`
- **목적**: 결제 성공 확인 페이지
- **관련 파일**: `apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/success/page.tsx`

---

### 외부 연동 화면

#### OAuth 콜백 (OAuth Callback)
- **경로**: `/callback/oauth/redirect`
- **목적**: 카카오 등 소셜 로그인 인증 처리
- **관련 파일**: `apps/web/src/app/(external)/callback/oauth/redirect/page.tsx`, `apps/web/src/entities/src/authentication`

#### 앱 설치 배너 (App Install Banner)
- **경로**: `/app-install-banner`
- **목적**: 웹에서 네이티브 앱 설치 유도
- **관련 파일**: `apps/web/src/app/(external)/(without-safearea)/app-install-banner/page.tsx`, `apps/web/src/features/src/native`

#### 브라우저에서 열기 (Open in Browser)
- **경로**: `/open-in-browser`
- **목적**: 인앱 브라우저에서 외부 브라우저로 리디렉션
- **관련 파일**: `apps/web/src/app/(external)/open-in-browser/page.tsx`

---

## 3. 기능 용어

### 핵심 기능

#### AI 학습 (AI Learning)
- **설명**: AI 캐릭터와 대화하며 자율적으로 영어를 학습하는 기능
- **주요 요소**:
  - 캐릭터 채팅 (Character Chat)
  - AI 학습 코스 (AI Course)
  - 체험 리포트 (Trial Report)
- **관련 파일**: `apps/web/src/app/(internal)/ai-learning`, `apps/web/src/app/(internal)/lessons/ai`

#### 캐릭터 채팅 (Character Chat)
- **설명**: AI 캐릭터와 1:1 대화를 통한 학습
- **관련 화면**: `/home/ai`, AI 학습 관련 화면
- **관련 파일**: `apps/web/src/views/character-chat-home`, `apps/web/src/views/character-chat-detail`

#### 레슨 부스터 (Lesson Booster)
- **설명**: 첫 수업 효과를 극대화하기 위한 사전 안내/튜토리얼
- **관련 화면**: `/first-lesson-booster-dialog`
- **관련 파일**: `apps/web/src/entities/src/first-lesson-booster`

#### 레벨 선택 (Level Select)
- **설명**: 학생의 영어 수준을 선택하는 기능
- **관련 화면**: `/level-select-dialog`
- **관련 파일**: `apps/web/src/app/(external)/(with-safearea)/level-select-dialog/page.tsx`

#### 사전 학습 (Pre-study)
- **설명**: 수업 전 미리 학습하는 콘텐츠
- **주요 기능**: 완료 여부 체크, 알림
- **관련 파일**: `apps/web/src/features/src/class-preparation`, `apps/web/src/entities/src/pre-study`

#### 튜토리얼 (Tutorial)
- **설명**: 신규 사용자를 위한 서비스 사용 가이드
- **유형**:
  - 수업 온보딩 (Lesson Onboarding)
  - 체험 튜토리얼 (Trial Tutorial)
- **관련 파일**: `apps/web/src/features/src/lesson-onboarding`, `apps/web/src/features/src/trial-tutorial`, `apps/web/src/entities/src/trial-tutorial`

---

### 피처 플래그 (Feature Flags)

#### 피처 플래그란?
- **설명**: 특정 기능을 켜고 끄는 스위치 (A/B 테스트, 점진적 배포 등에 사용)
- **도구**: Flagsmith
- **저장 위치**: Redis 캐시
- **관련 파일**: `apps/web/src/entities/src/feature-flag`, `packages/flags`

#### 주요 피처 플래그 예시
- `enable_react_home`: React 버전 홈 페이지 활성화
- `migration_booking_react`: React 버전 예약 페이지 활성화
- 기타: 코드베이스에서 `isEnabled('flag_name')` 형태로 사용

---

### 결제/배송 기능

#### 결제 유형 (Payment Type)
- **정기 결제 (Subscribe Payment)**: 자동 갱신
- **일시불 결제 (Lump Sum Payment)**: 1회성 결제
- **페이백 결제 (Payback Payment)**: 환급형 결제
- **아이패드 결제 (iPad Payment)**: 기기 제공 포함 결제
- **기업 결제 (Business Payment)**: B2B 결제
- **관련 파일**: `apps/web/src/features/src/payment-type`

#### 배송 정보 (Delivery)
- **설명**: 교재 등 물리적 상품 배송을 위한 주소 관리
- **주요 기능**: 주소 등록, 우편번호 검색
- **관련 파일**: `apps/web/src/features/src/delivery`

---

## 4. 기술 용어 (비개발자용 설명)

### 아키텍처 용어

#### BFF (Backend for Frontend)
- **정식 명칭**: Backend for Frontend
- **설명**: 웹/앱 전용 서버 (클라이언트와 실제 데이터베이스 사이의 중간 계층)
- **역할**: 인증, 데이터 가공, API 통합
- **기술**: Hono 프레임워크 사용
- **위치**: `apps/server`

#### API (Application Programming Interface)
- **설명**: 프론트엔드(화면)와 백엔드(서버) 간 데이터를 주고받는 통로
- **예시**: "수업 목록 조회 API", "예약 생성 API"
- **관련 파일**: `packages/apis`, `apps/server/src/domains`

#### 미들웨어 (Middleware)
- **설명**: 페이지가 로드되기 전에 실행되는 중간 처리 단계
- **예시**:
  - 로그인 여부 확인 (`withProtectedRoute`)
  - 세션 관리 (`withSession`)
  - 네이티브 앱 스토어 감지 (`withNativeStore`)
  - 카카오 인앱 브라우저 차단 (`withKakaoInAppBlock`)
- **실행 순서**: withKakaoInAppBlock → withNativeStore → withSession → withMarketing → withProtectedRoute
- **관련 파일**: `apps/web/src/middleware.ts`, `apps/web/src/core/middlewares`

#### 세션 (Session)
- **설명**: 로그인 상태를 유지하는 정보 (쿠키에 저장)
- **포함 내용**: 사용자 ID (uid), 액세스 토큰 (accessToken)
- **관련 파일**: `apps/web/src/entities/src/authentication`

#### Redis
- **설명**: 빠른 데이터 조회를 위한 메모리 기반 캐시 저장소
- **용도**: 피처 플래그 캐싱, 세션 관리
- **관련 파일**: `apps/web/src/shared/database`

---

### 앱 종류

#### 웹앱 (Web App)
- **설명**: 브라우저에서 실행되는 학생용 웹 애플리케이션
- **기술**: Next.js 15, React 19
- **경로**: `apps/web`
- **URL**: `https://podo.com` (프로덕션 예시)

#### 네이티브 앱 (Native App)
- **설명**: iOS/Android 스토어에서 다운로드하는 튜터용 모바일 앱
- **기술**: React Native, Expo
- **경로**: `apps/native`
- **대상**: 튜터 전용

#### 레거시 웹 (Legacy Web)
- **설명**: 기존 Nuxt.js 기반 웹 앱 (점진적으로 React로 마이그레이션 중)
- **경로**: `apps/legacy-web`
- **포트**: 3005 (로컬 개발)
- **프록시**: 특정 경로(`/_nuxt/*`, `/app/user/podo/*`)는 아직 레거시 웹으로 프록시됨

---

### 개발 환경

#### 스테이지 (Stage/Environment)
- **local**: 개발자 로컬 환경
- **development**: 개발 서버
- **staging**: QA/테스트 서버
- **production**: 실제 서비스 운영 서버
- **temp**: 임시 환경

#### 환경 변수 (Environment Variables)
- **설명**: 서버 주소, API 키 등 환경에 따라 달라지는 설정값
- **저장 위치**: `.env.local`, `.env.development` 등
- **보안**: S3에 암호화되어 저장, `pnpm env:download` 명령으로 다운로드
- **관련 파일**: `apps/web/src/shared/config/env`

---

## 5. 디자인 시스템 용어

### 디자인 시스템 구조

#### 디자인 시스템 (Design System)
- **설명**: 재사용 가능한 UI 컴포넌트와 디자인 토큰의 집합
- **목적**: 일관된 디자인 유지, 개발 속도 향상
- **위치**: `design-system/` 디렉토리

---

### 패키지 구분

#### Core 디자인 시스템
- **경로**: `design-system/core`
- **설명**: 모든 제품에서 공통으로 사용하는 기본 컴포넌트
- **주요 컴포넌트**:
  - Layout: Box, Flex, Stack, Divider, Spacer
- **스토리북**: Storybook 9로 문서화
- **용도**: 레이아웃, 기본 구조

#### Podo 디자인 시스템
- **경로**: `design-system/podo`
- **설명**: 포도 서비스 전용 컴포넌트
- **버전별 구조**:
  - **v1**: 초기 버전 컴포넌트
  - **v2**: 개선된 버전 (현재 주로 사용)
  - **v3**: 최신 버전 (일부 컴포넌트만 존재)
- **스토리북**: Storybook 9로 문서화

#### Design System Temp
- **경로**: `packages/design-system-temp`
- **설명**: Podo 디자인 토큰 설정 및 임시 컴포넌트
- **용도**: Tailwind CSS 기반 디자인 토큰 정의

#### Tutor-Web 디자인 시스템
- **경로**: `design-system/tutor-web`
- **설명**: 튜터용 웹 전용 컴포넌트
- **용도**: 튜터 관리자 페이지

---

### Podo 디자인 시스템 컴포넌트 목록

#### v1 컴포넌트 (초기 버전)
- Alert Dialog: 경고/확인 다이얼로그
- Badge: 뱃지/태그
- Button: 버튼
- Checkbox: 체크박스
- Chip: 칩/태그
- Confirm Dialog: 확인 다이얼로그
- Icon: 아이콘
- Input: 입력 필드
- Popover: 팝오버
- Radio: 라디오 버튼
- Separator: 구분선
- Sub Tab: 서브 탭
- Tabs: 탭
- Typography: 타이포그래피 (텍스트 스타일)

#### v2 컴포넌트 (현재 주로 사용)
- Alert Dialog: 경고/확인 다이얼로그
- Badge: 뱃지/태그
- Bottom Sheet: 하단 시트
- Button: 버튼
- Checkbox: 체크박스
- Chip: 칩/태그
- Chip with Badge: 뱃지 포함 칩
- Confirm Dialog: 확인 다이얼로그
- Feedback List: 피드백 리스트
- Progress: 진행률 표시
- Selectable Card: 선택 가능 카드
- Stepper: 단계 표시기
- Tabs: 탭
- Toaster: 토스트 알림
- Toggle: 토글 스위치

#### v3 컴포넌트 (최신)
- Chip: 칩/태그
- Chip with Badge: 뱃지 포함 칩

#### Design System Temp 컴포넌트
- Alert Dialog
- Badge
- Bottom Sheet
- Button
- Checkbox
- Chip
- Confirm Dialog
- Feedback List
- Icon
- Input
- Layout (Box, Flex, Stack 등)
- Popover
- Progress
- Radio
- Selectable Card
- Separator
- Stepper
- Sub Tab
- Tabs
- Toaster
- Toggle
- Typography

---

### 디자인 토큰 (Design Token)

#### 디자인 토큰이란?
- **설명**: 디자인의 기본 요소를 코드로 정의한 값 (색상, 크기, 간격 등)
- **예시**: `color-primary`, `spacing-md`, `font-size-lg`
- **장점**: 한 곳에서 수정하면 전체 앱에 일관되게 적용

#### 토큰 계층 (3단계 구조)
1. **Static Tokens**: 가장 기본적인 원시 값 (예: `blue-500`, `16px`)
2. **Semantic Tokens**: 의미를 가진 토큰 (예: `color-primary`, `spacing-medium`)
3. **Scale Tokens**: 크기 스케일 토큰 (예: `spacing-1`, `spacing-2`, `spacing-3`)

#### Podo 디자인 토큰
- **경로**: `packages/design-system-temp/podo-tailwind.config.ts`
- **기술**: Tailwind CSS 기반
- **용도**: Podo 서비스의 색상, 타이포그래피, 간격 등 정의

---

### 스토리북 (Storybook)

#### 스토리북이란?
- **설명**: 컴포넌트를 독립적으로 개발하고 문서화하는 도구
- **용도**: 디자이너/개발자가 컴포넌트 상태를 시각적으로 확인
- **버전**: Storybook 9
- **실행**:
  - Core: `design-system/core`에서 실행
  - Podo: `design-system/podo`에서 실행

---

## 6. 데이터 관리 용어

### 상태 관리

#### TanStack Query (React Query)
- **설명**: 서버 데이터를 가져오고 캐싱하는 라이브러리
- **용도**: API 호출 결과 관리, 자동 재시도, 캐싱
- **버전**: v5
- **사용 예시**: `useQuery`, `useMutation`

#### Entity (엔티티)
- **설명**: 데이터 모델 및 API 호출 로직을 관리하는 모듈
- **위치**: `apps/web/src/entities/src`
- **주요 엔티티**:
  - `authentication`: 인증
  - `users`: 사용자
  - `lesson`: 수업
  - `subscribes`: 구독
  - `coupon`: 쿠폰
  - `payment`: 결제
  - `tutor`: 튜터
  - `feature-flag`: 피처 플래그
  - `notice`: 공지사항

#### Feature (피처)
- **설명**: 특정 기능을 구현하는 비즈니스 로직 및 UI 모듈
- **위치**: `apps/web/src/features/src`
- **주요 피처**:
  - `auth`: 인증
  - `booking-lesson`: 수업 예약
  - `lesson`: 수업
  - `lesson-review`: 수업 리뷰
  - `lesson-report`: 레슨 리포트
  - `payment`: 결제
  - `subscribes`: 구독
  - `home-greeting`: 홈 인사말
  - `my-podo-sections`: 마이 포도 섹션

---

### 모니터링/분석

#### Datadog RUM (Real User Monitoring)
- **설명**: 실제 사용자 행동을 추적하는 모니터링 도구
- **용도**: 페이지 로딩 시간, 에러 추적, 사용자 경험 분석

#### Sentry
- **설명**: 에러 추적 및 로깅 도구
- **용도**: 버그 발생 시 즉시 알림, 에러 원인 분석

#### GA4 (Google Analytics 4)
- **설명**: 구글 웹 분석 도구
- **용도**: 사용자 행동 분석, 전환율 추적
- **미들웨어**: `withMarketing` (GA4 초기화)

---

## 7. 추가 용어

### 경로 관련

#### Internal Routes (내부 경로)
- **설명**: 로그인이 필요한 사용자 전용 페이지
- **경로**: `apps/web/src/app/(internal)`
- **예시**: `/home`, `/booking`, `/my-podo`

#### External Routes (외부 경로)
- **설명**: 로그인 없이 접근 가능한 페이지
- **경로**: `apps/web/src/app/(external)`
- **예시**: `/callback/oauth/redirect`, `/app-install-banner`

---

### 기타 기술 용어

#### Turbo (Turborepo)
- **설명**: 모노레포 빌드 도구 (여러 앱/패키지를 효율적으로 빌드)
- **명령어**: `pnpm dev`, `pnpm build`

#### pnpm Workspaces
- **설명**: 모노레포의 패키지 의존성을 관리하는 도구
- **장점**: 중복 설치 방지, 효율적인 의존성 관리

#### Zod
- **설명**: TypeScript 타입 검증 라이브러리
- **용도**: API 응답, 환경 변수, 폼 입력 검증

#### Drizzle ORM
- **설명**: 데이터베이스 ORM (Object-Relational Mapping)
- **용도**: SQL 쿼리를 TypeScript로 작성
- **위치**: `apps/server`

---

## 부록: 디렉토리 구조 빠른 참조

```
podo-app-DOC/
├── apps/
│   ├── web/               # Next.js 학생용 웹앱
│   ├── native/            # React Native 튜터용 앱
│   ├── server/            # Hono BFF 서버
│   ├── legacy-web/        # Nuxt.js 레거시 웹
│   └── layers/
│       ├── entities/      # 데이터 엔티티
│       └── features/      # 기능 모듈
├── packages/
│   ├── apis/              # API 클라이언트
│   ├── design-system-temp/# Podo 디자인 토큰
│   ├── flags/             # 피처 플래그 유틸
│   └── config/            # 공유 설정
└── design-system/
    ├── core/              # Core 컴포넌트
    ├── podo/              # Podo 컴포넌트 (v1, v2, v3)
    └── tutor-web/         # Tutor 컴포넌트
```

---

## 문의 및 업데이트

이 용어집은 포도 서비스의 코드베이스를 기반으로 작성되었습니다.
용어에 대한 문의사항이나 추가/수정이 필요한 경우 개발팀에 문의해주세요.

**최종 업데이트**: 2026-01-26
