# Ontology-Guided Constraint Discovery — 구현 설계

> 6-7차 Panel Review (2026-03-22) 결과를 반영한 구현 설계.
> 선행 문서: `deep-analysis-research-log.md`

## 1. 목적

대형 서비스 레포에서 "제품 변경 시 기존 시스템과 충돌하는 비즈니스 로직 수준의 제약"을 발견한다. RLM PoC의 교훈(비결정론성, 파라미터 민감성)과 Semgrep 리서치 교훈(결정론적 필터 + LLM 추론)을 반영한다.

### 핵심 원칙

- **"탐지는 코드, 판정은 에이전트"** — Sprint Kit 런타임은 관련 코드를 선별하고, 제약 추론은 에이전트가 수행
- **런타임 ≠ 추론 엔진** — Sprint Kit 코드가 LLM API를 직접 호출하지 않음
- **비결정론적 경계를 1단계로 한정** — 2단계 이후 동일 입력에 동일 결과

### 용어 변환의 책임 경계 (7차 Panel Review 즉시 조치 #1)

파이프라인에서 "한국어 도메인 용어 → 영어 코드 식별자" 변환이 필수적이다. 이 변환은 두 층으로 나뉘며, 각각 다른 주체가 책임진다:

| 변환 유형 | 예시 | 책임 주체 | 이유 |
|----------|------|----------|------|
| **구조적 변환** | "수업" → Lecture, GT_CLASS, classId | **코드** (온톨로지 모듈) | glossary에 등록된 결정론적 매핑. 반복 실행 시 동일 결과 |
| **의미적 변환** | "체험 수업" → `CITY='PODO_TRIAL'` | **에이전트** | 컬럼 값 수준의 매핑은 맥락 의존적. 코드가 모든 값 조합을 사전 등록할 수 없음 |

구조적 변환은 온톨로지 모듈(`queryOntology()`)이 수행하고, 의미적 변환은 에이전트 프로토콜에 위임한다. 이 경계선이 "탐지는 코드, 판정은 에이전트" 원칙의 구체적 적용이다.

### 온톨로지의 역할 (7차 Panel Review 검증 반영)

온톨로지는 **"정밀도 향상 레이어"가 아니라 "용어-코드 식별자 브릿지"**이다.

| 프로젝트 특성 | 온톨로지 역할 | 없을 때 결과 |
|-------------|-------------|------------|
| 용어-코드 일치 (DDD 준수, 영어 brief) | 선택 사항 (precision 향상) | 키워드 검색으로 기본 작동 |
| 용어-코드 불일치 (legacy 네이밍, 한국어 brief) | **전제 조건** (recall 확보) | 한국어 키워드로 영어 코드 매칭 0건 |

**실측 근거** (podo-backend, 7차 onto_pragmatics):
- 한국어 키워드 "체험"/"수업" → api_patterns 0건, schema_patterns 0건, files 0건
- 온톨로지 경유 → 11건 (api 4 + schema 1 + files 6)

**legacy 네이밍은 보편적 현상**: 도메인 개념당 평균 5.4개 이름 (podo 실측). 업계 3~8개 범위. 다계층 시스템의 구조적 특성이지 기술 부채가 아니다.

### 범용 도구로서의 원칙

온톨로지를 필수로 강제하지 않되, **없을 때의 한계를 투명하게 만든다**.

- 온톨로지 있음: 구조적 변환이 작동 → 정밀한 코드 선별
- 온톨로지 없음: 구조적 변환 불가 → **에이전트에게 "온톨로지 없이 실행 중입니다. 용어-코드 매핑을 직접 수행해야 합니다"를 안내** + ScanResult의 구조 정보만 제공

### 적용 조건

모든 scope에 무조건 적용하는 기반이 아님. **"brief 용어와 코드 식별자가 불일치하고, 관련 코드가 여러 모듈에 분산된 경우"**에 가치가 발생한다.

---

## 2. 파이프라인 구조

```
1단계: brief → keywords 추출 (에이전트 프로토콜)
  ↓ keywords: string[]
2단계: keywords → 온톨로지 매칭 → code_locations (코드, 결정론적)
  ↓ OntologyQueryResult { matched_entities, code_locations, db_tables, related_actions, related_transitions }
3단계: code_locations → 파일 검색 → 코드 청크 수집 (코드, 결정론적)
  ↓ RelevantCodeChunks { chunks: CodeChunk[], ontology_context: OntologyQueryResult }
4단계: 코드 청크 → 에이전트가 제약 추론 (에이전트 프로토콜)
  ↓ constraint.discovered × N
```

