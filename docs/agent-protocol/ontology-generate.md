# Ontology Generate Protocol — Stage 2

Stage 1이 추출한 `CodeStructureExtract`(IR)를 소비하여 도메인 온톨로지 YAML을 생성하는 프로토콜입니다.
설계 근거: `dev-docs/design/ontology-auto-generation.md` §6, `dev-docs/design/ontology-auto-generation-improvements.md`

## 핵심 원칙

| 원칙 | 내용 |
|------|------|
| **탐지는 코드, 판정은 에이전트** | Stage 1(코드)은 구조 추출만 수행. Stage 2(이 프로토콜)는 의미 부여 |
| **단방향 의존** | Stage 2 → Stage 1 방향의 피드백 금지. IR은 읽기 전용 |
| **기존 YAML 호환** | 생성된 YAML은 `buildOntologyIndex()`에 직접 입력 가능 |
| **graceful degradation** | Stage 2 실패 시 Stage 1의 code_aliases만으로 불완전 YAML 생성 |

## 입력과 출력

- **입력**: `CodeStructureExtract` (Stage 1 출력, JSON)
- **출력**: `glossary.yaml`, `actions.yaml`, `transitions.yaml` (v3 형식)
- **출력 타입**: `ontology-index.ts`의 `GlossaryEntry`, `ActionEntry`, `TransitionEntry`를 YAML로 직렬화한 형식

Stage 2 전용 중간 타입은 정의하지 않습니다. IR을 직접 읽고 YAML로 변환합니다.

---

## 1. 소비 순서

Stage 2는 `CodeStructureExtract`의 필드를 아래 순서로 읽습니다. 순서에 의미가 있습니다 — 앞 단계의 결과가 뒤 단계의 입력이 됩니다.

| 단계 | IR 필드 | 수행 작업 | 산출 |
|:----:|---------|----------|------|
| **S1** | `entity_candidates` | 엔티티 정규화: 코드명 → canonical + meaning(한국어) | glossary 초안 |
| **S2** | `enum_candidates` | enum 값별 비즈니스 의미 부여 | glossary.value_filters 완성 |
| **S3** | `relation_candidates` | 관계의 비즈니스 의미 확인 + glossary 보강 | glossary.legacy_aliases 일부 |
| **S4** | `policy_constant_candidates` | 매직넘버 → 비즈니스 정책 설명 | glossary 또는 별도 policy_constants |
| **S5** | `entry_points` + `call_graph` | 행위 의미 부여: 메서드 시그니처 → display_name + domain + side_effects | actions 완성 |
| **S6** | `transition_candidates` | 상태 전이의 trigger(자연어) + guards(비즈니스 조건) 서술 | transitions 완성 |
| **S7** | `meta` | 품질 검증: parsed_files/total_files 비율, unresolved_calls 비율 확인 | warnings |

**순서 근거**:
- S1(엔티티)이 먼저 — S2~S6에서 엔티티명을 canonical로 참조하기 위함
- S5(행위)가 S6(전이) 앞 — action의 target_entities가 transition의 trigger 서술에 맥락 제공
- S7(메타)이 마지막 — 전체 생성 품질 판단

---

## 2. YAML 필드별 생성 규칙

### 2.1 glossary.yaml

