# Ontology Auto-Generation — 코드베이스 진입점 경로 탐색 기반 온톨로지 자동 생성

> 상태: **설계 초안** — 8-Agent Panel Review #2 반영 (2026-03-24)
> 선행: `ontology-guided-constraint-discovery.md`, podo-ontology 리서치, 외부 도구 리서치

---

## 1. 배경과 목적

### 1.1 현재 상태

sprint-kit의 온톨로지 파이프라인은 **소비(consume) 전용**입니다:

```
사전 작성된 YAML → buildOntologyIndex() → queryOntology() → resolveCodeLocations() → collectRelevantChunks()
```

glossary, actions, transitions YAML을 사람이 수작업으로 작성해야 합니다. 이것이 파이프라인의 cold start 병목입니다.

### 1.2 목표

코드베이스에서 온톨로지 YAML을 **자동 생성**하는 기능을 추가합니다. 생성된 YAML은 기존 소비 파이프라인의 입력으로 사용됩니다.

목표 수준: podo-ontology(엔티티 65, enum 50, 관계 162, 행위 166, 상태 머신 10, 도메인 흐름 18, 정책 상수 18)에 근접하는 품질.

### 1.3 외부 리서치 결론 (2026-03-23)

| 접근법 | 대표 도구 | 한계 |
|--------|----------|------|
| AST 기반 | GraphGen4Code, Code-Graph-RAG | 구조만 추출, 의미 없음 |
| LLM 기반 | LLMs4OL, Onto-Generation | 입력이 자연어 텍스트, 코드 아님 |
| 스키마/타입 | TypeGraph, OntologyGen | 수동 정의 필요 또는 DB 한정 |

**결론**: 단일 도구로 podo-ontology 수준 불가. **2단계 파이프라인(결정론적 코드 추출 + 비결정론적 LLM 보완)**이 유일한 현실적 접근.

### 1.4 8-Agent Panel Review 합의 (7/7)

1. 2단계 파이프라인 구조는 건전 — "탐지는 코드, 판정은 에이전트" 원칙에 부합
2. Stage 1→Stage 2 인터페이스(출력 타입) 미정의가 핵심 취약점
3. Stage 2 실패 시 핵심 가치("한국어→영어 브릿지") 소실
4. false negative(코드 누락)가 false positive(불필요 코드 포함)보다 구조적으로 더 위험

---

## 2. 설계 원칙

| 원칙 | 내용 | 근거 |
|------|------|------|
| **탐지는 코드, 판정은 에이전트** | Stage 1(코드)은 구조 추출만, Stage 2(LLM)는 의미 부여 | 기존 파이프라인과 일관 |
| **결정론적 영역과 비결정론적 영역의 명시적 분리** | Stage 1 출력은 동일 입력→동일 결과. Stage 2는 비결정론적 | Panel Review 합의 |
| **기존 YAML 스키마 호환** | 생성된 온톨로지가 `buildOntologyIndex()`에 직접 입력 가능 | 기존 소비 파이프라인 재사용 |
| **"정적으로 추적 가능한 분기 탐색"** | "모든 분기"가 아님. 동적 디스패치/리플렉션은 `unresolved`로 표기 | Panel Review 즉시 조치 #1 |
| **graceful degradation** | Stage 1이 0건 추출해도 파이프라인 중단 없음 | Panel Review 즉시 조치 #2 |

---

## 3. 아키텍처

### 3.1 전체 흐름

