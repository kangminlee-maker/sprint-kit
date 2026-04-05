# /start Protocol

scope를 생성하거나, 이미 존재하는 scope를 이어서 진행합니다.
2단계 실행: 첫 번째 실행에서 brief를 준비하고, 두 번째 실행에서 grounding을 수행합니다.

## 입력

```
/start {projectName} [--add-dir 경로] [--github URL] [--figma file_key] [--obsidian 경로]
```

`projectName`은 scope를 식별하는 이름입니다. 소문자, 하이픈 허용. 공백은 하이픈으로 변환됩니다.
추가 소스를 플래그로 지정할 수 있습니다. `.sprint-kit.yaml`의 기본 소스와 병합됩니다.

예시:
```
/start tutor-block --add-dir /projects/app/src --figma abc123
```

### 소스 설정

#### `.sprint-kit.yaml` (레포 루트)

기본 소스를 선언합니다. 이 파일이 없으면 `/start` 플래그로만 소스를 지정합니다.

```yaml
default_sources:
  - type: github-tarball
    url: https://github.com/org/app
    description: 앱 소스코드
  - type: add-dir
    path: ./sources
    description: 디자인 가이드, 이용약관
```

전체 소스 타입은 아래 테이블 참조.

허용되는 `type` 값:

| type | 필수 필드 | 접근 방법 |
|------|----------|----------|
| `add-dir` | `path` | 로컬 파일/디렉토리 직접 읽기 |
| `github-tarball` | `url` | `gh api tarball/HEAD`로 다운로드 |
| `figma-mcp` | `file_key` | MCP 서버 통해 Figma 데이터 조회 |
| `obsidian-vault` | `path` | 로컬 vault 디렉토리 읽기 (`.obsidian/` 제외) |

`description`은 모든 타입에서 선택 사항이며, scope.md에서 스캔 소스 목록에 표시됩니다.

#### 소스 수집 및 병합 규칙

소스는 3곳에서 수집하여 중복 제거 후 전부 사용합니다.

**수집 경로:**

| 경로 | 수집 시점 | 설명 |
|------|----------|------|
| `.sprint-kit.yaml`의 `default_sources` | Path B 실행 시 | 프로젝트 공통 소스 (환경설정) |
| `inputs/brief.md`의 "추가 소스" 섹션 | Path B 실행 시 | 이 scope에만 필요한 추가 소스 |
| `/start` CLI 인자 (`--add-dir`, `--github`, `--figma`, `--obsidian`) | Path B 실행 시 | 실행 시점에 직접 지정하는 소스 |

**병합 규칙:**
- 키: `{type}:{identifier}` (예: `add-dir:./src`, `github-tarball:https://...`)
- 3곳에서 수집한 소스를 하나의 목록으로 합칩니다
- 같은 키가 여러 곳에 있으면 1개만 남깁니다 (중복 제거)
- 우선순위 없음 — 모든 소스를 동등하게 사용합니다
- 결과는 `inputs/sources.yaml`에 기록됩니다

**brief.md 소스 선반영:**
- Path A에서 brief.md를 생성할 때, `.sprint-kit.yaml`의 `default_sources`를 "자동 로드 (환경설정)" 섹션에 미리 채워둡니다
- 이것은 생성 시점의 1회성 스냅샷이며, 이후 `.sprint-kit.yaml`이 변경되어도 brief.md는 자동 갱신되지 않습니다
- Path B 실행 시 `.sprint-kit.yaml`을 다시 읽으므로, brief.md와 yaml의 불일치가 있어도 최종 sources.yaml에는 양쪽 소스가 모두 포함됩니다

**brief.md "추가 소스" 파싱 규칙:**
- `### 추가 소스` 섹션 아래의 체크리스트 항목을 파싱합니다
- 형식: `- [ ] {description} ({type}: {identifier})` 또는 `- [x] {description} ({type}: {identifier})`
- 체크 여부에 관계없이 모든 항목을 수집합니다 (체크박스는 사용자 편의용)
- 빈 항목 `(여기에 추가 소스를 기입하세요)`은 무시합니다

## 실행 환경

이 프로토콜의 코드 연산은 `src/index.ts` 공개 API를 통해 실행합니다.

