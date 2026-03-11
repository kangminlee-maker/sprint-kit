# 포도(PODO) 서비스 주요 사용자 플로우

이 문서는 포도 서비스의 주요 사용자 플로우를 기획자와 디자이너가 이해할 수 있도록 작성되었습니다.

## 목차
1. [로그인 플로우](#1-로그인-플로우)
2. [수업 예약 플로우](#2-수업-예약-플로우)
3. [수업 진행 플로우](#3-수업-진행-플로우)
4. [구독/결제 플로우](#4-구독결제-플로우)
5. [AI 학습 플로우](#5-ai-학습-플로우)
6. [이탈 고객 리텐션 플로우](#6-이탈-고객-리텐션-플로우)

---

## 1. 로그인 플로우

### 개요
포도 서비스는 카카오 OAuth와 애플 OAuth를 통한 소셜 로그인을 지원합니다. 로그인 성공 시 세션 쿠키가 설정되며, 사용자는 지정된 목적지(destination)로 리다이렉트됩니다.

### 플로우 단계

#### 1.1 로그인 페이지 진입
- **라우트**: `/login`
- **파일**: `apps/web/src/app/(internal)/login/page.tsx`
- **View**: `apps/web/src/views/login/view.tsx`

**동작**:
- URL 파라미터에서 `destination` 확인 (예: HOME, LESSON_TAB, TRIAL_LESSON 등)
- 이미 로그인된 경우(refreshToken 존재) → `/api/v2/authentication/validate-and-redirect`로 리다이렉트
- 로그인되지 않은 경우 → 로그인 페이지 표시

**화면 구성**:
- 포도 로고 이미지
- 카카오 로그인 버튼 (기본)
- 애플 로그인 버튼 (iOS 네이티브 앱에서만, 피처 플래그에 따라 표시)
- "로그인이 안되시나요?" 헬프 버튼

#### 1.2 카카오 OAuth 로그인

**클라이언트 측 처리** (`apps/web/src/views/login/view.tsx`):
1. 카카오 로그인 버튼 클릭
2. Kakao JS SDK가 초기화되어 있으면:
   - `/api/v2/authentication/kakao/authorize/state` 호출하여 state 값 획득
   - `Kakao.Auth.authorize()` 실행 (팝업 방식)
3. Kakao JS SDK 없으면:
   - `/api/v2/authentication/kakao/authorize` URL로 직접 리다이렉트

**서버 측 처리**:
- **BFF 엔드포인트**: `/api/v2/authentication/:provider/authorize`
  - 파일: `apps/server/src/domains/authentication/controller/v2/authorize.handler.ts`
  - 동작: 레거시 백엔드 `/api/v1/auth/kakao/authorize`로 프록시

- **OAuth 콜백**: `/api/v1/oauth/kakao`
  - 파일: `apps/server/src/domains/oauth/kakao/controller/login.handler.ts`
  - 동작:
    1. 카카오 서버에서 받은 `code`로 액세스 토큰 교환
    2. 카카오 사용자 정보 조회
    3. 포도 백엔드에서 사용자 인증 (회원가입/로그인)
    4. 쿠키 설정:
       - `accessToken`: 포도 API 인증용
       - `refreshToken`: 토큰 갱신용
       - `USER_UID`: 사용자 고유 ID
       - `USER_TOKEN`: 레거시 토큰
    5. 리다이렉트:
       - 네이티브 앱: `/callback/oauth/set-local-storage`
       - 웹: `/callback/oauth/redirect`

#### 1.3 애플 OAuth 로그인

**클라이언트 측 처리**:
1. 애플 로그인 버튼 클릭
2. `getAppleOauthLoginUrl()` 호출하여 Apple OAuth URL 생성
3. Apple 로그인 페이지로 리다이렉트

**서버 측 처리**:
- **OAuth 콜백**: `/api/v1/oauth/apple`
  - 파일: `apps/server/src/domains/oauth/apple/controller/login.handler.ts`
  - 동작: 카카오와 유사하게 Apple ID 토큰을 검증하고 세션 생성

#### 1.4 로그인 후 리다이렉트

**리다이렉트 게이트웨이**: `/callback/oauth/redirect`
- 파일: `apps/web/src/app/(external)/callback/oauth/redirect/page.tsx`
- 동작:
  1. 세션 정보(accessToken, refreshToken, uid, token) 확인
  2. 로그인되지 않은 경우 → `/login?destination={destination}`으로 리다이렉트
  3. `destination`에 따라 적절한 페이지로 리다이렉트:
     - `HOME`: 홈 페이지 (`/home` 또는 `/home/ai`)
     - `LESSON_TAB`: 구독 목록 (`/subscribes`)
     - `TRIAL_LESSON`: 체험 레슨 (`/lessons/trial`)
     - `REGULAR_LESSON`: 정규 레슨 (`/lessons/regular`)
     - `AI_LEARNING`: AI 학습 (`/ai-learning`)
     - 기타 여러 목적지 지원

### 세션 관리

**쿠키 기반 세션**:
- `accessToken`: API 인증에 사용, HTTP-Only, Secure, SameSite=Lax
- `refreshToken`: 토큰 갱신용, HTTP-Only, Secure, SameSite=Lax
- `USER_UID`: 사용자 ID
- `USER_TOKEN`: 레거시 시스템 호환용

**미들웨어 체인** (`apps/web/src/middleware.ts`):
```
withKakaoInAppBlock → withNativeStore → withSession → withMarketing → withProtectedRoute
```
- `withSession`: 세션 유효성 검증
- `withProtectedRoute`: 보호된 라우트 접근 제어 (로그인 필요)

### 관련 파일 경로

**Web App (apps/web)**:
```
src/app/(internal)/login/page.tsx                      # 로그인 페이지 라우트
src/views/login/view.tsx                               # 로그인 화면 UI
src/app/(external)/callback/oauth/redirect/page.tsx    # OAuth 콜백 리다이렉트
src/middleware.ts                                      # 미들웨어 체인
src/core/middlewares/                                  # 개별 미들웨어 로직
```

**Server (apps/server)**:
```
src/domains/authentication/controller/v2/authorize.handler.ts    # OAuth 시작 엔드포인트
src/domains/oauth/kakao/controller/login.handler.ts             # 카카오 로그인 핸들러
src/domains/oauth/apple/controller/login.handler.ts             # 애플 로그인 핸들러
src/shared/constants/token.ts                                   # 쿠키 옵션 정의
```

**Features (apps/web/src/features)**:
```
src/auth/api/                                          # 인증 API 유틸리티
src/auth/ui/                                           # 로그인 버튼 컴포넌트
```

---

## 2. 수업 예약 플로우

### 개요
사용자는 자신의 레슨권을 사용하여 원하는 날짜와 시간에 수업을 예약할 수 있습니다. 예약 변경도 같은 플로우를 사용하며, 수업 시작 2시간 전까지 변경 가능합니다.

### 플로우 단계

#### 2.1 예약 페이지 진입
- **라우트**: `/booking`
- **파일**: `apps/web/src/app/(internal)/booking/page.tsx`
- **View**: `apps/web/src/views/booking/view.tsx`

**쿼리 파라미터**:
- `classId`: 수업 ID (필수)
- `type`: 'new' (신규 예약) 또는 'edit' (예약 변경)
- `classType`: 'regular' (정규) 또는 'trial' (체험)
- `referrer`: 이전 페이지 (예: 'home', 'subscribes', 'reservation')

**진입 경로**:
1. 홈 페이지에서 "레슨 예약하기" 버튼 클릭
2. 구독 목록(`/subscribes`)에서 레슨 선택
3. 예약 목록(`/reservation`)에서 "예약 변경" 버튼 클릭

**동작**:
- 피처 플래그 `migration_booking_react` 확인
- 비활성화 시 → 레거시 페이지(`/app/user/podo/class-booking`)로 리다이렉트
- 활성화 시 → React 버전 예약 페이지 렌더링

#### 2.2 날짜 선택
**UI 컴포넌트**: `DateSelector` (`apps/web/src/views/booking/ui`)

**동작**:
1. 예약 가능한 날짜 목록 표시 (일반적으로 14일치)
2. 사용자가 날짜 클릭
3. 해당 날짜의 시간대 슬롯 로드

**데이터 로직** (`apps/web/src/views/booking/hooks`):
- `useSchedule`: 스케줄 상태 관리
- 페널티 기간 및 홀딩 기간 체크
- 해당 날짜에 유효한 레슨권이 있는지 확인

#### 2.3 시간 선택
**UI 컴포넌트**: `TimeSlotGrid`

**동작**:
1. 30분 단위 타임 슬롯 표시
2. 예약 가능/불가 상태 표시:
   - 활성화: 예약 가능
   - 비활성화 + 회색: 이미 예약된 시간
   - 비활성화 + 빨간색: 페널티/홀딩 기간
3. 사용자가 시간 선택

**상태 관리**:
- `selectedTime`: 선택한 시간 저장
- `timeGroups`: 시간대별로 그룹화된 슬롯 목록

#### 2.4 예약 확정
**동작**:
1. "선택한 날짜에 예약" 또는 "선택한 날짜로 예약 변경" 버튼 클릭
2. API 호출:
   - 신규 예약: `handleBooking()` → `bookMutation`
   - 예약 변경: `handleChange()` → `changeMutation`
3. 성공 시:
   - 예약 목록(`/reservation`) 또는 홈(`/home`)으로 리다이렉트
4. 실패 시:
   - 에러 메시지 표시

### 예약 목록 페이지

#### 2.5 예약 목록 조회
- **라우트**: `/reservation`
- **파일**: `apps/web/src/app/(internal)/reservation/page.tsx`
- **View**: `apps/web/src/views/reservation/view.tsx`

**탭 구성**:
1. **예정된 레슨**: 예약된 수업 목록
   - 수업 시간, 튜터 정보
   - "예약 변경" 버튼 → `/booking?classId={id}&type=edit`
   - "수업 시작" 버튼 → `/lessons/classroom/{classID}`

2. **지난 레슨**: 완료된 수업 목록
   - 필터: 전체/진행 완료/결석/결제 대기
   - 무한 스크롤 페이지네이션
   - "리포트 보기" 버튼 → `/lessons/classroom/{classID}/report`

### API 엔드포인트

**예약 관련**:
- `GET /api/v1/lesson/reserved`: 예정된 레슨 조회
- `GET /api/v1/lesson/completed`: 지난 레슨 조회 (페이지네이션)
- `POST /api/v1/booking/create`: 신규 예약 생성
- `PUT /api/v1/booking/change`: 예약 변경

### 관련 파일 경로

**Web App (apps/web)**:
```
src/app/(internal)/booking/page.tsx           # 예약 페이지 라우트
src/views/booking/view.tsx                    # 예약 화면 UI
src/views/booking/hooks/                      # 예약 로직 (useBookingData, useSchedule, useBookingMutation)
src/views/booking/ui/                         # 예약 UI 컴포넌트 (DateSelector, TimeSlotGrid, PenaltyNotice)

src/app/(internal)/reservation/page.tsx       # 예약 목록 라우트
src/views/reservation/view.tsx                # 예약 목록 UI
```

**Entities (apps/web/src/entities)**:
```
src/lesson/api/                               # 레슨 API 함수
src/lesson/model/                             # 레슨 타입 정의
```

---

## 3. 수업 진행 플로우

### 개요
사용자는 예약한 시간에 온라인 클래스룸에 입장하여 튜터와 1:1 화상 수업을 진행합니다. 수업 후에는 리포트를 확인하고 리뷰를 작성할 수 있습니다.

### 플로우 단계

#### 3.1 클래스룸 진입
- **라우트**: `/lessons/classroom/[classID]`
- **파일**: `apps/web/src/app/(internal)/lessons/classroom/[classID]/page.tsx`
- **View**: `apps/web/src/views/class-room/view.tsx`

**쿼리 파라미터**:
- `level`: 레벨 (소수점)
- `week`: 주차
- `permission`: 'true' 또는 'false'
- `langType`: 언어 타입 (EN, JP 등) - 선택적
- `sessionId`: 세션 ID - 선택적
- `referrer`: 이전 페이지 - 선택적

**진입 경로**:
1. 예약 목록에서 "수업 시작" 버튼 클릭
2. 홈 페이지에서 "다음 레슨" 카드 클릭
3. 푸시 알림에서 직접 진입

**동작**:
1. 피처 플래그 `classroom_migration` 확인
   - 비활성화 시 → 레거시 클래스룸으로 리다이렉트
2. 레슨 입장 정보 조회 (`lessonEntityQueries.lectureEnterInfo`)
3. Zoom 링크 결정:
   - 수업 시작 전: `pre_zoom_join_url` (사전 학습 모드)
   - 수업 시작 후: `zoom_join_url` (정규 수업 모드)
4. 클래스룸 뷰 렌더링

#### 3.2 수업 진행
**화면 구성**:
- **헤더**:
  - "강의" 버튼: 학습 자료 비디오 재생
  - "MP3" 버튼: 오디오 자료 재생
  - "나가기" 버튼: 수업 종료
- **메인**: Zoom iframe (화상 수업 화면)
- **학습 자료**: 비디오/오디오 플레이어 (선택 시 표시)

**동작**:
1. Zoom iframe 로드 완료 시 → `classRoomLoaded` 상태 true
2. 1분마다 사전 학습 시간 업데이트 (`updatePreStudyTime`)
3. 사용자가 "나가기" 클릭:
   - `requestFinishPodoClass` API 호출
   - Referrer에 따라 적절한 페이지로 리다이렉트

**시간 체크**:
- `useLessonTimeChecker`: 수업 시간 전/후 접근 제어
- 수업 시간 전/후에는 경고 표시 또는 접근 차단

#### 3.3 수업 리포트 조회
- **라우트**: `/lessons/classroom/[classID]/report`
- **파일**: `apps/web/src/app/(internal)/lessons/classroom/[classID]/report/page.tsx`
- **View**: `apps/web/src/views/lesson-report/view.tsx`

**동작**:
1. 진단 리포트 생성 상태 확인 (`generateDiagnosisReport`):
   - `REQUESTED` / `PROCESSING`: 생성 중 화면 표시
   - `COMPLETED`: 리포트 표시
   - `FAILED`: 실패 화면 표시
2. 리포트 내용:
   - 종합 점수 (발음, 유창성, 어휘, 문법)
   - AI 피드백
   - 학습 내용 요약
   - "리뷰 작성하기" 버튼

#### 3.4 수업 리뷰 작성
- **라우트**: `/lessons/classroom/[classID]/review`
- **파일**: `apps/web/src/app/(internal)/lessons/classroom/[classID]/review/page.tsx`
- **View**: `apps/web/src/views/lesson-review/view.tsx`

**쿼리 파라미터**:
- `feedbackIds`: 피드백 ID 목록 (콤마로 구분)

**동작**:
1. 리뷰 질문 목록 조회 (`getQuestions`)
2. 질문별 답변 수집 (별점, 객관식, 주관식)
3. 리뷰 제출:
   - API 호출
   - 완료 페이지로 리다이렉트 (`/lessons/classroom/[classID]/review-complete`)

**리뷰 완료 페이지**:
- 감사 메시지 표시
- "홈으로 가기" 버튼 → 홈 또는 AI 학습 홈

### API 엔드포인트

**클래스룸 관련**:
- `GET /api/v1/lesson/lecture-enter-info`: 레슨 입장 정보
- `GET /api/v1/lesson/lecture-room-info`: 클래스룸 정보 (학습 자료)
- `POST /api/v1/lesson/update-pre-study-time`: 사전 학습 시간 업데이트
- `POST /api/v1/lesson/finish`: 수업 종료

**리포트 관련**:
- `POST /api/v1/diagnosis/generate`: 진단 리포트 생성
- `GET /api/v1/diagnosis/report`: 진단 리포트 조회

**리뷰 관련**:
- `GET /api/v1/review/questions`: 리뷰 질문 목록
- `POST /api/v1/review/submit`: 리뷰 제출

### 관련 파일 경로

**Web App (apps/web)**:
```
src/app/(internal)/lessons/classroom/[classID]/page.tsx           # 클래스룸 라우트
src/views/class-room/view.tsx                                     # 클래스룸 UI

src/app/(internal)/lessons/classroom/[classID]/report/page.tsx   # 리포트 라우트
src/views/lesson-report/view.tsx                                  # 리포트 UI

src/app/(internal)/lessons/classroom/[classID]/review/page.tsx   # 리뷰 라우트
src/views/lesson-review/view.tsx                                  # 리뷰 UI
src/views/lesson-review/ui/lesson-review-funnel.tsx               # 리뷰 퍼널
```

**Entities (apps/web/src/entities)**:
```
src/lesson/api/                                                   # 레슨 API
src/lesson/model/                                                 # 레슨 타입
```

**Features (apps/web/src/features)**:
```
src/lesson/hooks/                                                 # 레슨 관련 훅 (useLessonTimeChecker)
src/lesson-review/                                                # 리뷰 관련 기능
src/lesson-report/                                                # 리포트 관련 기능
```

---

## 4. 구독/결제 플로우

### 개요
사용자는 다양한 구독 상품(정기 구독, 일괄 결제, 체험권 등)을 선택하고 결제 수단(카드, 카카오페이, 네이버페이)으로 결제할 수 있습니다.

### 플로우 단계

#### 4.1 구독 상품 목록 조회
- **라우트**: `/subscribes`
- **파일**: `apps/web/src/app/(internal)/subscribes/page.tsx`
- **View**: `apps/web/src/views/subscribe-list/`

**쿼리 파라미터**:
- `langType`: 언어 타입 (EN, JP) - 선택적

**화면 구성**:
1. **언어 탭**: 영어/일본어 전환
2. **구독 타입 탭**:
   - 정기 구독 (월/연)
   - 일괄 결제 (3개월/6개월/12개월)
   - 아이패드 패키지
   - 스마트톡 (캐릭터 챗)
3. **구독 카드 목록**:
   - 상품명, 가격, 혜택
   - "구매하기" 버튼

**동작**:
1. 사용자 구독 정보 조회 (`getUserWithSubscribeMappListAndNextCourse`)
2. 캐릭터 챗 전용 구독인 경우:
   - `CharacterChatTabs` 표시 (AI 학습 전용)
3. 일반 구독인 경우:
   - `LanguageTabs` 표시 (언어별 구독 상품)

#### 4.2 구독 상품 선택
**동작**:
1. 사용자가 "구매하기" 버튼 클릭
2. 상품 상세 정보 표시 (선택적)
3. `/subscribes/payment/{subscribeId}`로 이동

#### 4.3 결제 페이지
- **라우트**: `/subscribes/payment/[subscribeId]`
- **파일**: `apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx`
- **View**: `apps/web/src/views/subscribe-payment/view.tsx`

**쿼리 파라미터**:
- `coupon_id`: 쿠폰 ID - 선택적
- `zip_code`: 우편번호 - 선택적
- `address`: 주소 - 선택적
- `detail_address`: 상세 주소 - 선택적
- `promotionType`: 프로모션 타입 (PAYBACK 등) - 선택적

**화면 구성**:
1. **구독 티켓 요약**: 상품명, 기간, 레슨 횟수
2. **배송 정보** (아이패드 패키지만):
   - 상품 정보
   - 배송지 주소 입력 폼
3. **결제 수단 선택**:
   - 신용카드
   - 카카오페이
   - 네이버페이
   - 등록된 결제 수단 표시
4. **쿠폰 선택**: 보유 쿠폰 목록
5. **결제 금액**:
   - 원가
   - 할인 금액
   - 최종 결제 금액
   - 할부 정보 (일괄 결제 시)
6. **약관 동의**: 결제 약관, 개인정보 수집 동의
7. **결제하기** CTA 버튼

#### 4.4 결제 수단 등록 (정기 구독 시)
**동작**:
1. 정기 구독 선택 시 결제 수단 등록 필수
2. 결제 수단 선택:
   - 카드: `/my-podo/payment-methods/register` (카드 정보 입력)
   - 카카오페이: 카카오페이 앱으로 리다이렉트
   - 네이버페이: 네이버페이 앱으로 리다이렉트
3. 등록 완료 시 결제 페이지로 복귀

#### 4.5 결제 실행
**동작** (`apps/web/src/views/subscribe-payment/view.tsx`):
1. "결제하기" 버튼 클릭
2. 유효성 검증:
   - 결제 수단 선택 확인
   - 약관 동의 확인
3. 서버 측 검증 (`serverSideValidatePayment`):
   - 중복 레슨 확인
   - 연체 확인
4. 결제 패턴에 따라 분기:
   - **정기 구독 + 신규 카드**: `handlePaymentForNewCreditCard`
   - **정기 구독 + 등록된 카드**: `handlePaymentForRegisteredCreditCard`
   - **정기 구독 + 카카오페이**: `handlePaymentForNewKakaoPay` / `handlePaymentForRegisteredKakaoPay`
   - **정기 구독 + 네이버페이**: `handlePaymentForNewNaverPay` / `handlePaymentForRegisteredNaverPay`
   - **일괄 결제 + 카드**: `handlePaymentForTossPayments`
   - **일괄 결제 + 카카오페이**: `handlePaymentForNewKakaoPay`
   - **일괄 결제 + 네이버페이**: `handlePaymentForNewNaverPay`
5. 결제 처리:
   - 결제 게이트웨이로 리다이렉트 (카카오페이, 네이버페이)
   - 또는 PG사 API 호출 (토스페이먼츠)
6. 결제 완료 후 폴링:
   - 백엔드에서 결제 상태 확인
   - 완료 시 → 성공 페이지로 리다이렉트

#### 4.6 결제 완료
- **라우트**: `/subscribes/payment/[subscribeId]/success`
- **동작**:
  - 결제 성공 메시지 표시
  - "홈으로 가기" 버튼
  - GA4 구매 완료 이벤트 전송

### 결제 관련 API 엔드포인트

**구독 조회**:
- `GET /api/v1/subscribe/list`: 구독 상품 목록
- `GET /api/v1/subscribe/:id`: 구독 상품 상세
- `GET /api/v1/user/subscribe-mapp-list`: 사용자 구독 정보

**결제**:
- `POST /api/v1/payment/validate`: 결제 전 검증
- `POST /api/v1/payment/subscribe`: 정기 구독 결제
- `POST /api/v1/payment/lump-sum`: 일괄 결제
- `POST /api/v1/payment/register-card`: 카드 등록
- `POST /api/v1/payment/kakaopay/ready`: 카카오페이 준비
- `POST /api/v1/payment/naverpay/ready`: 네이버페이 준비
- `GET /api/v1/payment/status/:orderId`: 결제 상태 조회

**쿠폰**:
- `GET /api/v1/coupon/available`: 사용 가능한 쿠폰 목록
- `POST /api/v1/coupon/apply`: 쿠폰 적용

### 관련 파일 경로

**Web App (apps/web)**:
```
src/app/(internal)/subscribes/page.tsx                          # 구독 목록 라우트
src/views/subscribe-list/                                       # 구독 목록 UI
src/widgets/subscribe-tabs/                                     # 구독 탭 (LanguageTabs, CharacterChatTabs)

src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx   # 결제 페이지 라우트
src/views/subscribe-payment/view.tsx                            # 결제 UI
src/views/subscribe-payment/ui/                                 # 결제 섹션 컴포넌트

src/app/(internal)/my-podo/payment-methods/page.tsx            # 결제 수단 관리
src/app/(internal)/my-podo/payment-methods/register/page.tsx   # 결제 수단 등록
```

**Entities (apps/web/src/entities)**:
```
src/subscribes/api/                                             # 구독 API
src/payment/api/                                                # 결제 API
src/payment-methods/api/                                        # 결제 수단 API
```

**Features (apps/web/src/features)**:
```
src/payment/                                                    # 결제 관련 기능
src/payment-methods/                                            # 결제 수단 관련 기능
src/delivery/                                                   # 배송 정보 관련 기능
```

---

## 5. AI 학습 플로우

### 개요
포도링고(Podolingo)는 AI 캐릭터와 대화하며 언어를 학습하는 기능입니다. 사용자는 다양한 캐릭터와 주제로 대화하고, 학습 리포트를 확인할 수 있습니다.

### 플로우 단계

#### 5.1 AI 학습 홈 진입
- **라우트**: `/ai-learning`
- **파일**: `apps/web/src/app/(internal)/ai-learning/page.tsx`
- **View**: `apps/web/src/views/ai-learning/view.tsx`

**진입 조건**:
- 피처 플래그 `PODOLINGO_ENABLED` 활성화 필요
- 비활성화 시 → 404 페이지

**화면 구성**:
- Iframe으로 포도링고 앱 임베드 (`/beta/pl`)
- 하단 네비게이션 바는 포도링고 상태에 따라 표시/숨김

**postMessage 통신**:
- 포도링고 → 포도 앱:
  - `PODOLINGO_NAV_CONFIG`: 네비게이션 바 표시 여부 제어
  - `PODOLINGO_PROMPT_PURCHASE`: 레슨권 부족 시 구매 프롬프트

#### 5.2 AI 캐릭터 레슨 선택
- **라우트**: `/lessons/ai`
- **파일**: `apps/web/src/app/(internal)/lessons/ai/page.tsx`
- **View**: `apps/web/src/views/tutor-lesson-topics-select/view.tsx`

**쿼리 파라미터**:
- `langType`: 언어 타입 (EN, JP) - 기본값 EN

**화면 구성**:
1. 상단: 뒤로가기 + 제목 ("레슨 선택")
2. 레슨 주제 목록:
   - 주제 카드 (제목, 난이도, 설명)
   - "시작하기" 버튼

**동작**:
1. 튜터 레슨 주제 목록 조회 (`getTutorLessonTopics`)
2. 사용자가 주제 선택 → `/lessons/ai/{classCourseId}`로 이동

#### 5.3 캐릭터 채팅
- **라우트**: `/lessons/ai/[classCourseId]`
- **파일**: `apps/web/src/app/(internal)/lessons/ai/[classCourseId]/page.tsx`

**동작**:
1. 레슨 코스 정보 조회
2. AI 채팅 세션 시작
3. 사용자 ↔ AI 캐릭터 대화
4. 음성 인식 및 TTS 지원
5. 대화 종료 시 리포트 생성

#### 5.4 학습 리포트 조회
- **라우트**: `/lessons/ai/trial-report/[uuid]`
- **파일**: `apps/web/src/app/(internal)/lessons/ai/trial-report/[uuid]/page.tsx`

**동작**:
1. 체험 레슨 리포트 UUID로 조회
2. 리포트 내용:
   - AI 피드백
   - 학습 내용 요약
   - 발음 점수
   - 추천 학습 내용
3. "다른 주제 시작하기" 버튼 → `/lessons/ai`

#### 5.5 레슨권 구매 프롬프트
**동작** (AI 학습 중 레슨권 부족 시):
1. 포도링고에서 `PODOLINGO_PROMPT_PURCHASE` postMessage 전송
2. 포도 앱에서 다이얼로그 표시:
   - 제목: "보유한 레슨권이 없어요."
   - 메시지: "무제한 레슨권으로 포도의 모든 컨텐츠를 이용해보세요!"
   - "무제한 레슨권 보러가기" 버튼 → `/subscribes/tickets`
   - "다음에 할게요" 버튼

### AI 학습 관련 API 엔드포인트

**포도링고**:
- `GET /api/v1/podolingo/topics`: 레슨 주제 목록
- `POST /api/v1/podolingo/session`: AI 채팅 세션 생성
- `POST /api/v1/podolingo/message`: 메시지 전송
- `GET /api/v1/podolingo/report/:uuid`: 학습 리포트 조회

**튜터 레슨**:
- `GET /api/v1/lesson/tutor-topics`: 튜터 레슨 주제 목록

### 관련 파일 경로

**Web App (apps/web)**:
```
src/app/(internal)/ai-learning/page.tsx                         # AI 학습 홈 라우트
src/views/ai-learning/view.tsx                                  # AI 학습 홈 UI

src/app/(internal)/lessons/ai/page.tsx                          # AI 레슨 선택 라우트
src/views/tutor-lesson-topics-select/view.tsx                   # 레슨 선택 UI

src/app/(internal)/lessons/ai/[classCourseId]/page.tsx         # AI 채팅 라우트

src/app/(internal)/lessons/ai/trial-report/[uuid]/page.tsx     # AI 리포트 라우트
```

**Entities (apps/web/src/entities)**:
```
src/lesson/api/                                                 # 레슨 API
```

**Features (apps/web/src/features)**:
```
src/ai-learning/                                                # AI 학습 관련 기능
```

---

## 부록: 주요 라우트 맵

### 인증 및 홈
- `/login` - 로그인
- `/home` - 홈 (React)
- `/home/ai` - AI 학습 전용 홈
- `/app/user/podo/home` - 레거시 홈 (Nuxt)

### 예약 및 레슨
- `/subscribes` - 구독 목록
- `/booking` - 수업 예약
- `/reservation` - 예약 목록
- `/lessons/classroom/{classID}` - 클래스룸
- `/lessons/classroom/{classID}/report` - 수업 리포트
- `/lessons/classroom/{classID}/review` - 수업 리뷰
- `/lessons/trial` - 체험 레슨 목록
- `/lessons/regular` - 정규 레슨 목록

### AI 학습
- `/ai-learning` - AI 학습 홈 (포도링고)
- `/lessons/ai` - AI 레슨 선택
- `/lessons/ai/{classCourseId}` - AI 채팅
- `/lessons/ai/trial-report/{uuid}` - AI 리포트

### 결제 및 구독
- `/subscribes/tickets` - 구독 상품 목록
- `/subscribes/payment/{subscribeId}` - 결제
- `/subscribes/payment/{subscribeId}/success` - 결제 완료
- `/subscribes/trial` - 체험권 목록
- `/subscribes/tickets/smart-talk` - 스마트톡 구독
- `/subscribes/tickets/payback` - 페이백 상품

### 마이페이지
- `/my-podo` - 마이페이지
- `/my-podo/coupon` - 쿠폰
- `/my-podo/payment-methods` - 결제 수단 관리
- `/my-podo/notices` - 공지사항
- `/my-podo/notification-settings` - 알림 설정

### 콜백 및 유틸리티
- `/callback/oauth/redirect` - OAuth 리다이렉트
- `/callback/oauth/set-local-storage` - 네이티브 앱 세션 설정
- `/open-in-app/{...path}` - 앱으로 열기

---

## 참고사항

### 피처 플래그
많은 기능이 피처 플래그로 제어됩니다:
- `enable_react_home`: React 홈 페이지 활성화
- `migration_booking_react`: React 예약 페이지 활성화
- `classroom_migration`: React 클래스룸 활성화
- `PODOLINGO_ENABLED`: AI 학습 활성화
- `apple_login`: 애플 로그인 활성화

### 레거시 시스템
Nuxt.js로 작성된 레거시 앱(`apps/legacy-web`)이 여전히 일부 기능을 담당하고 있습니다. Next.js 앱은 특정 라우트를 레거시 앱으로 프록시합니다.

### 환경
- **Local**: 로컬 개발 환경
- **Development**: 개발 서버
- **Staging**: 스테이징 서버
- **Production**: 프로덕션 서버

### 모니터링
- **Datadog RUM**: 실시간 사용자 모니터링
- **Sentry**: 에러 추적
- **GA4**: 사용자 행동 분석

---

## 6. 이탈 고객 리텐션 플로우

### 개요
구독이 만료된 이탈 고객(Churned User)에게 특별 프로모션을 제공하여 재구독을 유도하는 플로우입니다. 홈 화면 진입 시 풀페이지 팝업과 배너를 통해 프로모션을 노출합니다.

### 플로우 단계

#### 6.1 이탈 고객 판별
**API 엔드포인트**: `GET /api/v1/users/welcomeback-promotion`
- **파일**: `apps/server/src/domains/users/controller/welcomeback-promotion.handler.ts`

**응답 데이터** (`WelcomeBackPromotion`):
- `isEligible`: 프로모션 대상 여부
- `promotionType`: 프로모션 유형 (예: WELCOMEBACK_30)
- `discountRate`: 할인율
- `validUntil`: 프로모션 유효 기간

**판별 조건**:
- 구독 만료 후 일정 기간 경과
- 이전에 유료 구독 이력 있음
- 현재 활성 구독 없음

#### 6.2 홈 화면 진입 시 프로모션 노출
**진입점**: `/home` (홈 페이지)
- **파일**: `apps/web/src/views/home/view.tsx`

**동작**:
1. 홈 화면 렌더링 시 `welcomeback-promotion` API 호출
2. `isEligible=true`인 경우:
   - WelcomeBackPopup 컴포넌트 표시 (풀페이지)
   - HomeBannerCarousel에 WelcomeBackBanner 추가
3. `isEligible=false`인 경우:
   - 일반 홈 화면 표시

#### 6.3 WelcomeBack 풀페이지 팝업
**컴포넌트**: `WelcomeBackPopup`
- **파일**: `apps/web/src/widgets/src/welcomeback-popup/ui/welcomeback-popup.tsx`
- **클라이언트 래퍼**: `apps/web/src/widgets/src/welcomeback-popup/ui/welcomeback-popup-client.tsx`

**화면 구성**:
- 프로모션 이미지/일러스트
- 할인율 및 혜택 안내
- "지금 구독하기" CTA 버튼 → `/subscribes/tickets?promotionType=WELCOMEBACK`
- "다음에 할게요" 닫기 버튼

**표시 조건**:
- 세션당 1회 표시 (localStorage로 제어)
- 사용자가 닫으면 해당 세션에서 재표시 안 함

#### 6.4 WelcomeBack 배너
**컴포넌트**: `WelcomeBackBanner`
- **파일**: `apps/web/src/widgets/src/home-banners/ui/welcomeback-banner.tsx`

**위치**: HomeBannerCarousel 내 첫 번째 슬라이드

**화면 구성**:
- 배너 이미지 (welcomeback-low.png, welcomeback-medium.png)
- 할인율 텍스트
- 탭 시 → `/subscribes/tickets?promotionType=WELCOMEBACK`

**배너 이미지 경로**:
- `apps/web/public/images/banners/welcomeback-low.png`
- `apps/web/public/images/banners/welcomeback-medium.png`

#### 6.5 프로모션 적용 결제
**동작**:
1. 사용자가 프로모션 링크 클릭 → `/subscribes/tickets?promotionType=WELCOMEBACK`
2. 구독 상품 목록에서 프로모션 가격 표시
3. 결제 페이지에서 자동으로 프로모션 할인 적용
4. 결제 완료 시 프로모션 사용 처리

### 관련 파일 경로

**Server (apps/server)**:
```
src/domains/users/controller/welcomeback-promotion.handler.ts   # 프로모션 자격 확인 API
src/domains/users/dto/welcomebackPromotion.schema.ts            # 응답 스키마
src/domains/users/service.ts                                     # 비즈니스 로직
```

**Widgets (apps/web/src/widgets)**:
```
src/welcomeback-popup/ui/welcomeback-popup.tsx                  # 풀페이지 팝업
src/welcomeback-popup/ui/welcomeback-popup-client.tsx           # 클라이언트 래퍼
src/home-banners/ui/welcomeback-banner.tsx                      # 홈 배너
src/home-banners/ui/home-banner-carousel.tsx                    # 배너 캐러셀 (수정됨)
```

**Entities (apps/web/src/entities)**:
```
src/users/apis/get-welcomeback-promotion.ts                     # API 호출 함수
src/users/apis/user.query.ts                                    # React Query 훅
```

**Web App (apps/web)**:
```
src/views/home/view.tsx                                         # 홈 뷰 (팝업/배너 통합)
public/images/banners/welcomeback-low.png                       # 배너 이미지 (저해상도)
public/images/banners/welcomeback-medium.png                    # 배너 이미지 (고해상도)
```

### 시퀀스 다이어그램

```
사용자 → 홈 화면 진입
    │
    ├── GET /api/v1/users/welcomeback-promotion
    │   └── isEligible: true
    │
    ├── WelcomeBackPopup 표시
    │   ├── "지금 구독하기" 클릭 → /subscribes/tickets?promotionType=WELCOMEBACK
    │   └── "다음에 할게요" 클릭 → 팝업 닫기 (세션 저장)
    │
    └── HomeBannerCarousel
        └── WelcomeBackBanner (첫 번째 슬라이드)
            └── 탭 → /subscribes/tickets?promotionType=WELCOMEBACK
```

### 피처 플래그
- 현재 피처 플래그 없이 API 응답 기반으로 동작
- 향후 `welcomeback_promotion_enabled` 플래그 추가 가능