```
[입력] 코드베이스 (ScanResult.files, ScanResult.dependency_graph)
   │  ※ ScanResult.api_patterns(기존 HTTP 패턴)은 EntryPoint(kind:"http")로 변환하여 재사용
   ▼
┌─────────────────────────────────────────┐
│ Stage 1: 구조 추출 (결정론적)              │
│                                         │
│  1a. 진입점 탐지                          │
│      ├─ HTTP 엔드포인트 (@Controller 등)  │
│      ├─ 스케줄러 (@Scheduled)             │
│      ├─ 이벤트 리스너 (@EventListener)    │
│      └─ 메시지 컨슈머 (@KafkaListener)    │
│                                         │
│  1b. 호출 그래프 구축                      │
│      진입점 → 서비스 → 레포지토리 → DB    │
│                                         │
│  1c. 구조 요소 추출                        │
│      ParsedModule[] → CodeStructureExtract│
│                                         │
│  1d. code_aliases 추출                    │
│      EntityCandidate → code_entity,       │
│      db_table, fk_variants               │
└─────────────────┬───────────────────────┘
                  │ CodeStructureExtract (IR)
                  ▼
┌─────────────────────────────────────────┐
│ Stage 2: 의미 부여 (비결정론적, LLM)       │
│                                         │
│  2a. 용어 정규화                          │
│      코드명 → canonical + meaning         │
│  2b. semantic_aliases 생성               │
│      canonical → legacy_aliases (한국어)  │
│  2c. 정책 상수 해석                        │
│      policy_constant_candidates →         │
│      policy_constants (의미/이유)          │
└─────────────────┬───────────────────────┘
                  │ glossary.yaml, actions.yaml, transitions.yaml
                  ▼
[출력] 기존 소비 파이프라인 입력 (YAML v3 형식)
```

### 3.2 Stage 1→Stage 2 의존 방향

```
Stage 1 → CodeStructureExtract → Stage 2 → YAML → 소비 파이프라인
              (단방향, 역방향 금지)
```

Stage 2가 Stage 1에 피드백을 보내는 것은 금지합니다. Stage 1이 탐지 실패한 항목은 `unresolved`로 표기하고 Stage 2에 전달합니다. 이것은 기존 `ontology-resolve.ts`의 `resolution_method: "unresolved"` 패턴과 일관됩니다.

---

## 4. 중간 표현 (IR): CodeStructureExtract

Stage 1의 출력이자 Stage 2의 입력입니다. 파서(ts-morph, tree-sitter)에 독립적인 통합 형식입니다. Stage 1은 코드 구조를 추출하며, 도메인 온톨로지는 Stage 2에서 비로소 생성됩니다. IR의 명칭이 "Ontology"가 아닌 "CodeStructureExtract"인 이유입니다.

### 4.1 타입 정의