```typescript
// ESM 프로젝트입니다. import를 사용하세요 (require() 불가).
// --input-type=module: --eval 코드를 ESM으로 해석 (Node.js 표준 플래그, tsx가 전달)
// 실행: npx tsx --input-type=module --eval "import { executeStart } from './src/index.ts'; ..."
import { executeStart } from './src/index.ts';
```

프로젝트 모듈 시스템: ESM (`"type": "module"`)
TypeScript 실행: `npx tsx`
코드 실행 방법: `npx tsx --input-type=module --eval "..."` (`--eval`/stdin은 파일 경로가 없어 `package.json`의 `"type"`을 인식하지 못하므로 `--input-type=module`로 ESM을 명시해야 합니다)
공개 API 진입점: `src/index.ts` — 외부에서는 이 파일만 import하세요.

## 실행 순서

`/start {projectName}` 실행 시, `executeStart()` 함수가 scope 폴더와 이벤트 로그 상태에 따라 3가지 경로 중 하나로 자동 분기합니다.

### 경로 판별 (executeStart 내부에서 자동 처리)

```
scopesDir/{projectName}-{YYYYMMDD}-* 폴더가 존재하는가?
├─ 없음 → Path A (신규)
└─ 있음 → events.ndjson이 비어있거나 없는가?
    ├─ 예 → Path B (brief 작성 완료 후 첫 grounding)
    └─ 아니오 → Path C (재개)
```

### executeStart() 호출

```typescript
import { executeStart } from './src/index.ts';

const result = await executeStart({
  projectName: "free-trial",       // scope 이름
  rawInput: "free-trial",          // 사용자 입력 원문 (--add-dir 등 플래그 포함 가능)
  projectRoot: process.cwd(),      // .sprint-kit.yaml이 있는 디렉토리
  scopesDir: join(process.cwd(), "scopes"),
  onProgress: (msg) => console.log(msg),  // 진행 상태 콜백 (선택)
});
```

### 반환 타입별 처리

`executeStart()`는 3가지 경로에 따라 서로 다른 결과를 반환합니다.

#### Path A — 신규 scope 생성 (`action: "initialized"`)

반환 필드:
- `result.paths` — scope 디렉토리 경로들 (ScopePaths)
- `result.scopeId` — 예: `"free-trial-20260316-001"`
- `result.briefPath` — 예: `"scopes/.../inputs/brief.md"`

scope 폴더를 생성하고 `inputs/brief.md` 템플릿을 만듭니다. grounding은 실행하지 않습니다.

- `scopeId`: `{projectName}-{YYYYMMDD}-{NNN}` 형식 (예: tutor-block-20260309-001)
- `YYYYMMDD`: scope 생성 날짜
- `NNN`: 같은 날짜+프로젝트명 조합에서 순차 부여 (001부터)

**brief.md 자동 생성**: `createScope`는 `inputs/brief.md` 템플릿을 자동으로 생성합니다.
- 변경 목적, 대상 사용자, 기대 결과 등 필수 항목을 포함
- `.sprint-kit.yaml`의 `default_sources`가 있으면 소스 목록을 자동으로 채움
- 이미 `brief.md`가 존재하면 덮어쓰지 않음 (멱등성 보장)

**사용자 안내**: 다음 내용을 사용자에게 표시합니다:

> `scopes/{scopeId}/inputs/brief.md`가 생성되었습니다.
>
> 다음 필수 항목을 작성한 후 `/start {projectName}`을 다시 실행해 주세요:
> - **변경 목적** — 무엇을 왜 변경하는가
> - **대상 사용자** — 이 변경의 영향을 받는 사용자
> - **기대 결과** — 변경이 성공하면 달라지는 것
>
> 아직 내용이 정리되지 않았다면, brief를 비워둔 채로 `/start {projectName}`을 실행해도 됩니다. Exploration 대화를 통해 함께 방향을 찾아갈 수 있습니다.

**이벤트 기록 없음** — `scope.created`는 Path B에서 기록합니다.

#### Path B — grounding 완료 (`action: "executed"` 또는 undefined)

반환 필드:
- `result.paths` — scope 디렉토리 경로들 (ScopePaths)
- `result.scanResults` — 스캔 성공한 소스들 (ScanResult[])
- `result.scanErrors` — 스캔 실패한 소스들 (ScanError[])
- `result.sourceHashes` — 소스별 content hash
- `result.totalFiles` — 스캔된 파일 수
- `result.briefValidation?` — brief가 불완전할 때만 존재 (`{ isComplete: false, missingFields: string[] }`)