| YAML 필드 | 데이터 원천 | 생성 주체 | 규칙 |
|-----------|-----------|:---------:|------|
| `canonical` | `EntityCandidate.name` | Stage 1 | 코드명 그대로 사용. Stage 2가 변경하지 않음 |
| `meaning` | 코드 맥락 + 도메인 지식 | **Stage 2** | 한국어로 1~2문장. 이 엔티티가 비즈니스에서 무엇을 의미하는지 서술 |
| `legacy_aliases` | 도메인 지식 | **Stage 2** | 한국어 동의어/약어 목록. `semantic_aliases`에 해당 (§5 참조) |
| `code_entity` | `EntityCandidate.name` | Stage 1 | 코드 클래스명 |
| `db_table` | `EntityCandidate.db_table` | Stage 1 | `@Table(name="...")` 추출값 |
| `fk_variants` | `RelationCandidate(kind: "fk")` | Stage 1 | FK 컬럼명 목록 |
| `value_filters[].column` | `EntityCandidate.fields[].name` | Stage 1 | enum 타입 필드명 |
| `value_filters[].value` | `EnumCandidate.values[]` | Stage 1 | enum 값 |
| `value_filters[].description` | enum 값 + 코드 맥락 | **Stage 2** | 각 enum 값의 비즈니스 의미. 한국어 1문장 |

### 2.2 actions.yaml

| YAML 필드 | 데이터 원천 | 생성 주체 | 규칙 |
|-----------|-----------|:---------:|------|
| `id` | `EntryPoint.symbol` | Stage 1 | 진입점의 정규화된 심볼명 |
| `name` | `EntryPoint.symbol` | Stage 1 | 심볼의 마지막 세그먼트 (`.` 뒤) |
| `display_name` | 메서드 시그니처 + 도메인 맥락 | **Stage 2** | 한국어. "~를 ~한다" 형식. 비즈니스 관점 행위명 |
| `domain` | 패키지/디렉토리 구조 + 도메인 지식 | **Stage 2** | 이 행위가 속하는 도메인 영역 (한국어, 2~4자) |
| `target_entities` | `call_graph` BFS 도달 엔티티 | Stage 1 | 진입점에서 호출 그래프를 따라 도달하는 엔티티 목록 |
| `source_code` | `EntryPoint.file_path:line` | Stage 1 | 소스 위치 참조 |
| `state_transitions` | `transition_candidates` 교차 참조 | Stage 1 | 이 행위가 유발하는 StateAssignment.id 목록 |
| `side_effects` | 호출 체인 분석 + 도메인 지식 | **Stage 2** | 이 행위의 부수 효과 목록 (예: "이메일 발송", "캐시 무효화") |
| `preconditions` | guard_expression + 도메인 지식 | **Stage 2** | 선행 조건. `{ check: string, policy_ref?: string }` |
| `results` | 호출 체인 종단 분석 | **Stage 2** | 행위의 결과 목록 |

### 2.3 transitions.yaml

| YAML 필드 | 데이터 원천 | 생성 주체 | 규칙 |
|-----------|-----------|:---------:|------|
| `id` | `StateAssignment.id` | Stage 1 | 합성 키 `"{entity}.{field_name}:{from}->{to}"` |
| `entity` | `StateAssignment.entity` | Stage 1 | |
| `field_name` | `StateAssignment.field_name` | Stage 1 | |
| `from` | `StateAssignment.from` | Stage 1 | `null`이면 `"(none)"` |
| `to` | `StateAssignment.to` | Stage 1 | |
| `trigger` | 호출 체인 역추적 + 도메인 지식 | **Stage 2** | 한국어. 이 전이를 유발하는 비즈니스 이벤트/조건 서술 |
| `source_code` | `StateAssignment.file_path:line` | Stage 1 | |
| `guards[].check` | `StateAssignment.guard_expression` | Stage 1 구조 + **Stage 2** 설명 | 코드 조건식이 있으면 비즈니스 조건으로 번역. 없으면 도메인 지식으로 추론 |
| `guards[].policy_ref` | 정책 상수 교차 참조 | **Stage 2** | guard에 정책 상수가 관여하면 해당 상수 참조 |

---

## 3. DomainFlowSeed

### 3.1 정의

`DomainFlowSeed`는 Stage 1이 호출 그래프에서 추출한 **행위 흐름의 골격**입니다. 하나의 진입점에서 시작하여 어떤 엔티티를 경유하고 어떤 상태 전이를 유발하는지를 기록합니다.

Stage 2는 이 골격에 비즈니스 의미를 부여하여 `domain_flows` YAML로 완성합니다.