```typescript
// ── Stage 1 출력: 파서 독립적 중간 표현 ──

/** 단일 파일의 파싱 결과 */
export interface ParsedModule {
  file_path: string;
  language: "typescript" | "javascript" | "kotlin" | "java" | "python" | "go";
  exports: ExportedSymbol[];
  imports: ImportedSymbol[];
  call_sites: CallSite[];
  type_declarations: TypeDecl[];
  state_assignments: StateAssignment[];
}

/**
 * 모듈 외부로 공개된(export) 심볼.
 * TypeDecl과의 분류 축: ExportedSymbol은 "모듈 경계를 넘어 외부에 노출되는 심볼"을 기록.
 * TypeDecl은 "export 여부와 무관한 모든 타입 선언"을 기록.
 * export된 타입은 양쪽 모두에 기록되지만, ExportedSymbol은 TypeDecl을 참조하므로
 * fields/enum_values는 TypeDecl에만 존재합니다.
 */
export interface ExportedSymbol {
  name: string;                      // PascalCase 클래스명 또는 함수명
  kind: "class" | "interface" | "function" | "enum" | "type_alias";
  file_path: string;
  line: number;
  type_decl_ref?: string;            // 동일 선언의 TypeDecl.name 참조 (타입인 경우)
  annotations?: string[];            // @Controller, @Entity 등
}

export interface CallSite {
  caller: string;                    // "ClassName.methodName"
  callee: string;                    // "ClassName.methodName"
  file_path: string;
  line: number;
  kind: "direct" | "unresolved";     // 정적 추적 가능 vs 동적 디스패치
}

export interface StateAssignment {
  id: string;                        // 합성 키: "{entity}.{field_name}:{from}->{to}"
  entity: string;                    // 상태를 가진 엔티티명
  field_name: string;                // 상태 필드명 (예: "status")
  from: string | null;               // 변경 전 값 (null = 조건문에서 판별 불가)
  to: string;                        // 변경 후 값
  file_path: string;
  line: number;
  guard_expression?: string;         // if문의 조건식 원문
}

export interface FieldDecl {
  name: string;
  type_name: string;
  is_fk: boolean;                    // FK 관계 여부 (@JoinColumn 등)
  referenced_entity?: string;        // FK 대상 엔티티
}

export interface ImportedSymbol {
  name: string;
  source: string;                    // import 경로
  file_path: string;
}

export interface TypeDecl {
  name: string;
  kind: "interface" | "enum" | "type_alias" | "class";
  file_path: string;
  line: number;
  fields?: FieldDecl[];
  enum_values?: string[];
}

/** Stage 1의 최종 출력. Stage 1 내부에서는 ParsedModule[]을 사용하지만,
 *  Stage 2에 전달하는 IR에는 포함하지 않습니다 (Stage 2 소비자 없음). */
export interface CodeStructureExtract {
  /** 진입점 목록 */
  entry_points: EntryPoint[];

  /** 호출 그래프 (진입점에서 도달 가능한 경로) */
  call_graph: CallSite[];

  /** 발견된 엔티티 후보 */
  entity_candidates: EntityCandidate[];

  /** 발견된 enum */
  enum_candidates: EnumCandidate[];

  /** 발견된 상태 전이 후보 */
  transition_candidates: StateAssignment[];

  /** 발견된 정책 상수 후보 (매직넘버, 상수 선언) */
  policy_constant_candidates: PolicyConstantCandidate[];

  /** 탐색 메타데이터 */
  meta: {
    total_files: number;
    parsed_files: number;
    entry_points_found: number;
    unresolved_calls: number;         // 동적 디스패치로 추적 실패한 호출 수
    languages: string[];
  };
}

export interface EntryPoint {
  symbol: string;                     // "ClassName.methodName"
  kind: "http" | "scheduled" | "event_listener" | "message_consumer" | "batch" | "main";
  file_path: string;
  line: number;
  http_method?: string;               // GET, POST 등 (HTTP인 경우)
  http_path?: string;                 // "/api/lessons" (HTTP인 경우)
  annotation?: string;                // "@GetMapping", "@Scheduled" 등
}

export interface EntityCandidate {
  name: string;                       // PascalCase 클래스명
  file_path: string;
  fields: FieldDecl[];
  annotations: string[];              // @Entity, @Table 등
  db_table?: string;                  // @Table(name="...") 에서 추출
  referenced_by: string[];            // 이 엔티티를 참조하는 다른 엔티티
}

export interface EnumCandidate {
  name: string;
  file_path: string;
  values: string[];
  used_by_fields: string[];           // 이 enum을 타입으로 사용하는 필드 목록
}

export interface PolicyConstantCandidate {
  name: string;                       // 상수명 또는 매직넘버 변수명
  value: string | number;             // 상수값
  file_path: string;
  line: number;
  usage_context: string;              // 이 상수를 사용하는 코드 위치/맥락
}

/** Phase 2에서 추가 예정. 소비 파이프라인의 domain_flows YAML 스키마 확장과 함께 도입.
export interface DomainFlowSeed {
  entry_point: string;                // 진입점 symbol
  entities_touched: string[];         // 경유하는 엔티티 목록 (BFS 최초 도달 순서)
  transitions_triggered: string[];    // StateAssignment.id 참조
}
*/
```

### 4.2 카테고리별 추출 가능성 (Panel Review 반영)

| 카테고리 | IR 필드 | Stage 1 추출율 | Stage 2 보완 | 최종 예상 |
|---------|---------|:------------:|:----------:|:--------:|
| 엔티티 (name, fields, FK) | `entity_candidates` | 90% | display_name, meaning | 95% |
| enum (values) | `enum_candidates` | 95% | 값별 설명 | 98% |
| 관계 (FK, 타입 참조) | `entity_candidates.fields[is_fk]` + `call_graph` | 60% | 비즈니스 수준 관계 | 75% |
| 행위 구조 (시그니처, 호출체인) | `entry_points` + `call_graph` | 80% | display_name, side_effects | 85% |
| 상태 전이 (from→to) | `transition_candidates` | 50% | trigger 설명, guard 의미 | 70% |
| 도메인 흐름 (서술) | Phase 2에서 추가 | — | — | Phase 2 |
| 정책 상수 (값) | `policy_constant_candidates` | 70% | 의미/이유 | 80% |

