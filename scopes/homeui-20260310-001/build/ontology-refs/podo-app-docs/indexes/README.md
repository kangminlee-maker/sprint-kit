# Podo Service RAG Search Indexes

포도 서비스의 RAG (Retrieval-Augmented Generation) 검색을 위한 종합 인덱스 파일들입니다.

## 인덱스 파일 목록

### 1. apps-index.md (272줄, 24KB)
모든 앱의 주요 파일 경로 인덱스

**포함 내용:**
- **apps/web**: Next.js 15 웹 앱의 모든 라우트, 뷰, 컴포넌트
- **apps/server**: Hono BFF의 도메인별 컨트롤러, 서비스, DTO
- **apps/native**: React Native 앱의 코어 모듈, 훅, UI 컴포넌트
- **apps/legacy-web**: Nuxt.js 레거시 앱의 페이지

**카테고리:**
- Core Files (엔트리포인트, 미들웨어, 설정)
- Routes (라우트별 페이지 파일)
- Views (페이지 레벨 컴포넌트)
- Domains (BFF 도메인별 구조)
- Hooks, UI, HOCs (네이티브 앱)

### 2. routes-index.md (289줄, 26KB)
모든 라우트 경로와 API 엔드포인트 인덱스

**포함 내용:**
- **apps/web Routes**: App Router 기반 모든 라우트 (internal/external)
- **apps/server API**: v1/v2 API 엔드포인트 (HTTP 메서드, 경로)
- **apps/legacy-web Routes**: Nuxt.js 페이지 라우트
- **apps/native Routes**: Expo Router 라우트

**카테고리:**
- Home, Authentication, Booking, Lessons, Subscribes, My Podo
- OAuth Callbacks, Deep Links, API Routes
- v1/v2 API Endpoints (domain별)

### 3. components-index.md (304줄, 23KB)
모든 디자인 시스템 컴포넌트 인덱스

**포함 내용:**
- **design-system/core**: 기본 Layout 컴포넌트 (Box, Flex, Stack 등)
- **design-system/podo**: Podo 전용 컴포넌트 (v1, v2, v3)
- **packages/design-system-temp**: 통합 디자인 시스템 (마이그레이션 타겟)

**카테고리:**
- Layout, Buttons, Forms, Typography
- Feedback, Navigation, Overlays, Icons
- Data Display

**버전 정보:**
- v1: 레거시 (새 개발 지양)
- v2: 현재 활성 (대부분 사용)
- v3: 최신 (일부만 제공)

### 4. api-index.md (280줄, 17KB)
BFF API 엔드포인트 상세 인덱스

**포함 내용:**
- **v1 API**: 쿠폰, 수업, 구독, 결제, 사용자
- **v2 API**: 개선된 인증 플로우
- **OAuth API**: 카카오/Apple 소셜 로그인
- **Payment API**: SQS 메시지 핸들러, 웹훅

**상세 정보:**
- HTTP 메서드, 엔드포인트, 파일 경로
- 요청/응답 형식
- 도메인 서비스, DTO, 엔티티 위치
- 인증 플로우, 결제 프로세스 설명

---

## 사용 방법

### 1. 라우트 찾기
특정 URL의 구현 파일을 찾을 때:

```bash
# routes-index.md에서 검색
# 예: "/home" 라우트 찾기
grep -i "\/home" routes-index.md
```

**결과:**
- 파일 경로: `~/podo-app-DOC/apps/web/src/app/(internal)/home/page.tsx`
- 인증: 필요
- 설명: 메인 홈 페이지
- 키워드: home, main, dashboard

### 2. 컴포넌트 찾기
사용하려는 디자인 시스템 컴포넌트 찾기:

```bash
# components-index.md에서 검색
# 예: Button 컴포넌트 찾기
grep -i "button" components-index.md
```

**결과:**
- v1, v2, v3 버전별 Button 컴포넌트 경로
- packages/design-system-temp의 통합 버전
- 각 버전의 특징 및 권장 사용 버전

### 3. API 엔드포인트 찾기
백엔드 API 구현 파일 찾기:

```bash
# api-index.md에서 검색
# 예: 쿠폰 관련 API 찾기
grep -i "coupon" api-index.md
```

**결과:**
- HTTP 메서드, 엔드포인트, 컨트롤러 경로
- 요청/응답 DTO 경로
- 서비스 로직 경로

### 4. 앱별 파일 찾기
특정 앱의 구조 파악:

```bash
# apps-index.md에서 검색
# 예: native 앱의 hooks 찾기
grep -i "hooks" apps-index.md | grep native
```

---

## 검색 키워드 가이드

### 기능별 키워드
| 기능 | 키워드 |
|------|--------|
| 홈 화면 | home, main, dashboard |
| 로그인 | login, oauth, kakao, apple, auth |
| 수업 예약 | booking, reservation, schedule |
| 수업 목록 | lessons, regular, trial, ai |
| 이용권 구매 | subscribes, tickets, purchase |
| 결제 | payment, checkout, card |
| 마이페이지 | mypage, profile, settings |
| 쿠폰 | coupons, discount |
| 알림 | notification, push |

### 기술별 키워드
| 기술 | 키워드 |
|------|--------|
| Next.js 라우트 | page.tsx, layout.tsx, route.ts |
| React 컴포넌트 | view.tsx, tsx |
| API 엔드포인트 | handler.ts, controller |
| 서비스 로직 | service.ts |
| 데이터 스키마 | schema.ts, dto, entity |
| 미들웨어 | middleware.ts |

---

## 파일 구조

```
.podo-docs/indexes/
├── README.md                 # 이 파일
├── apps-index.md             # 앱별 파일 인덱스
├── routes-index.md           # 라우트 및 API 인덱스
├── components-index.md       # 컴포넌트 인덱스
└── api-index.md              # API 상세 인덱스
```

---

## RAG 시스템 통합

이 인덱스 파일들은 다음과 같은 RAG 시스템에서 활용됩니다:

1. **문서 검색**: 키워드 기반 빠른 파일 찾기
2. **컨텍스트 제공**: AI가 코드베이스 이해할 수 있도록 구조 정보 제공
3. **자동 완성**: 파일 경로, API 엔드포인트 자동 완성
4. **의존성 추적**: 관련 파일 간의 연결 관계 파악

---

## 업데이트 가이드

코드베이스가 변경될 때 인덱스 업데이트 방법:

### 자동 업데이트 (권장)
```bash
# 스크립트 실행 (향후 추가 예정)
pnpm run update-indexes
```

### 수동 업데이트
1. 새로운 라우트 추가 시: `routes-index.md` 업데이트
2. 새로운 컴포넌트 추가 시: `components-index.md` 업데이트
3. 새로운 API 추가 시: `api-index.md` 업데이트
4. 새로운 앱/패키지 추가 시: `apps-index.md` 업데이트

---

## 통계

- **총 파일 수**: 1,145줄
- **총 크기**: 90KB
- **커버 범위**:
  - apps/web: 50+ 라우트, 40+ 뷰
  - apps/server: 50+ API 엔드포인트
  - design-system: 100+ 컴포넌트 (v1/v2/v3)
  - apps/native: 15+ 모듈
  - apps/legacy-web: 15+ 페이지

---

## 참고 자료

- [CLAUDE.md](../../CLAUDE.md): 프로젝트 전체 가이드
- [모노레포 구조](../../README.md): 전체 프로젝트 구조
- [API 문서](../../apps/server/README.md): BFF API 상세 문서