### 3.2 IR 확장

`CodeStructureExtract`에 `domain_flow_seeds` 필드를 추가합니다:

```typescript
export interface CodeStructureExtract {
  // ... 기존 필드 ...
  domain_flow_seeds: DomainFlowSeed[];
}

export interface DomainFlowSeed {
  /** 진입점 symbol (EntryPoint.symbol과 동일) */
  entry_point: string;
  /** 경유하는 엔티티 목록 (BFS 최초 도달 순서) */
  entities_touched: string[];
  /** 유발하는 상태 전이 ID 목록 (StateAssignment.id 참조) */
  transitions_triggered: string[];
  /** 호출 깊이 (entry_point에서 가장 먼 도달 엔티티까지의 hop 수) */
  max_depth: number;
}
```

**생성 시점**: Stage 1의 YAML 생성기(`yaml-generator.ts`)에서 `findTargetEntities()`와 `findTriggeredTransitions()` 결과를 조합하여 생성합니다. 기존 로직을 재사용하므로 추가 탐색 비용이 없습니다.

### 3.3 domain_flows YAML 스키마

```yaml
domain_flows:
  - id: "OrderService.createOrder"           # entry_point symbol
    name: "주문 생성"                          # Stage 2: display_name
    description: "사용자가 장바구니 상품을 주문으로 전환하는 흐름"  # Stage 2
    steps:
      - entity: "Cart"
        action: "조회"                        # Stage 2: 엔티티별 행위 서술
      - entity: "Order"
        action: "생성"
      - entity: "Payment"
        action: "결제 요청"
    transitions_triggered:
      - "Order.status:null->CREATED"          # Stage 1: StateAssignment.id
      - "Payment.status:null->PENDING"
    side_effects:                              # Stage 2
      - "재고 차감 요청"
      - "주문 확인 이메일 발송"
```

### 3.4 Stage 2 소비 규칙

| YAML 필드 | 데이터 원천 | 생성 주체 |
|-----------|-----------|:---------:|
| `id` | `DomainFlowSeed.entry_point` | Stage 1 |
| `name` | 행위 의미 + 도메인 지식 | **Stage 2** |
| `description` | 전체 흐름의 비즈니스 의미 | **Stage 2** |
| `steps[].entity` | `DomainFlowSeed.entities_touched` (순서 유지) | Stage 1 |
| `steps[].action` | 엔티티별 호출 그래프 분석 | **Stage 2** |
| `transitions_triggered` | `DomainFlowSeed.transitions_triggered` | Stage 1 |
| `side_effects` | 호출 체인 종단 분석 | **Stage 2** |

### 3.5 buildOntologyIndex() 확장

`OntologyIndex`에 `domain_flows` 필드를 추가합니다:

```typescript
export interface OntologyIndex {
  glossary: Map<string, GlossaryEntry>;
  actions: Map<string, ActionEntry>;
  transitions: Map<string, TransitionEntry[]>;
  domain_flows: Map<string, DomainFlowEntry>;  // 신규
}

export interface DomainFlowEntry {
  id: string;
  name: string;
  description: string;
  steps: { entity: string; action: string }[];
  transitions_triggered: string[];
  side_effects?: string[];
}
```

**하위 호환**: `domain_flows` YAML이 없으면 빈 Map으로 처리합니다. 기존 소비 파이프라인에 영향 없음.

---

## 4. Stage 2 실패 시 fallback 규칙

Stage 2가 부분 또는 전체 실패할 수 있습니다. 실패 시에도 `buildOntologyIndex()`를 통과하는 YAML을 생성해야 합니다.

### 4.1 필드별 fallback 값