> **카테고리↔IR 교차 검증**: 위 표의 "IR 필드" 컬럼이 §4.1 타입 정의의 필드와 1:1로 대응되는지 확인합니다. 카테고리 추가/변경 시 이 컬럼도 함께 갱신해야 합니다. "도메인 흐름"은 현재 소비 파이프라인에 YAML 스키마가 없어 Phase 2로 보류합니다.

**전체 추출율 (Phase 1)**: 도메인 흐름 제외, 6개 카테고리 가중 평균으로 약 **70~80%**.

---

## 5. Stage 1: 구조 추출

### 5.1 진입점 탐지

기존 `patterns/api-routes.ts`의 `detectApiRoutes()`를 확장합니다.

| 진입점 유형 | 탐지 패턴 | 현재 지원 |
|------------|----------|:--------:|
| HTTP 엔드포인트 | `@GetMapping`, `@PostMapping`, `export function GET`, `app.get()` 등 | 지원됨 |
| 스케줄러 | `@Scheduled(cron=...)`, `setInterval`, `node-cron` | **신규** |
| 이벤트 리스너 | `@EventListener`, `@TransactionalEventListener` | **신규** |
| 메시지 컨슈머 | `@KafkaListener`, `@RabbitListener`, `@SqsListener` | **신규** |
| 배치 작업 | `@Scheduled(fixedRate=...)`, Spring Batch `@StepScope` | **신규** |
| main 진입점 | `public static void main`, `if __name__ == "__main__"`, bin 스크립트 | **신규** |

**구현**: `generators/entry-point-detector.ts` 신규 파일. 기존 `PatternDetector`의 시그니처 패턴(`content, filePath → Result[]`)을 참고하되, 별도 타입(`EntryPointPattern`)을 사용합니다. 생성↔소비 파이프라인 분리 원칙에 따라 `PatternResult` union에는 포함하지 않습니다.

```typescript
export interface EntryPointPattern {
  file: string;
  symbol: string;          // "ClassName.methodName"
  kind: EntryPoint["kind"];
  line: number;
  annotation: string;
  http_method?: string;
  http_path?: string;
}

export function detectEntryPoints(content: string, filePath: string): EntryPointPattern[];
```

### 5.2 호출 그래프 구축

진입점에서 출발하여 `DepEdge[]`(기존 dependency_graph)를 따라 도달 가능한 모든 심볼을 탐색합니다.

```typescript
export function buildCallGraph(
  entryPoints: EntryPointPattern[],
  modules: ParsedModule[],
): CallSite[];
```

**탐색 규칙**:
- `import`/`require` 관계를 따라 파일 단위로 이동
- 파일 내에서 `CallSite`(함수 호출)를 따라 심볼 단위로 이동
- 동적 디스패치(인터페이스 호출, 리플렉션)는 `kind: "unresolved"`로 기록
- 최대 탐색 깊이: 설정 가능 (기본 20-hop)
- 순환 참조: visited set으로 방지

### 5.3 엔티티/상태/정책상수 추출

호출 그래프에서 도달한 심볼 중:
- `@Entity`, `@Table` 어노테이션 → `EntityCandidate`
- `enum` 선언 → `EnumCandidate`
- 상태 필드 할당 (`entity.status = "ACTIVE"`) → `StateAssignment` (id: `"{entity}.{field_name}:{from}->{to}"` 합성 키 자동 생성)
- FK 참조 (`@JoinColumn`, `@ManyToOne`) → `FieldDecl.is_fk = true`
- 매직넘버/상수 선언 (`MAX_RETRY = 3`, `GRACE_PERIOD_DAYS = 14`) → `PolicyConstantCandidate`

### 5.4 code_aliases 추출

`EntityCandidate`에서 결정론적으로 추출하는 코드 별칭:
- `code_entity`: 엔티티의 PascalCase 코드명 (정식 코드명)
- `db_table`: `@Table(name="...")` 에서 추출 (정식 DB명)
- `fk_variants`: FK 컬럼명에서 추출 (코드 별칭)

