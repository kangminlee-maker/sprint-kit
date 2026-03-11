# apps/legacy-web - Nuxt.js 2 레거시 웹 애플리케이션 문서

## 목차
- [개요](#개요)
- [기술 스택](#기술-스택)
- [디렉토리 구조](#디렉토리-구조)
- [페이지 구조](#페이지-구조)
- [컴포넌트 구조](#컴포넌트-구조)
- [레이아웃](#레이아웃)
- [상태 관리 (Vuex Store)](#상태-관리-vuex-store)
- [미들웨어](#미들웨어)
- [API 프록시 (Server Middleware)](#api-프록시-server-middleware)
- [플러그인](#플러그인)
- [Next.js와의 연동](#nextjs와의-연동)
- [환경 변수](#환경-변수)
- [빌드 및 배포](#빌드-및-배포)
- [마이그레이션 현황](#마이그레이션-현황)

---

## 개요

### 프로젝트 정보
- **패키지명**: `@podo/legacy-web`
- **프레임워크**: Nuxt.js 2.15.8
- **포트**: 3005 (로컬 개발 환경)
- **상태**: 마이그레이션 진행 중 (Next.js로 점진적 마이그레이션)
- **목적**: PODO 앱의 레거시 사용자 페이지 제공 (주로 `/app/user/podo/*` 경로)

### 주요 특징
- Nuxt.js 2 기반의 서버 사이드 렌더링 (SSR) 앱
- Vuetify 2를 사용한 Material Design UI
- Vuex를 통한 중앙화된 상태 관리
- Next.js (apps/web)와 멀티존 아키텍처로 통합
- 점진적 마이그레이션: 새로운 기능은 Next.js에서 개발, 기존 기능은 레거시 유지

---

## 기술 스택

### 핵심 프레임워크
| 기술 | 버전 | 용도 |
|------|------|------|
| **Nuxt.js** | 2.15.8 | Vue.js SSR 프레임워크 |
| **Vue.js** | 2.6.14 | UI 프레임워크 |
| **Vuetify** | 2.6.1 | Material Design 컴포넌트 라이브러리 |
| **Vuex** | (Nuxt 내장) | 상태 관리 |

### 주요 라이브러리
| 라이브러리 | 용도 |
|------------|------|
| `@nuxtjs/axios` | HTTP 클라이언트 |
| `@nuxtjs/proxy` | API 프록시 설정 |
| `@nuxtjs/device` | 디바이스 감지 (모바일/데스크톱) |
| `@nuxtjs/google-tag-manager` | GTM 통합 (ID: GTM-53SLQ7NC) |
| `cookie-universal-nuxt` | 쿠키 관리 |
| `moment` / `moment-timezone` | 날짜/시간 처리 |
| `howler` | 오디오 재생 |
| `html2canvas` | 스크린샷 캡처 |
| `lottie-web-vue` | Lottie 애니메이션 |
| `v-wave` | 리플 효과 |
| `vue-slick-carousel` | 캐러셀 컴포넌트 |

### 개발 도구
| 도구 | 용도 |
|------|------|
| `@nuxtjs/eslint-module` | ESLint 통합 |
| `tailwindcss` | 유틸리티 CSS (추가 스타일링) |
| `@nuxt/postcss8` | PostCSS 지원 |
| `prettier` | 코드 포맷팅 |

---

## 디렉토리 구조

```
apps/legacy-web/
├── api/                    # Server Middleware (API 프록시)
│   └── app/
│       ├── feature-flag/   # 피처 플래그 API
│       ├── user/           # 사용자 관련 API
│       │   ├── lemonade/   # 레모네이드(구버전) API
│       │   └── podo/       # PODO API
│       ├── send.js         # Axios 인스턴스 생성
│       ├── sendPhp.js      # PHP 백엔드 프록시
│       └── sendReact.js    # React 앱 프록시
├── assets/                 # 정적 자산
│   ├── fonts/              # 폰트 파일
│   ├── icon/               # 아이콘
│   ├── img/                # 이미지
│   ├── lemonade/           # 레모네이드 관련 자산
│   ├── podo/               # PODO 관련 자산
│   ├── popup/              # 팝업 이미지
│   └── scss/               # SCSS 스타일시트
│       ├── 1_layouts/      # 레이아웃 스타일
│       ├── 2_animations/   # 애니메이션
│       ├── 3_templates/    # 템플릿
│       └── 4_components/   # 컴포넌트 스타일
├── components/             # Vue 컴포넌트
│   ├── app/
│   │   ├── common/         # 공통 컴포넌트
│   │   └── lemonade/       # 레모네이드/PODO 컴포넌트
│   └── utils/              # 유틸리티 컴포넌트
├── layouts/                # Nuxt 레이아웃
│   ├── default.vue         # 기본 레이아웃
│   ├── default_podo.vue    # PODO 레이아웃 (탭바 포함)
│   ├── default_podo_no_tab.vue # PODO 레이아웃 (탭바 제외)
│   └── error.vue           # 에러 페이지
├── libs/                   # 라이브러리 및 유틸리티
│   └── user-agent.js       # User Agent 파싱
├── middleware/             # Nuxt 미들웨어
│   ├── auth.js             # 인증 미들웨어
│   ├── sessionError.js     # 세션 에러 처리
│   ├── feature-flag.js     # 피처 플래그
│   ├── healthcheck.js      # 헬스체크 (서버)
│   └── test.js             # 테스트 미들웨어
├── pages/                  # Nuxt 페이지 (라우트)
│   ├── index.vue           # 홈 페이지
│   └── app/user/podo/      # PODO 사용자 페이지
├── plugins/                # Nuxt 플러그인
│   ├── common.js           # 공통 유틸리티 주입
│   └── number-animation.js # 숫자 애니메이션
├── static/                 # 정적 파일 (직접 서빙)
│   └── RecorderWorker.js   # Web Worker
├── store/                  # Vuex Store
│   ├── index.js            # 루트 스토어
│   └── mypage/             # 마이페이지 스토어
├── nuxt.config.js          # Nuxt 설정
├── tailwind.config.js      # Tailwind CSS 설정
└── package.json            # 의존성 관리
```

---

## 페이지 구조

### 주요 페이지 및 라우트

#### `/app/user/podo/*` - PODO 사용자 페이지
모든 PODO 관련 페이지는 Next.js에서 레거시 웹으로 프록시됩니다.

| 페이지 파일 | 라우트 | 설명 | 레이아웃 |
|------------|--------|------|----------|
| `pages/app/user/podo/home.vue` | `/app/user/podo/home` | PODO 홈 (인사, 배너, 수업 준비, 튜토리얼) | `default_podo` |
| `pages/app/user/podo/classes.vue` | `/app/user/podo/classes` | 수업 내역 (완료된 수업 리스트) | `default_podo` |
| `pages/app/user/podo/class-reserved.vue` | `/app/user/podo/class-reserved` | 예약된 수업 목록 | `default_podo` |
| `pages/app/user/podo/class-booking.vue` | `/app/user/podo/class-booking` | 수업 예약 페이지 | `default_podo_no_tab` |
| `pages/app/user/podo/class-report.vue` | `/app/user/podo/class-report` | 수업 리포트 (수업 후 피드백) | `default_podo_no_tab` |
| `pages/app/user/podo/class-replay.vue` | `/app/user/podo/class-replay` | 수업 다시보기 | `default_podo_no_tab` |
| `pages/app/user/podo/classroom.vue` | `/app/user/podo/classroom` | 실시간 수업 화면 | `default_podo_no_tab` |
| `pages/app/user/podo/selftest.vue` | `/app/user/podo/selftest` | 셀프 테스트 (레벨 테스트) | `default_podo_no_tab` |

#### 마이페이지
| 페이지 파일 | 라우트 | 설명 |
|------------|--------|------|
| `pages/app/user/podo/mypage/index.vue` | `/app/user/podo/mypage` | 마이페이지 메인 |
| `pages/app/user/podo/mypage/plan/index.vue` | `/app/user/podo/mypage/plan` | 수강권(구독) 목록 |
| `pages/app/user/podo/mypage/plan/_ticketId.vue` | `/app/user/podo/mypage/plan/:ticketId` | 수강권 상세 |
| `pages/app/user/podo/mypage/payment.vue` | `/app/user/podo/mypage/payment` | 결제 내역 |
| `pages/app/user/podo/mypage/card-manage.vue` | `/app/user/podo/mypage/card-manage` | 카드 관리 |
| `pages/app/user/podo/mypage/card-registration.vue` | `/app/user/podo/mypage/card-registration` | 카드 등록 |

#### 탈퇴/해지
| 페이지 파일 | 라우트 | 설명 |
|------------|--------|------|
| `pages/app/user/podo/churn/index.vue` | `/app/user/podo/churn` | 구독 해지 메인 |
| `pages/app/user/podo/churn/quit-reason.vue` | `/app/user/podo/churn/quit-reason` | 해지 사유 선택 |

#### 디버그
| 페이지 파일 | 라우트 | 설명 |
|------------|--------|------|
| `pages/app/user/debug/index.vue` | `/app/user/debug` | 디버그 페이지 (개발용) |

#### 기타
| 페이지 파일 | 라우트 | 설명 |
|------------|--------|------|
| `pages/index.vue` | `/` | 루트 페이지 (리다이렉트용) |

### 페이지 구조 패턴
대부분의 페이지는 다음 구조를 따릅니다:
```vue
<template>
  <!-- UI 컴포넌트 -->
</template>

<script>
export default {
  layout: 'default_podo', // 또는 'default_podo_no_tab'
  middleware: 'auth',     // 인증 필요 시
  async asyncData({ store }) {
    // SSR 데이터 페칭
  },
  mounted() {
    // 클라이언트 초기화
  }
}
</script>

<style scoped>
/* 컴포넌트 스타일 */
</style>
```

---

## 컴포넌트 구조

### 공통 컴포넌트
**경로**: `components/app/common/`

| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **DefaultButton** | `components/app/common/button/DefaultButton.vue` | 기본 버튼 컴포넌트 |
| **Dialog** | `components/app/common/dialog/Dialog.vue` | 범용 다이얼로그 |
| **AlertDialog** | `components/app/common/dialog/AlertDialog.vue` | 알림 다이얼로그 |
| **ExternalDialog** | `components/app/common/dialog/ExternalDialog.vue` | 외부 iframe 다이얼로그 |
| **FirstClassCompDialog** | `components/app/common/dialog/FirstClassCompDialog.vue` | 첫 수업 완료 축하 다이얼로그 |
| **DefaultToast** | `components/app/common/toast/DefaultToast.vue` | 토스트 알림 |
| **PodoLoading** | `components/app/common/loading/PodoLoading.vue` | 로딩 스피너 |

### PODO 관련 컴포넌트
**경로**: `components/app/lemonade/podo/`

#### 네비게이션
| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **Nav** | `components/app/lemonade/podo/Nav.vue` | 상단 네비게이션 바 (수강권 정보 표시) |
| **BottomTabbar** | `components/app/lemonade/podo/BottomTabbar.vue` | 하단 탭바 (홈/수업/예약/마이페이지) |

#### 홈 페이지 컴포넌트
**경로**: `components/app/lemonade/podo/home/`

| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **TopBanner** | `components/app/lemonade/podo/home/TopBanner.vue` | 상단 광고 배너 |
| **Greeting** | `components/app/lemonade/podo/home/Greeting.vue` | 사용자 인사 및 다음 수업 정보 |
| **Tutorial** | `components/app/lemonade/podo/home/Tutorial.vue` | 체험 수업 튜토리얼 단계 UI |
| **ClassPrepare** | `components/app/lemonade/podo/home/ClassPrepare.vue` | 수업 준비 섹션 (발음학습북, 선행학습) |
| **Courses** | `components/app/lemonade/podo/home/Courses.vue` | 수강권 목록 표시 |
| **HeadTeacherContact** | `components/app/lemonade/podo/home/HeadTeacherContact.vue` | 담임 선생님 연락처 |
| **HomePopup** | `components/app/lemonade/podo/home/HomePopup.vue` | 홈 팝업 (광고, 공지) |

#### 수업 관련 컴포넌트
**경로**: `components/app/lemonade/podo/`

| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **ClassHistory** | `components/app/lemonade/podo/classes/ClassHistory.vue` | 수업 내역 리스트 아이템 |
| **ClassTimeChecker** | `components/app/lemonade/podo/classroom/ClassTimeChecker.vue` | 수업 시간 체크 (예약 시간 확인) |

#### 팝업 컴포넌트
**경로**: `components/app/lemonade/podo/popup/`

| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **Drawer** | `components/app/lemonade/podo/popup/Drawer.vue` | 바텀 시트 드로어 |
| **ClassCancelConfirm** | `components/app/lemonade/podo/popup/ClassCancelConfirm.vue` | 수업 취소 확인 다이얼로그 |
| **CertificateIssuanceDrawer** | `components/app/lemonade/podo/popup/CertificateIssuanceDrawer/` | 수료증 발급 관련 드로어 (3개 페이지) |

#### 기타
| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **PopupClassCaution** | `components/app/lemonade/podo/PopupClassCaution.vue` | 수업 주의사항 팝업 |
| **KakaoBlock** | `components/app/lemonade/podo/KakaoBlock.vue` | 카카오톡 차단 안내 |
| **BetaIcon** | `components/app/lemonade/podo/BetaIcon.vue` | 베타 기능 아이콘 |

### 레모네이드 공통 컴포넌트
**경로**: `components/app/lemonade/`

| 컴포넌트 | 파일 경로 | 용도 |
|----------|-----------|------|
| **SideBar** | `components/app/lemonade/SideBar.vue` | 사이드바 메뉴 |
| **TeacherProfile** | `components/app/lemonade/TeacherProfile.vue` | 튜터 프로필 표시 |
| **IosVersionCheck** | `components/app/lemonade/IosVersionCheck.vue` | iOS 버전 체크 및 업데이트 안내 |

### 유틸리티
**경로**: `components/utils/`

| 파일 | 용도 |
|------|------|
| `components/utils/checkDevice.js` | 디바이스 감지 유틸리티 |

---

## 레이아웃

Nuxt.js의 레이아웃 시스템을 사용하여 페이지 전역 UI를 정의합니다.

### 1. default.vue
**경로**: `layouts/default.vue`

기본 레이아웃. 단순한 페이지에 사용.

```vue
<template>
  <v-app>
    <Nuxt />
  </v-app>
</template>
```

### 2. default_podo.vue
**경로**: `layouts/default_podo.vue`

PODO 앱 레이아웃 (하단 탭바 포함).

**주요 구성요소**:
- `<Nav>`: 상단 네비게이션
- `<Nuxt>`: 페이지 콘텐츠
- `<BottomTabbar>`: 하단 탭 네비게이션 (홈, 수업, 예약, 마이페이지)

**탭 구조**:
```javascript
tabPaths: {
  home: '/app/user/podo/home',
  class: '/app/user/podo/classes',
  reserved: '/app/user/podo/class-reserved',
  mypage: '/app/user/podo/mypage',
}
```

**사용 페이지**:
- 홈
- 수업 내역
- 예약 목록
- 마이페이지

### 3. default_podo_no_tab.vue
**경로**: `layouts/default_podo_no_tab.vue`

PODO 앱 레이아웃 (하단 탭바 제외).

**주요 구성요소**:
- `<Nav>`: 상단 네비게이션
- `<Nuxt>`: 페이지 콘텐츠

**사용 페이지**:
- 수업 예약
- 수업 리포트
- 수업 화면
- 셀프 테스트

### 4. error.vue
**경로**: `layouts/error.vue`

에러 페이지 레이아웃.

**처리 에러**:
- 401 Unauthorized (세션 만료)
- 404 Not Found
- 500 Internal Server Error

---

## 상태 관리 (Vuex Store)

### 루트 스토어
**경로**: `store/index.js`

#### State
```javascript
state: {
  authInfo: {},              // 인증 정보 (uid, token, accessToken, refreshToken)
  sessionId: '',             // 세션 ID
  currentTab: null,          // 현재 선택된 탭
  tabPaths: {                // 탭 경로 매핑
    home: '/app/user/podo/home',
    class: '/app/user/podo/classes',
    reserved: '/app/user/podo/class-reserved',
    mypage: '/app/user/podo/mypage',
  },
  featureFlag: {},           // 피처 플래그
  testableUserIdList: [],    // 테스트 가능 사용자 목록
  // PODO 관련 상태
  podoUserInfo: {},          // 사용자 정보
  podoTrialCourseList: {},   // 체험 수업 커리큘럼
  podoClassCourseList: {},   // 정규 수업 커리큘럼
  podoClassLevelList: {},    // 수업 레벨 목록
  podoClassHistoryList: {},  // 수업 내역
  podoSubscriptionList: {},  // 구독(수강권) 목록
  podoNextClassInfo: {},     // 다음 수업 정보
  podoTicketList: {},        // 수강권 티켓 목록
  podoCardInfo: {},          // 결제 카드 정보
  // ... 기타 PODO 상태
}
```

#### Mutations
상태를 동기적으로 변경하는 메서드.

**주요 Mutations**:
- `fetchAuthInfo`: 인증 정보 설정
- `resetAuthInfo`: 인증 정보 초기화
- `SET_CURRENT_TAB`: 현재 탭 설정
- `fetchPodoUserInfo`: 사용자 정보 저장
- `fetchPodoTicketList`: 수강권 목록 저장
- ... (50+ mutations)

#### Actions
비동기 작업 및 API 호출을 처리.

**주요 Actions**:

| Action | 설명 | API |
|--------|------|-----|
| `FETCH_PODO_USER_INFO` | 사용자 정보 조회 | `GET /api/v1/user/podo/info` |
| `FETCH_PODO_TICKET_LIST` | 수강권 목록 조회 | `GET /api/v1/subscribe/podo/ticketList` |
| `FETCH_PODO_CLASS_HISTORY_LIST` | 수업 내역 조회 | `GET /api/v1/lecture/podo/history` |
| `FETCH_PODO_NEXT_CLASS_INFO` | 다음 수업 정보 조회 | `GET /api/v1/lecture/podo/nextClass` |
| `REQUEST_CREATE_PODO_CLASS_V2` | 수업 생성 (예약) | `POST /api/v2/lecture/podo/create` |
| `REQUEST_UPDATE_PODO_CLASS` | 수업 상태 업데이트 | `PUT /api/v1/lecture/podo/update` |
| `REQUEST_FINISH_PODO_CLASS` | 수업 종료 | `POST /api/v1/lecture/podo/finish` |
| `FETCH_PODO_CARD_INFO` | 결제 카드 조회 | `GET /api/v1/payment/card` |
| `CREATE_CARD` | 카드 등록 | `POST /api/v1/payment/card` |
| `DELETE_CARD` | 카드 삭제 | `DELETE /api/v1/payment/card` |
| `UPDATE_SUBSCRIPTION` | 구독 연장 | `PUT /api/v1/subscribe/extend` |
| `FETCH_PODO_REPORT` | 수업 리포트 조회 | `GET /api/v1/report` |

**Tab Navigation Actions**:
```javascript
actions: {
  initializeTab({ commit, state }, path) {
    // 현재 경로에 맞는 탭 초기화
  },
  navigateToTab({ commit, state }, tab) {
    // 탭 전환 및 라우팅
  }
}
```

### 마이페이지 스토어
**경로**: `store/mypage/index.js`

마이페이지 관련 상태 관리 (구조 확인 필요).

---

## 미들웨어

### 1. sessionError.js
**경로**: `middleware/sessionError.js`

**용도**: 세션 에러 처리

```javascript
export default function ({ route, error }) {
  if (route.path === '/session-error') {
    return error({ statusCode: 401, message: '로그인이 풀렸습니다.' });
  }
}
```

**적용**: 전역 (nuxt.config.js의 `router.middleware`)

### 2. auth.js
**경로**: `middleware/auth.js`

**용도**: 인증 확인 및 쿠키에서 토큰 추출

**주요 로직**:
1. 쿠키에서 `accessToken`, `refreshToken` 추출
2. 토큰이 없으면 `/login`으로 리다이렉트
3. 토큰이 있으면 Vuex 스토어에 인증 정보 저장

**쿠키 병합**:
- `cookie` 헤더 (기본값)
- `set-cookie` 헤더 (우선순위 높음)

**적용**: 페이지별로 `middleware: 'auth'` 지정

### 3. feature-flag.js
**경로**: `middleware/feature-flag.js`

**용도**: 피처 플래그 설정 (추정)

### 4. healthcheck.js (Server Middleware)
**경로**: `middleware/healthcheck.js`

**용도**: 헬스체크 엔드포인트 제공

**적용**: `serverMiddleware` (nuxt.config.js)

### 5. test.js (Server Middleware)
**경로**: `middleware/test.js`

**용도**: 테스트용 미들웨어 (추정)

**적용**: `serverMiddleware` (nuxt.config.js)

---

## API 프록시 (Server Middleware)

Nuxt.js의 `serverMiddleware`를 사용하여 백엔드 API로의 프록시 역할을 수행합니다.

### 디렉토리 구조
```
api/
├── app/
│   ├── send.js                 # Axios 인스턴스 생성 (기본)
│   ├── sendPhp.js              # PHP 백엔드 프록시
│   ├── sendReact.js            # React 앱 프록시
│   ├── feature-flag/
│   │   └── index.js            # 피처 플래그 API
│   └── user/
│       ├── lemonade/
│       │   └── index.js        # 레모네이드 API
│       └── podo/
│           ├── index.js        # PODO 공통 API
│           ├── home.js         # 홈 관련 API
│           ├── class-booking.js # 수업 예약 API
│           ├── class-report.js  # 수업 리포트 API
│           ├── class-reserved.js # 예약 목록 API
│           └── churn/
│               └── index.js    # 구독 해지 API
```

### 1. send.js - Axios 인스턴스 팩토리
**경로**: `api/app/send.js`

**기능**:
- 인증 헤더 자동 추가 (UID, USER_TOKEN, Authorization, Refresh-Token)
- 401 Unauthorized 에러 시 `/session-error`로 리다이렉트
- `Authorization` 헤더 자동 갱신 (응답에서 새 토큰 추출)

**사용 예시**:
```javascript
import instance from '@/api/app/send';

function fetchUserInfo(auth) {
  return instance(auth, process.env.PODO_API).get('/api/v1/user/info');
}
```

### 2. PODO API 모듈

#### home.js
**경로**: `api/app/user/podo/home.js`

**제공 함수**:
- `fetchPodoAdPopup(auth)`: 광고 팝업 조회
- `fetchAllSubscribeList(auth)`: 구독 리스트 조회
- `fetchCompPreStudyList(auth)`: 선행학습 완료 수업 조회

#### index.js (PODO 공통)
**경로**: `api/app/user/podo/index.js`

**제공 함수** (50+ 함수, 주요 일부만 나열):
- `fetchPodoUserInfo(auth)`: 사용자 정보
- `fetchPodoTrialCourseList(auth)`: 체험 수업 커리큘럼
- `fetchPodoClassCourseList(auth)`: 정규 수업 커리큘럼
- `fetchPodoClassLevelList(auth)`: 수업 레벨 목록
- `fetchPodoClassHistoryList(auth)`: 수업 내역
- `fetchPodoNextClass(auth)`: 다음 수업 정보
- `fetchPodoTicketList(auth)`: 수강권 목록
- `fetchPodoSubscription(auth)`: 구독 정보
- `fetchPodoCardInfo(auth)`: 결제 카드 정보
- `fetchPodoCardList(auth)`: 카드 목록
- `requestCreatePodoClassV1(auth, payload)`: 수업 생성 v1
- `requestCreatePodoClassV2(auth, payload)`: 수업 생성 v2
- `requestUpdatePodoClass(auth, payload)`: 수업 업데이트
- `requestFinishPodoClass(auth, payload)`: 수업 종료
- `createCard(auth, payload)`: 카드 등록
- `deleteCard(auth, payload)`: 카드 삭제
- `updatePodoTicket(auth, payload)`: 수강권 업데이트
- `updateCardSelected(auth, payload)`: 기본 카드 선택

#### class-report.js
**경로**: `api/app/user/podo/class-report.js`

**제공 함수**:
- `fetchPodoReport(auth, payload)`: 수업 리포트 조회
- `fetchPodoExtendProducts(auth, payload)`: 연장 상품 조회
- `fetchPodoExtendProductsV2(auth, payload)`: 연장 상품 조회 v2
- `fetchPodoPaymentInfo(auth, payload)`: 결제 수단 조회
- `updateSubscription(auth, payload)`: 구독 연장 v1
- `updateSubscriptionV2(auth, payload)`: 구독 연장 v2

#### churn/index.js
**경로**: `api/app/user/podo/churn/index.js`

**용도**: 구독 해지 관련 API

### 3. 레모네이드 API
**경로**: `api/app/user/lemonade/index.js`

**제공 함수**:
- `fetchLeLectureRoomInfo(auth, payload)`: 강의실 정보 조회
- `fetchLeLectureEnterInfo(auth, payload)`: 수업 접속 정보 조회
- `fetchLeLectureReplayInfo(auth, payload)`: 수업 다시보기 정보 조회
- `fetchLeNoticeList(auth, payload)`: 공지사항 조회
- `fetchLeTeacherProfile(auth, payload)`: 튜터 프로필 조회

---

## 플러그인

### 1. common.js
**경로**: `plugins/common.js`

**기능**: 전역 유틸리티 함수 및 피처 플래그 리졸버 주입

**주입 함수** (`$` 접두사로 접근):

| 함수명 | 설명 | 사용 예 |
|--------|------|---------|
| `$openSubActivity(site, closeable)` | 네이티브 앱 서브 액티비티 열기 | `this.$openSubActivity('/payment')` |
| `$redirectToRenewalApp(pathname, params)` | Next.js 앱으로 리다이렉트 | `this.$redirectToRenewalApp('/home')` |
| `$isEnabled(key)` | 피처 플래그 활성화 확인 | `this.$isEnabled('new_feature')` |
| `$isEnabledByTestableUserId(key)` | 테스트 사용자 전용 피처 플래그 | `this.$isEnabledByTestableUserId('beta_feature')` |
| `$requestAllowNotification(msgTxt)` | 알림 권한 요청 (네이티브) | `this.$requestAllowNotification('수업 알림')` |
| `$clearHistory()` | 히스토리 제거 (Android) | `this.$clearHistory()` |
| `$activeAudioPermission()` | 오디오 권한 활성화 (네이티브) | `this.$activeAudioPermission()` |
| `$logout()` | 로그아웃 | `this.$logout()` |
| `$calcLeftTime(currentTime, targetTimestamp)` | 남은 시간 계산 (예: "3일", "2시간") | `this.$calcLeftTime(now, classTime)` |
| `$calculateDateDiff(startDate, finalDate)` | 날짜 차이 계산 (일 단위) | `this.$calculateDateDiff(start, end)` |

**피처 플래그 통합**:
```javascript
import { setFeatureFlagResolver } from '@packages/navigation';

setFeatureFlagResolver((flagKey) => {
  const flag = store.state.featureFlag[flagKey];
  return flag ? flag.enabled : false;
});
```

### 2. number-animation.js
**경로**: `plugins/number-animation.js`

**기능**: `vue-number-animation` 플러그인 등록 (클라이언트 전용)

**사용**: 숫자 카운트업 애니메이션

---

## Next.js와의 연동

### 멀티존 아키텍처

apps/web (Next.js)와 apps/legacy-web (Nuxt.js)은 **멀티존** 구조로 통합됩니다.

#### Next.js 설정 (apps/web/next.config.ts)
```typescript
async rewrites() {
  return [
    // Nuxt.js 정적 자산 프록시
    {
      source: '/_nuxt/:path+',
      destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/_nuxt/:path+`,
    },
    // Nuxt.js 페이지 프록시
    {
      source: '/app/user/podo/:path+',
      destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/app/user/podo/:path+`,
    },
    // 로컬 개발 전용 (HMR)
    ...(env.APP_ENV === 'local' ? [
      {
        source: '/_loading/:path+',
        destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/_loading/:path+`,
      },
      {
        source: '/__webpack_hmr/:path+',
        destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/__webpack_hmr/:path+`,
      },
    ] : []),
  ]
}
```

#### 프록시되는 라우트
Next.js에서 다음 경로로 요청이 오면 Nuxt.js로 프록시됩니다:

| 경로 패턴 | 설명 |
|----------|------|
| `/_nuxt/*` | Nuxt.js 번들 파일 (JS, CSS) |
| `/app/user/podo/*` | PODO 사용자 페이지 전체 |

### 동작 흐름
1. 사용자가 `https://app.podospeaking.com/app/user/podo/home` 접속
2. Next.js가 요청 수신
3. `next.config.ts`의 `rewrites` 규칙에 따라 Nuxt.js (포트 3005)로 프록시
4. Nuxt.js가 페이지 렌더링 및 응답
5. 클라이언트에서 필요한 `/_nuxt/*` 자산 요청도 동일하게 프록시

### 개발 환경 설정
```bash
# Terminal 1: Nuxt.js 실행
cd apps/legacy-web
pnpm dev  # 포트 3005

# Terminal 2: Next.js 실행
cd apps/web
pnpm dev  # 포트 3000
```

Next.js가 Nuxt.js로 프록시하므로 **반드시 Nuxt.js가 먼저 실행**되어야 합니다.

---

## 환경 변수

### 환경별 파일
- `.env.local`: 로컬 개발
- `.env.development`: 개발 서버
- `.env.staging`: 스테이징 서버
- `.env.green`: Green 배포
- `.env.blue`: Blue 배포

### 주요 환경 변수
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `APP_ENV` | 환경 구분 | `local`, `development`, `production` |
| `BASE_URL` | API 기본 URL | `https://api.podospeaking.com` |
| `PODO_WEB` | 메인 웹사이트 URL | `https://podospeaking.com` |
| `PODO_API` | PODO API URL | `https://api.podospeaking.com` |
| `PODO_APP` | 앱 URL | `https://app.podospeaking.com` |
| `PODO_REACT_ORIGIN` | Next.js 앱 URL (리다이렉트용) | `http://localhost:3000` |
| `IS_PROD` | 프로덕션 여부 (자동 계산) | `true` / `false` |

### nuxt.config.js 주입
```javascript
env: {
  APP_ENV: process.env.APP_ENV,
  BASE_URL: process.env.BASE_URL,
  PODO_WEB: process.env.PODO_WEB,
  PODO_API: process.env.PODO_API,
  PODO_APP: process.env.PODO_APP,
  PODO_REACT_ORIGIN: process.env.PODO_REACT_ORIGIN,
  IS_PROD: isProd,
}
```

**접근 방법**:
- 클라이언트/서버: `process.env.PODO_API`

---

## 빌드 및 배포

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 로컬 개발 서버 (포트 3005) |
| `pnpm build:dev` | 개발 환경 빌드 |
| `pnpm start:dev` | 개발 환경 서버 실행 |
| `pnpm build:stage` | 스테이징 환경 빌드 |
| `pnpm start:stage` | 스테이징 환경 서버 실행 |
| `pnpm build:green` | Green 배포 빌드 |
| `pnpm start:green` | Green 배포 서버 실행 |
| `pnpm build:blue` | Blue 배포 빌드 |
| `pnpm start:blue` | Blue 배포 서버 실행 |
| `pnpm lint` | ESLint + Prettier 검사 |
| `pnpm lintfix` | 자동 수정 |

### 빌드 설정 (nuxt.config.js)

#### PostCSS & Tailwind
```javascript
build: {
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
}
```

#### CDN 설정 (프로덕션)
```javascript
publicPath: isProd ? 'https://dnhzd42enzqe4.cloudfront.net' : undefined,
```

프로덕션에서는 정적 자산을 CloudFront CDN에서 서빙합니다.

#### Transpile 설정
```javascript
transpile: ['zod', '@packages/navigation']
```

모노레포 패키지를 Babel로 트랜스파일합니다.

### 배포 플로우
1. GitHub Actions에서 빌드 트리거
2. 환경별 `.env` 파일 주입
3. `pnpm build:{env}` 실행
4. Docker 이미지 빌드
5. ECR 푸시
6. EKS에 배포
7. Next.js와 함께 멀티존으로 서빙

---

## 마이그레이션 현황

### 마이그레이션 전략
PODO 서비스는 **점진적 마이그레이션** 전략을 따릅니다:
1. 새로운 기능은 Next.js (apps/web)에서 개발
2. 기존 기능은 Nuxt.js (apps/legacy-web)에서 유지
3. 트래픽이 적은 페이지부터 순차적으로 마이그레이션

### 마이그레이션된 페이지 (Next.js로 이동 완료)
현재 Next.js에서 처리하는 페이지는 CLAUDE.md 참고.

주요 마이그레이션 완료:
- 로그인/회원가입 (`/login`, `/oauth/kakao`, `/oauth/apple`)
- 메인 홈 (`/` - 홈 페이지는 Next.js로 마이그레이션)

### 마이그레이션 예정 페이지 (Nuxt.js에서 아직 사용 중)

#### 우선순위 HIGH (자주 사용되는 페이지)
- `/app/user/podo/home` - PODO 홈 (탭 네비게이션 포함)
- `/app/user/podo/classes` - 수업 내역
- `/app/user/podo/class-reserved` - 예약 목록
- `/app/user/podo/class-booking` - 수업 예약
- `/app/user/podo/mypage` - 마이페이지

#### 우선순위 MEDIUM
- `/app/user/podo/class-report` - 수업 리포트
- `/app/user/podo/classroom` - 실시간 수업 화면
- `/app/user/podo/mypage/plan` - 수강권 관리
- `/app/user/podo/mypage/payment` - 결제 내역

#### 우선순위 LOW (트래픽 낮음)
- `/app/user/podo/class-replay` - 수업 다시보기
- `/app/user/podo/selftest` - 셀프 테스트
- `/app/user/podo/mypage/card-manage` - 카드 관리
- `/app/user/podo/churn` - 구독 해지
- `/app/user/debug` - 디버그 페이지

### 마이그레이션 시 주의사항
1. **인증 시스템**: Nuxt.js는 쿠키 기반 인증, Next.js는 미들웨어 체이닝 (`withSession`)
2. **상태 관리**: Vuex → TanStack Query로 전환
3. **컴포넌트**: Vuetify 2 → design-system/podo로 전환
4. **라우팅**: Nuxt.js 파일 기반 라우팅 → Next.js App Router
5. **API 호출**: Axios → Hono RPC 클라이언트 (apps/server/BFF 경유)

---

## 키워드 인덱스 (RAG 검색용)

### 기술 스택 키워드
Nuxt.js, Nuxt 2, Vue.js, Vue 2, Vuetify, Vuex, SSR, Server-Side Rendering, Axios, Tailwind CSS, PostCSS, GTM, Google Tag Manager, moment.js, howler.js, lottie, cookie-universal-nuxt

### 페이지 키워드
home, 홈, classes, 수업 내역, class-reserved, 예약, class-booking, 수업 예약, class-report, 리포트, classroom, 실시간 수업, selftest, 셀프 테스트, 레벨 테스트, mypage, 마이페이지, plan, 수강권, payment, 결제, card-manage, 카드 관리, churn, 구독 해지, 탈퇴

### 컴포넌트 키워드
Nav, 네비게이션, BottomTabbar, 탭바, Greeting, 인사, Tutorial, 튜토리얼, ClassPrepare, 수업 준비, TopBanner, 배너, Dialog, 다이얼로그, Toast, 토스트, Loading, 로딩, Drawer, 드로어, SideBar, 사이드바, TeacherProfile, 튜터 프로필

### 기능 키워드
authentication, 인증, authorization, 권한, session, 세션, cookie, 쿠키, token, 토큰, JWT, refresh token, feature flag, 피처 플래그, proxy, 프록시, middleware, 미들웨어, Vuex store, 상태 관리, API, REST API, health check, 헬스체크

### 마이그레이션 키워드
migration, 마이그레이션, legacy, 레거시, Next.js integration, Next.js 통합, multi-zone, 멀티존, rewrite, 프록시, gradual migration, 점진적 마이그레이션

### 배포 키워드
build, 빌드, deploy, 배포, CDN, CloudFront, Docker, EKS, ECR, GitHub Actions, CI/CD, green-blue deployment, 무중단 배포

### 개발 키워드
npm script, pnpm, dev server, 개발 서버, hot reload, HMR, ESLint, Prettier, debugging, 디버깅, environment variable, 환경 변수

---

## 관련 문서
- [apps/web - Next.js 메인 앱 문서](./web.md) (예정)
- [apps/server - Hono BFF 문서](./server.md) (예정)
- [design-system/podo - 디자인 시스템 문서](../design-system/podo.md) (예정)
- [모노레포 루트 CLAUDE.md](~/podo-app-DOC/CLAUDE.md)

---

**문서 작성일**: 2026-01-26
**문서 버전**: 1.0.0
**대상 버전**: apps/legacy-web@1.0.0 (Nuxt.js 2.15.8)