| YAML 필드 | fallback 값 | 근거 |
|-----------|------------|------|
| `meaning` | `""` (빈 문자열) | `buildOntologyIndex()`가 `meaning ?? ""`로 처리 |
| `legacy_aliases` | `[]` (빈 배열) | semantic_aliases 없이도 code_aliases로 검색 가능 |
| `value_filters[].description` | `""` | enum 값 자체는 Stage 1이 추출 완료 |
| `display_name` | `""` | 코드 심볼명(`name`)으로 대체 가능 |
| `domain` | `""` | 미분류 상태. 소비 파이프라인에서 필터링 시 전체 포함 |
| `side_effects` | 생략 (undefined) | optional 필드 |
| `preconditions` | 생략 (undefined) | optional 필드 |
| `results` | 생략 (undefined) | optional 필드 |
| `trigger` | `""` | 빈 문자열. 상태 전이의 구조(from→to)는 Stage 1이 확보 |
| `guards[].policy_ref` | 생략 (undefined) | optional 필드 |
| `domain_flows` | 생략 (YAML 파일 미생성) | `buildOntologyIndex()`가 빈 Map으로 처리 |

### 4.2 부분 실패 처리

Stage 2는 항목별로 독립 처리합니다. 하나의 엔티티에서 meaning 생성에 실패해도 다른 엔티티는 정상 생성합니다.

```
성공: meaning="사용자가 수강 신청한 강의 단위"
실패: meaning="" + warning 기록
```

### 4.3 warning 체계

| warning | 조건 |
|---------|------|
| `auto_generated_no_entities` | Stage 1에서 엔티티 0건 추출 |
| `auto_generated_partial` | Stage 2가 1건 이상 실패 (meaning="" 포함) |
| `auto_generated_no_domain_flows` | DomainFlowSeed는 있으나 Stage 2 변환 실패 |
| `low_parse_coverage` | `meta.parsed_files / meta.total_files < 0.5` |
| `high_unresolved_ratio` | `meta.unresolved_calls / call_graph.length > 0.3` |

---

## 5. code_aliases vs semantic_aliases 처리 절차

"탐지는 코드, 판정은 에이전트" 원칙을 별칭(alias) 생성에도 적용합니다.

### 5.1 두 종류의 별칭

| 구분 | 담당 | 성격 | YAML 매핑 위치 | 예시 |
|------|------|------|---------------|------|
| `code_aliases` | Stage 1 (결정론적) | 코드에서 직접 추출한 식별자 | `code_entity`, `db_table`, `fk_variants` | `GT_CLASS`, `gt_class`, `classId` |
| `semantic_aliases` | Stage 2 (비결정론적) | 도메인 지식으로 생성한 동의어 | `legacy_aliases`, `meaning` | `수업`, `레슨`, `강의` |

### 5.2 병합 규칙

1. **Stage 1이 먼저 실행**: `code_entity`, `db_table`, `fk_variants`를 YAML에 기록
2. **Stage 2가 보강**: `legacy_aliases`에 semantic_aliases를 추가, `meaning`을 채움
3. **충돌 시**: Stage 1이 기록한 code_aliases는 Stage 2가 수정하지 않음 (읽기 전용)
4. **중복 방지**: Stage 2가 생성한 semantic_alias가 기존 code_alias와 동일하면 제거

### 5.3 구분 유지 원칙

`code_entity`와 `db_table`은 정식 이름(canonical code name)입니다. `fk_variants`만 진정한 별칭(alias)입니다. Stage 2는 이 구분을 인지하고, 정식 이름을 semantic_aliases에 중복 추가하지 않습니다.

---

## 6. 캐시 키 규칙

### 6.1 Stage 1 출력 캐시

Stage 1의 `CodeStructureExtract`는 결정론적이므로 입력이 동일하면 출력도 동일합니다. 캐시 키는 입력 해시로 구성합니다.

```
cache_key = SHA-256(
  sorted(files.map(f => f.path + ":" + SHA-256(f.content))).join("\n")
  + "\n" +
  sorted(dependency_graph.map(e => e.from + "->" + e.to)).join("\n")
)
```