| 단계 | 실행 주체 | 결정론성 | 구현 상태 |
|------|----------|---------|----------|
| 1 | 에이전트 프로토콜 | 비결정론적 | 프로토콜 문서 작성 필요 |
| 2 | Sprint Kit 코드 | **결정론적** | `queryOntology()` 구현 완료, commands/ 연결 필요 |
| 3 | Sprint Kit 코드 | **결정론적** | **미구현** — resolution 로직 + 코드 청크 수집 |
| 4 | 에이전트 프로토콜 | 비결정론적 | 프로토콜 문서 작성 필요 |

---

## 3. 기존 인프라 (구현 완료)

### ontology-index.ts

```typescript
OntologyIndex { glossary, actions, transitions }
GlossaryEntry { canonical, meaning, legacy_aliases, code_entity?, db_table?, fk_variants }
ActionEntry { id, name, display_name, domain, actor?, target_entities, source_code }
TransitionEntry { entity, field_name, from, to, trigger, source_code }
```

### ontology-query.ts

```typescript
queryOntology(index, keywords) → OntologyQueryResult {
  matched_entities,    // ["Lesson", "Ticket"]
  code_locations,      // [{ reference: "PodoScheduleServiceImplV2.match()", context, entity }]
  db_tables,           // ["GT_CLASS", "le_ticket"]
  related_actions,     // [{ id, display_name, source_code }]
  related_transitions  // [{ entity, from, to, trigger, source_code }]
}
```

### 고립 상태 (6차 Panel Review onto_structure 확인)

- `queryOntology()`는 commands/ 흐름에 연결되지 않음 (테스트에서만 호출)
- `source_code` 문자열 → 실제 파일 경로 해석(resolution) 로직 없음
- `code_entity` 필드는 queryOntology()에서 실제 미사용 (onto_semantics 확인)

---

## 4. 미구현 — 필요한 신규 모듈

### 4-1. source_code resolution

`ActionEntry.source_code`와 `TransitionEntry.source_code`는 자연어 문자열이다.

```
예: "PodoScheduleServiceImplV2.match()"
예: "LectureCommandServiceImpl.createNewPodoLecture()"
```

이 문자열에서 실제 파일 경로를 찾아야 한다.

**방법**: `ScanResult.files`의 파일 경로와 대조.

```typescript
// scanners/ontology-resolve.ts (신규)

interface ResolvedLocation {
  reference: string;         // 원본: "PodoScheduleServiceImplV2.match()"
  resolved_files: string[];  // 매칭된 파일: ["src/main/.../PodoScheduleServiceImplV2.java"]
  resolution_method: "filename" | "unresolved";
}

function resolveCodeLocations(
  locations: CodeLocation[],
  files: FileEntry[],
): ResolvedLocation[] {
  // 1. source_code에서 클래스명 추출: "PodoScheduleServiceImplV2.match()" → "PodoScheduleServiceImplV2"
  // 2. files에서 해당 클래스명을 포함하는 파일 검색
  // 3. 매칭 실패 시 resolution_method: "unresolved"
}
```

이 함수는 `ScanResult.files`만 사용하므로 LLM 호출이 불필요하고 결정론적이다.

### 4-2. 6관점 코드 청크 수집 + Coverage Gap (에이전트 위임)

> 8차 Panel Review (2026-03-22) 즉시 조치 4건 + 권장 사항 R1-R3 반영.

onto-review의 검증 관점에서 **이름을 분류 축으로 차용**하되, 각 관점의 의미는 "코드 수집 전략"으로 재정의한다. onto-review의 관점은 "온톨로지 검증"이고, 여기서의 관점은 "brief 관련 코드의 분류 체계"이다. 두 체계는 이름만 공유하며 적용 목적이 다르다.

**관찰과 추론의 분리**: 6개 관점(semantics~evolution)은 **관찰**(존재하는 코드를 구조적으로 분류)이고, coverage는 **추론**(존재하지 않는 것을 판별)이다. 코드가 할 수 있는 것은 관찰까지이다. coverage gap 식별은 에이전트 프로토콜에 위임한다.