이 세 종류는 "aliases"로 통칭되지만 성격이 다릅니다: `code_entity`와 `db_table`은 정식 이름(canonical code name)이고, `fk_variants`만 진정한 별칭(alias)입니다. Stage 2에서 이 구분을 유지해야 합니다.

### 5.5 파서 어댑터

| 언어 | 파서 | 어댑터 |
|------|------|--------|
| TypeScript/JavaScript | ts-morph | `parsers/ts-morph-adapter.ts` |
| Kotlin/Java | tree-sitter | `parsers/tree-sitter-adapter.ts` |

각 어댑터는 `ParsedModule`을 출력합니다. 후속 처리는 `ParsedModule`만 소비하므로, 파서 추가 시 어댑터만 구현하면 됩니다.

```typescript
export interface ParserAdapter {
  languages: string[];
  parse(content: string, filePath: string): ParsedModule;
}
```

---

## 6. Stage 2: LLM 의미 부여

### 6.1 입력과 출력

- **입력**: `CodeStructureExtract` (Stage 1 출력)
- **출력**: glossary.yaml, actions.yaml, transitions.yaml (기존 소비 파이프라인 입력 형식, v3)
- **출력 타입**: 기존 `ontology-index.ts`의 `GlossaryEntry`, `ActionEntry`, `TransitionEntry` 타입을 YAML로 직렬화한 형식. Stage 2 전용 중간 타입은 정의하지 않습니다.
- **상세 설계**: Phase 2 착수 시 별도 문서(`docs/agent-protocol/ontology-generate.md`)에서 정의합니다.

### 6.2 변환 작업

| 작업 | 입력 | 출력 필드 | 근거 |
|------|------|----------|------|
| **용어 정규화** | `EntityCandidate.name` + 코드 주석 | `canonical`, `meaning` (한국어) | 코드명→도메인 용어 변환은 LLM만 가능 |
| **semantic_aliases 생성** | `canonical` + 도메인 맥락 | `legacy_aliases` (한국어 부분) | LLM이 도메인 지식으로 생성 |
| **value_filters 매핑** | `EnumCandidate.values` + 코드 맥락 | `value_filters` | DB 컬럼값의 비즈니스 의미는 LLM만 판단 가능 |
| **행위 의미 부여** | `EntryPoint` + `CallSite` 체인 | `display_name`, `side_effects` | 메서드 시그니처→비즈니스 설명 |
| **상태 전이 서술** | `StateAssignment` | `trigger` (자연어), `guards` | guard_expression→비즈니스 조건 설명 |
| **정책 상수 해석** | `PolicyConstantCandidate` | policy_constants (의미/이유) | 매직넘버→비즈니스 정책 설명은 LLM만 가능 |

> **Note**: `code_aliases`(code_entity, db_table, fk_variants)는 Stage 1에서 결정론적으로 추출합니다 (§3.1 Step 1d). LLM이 불필요하므로 이 표에 포함하지 않습니다.
> **Note**: `domain_flows`는 Phase 2에서 YAML 스키마 확장과 함께 추가 예정입니다.

### 6.3 code_aliases vs semantic_aliases 분리 (Panel Review 반영)

"탐지는 코드, 판정은 에이전트" 원칙 준수:

| 구분 | 담당 | 예시 |
|------|------|------|
| `code_aliases` | Stage 1 (코드, 결정론적) | `GT_CLASS`, `classId`, `lecture_id` |
| `semantic_aliases` | Stage 2 (LLM, 비결정론적) | `수업`, `레슨`, `강의` |

Stage 1이 추출한 `code_aliases`는 기존 YAML의 `code_entity`, `db_table`, `fk_variants`에 매핑됩니다.
Stage 2가 생성한 `semantic_aliases`는 `legacy_aliases`와 `meaning`에 매핑됩니다.

### 6.4 비결정론성 관리