`executeStart()`가 내부적으로 처리하는 것:
- brief.md 검증 (필수 항목 확인 — **불완전해도 차단하지 않음**)
- 소스 3-way 병합 (.sprint-kit.yaml + brief.md + CLI 인자)
- `scope.created` 이벤트 기록
- 소스 스캔 (병렬 실행)
- `grounding.started` + `grounding.completed` 이벤트 기록
- `reality-snapshot.json` + `scope.md` 생성

**brief 불완전 시**: `result.briefValidation`이 존재합니다. 에이전트는 Step 4.5에서 `entry_mode: "conversation"`으로 exploration에 진입하여, 사용자와 대화를 통해 방향을 함께 찾아갑니다.

Path B 성공 후, 에이전트는 `result.scanResults`를 사용하여 아래 "공통 실행 단계" (Step 4~7)를 실행합니다.

#### Path C — 재개 (`action: "resume_info"`)

반환 필드:
- `result.currentState` — 현재 상태 (예: `"grounded"`, `"align_proposed"`)
- `result.nextAction` — PO 친화적 한국어 안내 메시지

이벤트 로그를 읽어 현재 상태를 확인하고, 상태에 맞는 안내를 제공합니다. `result.nextAction` 메시지를 사용자에게 표시합니다.

| 현재 상태 | 동작 |
|-----------|------|
| `grounded` | Step 4~7 실행 |
| `exploring` | `exploration.md` 프로토콜로 진입 |
| `align_proposed` | `/align`으로 결정 요청 |
| `align_locked` 이상 | `/draft`로 진행 안내 |
| `closed` / `deferred` / `rejected` | 종료 안내 |

#### 실패 (`success: false`)

반환 필드:
- `result.reason` — 실패 사유
- `result.step` — 실패 단계 (예: `"brief_validation"`, `"scan_sources"`)

`result.reason`을 사용자에게 표시합니다.

---

### Recovery Paths

#### grounded 이상에서 소스 변경 감지 시

`snapshot.marked_stale` 경로를 사용합니다. `grounded` 상태에서 self-transition을 허용하여, 소스를 재스캔하고 snapshot을 갱신합니다.

#### scope.created 후 grounding 실패 시

Path C의 `draft` 상태로 재진입합니다. `/start`를 다시 실행하면 됩니다.

---

### Brief 검증 규칙

필수 항목: **변경 목적**, **대상 사용자**, **기대 결과**

판단 기준:
- 해당 섹션의 `<!-- -->` 주석 아래에 공백이 아닌 텍스트가 1줄 이상 있으면 → **채워짐**
- 빈 줄만 있거나 주석만 있으면 → **비어있음**

---

## 공통 실행 단계 (Step 4~7)

Path B 성공 후 또는 Path C에서 `grounded` 상태일 때, 에이전트가 아래 단계를 실행합니다.

> **Step 2~3 (소스 스캔 + Grounding 기록)은 `executeStart()`가 자동으로 처리합니다.**
> Path B 실행 시 `scope.created`, `grounding.started`, `grounding.completed` 이벤트가 내부적으로 기록되며,
> `result.scanResults`에 스캔 결과가 반환됩니다.

#### 3-Perspective 탐색 체크리스트

**Experience** — 사용자가 보고 만지는 것에서 제약을 찾습니다:
- [ ] 화면 레이아웃: 공간 부족, 배치 충돌
- [ ] 사용자 흐름: 누락된 단계, 막다른 경로
- [ ] 디자인 가이드: 간격, 색상, 컴포넌트 규격 위반
- [ ] 기존 상호작용 패턴: 학습된 패턴과의 충돌

**Code** — 시스템이 실행하는 것에서 제약을 찾습니다:
- [ ] DB 스키마: 저장 공간 부재, 타입 불일치
- [ ] API 계약: 호환성 파괴, 응답 형식 변경
- [ ] 모듈 의존성: 순환 참조, 결합도
- [ ] 상태 머신: 빠진 전이, 잘못된 상태
- [ ] 성능: 쿼리 복잡도, 데이터량

**Brownfield 불변 제약 기록** (Code 관점에서 제약 발견 시 함께 수행):

변경 영향권에 있는 기존 코드에서, 깨지면 안 되는 규칙을 `BrownfieldInvariant`로 기록합니다.
Grounding 단계에서는 **api_contract** 유형을 우선 기록합니다:

- [ ] 외부에 노출된 API 엔드포인트의 응답 필드 구조 (필드명, 타입, 필수/선택)
- [ ] 다른 서비스가 호출하는 내부 API의 요청/응답 계약
- [ ] webhook, 콜백 등 외부 시스템이 전제하는 데이터 형식

기록 형식:
```typescript
// brownfieldDetail.invariants에 추가
{
  name: "GET /api/bookings 응답에 schedule_id 필드 필수",
  source: "src/api/bookings.ts",
  description: "모바일 앱이 schedule_id를 필수로 사용. 삭제 시 앱 크래시",
  type: "api_contract",
  affected_files: ["src/api/bookings.ts", "src/types/booking.ts"]
}
```

Grounding은 방향 수준이므로, 변경 영향권이 명확한 API만 기록합니다. 세부 불변 제약은 Draft에서 추가합니다.

**Policy** — 규칙이 제약하는 것에서 제약을 찾습니다:
- [ ] 이용약관: 조항 충돌
- [ ] 사업 규칙: 모순, 미정의 케이스
- [ ] 규제/법규: 준수 요건
- [ ] 디자인 표준: 브랜드, 접근성
- [ ] 운영 정책: CS 워크플로, 에스컬레이션 경로

#### 탐색 깊이

Grounding 단계는 **방향 수준**입니다. "이 방향으로 가면 어떤 큰 충돌이 있는가?"를 찾습니다. 구체적 surface가 없으므로 세부 구현 제약은 Draft에서 발견합니다.

### 2.5. 정책 대조 (Policy Cross-Reference)

발견된 각 constraint에 대해, 해당 내용이 정책 문서(ontology)에서 뒷받침되는지 교차 확인합니다.

**절차:**

1. constraint가 주장하는 비즈니스 규칙을 추출합니다 (예: "체험 수업은 항상 무료 취소")
2. 해당 규칙이 정의된 정책 문서를 소스에서 검색합니다 (온톨로지, 이용약관, 비즈니스 규칙 문서)
3. 검색 결과에 따라 `evidence_status`를 설정합니다:
   - `verified` — 정책 문서에서 확인됨. `source_refs`에 문서명과 섹션을 인용합니다.
   - `code_inferred` — 코드에서 추론됨. 정책 문서에 명시적 근거 없음. `evidence_note`에 추론 출처를 기록합니다.
   - `brief_claimed` — brief 또는 사용자 주장. 정책 문서와 대조하지 못함. `evidence_note`에 "확인 필요" 사유를 기록합니다.
   - `unverified` — 출처 미확인. `evidence_note`에 "정책 문서 검색 결과 없음"을 기록합니다.
4. `constraint.discovered` 이벤트의 payload에 `evidence_status`와 `evidence_note`를 포함합니다.

**규칙:**
- `severity: required` + `evidence_status: unverified`인 constraint는 Align Packet에서 "미검증 가정" 섹션에 별도 표시됩니다.
- 이 단계는 constraint의 severity나 decision_owner를 변경하지 않습니다. evidence_status만 추가합니다.
- 정책 문서 접근이 불가능한 환경(온톨로지 소스 없음)에서는 모든 constraint의 `evidence_status`를 `unverified`로 설정합니다.

```typescript
// constraint.discovered 이벤트 payload 구조 — 정책 대조 포함 (참조용)
{
  constraint_id: "CST-001",
  perspective: "experience",
  summary: "...",
  severity: "required",
  discovery_stage: "grounding",
  decision_owner: "product_owner",
  impact_if_ignored: "...",
  source_refs: [{ source: "...", detail: "..." }],
  evidence_status: "verified",           // 정책 대조 결과
  evidence_note: "schedule/policies.md 섹션 3.2에서 확인",  // 인용 또는 미확인 사유
}
```

### 3. 온톨로지 유도 코드 선별 (Ontology-Guided Code Selection)

온톨로지 소스(glossary/actions/transitions YAML)가 `default_sources`에 포함된 경우, grounding 완료 후 **6관점 코드 선별**을 수행하여 brief와 관련된 코드를 사전 분류합니다.

권장 선언 방식:

```yaml
default_sources:
  - type: add-dir
    path: ./domain-assets
    content_role: ontology_bundle
    ontology_files:
      code_mapping: ontology/code-mapping.yaml
      behavior: ontology/behavior.yaml
      model: ontology/model.yaml
```

