# RAG 인덱스 생성 완료

포도 서비스의 RAG 검색을 위한 4개 인덱스 파일이 성공적으로 생성되었습니다.

## 생성된 파일

| 파일명 | 크기 | 라인 수 | 설명 |
|--------|------|---------|------|
| `apps-index.md` | 24KB | 272줄 | 앱별 주요 파일 경로 인덱스 |
| `routes-index.md` | 26KB | 289줄 | 모든 라우트 및 API 엔드포인트 |
| `components-index.md` | 23KB | 304줄 | 디자인 시스템 컴포넌트 목록 |
| `api-index.md` | 17KB | 280줄 | BFF API 상세 인덱스 |
| `README.md` | 5KB | 200줄 | 사용 가이드 |
| **합계** | **95KB** | **1,345줄** | - |

## 커버리지

### apps-index.md
- apps/web: 50+ 라우트, 40+ 뷰, 미들웨어
- apps/server: 8개 도메인, 50+ 핸들러
- apps/native: 15+ 모듈 (hooks, UI, core)
- apps/legacy-web: 15+ Nuxt 페이지

### routes-index.md
- apps/web: 46개 내부 라우트, 12개 외부 라우트
- apps/server: 40+ API 엔드포인트 (v1/v2)
- apps/legacy-web: 15개 레거시 라우트
- apps/native: 4개 네이티브 라우트

### components-index.md
- design-system/core: 7개 레이아웃 컴포넌트
- design-system/podo v1: 15개 컴포넌트
- design-system/podo v2: 30+ 컴포넌트
- design-system/podo v3: 20+ 컴포넌트
- packages/design-system-temp: 30+ 통합 컴포넌트

### api-index.md
- Authentication (v1/v2): 10개 엔드포인트
- OAuth (Kakao/Apple): 3개 엔드포인트
- Coupons: 3개 엔드포인트
- Lessons: 7개 엔드포인트
- Subscribes: 3개 엔드포인트
- Payment Methods: 2개 엔드포인트
- Users: 2개 엔드포인트
- Payment: 8개 엔드포인트 (SQS, 웹훅)

## 주요 특징

### 1. 검색 최적화
- 마크다운 테이블 형식으로 읽기 쉬움
- 키워드 기반 검색 가능
- 파일 경로는 절대 경로로 통일

### 2. 카테고리별 그룹핑
- 기능별 (라우트, 컴포넌트, API)
- 도메인별 (인증, 수업, 결제 등)
- 버전별 (v1, v2, v3)

### 3. 메타데이터 포함
- 파일 경로, 설명, 키워드
- HTTP 메서드, 요청/응답 타입 (API)
- 인증 필요 여부 (라우트)
- 버전 정보 (컴포넌트)

## 사용 예시

### RAG 질의 예시 1: "홈 페이지는 어디에 있나요?"
**검색 키워드**: `home`, `main`
**찾을 인덱스**: `routes-index.md`
**결과**:
```
라우트: /home
파일: ~/podo-app-DOC/apps/web/src/app/(internal)/home/page.tsx
뷰: ~/podo-app-DOC/apps/web/src/views/home/view.tsx
```

### RAG 질의 예시 2: "Button 컴포넌트는 어떤 버전을 사용하나요?"
**검색 키워드**: `button`, `component`
**찾을 인덱스**: `components-index.md`
**결과**:
```
- v1 (레거시): design-system/podo/src/components/v1/button/
- v2 (현재): design-system/podo/src/components/v2/button/
- v3 (최신): design-system/podo/src/components/v3/button/
- temp (통합): packages/design-system-temp/src/components/button/
권장: v2 또는 temp 사용
```

### RAG 질의 예시 3: "쿠폰 API는 어떻게 호출하나요?"
**검색 키워드**: `coupon`, `api`
**찾을 인덱스**: `api-index.md`
**결과**:
```
GET /api/v1/coupons/available
- 파일: apps/server/src/domains/coupons/controller/available.handler.ts
- 요청: Header: Authorization
- 응답: JSON: Coupon[]
- 서비스: apps/server/src/domains/coupons/service.ts
```

### RAG 질의 예시 4: "네이티브 앱에서 푸시 알림은 어떻게 처리하나요?"
**검색 키워드**: `push`, `notification`, `native`
**찾을 인덱스**: `apps-index.md`
**결과**:
```
훅: apps/native/src/shared/hooks/use-push-notification.ts
라이브러리: apps/native/src/shared/libs/register-push-notification.ts
API: POST /api/v1/users/device-token
```

## 다음 단계

### 1. RAG 시스템 통합
- 벡터 데이터베이스에 임베딩 저장
- 의미론적 검색 구현
- LLM과 연동하여 자연어 질의 지원

### 2. 자동 업데이트
- Git hook 설정 (pre-commit)
- CI/CD 파이프라인에 인덱스 생성 추가
- 변경 사항 자동 감지 및 업데이트

### 3. 추가 인덱스
- `hooks-index.md`: 모든 커스텀 훅
- `utils-index.md`: 유틸리티 함수
- `types-index.md`: 타입 정의
- `tests-index.md`: 테스트 파일

### 4. 문서화 개선
- 각 파일의 역할과 책임 명시
- 의존성 관계 다이어그램
- 사용 예제 추가

## 생성 정보

- **생성일**: 2026-01-26
- **생성 도구**: Claude Code (Sisyphus-Junior)
- **코드베이스**: podo-app-DOC
- **브랜치**: feat/DOC
- **커밋 기준**: fc79c51f (2026-01-26)

## 유지보수

### 업데이트가 필요한 경우
1. 새로운 라우트 추가
2. 새로운 API 엔드포인트 추가
3. 새로운 컴포넌트 추가
4. 앱 구조 변경
5. 파일 위치 이동

### 업데이트 방법
```bash
# 수동 업데이트
vi ~/podo-app-DOC/.podo-docs/indexes/{index-file}.md

# 자동 업데이트 (향후 구현 예정)
pnpm run update-indexes
```

## 문의

인덱스 파일 관련 문의나 개선 제안은 팀 채널로 연락 바랍니다.