- LLM 출력을 캐싱합니다. 키: `CodeStructureExtract`의 해시. 동일 입력 → 캐시 반환.
- 캐시 미적중 시에만 LLM을 호출합니다.
- 캐시 무효화 조건: Stage 1 출력의 해시 변경 (코드 변경 시).
- 이것은 기존 `source_hashes` + ETag 캐싱(`ScanSkipped`) 패턴과 일관됩니다.

---

## 7. 기존 파이프라인과의 통합

### 7.1 YAML 스키마 매핑

| CodeStructureExtract 요소 | YAML 필드 매핑 | 매핑 방식 |
|------------------|--------------|----------|
| `EntityCandidate` | glossary의 `canonical`, `code_entity`, `db_table` | Stage 1 직접 |
| `EntityCandidate.fields[is_fk]` | glossary의 `fk_variants` | Stage 1 직접 |
| `EnumCandidate` | glossary의 `value_filters` | Stage 2 의미 부여 |
| `EntryPoint` + `CallSite` 체인 | actions의 `id`, `source_code`, `target_entities` | Stage 1 직접 |
| `StateAssignment` | transitions의 `entity`, `field_name`, `from`, `to`, `source_code` | Stage 1 직접 |
| `StateAssignment.guard_expression` | transitions의 `guards` | Stage 1 구조 + Stage 2 설명 |
| `PolicyConstantCandidate` | glossary 또는 별도 섹션의 `policy_constants` | Stage 1 구조 + Stage 2 해석 |
| — | glossary의 `meaning`, `legacy_aliases` | Stage 2 전담 |
| — | actions의 `display_name`, `side_effects` | Stage 2 전담 |
| — | transitions의 `trigger` (자연어) | Stage 2 전담 |

> **Phase 2 추가 예정**: `DomainFlowSeed` → `domain_flows` YAML. 소비 파이프라인(`buildOntologyIndex`)의 스키마 확장이 선행 조건입니다.

### 7.2 graceful degradation

| 상황 | 동작 | `search_confidence` |
|------|------|-------------------|
| Stage 1: 진입점 0건 | YAML 미생성. 기존 "온톨로지 없음" 경로 진입 | `method: "none"` |
| Stage 1: 진입점 발견 + 엔티티 0건 | actions/transitions만 있는 부분 YAML 생성 (glossary 비어있음) | `method: "ontology"`, `warning: "auto_generated_no_entities"` |
| Stage 1: 성공, Stage 2: 실패 | code_aliases만 있는 불완전 YAML 생성. `meaning` 필드는 빈 문자열(`""`)로 설정하여 `buildOntologyIndex()` 파싱 통과 보장 | `method: "ontology"`, `warning: "auto_generated_partial"` |
| Stage 1+2: 성공 | 완전 YAML 생성 | `method: "ontology"` |
| 기존 수작업 YAML 존재 | 자동 생성 건너뜀 (수작업 우선) | 기존 동작 |

> **YAML 출력 버전**: 생성기는 **v3 형식**으로 출력합니다 (`actions` 단일 배열, `state_machine` 키 사용).

### 7.3 생성↔소비 파이프라인 분리

생성 파이프라인은 소비 파이프라인의 타입을 import하지 않습니다. YAML 파일이 두 파이프라인을 분리합니다.

```
src/scanners/generators/    ← 신규 (생성 파이프라인)
   ├─ parsers/
   │   ├─ ts-morph-adapter.ts
   │   └─ tree-sitter-adapter.ts
   ├─ entry-point-detector.ts
   ├─ call-graph-builder.ts
   ├─ structure-extractor.ts
   └─ types.ts              ← CodeStructureExtract, ParsedModule 등

src/scanners/               ← 기존 (소비 파이프라인)
   ├─ ontology-index.ts
   ├─ ontology-query.ts
   ├─ ontology-resolve.ts
   └─ code-chunk-collector.ts
```

**gate-guard 규칙** (`npm run check-deps`에 추가):
- `generators/` → `scanners/ontology-*.ts` import 차단 (생성→소비 의존 금지)
- `scanners/ontology-*.ts` → `generators/` import 차단 (소비→생성 의존 금지)

**ScanResult 입력 경로**: `generators/types.ts`에 Stage 1이 필요한 입력만 추출한 `GeneratorInput` 인터페이스를 정의합니다:

```typescript
export interface GeneratorInput {
  files: { path: string; content: string }[];   // ScanResult.files에서 추출
  dependency_graph: { from: string; to: string }[];  // ScanResult.dependency_graph에서 추출
}
```

호출자가 `ScanResult`를 `GeneratorInput`으로 변환하여 전달하므로, `generators/`는 `scanners/types.ts`(`ScanResult`)를 직접 import하지 않습니다. 기존 `ScanResult.api_patterns`(HTTP 패턴)은 `EntryPoint`(kind: "http")로 변환하여 재사용합니다.

---

## 8. 확장 대응 (Panel Review onto_evolution 반영)

| 시나리오 | 대응 설계 | 변경 범위 |
|---------|----------|----------|
| **새 언어** | `ParserAdapter` 인터페이스 구현 + `entry-point-detector.ts`에 패턴 추가 | 어댑터 1개 + 패턴 N개 |
| **새 프레임워크** | `entry-point-detector.ts`에 패턴 추가. DI 있으면 어노테이션→구현체 매핑 휴리스틱 추가 | 패턴 + 휴리스틱 |
| **마이크로서비스** | 각 레포별 `CodeStructureExtract` 생성 → Stage 2에서 병합 (LLM이 동일 엔티티 판별) | Stage 2 확장 (향후) |
| **버전관리** | Stage 1 출력 해시 비교로 구조적 diff. Stage 2 출력 캐싱으로 false diff 방지 | 캐시 계층 |
| **다중 도메인** | 패키지/디렉토리 기반 도메인 분류를 Stage 2에서 수행. `ActionEntry.domain` 자동 할당 | Stage 2 확장 (향후) |

---

## 9. 에러 처리

| 에러 | 분류 | 대응 |
|------|------|------|
| 파서 미지원 언어 | graceful degradation | 해당 파일 건너뜀. `meta.parsed_files < meta.total_files`로 추적 |
| 호출 그래프 순환 | 정상 처리 | visited set으로 순환 종료. 순환 경로 기록 |
| Stage 2 LLM 타임아웃 | graceful degradation | code_aliases만 있는 부분 YAML 생성 |
| 기존 YAML과 충돌 | 수작업 우선 | 기존 YAML 존재 시 자동 생성 건너뜀 |

---

## 10. 테스트 전략

| 범주 | 파일 | 내용 | LLM 필요 |
|------|------|------|:--------:|
| 파서 어댑터 | `parsers/ts-morph-adapter.test.ts` | TS/JS 코드 → ParsedModule 변환 | 아니요 |
| 진입점 탐지 | `entry-point-detector.test.ts` | @Controller, @Scheduled 등 패턴 매칭 | 아니요 |
| 호출 그래프 | `call-graph-builder.test.ts` | 진입점→서비스→레포지토리 경로 추적 | 아니요 |
| 구조 추출 | `structure-extractor.test.ts` | ParsedModule[] → CodeStructureExtract 변환 | 아니요 |
| YAML 생성 | `yaml-generator.test.ts` | CodeStructureExtract → glossary/actions/transitions YAML (v3) | 아니요 |
| **YAML→소비 통합** | `yaml-consumer-integration.test.ts` | **생성된 YAML → `buildOntologyIndex()` 통과** 검증 | 아니요 |
| E2E (Stage 1) | `e2e-stage1.test.ts` | 실제 코드 → CodeStructureExtract → YAML (code_aliases만) | 아니요 |
| E2E (Stage 1+2) | 수동/에이전트 | 실제 코드 → 완전 YAML → 기존 파이프라인 통과 | 예 |

---

## 11. 구현 순서