- `content_role: ontology_bundle`가 명시된 source를 우선 사용합니다.
- `ontology_files`를 생략하면 source 내부에서 exact filename을 탐색합니다.
- explicit declaration이 없으면 ontology-guided selection 준비를 건너뛰고 기존 탐색으로 진행합니다.

#### 3.1. 작동 조건

- 온톨로지 소스가 스캔되었고 `OntologyIndex`가 구축된 경우에만 실행
- 온톨로지가 없으면 이 단계를 건너뛰고 기존 방식(에이전트 직접 탐색)으로 진행
- 이 단계가 실패해도 grounding은 성공

#### 3.2. 에이전트 수행 절차

**Step 1**: brief.md에서 변경 목표와 관련된 **도메인 키워드**를 추출합니다.

- brief의 핵심 명사/동사를 추출합니다 (예: "체험 수업 3회 무료 제공" → ["체험", "수업", "수강권", "결제"])
- 한국어 키워드와 영어 키워드 모두 포함합니다

**Step 2**: 추출된 키워드로 `queryOntology()`를 호출합니다.

```typescript
import { buildOntologyIndex, queryOntology } from './src/index.ts';

const index = buildOntologyIndex(glossaryYaml, actionsYaml, transitionsYaml);
const result = queryOntology(index, keywords);
// result: { matched_entities, code_locations, db_tables, related_actions, related_transitions, value_filters }
```

- 매칭 0건이면: "온톨로지 매칭 결과 없음. 에이전트 직접 탐색으로 진행합니다." 안내 후 §4로 이동

**Step 3**: `resolveCodeLocations()`로 source_code 참조를 파일 경로로 해석합니다.

```typescript
import { resolveCodeLocations } from './src/index.ts';

const resolved = resolveCodeLocations(result.code_locations, scanResult.files);
```

**Step 4**: `collectRelevantChunks()`로 6관점 코드 청크를 수집합니다.

```typescript
import { collectRelevantChunks } from './src/index.ts';

const chunks = collectRelevantChunks(resolved, result, scanResult, keywords);
// chunks.by_viewpoint: { semantics, dependency, logic, structure, pragmatics, evolution }
// chunks.coverage_gaps: [] (에이전트가 §3.3에서 채움)
```

결과를 `build/relevant-chunks.json`에 저장합니다.

#### 3.3. 6관점 코드 분석 + Coverage Gap 식별

`build/relevant-chunks.json`이 존재하면, **선별된 파일부터 읽습니다**. 전체 ScanResult.files를 순회하기 전에 6관점 청크에 포함된 파일을 먼저 확인하고, 부족할 때만 추가 탐색합니다.

**"부족" 판정 기준**: 6관점 중 2개 이상의 관점에서 청크가 0건이면, 해당 관점에 대해 ScanResult.files에서 추가 탐색을 수행합니다. 특정 관점의 청크가 0건이면 해당 관점을 건너뛰고 다음 관점으로 진행합니다.

다음 순서로 6관점을 참조합니다:

1. **logic** — 기존 guard/조건이 brief와 충돌하는지 우선 확인. `⚠️` 표시가 있는 항목을 특히 주의
2. **semantics** — 온톨로지 직접 매칭 코드. 변경 대상의 핵심 구현
3. **dependency** — import 관계에서 추가 영향 범위 (파일 수준. 함수 호출 관계는 파일 내부에서 직접 확인)
4. **pragmatics** — 사용자 접점 API/알림. Experience 관점 제약 발견
5. **structure** — 테스트/DDL/설정. 구조적 제약 + DB 제약조건
6. **evolution** — 레거시/세대 혼재. 호환성 제약

`search_hint`가 있는 청크(예: `grep:PODO_TRIAL`)는 해당 패턴으로 코드베이스를 검색하여 관련 파일을 추가로 발견합니다.

각 청크의 `context` 필드를 먼저 읽고, "왜 이 파일이 선별되었는가"를 파악한 뒤 파일을 확인합니다.

6관점 분석이 완료되면, **brief에 필요하지만 코드에 없는 영역**(Coverage Gap)을 식별합니다:
- 코드가 제공하는 것: "이 엔티티에 어떤 actions/transitions가 존재한다"
- 에이전트가 판별하는 것: "brief가 요구하는데 코드에 없는 것"