**중복 허용 정책**: 한 청크가 여러 관점에 포함될 수 있다 (예: LectureController.java가 dependency+pragmatics 양쪽). 이것은 의도된 동작이다. 에이전트에게 동일 파일이 다른 맥락으로 제시되므로 다른 관점의 제약을 발견하는 데 도움이 된다. `total_tokens_estimate` 계산 시 중복 파일은 1회만 카운트한다.

```typescript
// scanners/code-chunk-collector.ts (신규)

// onto-review 관점과 구분하기 위해 CollectionViewpoint로 명명 (R8 즉시조치 #3)
type CollectionViewpoint = "semantics" | "dependency" | "logic" | "structure" | "pragmatics" | "evolution";

interface CodeChunk {
  file_path?: string;     // 파일 경로. undefined이면 search_hint를 사용
  viewpoint: CollectionViewpoint;
  context: string;        // 이 청크가 왜 선별되었는지 (관점별 설명, 아래 생성 규칙 참조)
  search_hint?: string;   // 에이전트에게 전달할 검색 힌트 (grep 패턴 등)
}

// Coverage gap은 에이전트가 식별 — 코드가 생성하지 않음 (R8 즉시조치 #2)
interface CoverageGap {
  description: string;
  related_entity: string;
  brief_requirement: string;
}

interface RelevantCodeChunks {
  // 6개 관점의 코드 청크 (관찰 영역 — 코드가 수행)
  by_viewpoint: Record<CollectionViewpoint, CodeChunk[]>;

  // Coverage gap은 별도 최상위 필드 (추론 영역 — 에이전트가 수행) (R8 즉시조치 #1)
  // 이 필드는 코드가 채우지 않음. 에이전트가 6관점 청크를 분석한 후 식별하여 기록.
  coverage_gaps: CoverageGap[];

  ontology_result: OntologyQueryResult;
  total_chunks: number;
  total_tokens_estimate: number;

  search_confidence: {
    method: "ontology" | "keyword_only" | "none";
    ontology_match_count: number;
    unresolved_count: number;
    keywords_used: string[];
    viewpoint_counts: Record<CollectionViewpoint, number>;
    warning?: string;
  };
}
```

#### 관점별 수집 전략

| 관점 | 수집 대상 | 데이터 소스 | context 생성 규칙 |
|------|----------|-----------|-----------------|
| **Semantics** | 온톨로지 매칭 코드 + value_filters | `OntologyQueryResult.code_locations` + `value_filters` | `"[엔티티명] [액션/전이명]. value_filter: [값]"` |
| **Dependency** | import 관계 1-2 hop (파일 수준) | `ScanResult.dependency_graph` | `"[대상파일]의 [caller/callee] (hop [N])"` |
| **Logic** | guard 조건 + 관련 파일 | `ActionEntry.guard_note` + resolved files | `"⚠️ Guard: [조건] — brief와 [충돌 가능성 설명]"` |
| **Structure** | 테스트, DDL, 설정, 환경변수 | `ScanResult.files` (category=test/schema/config) + `config_patterns` | `"[파일 카테고리]: [역할 설명]"` |
| **Pragmatics** | API 엔드포인트 | `ScanResult.api_patterns` | `"[HTTP method] [path] — [사용자 접점 설명]"` |
| **Evolution** | 레거시/세대 패턴 | `ScanResult.files` + `schema_patterns` | `"[세대 표시]: [패턴 설명] (예: GT_ 레거시 vs le_ 신규)"` |

