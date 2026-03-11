# podo-app-DOC Sync Protocol

코드 변경사항을 문서에 반영하는 상세 규칙입니다.

## 문서 구조 개요

```
podo-docs/
├── README.md                      # 메인 진입점
├── architecture/
│   └── overview.md                # 아키텍처 개요
├── apps/                          # 앱별 문서
│   ├── web.md                     # Next.js 웹앱
│   ├── server.md                  # Hono BFF
│   ├── native.md                  # React Native
│   └── legacy-web.md              # Nuxt.js 레거시
├── design-system/
│   └── README.md                  # 디자인 시스템
├── indexes/                       # 인덱스 문서
│   ├── README.md
│   ├── routes-index.md            # URL → 화면 매핑
│   ├── components-index.md        # 컴포넌트 목록
│   └── api-index.md               # API 엔드포인트
├── packages/
│   └── README.md                  # 공유 패키지
├── glossary.md                    # 용어집
├── user-flows.md                  # 사용자 플로우
├── feature-flags.md               # 피처 플래그
└── migration-status.md            # 마이그레이션 현황
```

## 코드 참조 형식

### 절대 경로 형식 (표준)
```
~/podo-app-DOC/apps/web/src/app/(internal)/home/page.tsx
```

### 상대 경로 형식 (대안)
```
apps/web/src/app/(internal)/home/page.tsx
```

**규칙**: 기존 문서의 경로 형식을 유지. 새 항목 추가 시 해당 문서의 기존 형식 따름.

---

## 코드 변경 유형별 업데이트 규칙

### 1. Route(page.tsx) 변경 시

**영향 문서**:
- `indexes/routes-index.md`
- `user-flows.md` (관련 플로우가 있는 경우)

**업데이트 항목**:

| 변경 | 규칙 |
|------|------|
| 새 라우트 추가 | 테이블에 행 추가 (경로 알파벳 순 또는 논리적 그룹 내 위치) |
| 라우트 삭제 | [REMOVED] 표시 + 이력 주석 |
| 라우트 이동 | 경로 갱신, 필요시 NOTE 표시 |
| 인증 변경 | 인증 컬럼 갱신 |

**테이블 형식**:
```markdown
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/home` | `/Users/.../home/page.tsx` | 필요 | 메인 홈 | home, main |
```

**인증 값**:
- `필요` - 로그인 필요
- `불필요` - 공개 페이지
- `-` - 레이아웃/API 등 해당 없음

---

### 2. Component 변경 시

**영향 문서**:
- `indexes/components-index.md`
- `design-system/README.md` (디자인 시스템 컴포넌트인 경우)

**업데이트 항목**:

| 변경 | 규칙 |
|------|------|
| 새 컴포넌트 | 테이블에 행 추가 (카테고리별 그룹 유지) |
| 컴포넌트 삭제 | [REMOVED] 표시 |
| 버전 변경 (v1→v2) | 새 행 추가, 레거시 버전 유지 |
| Props 변경 | 해당 문서의 상세 섹션 갱신 (있는 경우) |

**테이블 형식**:
```markdown
| 컴포넌트 | 파일 경로 | 설명 | 키워드 |
|----------|----------|------|--------|
| `Button` | `/Users/.../button.tsx` | 기본 버튼 (v2) | button, cta, v2 |
```

---

### 3. API Route 변경 시

**영향 문서**:
- `indexes/api-index.md`

**업데이트 항목**:

| 변경 | 규칙 |
|------|------|
| 새 API | 테이블에 행 추가 (도메인별 그룹 유지) |
| API 삭제 | [REMOVED] 표시 |
| HTTP 메서드 변경 | HTTP 컬럼 갱신 |
| 경로 변경 | 엔드포인트 컬럼 갱신 |

**테이블 형식**:
```markdown
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/users/profile` | `/Users/.../profile.handler.ts` | 프로필 조회 | users, profile |
```

---

### 4. Hook/Provider 변경 시

**영향 문서**:
- `apps/{app}.md`
- `architecture/overview.md` (Provider 구조 변경 시)

**업데이트 항목**:

| 변경 | 규칙 |
|------|------|
| 새 Hook | 관련 앱 문서의 Hooks 섹션에 추가 |
| 새 Provider | architecture/overview.md의 Provider 계층 갱신 |
| Hook 삭제 | [REMOVED] 표시 |
| Hook 로직 변경 | 설명 텍스트는 보존, 파일 참조만 갱신 |