Coverage Gap의 분류:
- **"기존 코드와의 충돌"** → `constraint.discovered`로 기록 (예: "boolean 판정이 3회와 충돌")
- **"신규 구현 필요"** → Build Spec의 implementation item으로 기록 (예: "3회 추적 로직 구현 필요")

#### 3.4. search_confidence 안내

`search_confidence.method`에 따라 PO에게 안내합니다:
- `"ontology"` + chunks > 0 → "시스템이 관련 코드를 6관점으로 선별했습니다"
- `"ontology"` + chunks = 0 → "온톨로지 매칭 결과가 없습니다. 관련 코드가 없거나 온톨로지 등록이 필요합니다"
- `"keyword_only"` → "온톨로지 없이 실행 중입니다. 용어-코드 매핑 누락이 있을 수 있습니다"

`value_filters`가 있으면 에이전트에게 추가 안내:
- "TrialLesson은 GT_CLASS 테이블에서 CITY='PODO_TRIAL'인 레코드입니다. 코드에서 이 값을 사용하는 쿼리가 관련 로직입니다."

### 4. Constraint 발견 기록

**이벤트 기록 순서 (필수):**

`constraint.discovered`는 `grounded` 상태 이후에만 허용됩니다. 반드시 `grounding.completed`를 **먼저** 기록한 뒤 constraint를 기록하세요. 순서가 뒤바뀌면 상태 기계가 이벤트를 거부하며, 거부 시 `{ success: false, current_state, rejected_type }`이 반환됩니다.

```
올바른 순서: grounding.completed(→grounded) → constraint.discovered(×N) → align.proposed
잘못된 순서: constraint.discovered(draft 상태 → 거부됨) → grounding.completed
```

발견된 각 제약에 대해, 아래 payload 구조로 `constraint.discovered` 이벤트를 기록합니다:

```typescript
// constraint.discovered 이벤트 payload 구조 (참조용)
{
  constraint_id: "CST-001",  // scope 내 순차 부여
  perspective: "code",       // experience | code | policy
  summary: "한 줄 요약",
  severity: "required",      // required | recommended
  discovery_stage: "grounding",
  decision_owner: "product_owner",  // product_owner | builder
  impact_if_ignored: "처리하지 않으면 일어나는 일",
  source_refs: [{ source: "파일명", detail: "구체적 위치/내용" }],
}
```

#### severity 판단 기준

- `required`: 이것 없이 기능 불능, 데이터 손실, 법규 위반, 보안 취약점
- `recommended`: 처리하면 더 좋지만 기능은 작동

#### decision_owner 판단 기준

- `product_owner`: 제품·사업 판단이 필요 (차단 한도, 약관 변경, 매칭 정책)
- `builder`: 구현 방식 판단이 필요 (DB 구조, API 설계, 인덱스 전략)

### 4.5. Exploration 진입

Grounding 완료 후, `exploration.started` 이벤트를 기록하여 `exploring` 상태로 전이합니다.
brief의 상세도에 따라 exploration 범위가 달라집니다.

| brief 상태 | 판별 | exploration 범위 |
|-----------|------|---------|
| brief 없음 또는 모든 필수 항목 비어 있음 | `entry_mode: "conversation"` | Phase 1~6 전체 |
| 변경 목적만 채워짐 | `entry_mode: "brief_minimal"` | Phase 1 확인 후 2~6 |
| 모든 필수 항목 채워짐 + 포함/제외 범위까지 명확 | `entry_mode: "brief_detailed"` | Phase 1 재정위 후, 이미 결정된 부분 건너뜀 |

```typescript
// exploration.started 이벤트 payload 구조 (참조용)
// 상태 전이: grounded → exploring
{
  entry_mode,      // "experience" | "brief_minimal" | "brief_detailed" | "conversation"
  initial_goals,   // string[]
}
```

exploration 완료 후 `align.proposed` 이벤트로 `exploring → align_proposed`로 전이합니다.
exploration에서 생성된 `build/exploration-log.md`의 Phase 6 결과가 AlignPacketContent의 입력이 됩니다.

상세 프로토콜: `docs/agent-protocol/exploration.md` 참조.

### 5. Align Packet 렌더링

`AlignPacketContent` 타입(kernel/types.ts)의 모든 필드를 채워서 렌더러에 전달합니다.