| # | 작업 | 의존성 | 산출물 |
|---|------|--------|--------|
| 1 | `CodeStructureExtract` 타입 정의 + `GeneratorInput` | 없음 | `src/scanners/generators/types.ts` |
| 2 | `ParserAdapter` 인터페이스 + ts-morph 어댑터 | #1 | `parsers/ts-morph-adapter.ts` |
| 3 | 진입점 탐지기 | #1 | `generators/entry-point-detector.ts` |
| 4 | 호출 그래프 빌더 | #2, #3 | `call-graph-builder.ts` |
| 5 | CodeStructureExtract 추출기 | #4 | `structure-extractor.ts` |
| 6 | YAML 생성기 (code_aliases만, v3 형식) | #5 | `yaml-generator.ts` |
| 7 | YAML→소비 통합 테스트 + E2E | #6 | `yaml-consumer-integration.test.ts`, `e2e-stage1.test.ts` |
| 8 | gate-guard 규칙 추가 (양방향 차단) | #6 | `check-deps` 업데이트 |
| 9 | Stage 2 에이전트 프로토콜 설계 + DomainFlowSeed 도입 | #6 | `docs/agent-protocol/ontology-generate.md` |
| 10 | tree-sitter 어댑터 (Kotlin/Java) | #2 | `parsers/tree-sitter-adapter.ts` |

**Phase 1** (#1~#8): Stage 1 완성. code_aliases만 있는 YAML 자동 생성. LLM 불필요.
**Phase 2** (#9): Stage 2 에이전트 프로토콜 + DomainFlowSeed/domain_flows YAML 스키마 확장. LLM이 semantic_aliases 추가.
**Phase 3** (#10): 다중 언어 지원.

---

## 12. Panel Review 반영 기록

### Panel Review #1 (2026-03-23, 7/7 합의)

| # | 조치 | 상태 |
|---|------|------|
| 1 | "모든 분기" → "정적으로 추적 가능한 분기"로 정정 | §2 원칙에 반영 |
| 2 | "빈 온톨로지" vs "온톨로지 없음" 구분 신호 | §7.2 graceful degradation에 반영 |
| 3 | @Scheduled, @EventListener, @KafkaListener 진입점 추가 | §5.1에 반영 |
| R1 | 온톨로지 YAML 자동 생성 bootstrap | 이 설계 문서 전체 |
| R2 | 키워드 추출 가이드라인 구체화 | Phase 2 프로토콜 문서 |
| R3 | naming-audit 자동 실행 | `meta.unresolved_calls`로 부분 대응 |
| R4 | ParsedModule IR 정의 | §4.1에 반영 |

### Panel Review #2 (2026-03-24, 8/8 합의)

**즉시 조치**

| # | 조치 | 상태 |
|---|------|------|
| 1 | `RawOntology`에 `policy_constant_candidates` 필드 + `PolicyConstantCandidate` 타입 추가 | §4.1, §4.2, §5.3, §7.1에 반영 |
| 2 | `StateAssignment`에 `id` 필드 추가 + 합성 키 규칙 명시 | §4.1, §5.3에 반영 |
| 3 | `code_aliases 수집`을 §6.2에서 제거, §3.1(1d) + §5.4에 배치 | §3.1, §5.4, §6.2에 반영 |
| 4 | `ExportedSymbol`/`TypeDecl` 분류 축 명시 + `kind` 값 통일 (`"type"` → `"type_alias"`) | §4.1에 반영 |
| 5 | §4.2에 카테고리↔IR 교차 검증 매핑 컬럼 추가 | §4.2에 반영 |
| 6 | `ParsedModule.language`에 `"javascript"` 추가 | §4.1에 반영 |

**권장 사항**

| # | 권장 | 상태 |
|---|------|------|
| R1 | `DomainFlowSeed` Phase 1에서 제거 → Phase 2에서 YAML 스키마 확장과 함께 추가 | §4.1, §4.2, §6.2, §7.1, §11에 반영 |
| R2 | `RawOntology` → `CodeStructureExtract` 명칭 변경 | 문서 전체에 반영 |
| R3 | `modules` 필드를 IR에서 제거 (Stage 1 내부 타입으로 제한) | §4.1에 반영 |
| R4 | graceful degradation에 "진입점 발견 + 엔티티 0건" 행 추가 | §7.2에 반영 |
| R5 | `ScanResult` → Stage 1 입력 경로 명시 (`GeneratorInput` 인터페이스) | §3.1, §7.3에 반영 |
| R6 | 통합 테스트 추가 + YAML v3 버전 명시 | §7.2, §10에 반영 |