**context 생성 규칙** (R8 즉시조치 #4): 각 관점의 context는 **에이전트가 판정에 사용할 단서**를 포함해야 한다. logic 관점은 "충돌 가능성"을 명시하고, evolution은 "세대 혼재"를 명시한다. 사실 서술만으로는 분류의 가치가 소멸한다.

**Dependency 관점 해상도 주의**: `ScanResult.dependency_graph`의 `DepEdge`는 **파일 수준** import 관계이다. "이 함수의 호출자"가 아니라 "이 파일을 import하는 파일"이 반환된다. 함수 수준 호출 그래프는 현재 ScanResult에 없으며, Tree-sitter 등 추가 도구 없이는 제공할 수 없다. 이 한계를 에이전트 프로토콜에 명시한다.

**Logic 관점 guard 구조** (R8 권장 R1): `GuardEntry` 별도 타입 대신, `ActionEntry`에 optional 필드를 추가하여 최소 구조로 시작한다.

```typescript
// ontology-index.ts 확장 — 최소 구조 (R8 권장 R1)
export interface ActionEntry {
  // 기존 필드 유지
  id: string;
  name: string;
  display_name: string;
  domain: string;
  actor?: string;
  target_entities: string[];
  source_code: string;
  // 신규 — guard/제약 메모 (guards 데이터가 3건 미만이므로 별도 타입 대신 필드 추가)
  guard_note?: string;  // 예: "hasCompletedTrialClass가 boolean — 3회 체험과 충돌 가능"
}
```

guards가 3건 이상으로 늘어나고 source_entities/target_entities 관계가 실제로 활용되는 시점에 `GuardEntry` 별도 타입으로 승격한다.

**Structure 관점에 config_patterns 포함** (R8 권장 R2 반영): feature flag, 환경변수 등 설정 코드를 structure 관점에서 수집한다. `ScanResult.config_patterns`를 데이터 소스로 추가.

**Logic 관점에 schema 제약 확장 경로** (R8 권장 R3): 현재 `SchemaPattern.columns`는 컬럼명 문자열만 포함. NOT NULL/UNIQUE 등 DB 제약 정보는 향후 `SchemaPattern` 확장 또는 DDL 파싱으로 추가. 현재는 DDL 파일 자체를 structure 관점 청크로 제공하여, 에이전트가 DB 제약을 직접 확인한다.

#### 수집 함수

```typescript
function collectRelevantChunks(
  resolved: ResolvedLocation[],
  ontologyResult: OntologyQueryResult,
  scanResult: ScanResult,
  options?: {
    maxChunksPerViewpoint?: number;
    viewpointOverrides?: Partial<Record<CollectionViewpoint, { maxChunks?: number; enabled?: boolean }>>;
  },
): RelevantCodeChunks {
  const defaultMax = options?.maxChunksPerViewpoint ?? 10;

  const viewpoints: Record<CollectionViewpoint, CodeChunk[]> = {
    semantics: collectSemantics(resolved, getMax("semantics")),
    dependency: collectDependency(resolved, scanResult.dependency_graph, getMax("dependency")),
    logic: collectLogic(ontologyResult, resolved, scanResult, getMax("logic")),
    structure: collectStructure(resolved, scanResult.files, scanResult.schema_patterns, scanResult.config_patterns, getMax("structure")),
    pragmatics: collectPragmatics(ontologyResult.matched_entities, scanResult.api_patterns, resolved, getMax("pragmatics")),
    evolution: collectEvolution(resolved, scanResult, getMax("evolution")),
  };

  return {
    by_viewpoint: viewpoints,
    coverage_gaps: [],  // 에이전트가 채움 — 코드는 빈 배열로 초기화
    // ... 나머지 필드
  };

  function getMax(vp: CollectionViewpoint): number {
    const override = options?.viewpointOverrides?.[vp];
    if (override?.enabled === false) return 0;
    return override?.maxChunks ?? defaultMax;
  }
}
```

#### 에이전트에게 전달되는 형태 (`build/relevant-chunks.json`)

```json
{
  "brief": "체험 수업 3회 무료 제공",
  "by_viewpoint": {
    "semantics": [
      { "file_path": "TrialLectureCommandServiceImpl.java",
        "context": "Action TRIAL-1: 체험 수업 생성. code_entity: TrialLecture" }
    ],
    "dependency": [
      { "file_path": "LectureController.java",
        "context": "TrialLectureCommandServiceImpl의 호출자 (API 진입점)" }
    ],
    "logic": [
      { "file_path": "UserGateway.java",
        "context": "⚠️ Guard G1: 체험 완료 판정 boolean — 3회와 충돌 가능 (70행)" },
      { "file_path": "TicketServiceImpl.java",
        "context": "⚠️ Guard G2: 활성 티켓 1개 제한 — 3회와 충돌 가능 (137행)" }
    ],
    "structure": [
      { "file_path": "GT_CLASS DDL",
        "context": "TrialLesson의 DB 스키마. CITY 컬럼으로 체험/일반 구분" }
    ],
    "pragmatics": [
      { "file_path": "LectureController.java",
        "context": "GET /getPodoTrialLectureList — 학생이 체험 수업 목록을 조회하는 엔드포인트" }
    ],
    "evolution": [
      { "file_path": "PaymentGateway.java",
        "context": "TRIAL / TRIAL_FREE 2가지 결제 유형 공존. 체험 기간 커리큘럼별 하드코딩" }
    ],
    "coverage": [
      { "description": "3회 완료 추적 로직 부재 (현재 boolean만)",
        "related_entity": "TrialLesson",
        "brief_requirement": "3회 무료 제공 → 회차별 완료 추적 필요" }
    ]
  },
  "search_confidence": { "method": "ontology", "ontology_match_count": 4 }
}
```

**새로운 외부 의존 없음**: 모든 데이터 소스가 기존 `ScanResult` + `OntologyQueryResult`이다. 관점별 필터링 로직만 추가하면 된다.

### 4-3. commands/ 연결

```typescript
// commands/start.ts 수정 — grounding 완료 후 옵션으로 실행

// 온톨로지 기반 6관점 코드 선별 (optional)
if (ontologyIndex && briefKeywords.length > 0) {
  const queryResult = queryOntology(ontologyIndex, briefKeywords);
  if (queryResult.matched_entities.length > 0) {
    const resolved = resolveCodeLocations(queryResult.code_locations, scanResult.files);
    const chunks = collectRelevantChunks(resolved, queryResult, scanResult);
    writeFileSync(paths.relevantChunks, JSON.stringify(chunks, null, 2), "utf-8");
  } else {
    writeFileSync(paths.relevantChunks, JSON.stringify({
      by_viewpoint: { semantics: [], dependency: [], logic: [], structure: [], pragmatics: [], evolution: [] },
      coverage_gaps: [],
      search_confidence: { method: "ontology", ontology_match_count: 0, warning: "온톨로지 매칭 0건 — 에이전트 직접 탐색 필요" },
    }, null, 2), "utf-8");
  }
} else if (!ontologyIndex) {
  writeFileSync(paths.relevantChunks, JSON.stringify({
    by_viewpoint: { semantics: [], dependency: [], logic: [], structure: [], pragmatics: [], evolution: [] },
    coverage_gaps: [],
    search_confidence: { method: "keyword_only", ontology_match_count: 0, warning: "온톨로지 없이 실행 중 — 용어-코드 매핑을 에이전트가 직접 수행해야 합니다" },
  }, null, 2), "utf-8");
}
```

---

## 5. 에이전트 프로토콜

### 1단계: brief → keywords (에이전트 수행)

에이전트 프로토콜 문서(`docs/agent-protocol/start.md`)에 추가:

```
온톨로지 기반 코드 선별이 활성화된 경우:

1. brief.md에서 변경 목표와 관련된 도메인 키워드를 추출합니다.
2. 추출된 키워드를 queryOntology()에 전달합니다.
   - 매칭 결과가 있으면: 관련 코드 청크가 build/relevant-chunks.json에 생성됩니다.
   - 매칭 결과가 없으면: 기존 ScanResult만으로 grounding을 진행합니다.
```

### 4단계: 6관점 코드 청크 → 제약 추론 + Coverage Gap 식별 (에이전트 수행)

```
build/relevant-chunks.json이 존재하는 경우:

1. by_viewpoint의 6관점을 다음 순서로 참조합니다:
   (1) logic — 기존 guard/조건이 brief와 충돌하는지 우선 확인
   (2) semantics — 온톨로지 직접 매칭 코드 확인
   (3) dependency — 호출 관계에서 추가 영향 범위 확인
   (4) pragmatics — 사용자 접점(API, 알림) 영향 확인
   (5) structure — 테스트/DDL/설정에서 구조적 제약 확인
   (6) evolution — 레거시/세대 혼재에서 호환성 제약 확인

2. 각 청크의 context 필드를 먼저 읽고, 특히 ⚠️ 표시가 있는 항목을 우선 확인합니다.
   context는 "왜 이 파일이 선별되었는가"와 "brief와 충돌할 가능성"을 설명합니다.

3. 6관점 분석 후, brief에 필요하지만 코드에 없는 영역을 식별합니다 (Coverage Gap).
   코드가 제공하는 것: "이 엔티티에 어떤 actions/transitions/guards가 존재한다"
   에이전트가 판별하는 것: "brief가 요구하는데 코드에 없는 것"
   - CoverageGap이 "기존 코드와의 충돌"이면 → constraint.discovered로 기록
   - CoverageGap이 "신규 구현 필요"이면 → Build Spec의 implementation item으로 기록
   이 판별은 에이전트가 수행합니다.

4. 발견된 제약을 constraint.discovered 이벤트로 기록합니다.
   - discovery_stage: "grounding"
   - evidence_status: "code_inferred"
   - source_refs에 파일 경로와 코드 근거를 포함합니다.

5. dependency 관점의 한계: import 관계(파일 수준)만 제공됩니다.
   함수 수준 호출 관계는 제공되지 않으므로, 에이전트가 파일 내부에서 직접 확인해야 합니다.
```

---

## 6. 품질 기준 (7차 Panel Review 즉시 조치 #3)

### 코드 선별 품질 지표

| 지표 | 정의 | 최소 기준 |
|------|------|----------|
| **선별 재현율 (Selection Recall)** | brief와 실제로 관련된 코드 중 파이프라인이 찾아낸 비율 | 온톨로지 있음: 70%+, 없음: 측정 대상 외 (에이전트 위임) |
| **선별 정밀도 (Selection Precision)** | 파이프라인이 반환한 코드 중 실제로 관련된 비율 | 50%+ (절반 이상이 관련 코드) |
| **coverage_confidence** | 검색 결과의 신뢰도 신호 | `search_confidence.method`로 에이전트에 전달 |

### "미발견" vs "부재" 구분 원칙

- `search_confidence.method === "ontology"` + chunks > 0: **정상 결과** — 온톨로지 매칭으로 코드 발견
- `search_confidence.method === "ontology"` + chunks === 0: **부재** — 온톨로지가 존재하지만 관련 코드 없음
- `search_confidence.method === "keyword_only"`: **미발견 가능** — 온톨로지 없이 키워드만으로 검색. 한국어↔영어 gap으로 누락 가능
- `search_confidence.method === "none"`: **미발견 확실** — 검색 자체가 실행되지 않음

에이전트 프로토콜에서 이 신호를 PO에게 전달:
- `"ontology"` → "시스템이 관련 코드를 선별했습니다"
- `"keyword_only"` → "온톨로지 없이 키워드로만 검색했습니다. 누락된 코드가 있을 수 있습니다"
- `"none"` → "자동 코드 선별이 실행되지 않았습니다. 에이전트가 직접 탐색합니다"

## 7. Fallback 경로

| 상황 | 동작 | search_confidence.method |
|------|------|------------------------|
| 온톨로지 YAML 있음 + 매칭 성공 | 온톨로지 기반 코드 선별 | `"ontology"` |
| 온톨로지 YAML 있음 + 매칭 0건 | ScanResult 구조 정보만 제공 + 에이전트 직접 탐색 | `"ontology"` (매칭 0건이 부재 의미) |
| 온톨로지 YAML 없음 | ScanResult 구조 정보만 제공 + 에이전트에 "온톨로지 없이 실행 중" 안내 | `"keyword_only"` |
| resolution 실패 | 해당 location 건너뛰고 나머지 처리. unresolved_count 기록 | `"ontology"` + warning |
| 코드 청크가 너무 많음 | hop=0 > hop=1 > hop=2 우선순위로 truncation | `"ontology"` |

---

## 8. 파일 구조

```
src/
  scanners/
    ontology-index.ts       (수정) — ActionEntry에 guard_note?, value_filters? 추가
    ontology-query.ts       (수정) — value_filters 반환 추가
    ontology-resolve.ts     (신규) — source_code → 파일 경로 resolution
    viewpoint-collectors.ts (신규) — 6관점별 코드 청크 수집
    code-chunk-collector.ts (신규) — 6관점 통합 수집 오케스트레이션
  commands/
    start.ts                (수정) — 온톨로지 기반 6관점 코드 선별 호출
docs/
  agent-protocol/
    start.md                (수정) — 1단계 keywords / 4단계 6관점+coverage gap 제약 추론
```

---

## 9. ScanResult와의 관계

ScanResult를 확장하지 않는다. 별도 출력(`build/relevant-chunks.json`)으로 전달한다.

**이유**: ScanResult는 "소스의 구조 정보"를 담는 타입이다. 7관점 코드 청크는 "brief에 대한 관련 코드"이므로, brief 의존적이고 scope마다 다르다. ScanResult와 성격이 다르므로 합치지 않는다.

---

## 10. 구현 순서

| # | 작업 | 의존성 | 산출물 |
|---|------|--------|--------|
| 1 | `ontology-index.ts` 수정: `ActionEntry`에 `guard_note?` + `GlossaryEntry`에 `value_filters?` 추가 | 없음 | 타입 수정 (optional 필드, 하위 호환) |
| 2 | `ontology-query.ts` 수정: `value_filters` 반환 추가 | #1 | 쿼리 확장 |
| 3 | `ontology-resolve.ts` 작성 | #2 | source_code → 파일 경로 resolution |
| 4 | `viewpoint-collectors.ts` 작성: 6관점별 수집 함수 | #3, `scanners/types.ts` | 관점별 수집 |
| 5 | `code-chunk-collector.ts` 작성: 6관점 통합 오케스트레이션 | #4 | 통합 수집 |
| 6 | `start.ts`에 6관점 코드 선별 호출 삽입 | #5 | commands/ 연결 |
| 7 | 테스트 작성 (관점별 + 통합) | #4, #5, #6 | 테스트 |
| 8 | 에이전트 프로토콜 문서 업데이트 (6관점+coverage gap 안내) | #6 | start.md 수정 |

**하위 호환 보장 조건** (R8 onto_evolution 반영):
- `GlossaryEntry.value_filters`: optional → 기존 YAML 호환
- `ActionEntry.guard_note`: optional → 기존 YAML 호환
- guards가 기존 YAML에 포함 (별도 파일 아님) → `buildOntologyIndex()` 시그니처 유지
- 기본값 `[]`/`undefined` 명시 → JSON 스키마 호환

---

## 11. 6-8차 Panel Review 발견 대응 기록

| 발견 | 대응 |
|------|------|
| onto_logic #1: 온톨로지 미등록 코드 | Fallback 경로 §6에 명시 |
| onto_logic #2: brief→canonical 비결정론 | §2 파이프라인 표에 결정론성 명시 |
| onto_logic #3: 3→4단계 컨텍스트 | §5 에이전트 프로토콜에 ontology_context 포함 |
| onto_logic #4: 고정 hop 정당화 | §4-2의 온톨로지 유도 2-hop (2hop에서 온톨로지 필터) |
| onto_logic #5: ScanResult 확장 | §8에서 확장하지 않는 결정 + 이유 |
| onto_structure: 끊어진 경로 4건 | §4에서 3개 신규 모듈로 연결 |
| onto_pragmatics: cold start | §6 Fallback 경로 |
| onto_semantics: "브릿지" 부정확 | §3에서 실제 도달 경로 명시 |
| onto_semantics: "RAG" 용어 | 문서 제목: "Ontology-Guided Constraint Discovery" |
| onto_dependency: 런타임≠추론엔진 | §2 핵심 원칙 + 4단계 에이전트 위임 |
| onto_dependency: Tree-sitter native | §4에서 Tree-sitter 미사용 (ScanResult.files + grep으로 대체) |
| onto_coverage GAP-10: 대안 비교 | CodeGraphContext MCP는 향후 검토. 현재는 기존 인프라 기반 최소 구현 |

### 7차 Panel Review (온톨로지 필수 여부)

| 발견 | 대응 |
|------|------|
| 용어 변환 책임 경계 미정의 | §1에 구조적 변환(코드) / 의미적 변환(에이전트) 경계 명시 |
| "미발견" vs "부재" 구분 없음 | §6에 search_confidence + §4-2에 viewpoint_counts |
| "수용 가능한 품질" 정의 없음 | §6에 Selection Recall/Precision 기준선 명시 |

### 8차 Panel Review (7관점 수집 검증)

| 즉시 조치 | 대응 |
|----------|------|
| coverage를 by_viewpoint에서 분리 | §4-2: by_viewpoint는 6관점 CodeChunk[]만. coverage_gaps는 최상위 필드로 분리, 에이전트가 채움 |
| collectCoverageGaps() 제거, 에이전트 위임 | §4-2: coverage 수집 함수 제거. §5 4단계에 에이전트가 coverage gap 식별 절차 추가 |
| Viewpoint→CollectionViewpoint 타입명 변경 | §4-2: `type CollectionViewpoint` + onto-review 차용 범위 명시 |
| context 생성 규칙 명시 | §4-2: 관점별 수집 전략 표에 context 생성 규칙 컬럼 추가 |

| 권장 사항 | 대응 |
|----------|------|
| R1: GuardEntry 대신 ActionEntry.guard_note? | §4-2: ActionEntry에 guard_note? 추가. 3건+ 시 별도 타입 승격 |
| R2: 중복 허용 정책 명시 | §4-2: "중복 허용 정책" 문단 추가 |
| R3: config_patterns를 structure에 포함 | §4-2: Structure 관점 데이터 소스에 config_patterns 추가 |