---

### 5. 파일 삭제 (D 상태) 시

**처리 단계**:

1. **연관 문서 검색**
```bash
grep -r "삭제된파일명" podo-docs/
grep -r "삭제된컴포넌트명" podo-docs/
```

2. **[REMOVED] 표시 형식**
```markdown
<!-- REMOVED: 2026-01-28, Commit: abc1234, Original: apps/web/src/components/OldButton.tsx -->
| ~~`OldButton`~~ | - | **[REMOVED]** | removed, deprecated |
```

또는 행 전체를 주석 처리:
```markdown
<!-- REMOVED: 2026-01-28, Commit: abc1234 | `OldButton` | /Users/.../OldButton.tsx | 기존 버튼 | button -->
```

---

### 6. 파일 이동/리네임 (R 상태) 시

**업데이트 항목**:
- 모든 파일 경로 참조 갱신

**규칙**:
- 절대 경로 사용 문서: 새 절대 경로로 갱신
- 상대 경로 사용 문서: 새 상대 경로로 갱신

---

### 7. 디렉토리 구조 변경 시 (⭐ 중요)

앱 문서(`apps/*.md`)에는 **디렉토리 트리 구조**가 포함되어 있습니다. 폴더/파일 추가, 삭제, 이동 시 해당 트리도 반드시 업데이트해야 합니다.

**영향 문서**:
- `apps/web.md` - Layers 구조, Views 구조
- `apps/server.md` - Domains 구조
- `apps/native.md` - App 구조
- `architecture/overview.md` - 전체 아키텍처 트리

#### 7.1 새 디렉토리/파일 추가 (A 상태)

**처리 단계**:
1. 추가된 경로의 상위 앱/레이어 식별
2. 해당 앱 문서의 디렉토리 트리 섹션 찾기
3. 알파벳 순서에 맞게 새 항목 추가
4. `# (NEW)` 주석 추가 (선택적)

**예시** - `apps/web/src/widgets/welcomeback-popup/` 추가:
```markdown
#### 변경 전
widgets/src/
├── tutor-profile/                     # 튜터 프로필
└── ...

#### 변경 후
widgets/src/
├── tutor-profile/                     # 튜터 프로필
└── welcomeback-popup/                 # 이탈 고객 프로모션 팝업 (NEW)
    ├── ui/welcomeback-popup.tsx       # 풀페이지 프로모션 팝업
    └── ui/welcomeback-popup-client.tsx # 클라이언트 전용 팝업
```

#### 7.2 디렉토리/파일 삭제 (D 상태)

**처리 단계**:
1. 삭제된 경로의 상위 앱/레이어 식별
2. 해당 앱 문서의 디렉토리 트리에서 항목 제거
3. 트리에서 완전히 제거 (테이블과 달리 [REMOVED] 표시 불필요)

**예시** - `apps/web/src/widgets/old-widget/` 삭제:
```markdown
#### 변경 전
widgets/src/
├── old-widget/                        # 레거시 위젯
└── tutor-profile/                     # 튜터 프로필

#### 변경 후
widgets/src/
└── tutor-profile/                     # 튜터 프로필
```

#### 7.3 디렉토리/파일 이동 (R 상태)

**처리 단계**:
1. 원본 위치에서 항목 제거
2. 새 위치에 항목 추가
3. 하위 파일들의 경로도 함께 갱신

**예시** - `widgets/src/banner/` → `widgets/src/home-banners/` 이동:
```markdown
#### 변경 전
widgets/src/
├── banner/                            # 배너 위젯
└── ...

#### 변경 후
widgets/src/
├── home-banners/                      # 홈 배너 캐러셀 (이동됨)
└── ...
```

#### 7.4 트리 구조 찾기 규칙

| 변경 경로 패턴 | 업데이트할 문서 | 트리 섹션 |
|---------------|----------------|----------|
| `apps/web/src/app/**` | `apps/web.md` | "src/ 상세 구조" |
| `apps/web/src/core/**` | `apps/web.md` | "Core Layer" |
| `apps/web/src/shared/**` | `apps/web.md` | "Shared Layer" |
| `apps/web/src/features/**` | `apps/web.md` | "Features Layer" |
| `apps/web/src/entities/**` | `apps/web.md` | "Entities Layer" |
| `apps/web/src/widgets/**` | `apps/web.md` | "Widgets Layer" |
| `apps/web/src/views/**` | `apps/web.md` | "Views 레이어" |
| `apps/server/src/domains/**` | `apps/server.md` | "Domains 구조" |
| `apps/native/src/**` | `apps/native.md` | "App 구조" |
| `design-system/**` | `design-system/README.md` | 해당 패키지 섹션 |

