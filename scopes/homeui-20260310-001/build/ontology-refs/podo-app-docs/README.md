# 포도 서비스 문서 센터

> **Podo Service Documentation Center**
> 기획자, 디자이너, 개발자가 포도 서비스를 이해하고 효율적으로 협업하기 위한 통합 문서 센터입니다.

**최종 업데이트**: 2026-01-28
**문서 버전**: 1.0.1
**대상 독자**: 기획자, 디자이너, 신규 개발자, PM

---

## 문서의 목적

이 문서 센터는 다음을 목표로 합니다:

- **서비스 이해**: 포도 서비스의 전체 구조와 기능을 한눈에 파악
- **빠른 검색**: 화면, API, 컴포넌트, 용어를 신속하게 찾기
- **효율적 협업**: 기획/디자인/개발 간 공통 언어 제공
- **지식 전파**: 신규 구성원의 온보딩 시간 단축

---

## 📂 문서 구조

```
.podo-docs/
├── README.md              # 이 파일 (메인 진입점)
├── architecture/
│   └── overview.md        # 전체 아키텍처 개요
├── apps/
│   ├── web.md            # Next.js 웹앱 상세
│   ├── server.md         # Hono BFF 상세
│   ├── native.md         # React Native 앱 상세
│   └── legacy-web.md     # Nuxt.js 레거시 상세
├── packages/
│   └── README.md         # 공유 패키지 문서
├── design-system/
│   └── README.md         # 디자인 시스템 문서
├── indexes/
│   ├── apps-index.md     # 앱별 파일 인덱스
│   ├── routes-index.md   # 라우트 인덱스 (URL → 화면)
│   ├── components-index.md # 컴포넌트 인덱스
│   └── api-index.md      # API 엔드포인트 인덱스
├── glossary.md           # 용어집
├── user-flows.md         # 사용자 플로우
└── migration-status.md   # 마이그레이션 현황
```

---

## 🚀 빠른 참조 가이드

### 자주 묻는 질문별 문서 안내

| 질문 | 참조 문서 |
|------|----------|
| 어떤 화면이 있나요? | [`indexes/routes-index.md`](./indexes/routes-index.md) |
| 이 용어가 뭔가요? | [`glossary.md`](./glossary.md) |
| 사용자는 어떻게 이동하나요? | [`user-flows.md`](./user-flows.md) |
| 어떤 컴포넌트를 쓸 수 있나요? | [`indexes/components-index.md`](./indexes/components-index.md) |
| API 엔드포인트는? | [`indexes/api-index.md`](./indexes/api-index.md) |
| 레거시 vs 신규 차이는? | [`migration-status.md`](./migration-status.md) |
| 전체 구조가 궁금해요 | [`architecture/overview.md`](./architecture/overview.md) |
| 디자인 시스템은? | [`design-system/README.md`](./design-system/README.md) |

---

## 🛠 기술 스택 요약

### 웹 애플리케이션 (apps/web)
- **프레임워크**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS
- **상태 관리**: TanStack Query v5
- **배포**: EKS (Docker/ECR)
- **모니터링**: Datadog RUM, Sentry

### 모바일 애플리케이션 (apps/native)
- **플랫폼**: React Native 0.79, Expo 53
- **대상**: 튜터용 모바일 앱 (iOS/Android)

### 서버 (apps/server)
- **BFF**: Hono (Backend for Frontend)
- **ORM**: Drizzle
- **검증**: Zod
- **API 문서**: OpenAPI (via @hono/zod-openapi)

### 레거시 (apps/legacy-web)
- **프레임워크**: Nuxt.js 2
- **상태**: 마이그레이션 진행 중
- **역할**: 특정 라우트 프록시 (`/_nuxt/*`, `/app/user/podo/*`)

### 공유 레이어
- **모노레포**: pnpm workspaces + Turbo
- **디자인 시스템**: Storybook 9 (core, podo, tutor-web)
- **피처 플래그**: Flagsmith

---

## 🔍 RAG 검색 가이드

### 효과적인 검색 팁

1. **화면 찾기**: "예약 화면", "로그인 페이지" → `routes-index.md` 검색
2. **용어 찾기**: "튜터", "매칭", "포인트" → `glossary.md` 검색
3. **컴포넌트 찾기**: "버튼", "모달", "폼" → `components-index.md` 검색
4. **API 찾기**: "예약 생성", "사용자 정보" → `api-index.md` 검색
5. **플로우 이해**: "예약 플로우", "결제 과정" → `user-flows.md` 검색

### 주요 키워드 목록

**도메인 용어**
- 튜터(Tutor), 학생(Student), 포도 전용 튜터(Podo Tutor)
- 예약(Reservation), 매칭(Matching), 세션(Session)
- 포인트(Point), 크레딧(Credit), 결제(Payment)
- 커리큘럼(Curriculum), 학습 진도(Progress)

**기술 용어**
- RSC (React Server Component), SSR, CSR
- BFF (Backend for Frontend)
- Feature Flag, A/B Testing
- Middleware, Route Handler

**앱 구분**
- Web, Native, Server, Legacy-Web
- Podo (학생용), Tutor (튜터용)

---

## 📖 문서 읽는 순서 (신규 구성원 추천)

### 1단계: 전체 이해
1. [`architecture/overview.md`](./architecture/overview.md) - 아키텍처 개요
2. [`glossary.md`](./glossary.md) - 핵심 용어 학습

### 2단계: 도메인 이해
3. [`user-flows.md`](./user-flows.md) - 주요 사용자 플로우
4. [`indexes/routes-index.md`](./indexes/routes-index.md) - 화면 목록 파악

### 3단계: 기술 스택 이해
5. [`apps/web.md`](./apps/web.md) - 웹앱 구조
6. [`apps/server.md`](./apps/server.md) - BFF 구조
7. [`design-system/README.md`](./design-system/README.md) - 디자인 시스템

### 4단계: 현황 파악
8. [`migration-status.md`](./migration-status.md) - 마이그레이션 현황

---

## 🤝 문서 기여 가이드

### 문서 업데이트가 필요한 경우
- 새로운 화면/기능 추가 시
- 주요 아키텍처 변경 시
- 용어 정의 변경 시
- 디자인 시스템 컴포넌트 추가 시

### 업데이트 방법
1. 해당 문서 파일 수정
2. 이 README 상단의 "최종 업데이트" 날짜 갱신
3. PR에 `docs` 라벨 추가

---

## 📞 문서 관련 문의

- **문서 오류 발견**: GitHub Issue 생성 (`docs` 라벨)
- **신규 문서 요청**: 팀 채널에 문의
- **긴급 질문**: 개발팀 담당자에게 직접 연락

---

## 🗂 관련 문서

- [CLAUDE.md](../CLAUDE.md) - Claude Code 개발 가이드
- [.cursor/rules](../.cursor/rules) - 코드 컨벤션
- [package.json](../package.json) - 프로젝트 설정

---

**이 문서는 MCP(Model Context Protocol) 서버를 통해 AI 어시스턴트가 자동으로 검색/조회할 수 있도록 구조화되어 있습니다.**