```typescript
import { renderAlignPacket } from './src/index.ts';
import type { AlignPacketContent } from './src/index.ts';

const content: AlignPacketContent = { /* 모든 필드 채우기 — 타입 정의 참조 */ };
const markdown = renderAlignPacket(state, content);
writeFileSync(join(paths.build, "align-packet.md"), markdown);
```

**필수 필드**: `user_original_text`, `interpreted_direction`, `proposed_scope`(in/out), `scenarios`, `as_is`(experience/policy/code/code_details), `tensions`(constraint별 what/why_conflict/scale/options/details), `decision_questions`.

Exploration을 수행한 경우, `exploration.md`의 Phase→AlignPacketContent 매핑 규칙을 따릅니다.

### 6. Align Proposed 이벤트 기록

```typescript
import { contentHash } from './src/index.ts';

// align.proposed 이벤트 payload 구조 (참조용)
{
  packet_path: "build/align-packet.md",
  packet_hash: contentHash(markdown),
  snapshot_revision: 1,
}
```

**반드시 파일을 먼저 쓰고, 해시를 계산한 뒤, 이벤트를 기록합니다.**

### 7. 사용자에게 Align Packet 제시

생성된 `build/align-packet.md`를 사용자에게 보여주고, `/align` 명령으로 결정을 요청합니다.

## 컨텍스트 제한 모델 대응 (200k 이하)

200k 컨텍스트 모델에서는 프로토콜 문서(~22k 토큰, 200k의 ~11%)가 아니라 **소스 데이터**가 병목입니다. 다음 계층화 전략으로 컨텍스트를 관리합니다.

### Tier 1 — Grounding 스캔 결과 선별 (필수)

소스 스캔 후 전체 결과를 컨텍스트에 유지하지 않고, 아래 기준으로 선별합니다:

| 항목 | 포함 | 제외 |
|------|------|------|
| constraint 목록 (CST-*) | 전체 유지 | — |
| 파일 목록 (files[]) | 카테고리별 상위 10건 | 나머지 |
| 의존 그래프 (dependency_graph[]) | scope의 목적과 관련된 모듈에서 depth 2까지 | 나머지 |
| API 패턴 (api_patterns[]) | scope의 목적과 관련된 엔드포인트만 | 나머지 |
| 스키마 패턴 (schema_patterns[]) | scope의 목적과 관련된 테이블만 | 나머지 |

"관련 영역"의 판별: scope의 title, description, brief(있는 경우)에서 언급된 기능/화면/엔티티를 기준으로 판별합니다. 판별이 모호한 경우 해당 항목을 포함합니다 (과소 포함보다 과다 포함이 안전).

### Tier 2 — Surface/Compile 시 소스 재주입

`usage_hint: context` 소스의 전문 주입(draft-surface.md 참조)은 200k에서도 필수입니다. 단, 다음을 적용합니다:

- **디자인 온톨로지**: 전문 필수 (요약 금지 — draft-surface.md 규칙 유지)
- **앱 소스코드**: scope의 목적과 관련된 디렉토리의 파일만 선택적 로드. `target_stack`의 프레임워크 규칙 파일(tailwind.config.*, package.json) 우선. 관련 영역 판별이 모호하면 과다 포함
- **정책 문서**: constraint의 `source_refs`가 가리키는 섹션만 선택적 로드. constraint 발견 전 단계에서는 scope 목적과 관련된 정책 영역을 선택적 로드

### Tier 3 — Exploration 대화 선택적 유지

exploration-log.md에 대화 전문이 기록되므로, 에이전트 컨텍스트에서는:
- 현재 Phase의 대화만 유지
- 이전 Phase의 결정 사항은 `exploration_progress`(이벤트 기반)에서 복원
- 5 round 초과 시 중간 정리 결과만 유지하고 개별 round 대화는 drop

## 렌더링 규칙

- 기술 용어를 유지하고, 첫 등장 시 괄호 안에 설명
- 기술 상세는 `<details><summary>기술 상세 (Builder 참고용)</summary>` 안에 접기
- 비즈니스 영향 중심으로 서술
- "처리하지 않으면" 항목은 모든 constraint에 필수
- 포함/제외 테이블의 "동의하시나요?" 열은 렌더러가 자동 생성

## 오류 처리

렌더러가 에러를 throw하면 메시지에 수정 방법이 포함되어 있습니다. 메시지를 읽고 조치한 뒤 재시도하세요.