---

## 앱별 특수 규칙

### apps/web (Next.js)

**라우트 그룹 처리**:
- `(internal)/*` - 인증 필요
- `(external)/*` - 인증 불필요
- 라우트 인덱스에 인증 컬럼 자동 설정

**파일 패턴**:
- `page.tsx` - 페이지 컴포넌트 → routes-index 갱신
- `layout.tsx` - 레이아웃 → routes-index (레이아웃 섹션)
- `route.ts` - API 라우트 → api-index 갱신

### apps/server (Hono BFF)

**파일 패턴**:
- `*.handler.ts` - API 핸들러 → api-index 갱신
- `domains/{domain}/controller/` - 도메인별 API

### apps/native (React Native)

**파일 패턴**:
- `src/app/*.tsx` - Expo Router 페이지 → routes-index (Native 섹션)

### apps/legacy-web (Nuxt.js)

**파일 패턴**:
- `pages/**/*.vue` - 레거시 페이지 → routes-index (Legacy 섹션)

---

## 충돌 방지 규칙

### 테이블 업데이트 시

1. **그룹 유지**: 기존 카테고리/도메인 그룹 구조 유지
2. **순서 유지**: 알파벳 순 또는 논리적 순서 유지
3. **행 삭제 방지**: 삭제 시 [REMOVED] 표시

### 버전 공존 시 (v1/v2/v3)

1. **모든 버전 유지**: v1, v2, v3 섹션 모두 보존
2. **버전 라벨링**: 설명에 (v1), (v2), (v3) 명시
3. **새 컴포넌트**: 적절한 버전 섹션에 추가

### 마이그레이션 문서

1. `migration-status.md`는 수동 관리
2. 코드 변경으로 자동 갱신하지 않음

---

## 결과 반환 JSON 형식

```json
{
  "status": "success" | "partial" | "error",
  "repo": "podo-app-DOC",
  "range": "ORIG_HEAD..HEAD",
  "summary": {
    "files_analyzed": 25,
    "docs_updated": 12,
    "docs_skipped": 5,
    "manual_review_needed": 2
  },
  "updated_docs": [
    {
      "path": "podo-docs/indexes/routes-index.md",
      "changes": ["route_added: /new-page", "route_updated: /home"],
      "lines_affected": [45, 89, 102]
    },
    {
      "path": "podo-docs/indexes/components-index.md",
      "changes": ["component_added: NewDialog"],
      "lines_affected": [156]
    }
  ],
  "skipped": [
    {
      "path": "podo-docs/glossary.md",
      "reason": "manual_only_document"
    }
  ],
  "manual_review": [
    {
      "path": "podo-docs/architecture/overview.md",
      "reason": "provider_structure_change",
      "hint": "새 GlobalProvider 추가됨"
    }
  ],
  "errors": []
}
```

---

## 업데이트 예시

### 예시 1: 새 페이지 추가

**변경 파일**: `apps/web/src/app/(internal)/settings/page.tsx` (A 상태)

**After** (`indexes/routes-index.md`):
```markdown
### My Podo Routes - Settings (설정)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/settings` | `~/podo-app-DOC/apps/web/src/app/(internal)/settings/page.tsx` | 필요 | 설정 페이지 | settings, preferences |
```

### 예시 2: API 엔드포인트 삭제

**변경 파일**: `apps/server/src/domains/users/controller/legacy.handler.ts` (D 상태)

**After** (`indexes/api-index.md`):
```markdown
<!-- REMOVED: 2026-01-28, Commit: abc1234 | GET | `/api/v1/users/legacy` | .../legacy.handler.ts | [REMOVED] 레거시 API | legacy -->
```

### 예시 3: 컴포넌트 버전 업그레이드

**변경 파일**: `design-system/podo/src/components/v3/calendar/calendar.tsx` (A 상태)

**After** (`indexes/components-index.md`):
```markdown
#### v3 - Date/Time
| 컴포넌트 | 파일 경로 | 설명 | 키워드 |
|----------|----------|------|--------|
| `Calendar` | `/Users/.../v3/calendar/calendar.tsx` | 캘린더 (v3) | calendar, date-picker, v3 |
```