**무효화 조건**: 입력 파일의 내용 또는 의존 그래프가 변경되면 캐시 미스.

### 6.2 Stage 2 출력 캐시

Stage 2는 비결정론적(LLM)이므로 동일 입력에서도 다른 출력이 나올 수 있습니다. 캐시 키는 Stage 1 출력 해시를 사용합니다.

```
cache_key = SHA-256(JSON.stringify(CodeStructureExtract))
```

**캐시 정책**:
- Stage 1 출력이 변경되지 않으면 Stage 2를 재실행하지 않음
- 사용자가 명시적으로 재생성을 요청하면 캐시 무시
- 캐시 유효 기간: 설정하지 않음 (Stage 1 해시 변경이 유일한 무효화 트리거)

### 6.3 ETag 패턴과의 일관성

기존 tarball 스캔에서 사용하는 ETag 캐싱 패턴과 동일한 원리를 적용합니다:
- 입력 변경 없음 → 캐시 히트 → 스캔/생성 건너뜀 (`ScanSkipped` 반환)
- 입력 변경 있음 → 캐시 미스 → 전체 파이프라인 재실행

---

## 7. 보조 진입점 처리 (Phase 2a: 2.2)

Phase 2a에서 `EntryPoint`에 보조 진입점이 추가됩니다.

### 7.1 primary vs auxiliary 구분

```typescript
export interface EntryPoint {
  // ... 기존 필드 ...
  primary: boolean;  // Phase 2a 추가
}

export type EntryPointKind =
  | "http" | "scheduled" | "event_listener"
  | "message_consumer" | "batch" | "main"
  | "auxiliary_service_method";  // Phase 2a 추가
```

### 7.2 Stage 2 처리 차이

| 구분 | primary (기존) | auxiliary (Phase 2a) |
|------|---------------|---------------------|
| actions YAML 포함 | 항상 | 다른 primary에서 도달 불가한 경우만 |
| domain_flows 생성 | 항상 | 생성하지 않음 (독립 흐름이 아님) |
| display_name | 필수 | 필수 |
| side_effects | 추론 | 추론 (범위가 좁음) |

---

## 8. 실행 절차 요약

```
1. CodeStructureExtract (JSON) 수신
2. meta 검증: total_files > 0, entry_points_found > 0
   └─ 0건이면 → 빈 YAML 반환 + warning
3. S1~S4: glossary.yaml 생성
   └─ 각 엔티티/enum/관계/상수에 대해 의미 부여
   └─ 실패 항목은 fallback 값 적용 + warning 기록
4. S5: actions.yaml 생성
   └─ primary 진입점 우선, auxiliary는 미도달 엔티티 접근용
5. S6: transitions.yaml 생성
   └─ trigger/guards에 비즈니스 의미 부여
6. domain_flows.yaml 생성 (DomainFlowSeed 기반)
   └─ primary 진입점만 대상
   └─ 실패 시 파일 미생성 (graceful degradation)
7. 최종 검증
   └─ 생성된 YAML이 buildOntologyIndex()로 파싱 가능한지 확인
   └─ warnings 집계
```

---

## 9. 이 프로토콜의 범위

이 문서는 **Phase 2a~2b의 설계 기준**입니다.

| 이 문서가 정의하는 것 | 이 문서가 정의하지 않는 것 |
|---------------------|------------------------|
| Stage 2가 IR을 소비하는 순서와 규칙 | Stage 1의 추출 알고리즘 (설계 문서에서 정의) |
| YAML 필드별 생성 주체와 규칙 | LLM 프롬프트 구조 (구현 시 결정) |
| DomainFlowSeed IR 스키마 + YAML 스키마 | `buildOntologyIndex()` 코드 구현 (코드에서 정의) |
| fallback/warning 체계 | 다중 언어 파서 (Phase 2c) |
| 캐시 키 규칙 | 문서/테스트 보조 입력 (Phase 3) |
