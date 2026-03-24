# Ontology Auto-Generation — 개선안 및 상한선 분석

> 상태: **Panel Review #3 반영 완료** (2026-03-24)
> 선행: `ontology-auto-generation.md` (Panel Review #2 반영), 시뮬레이션 테스트 결과
> 리뷰: `ontology-auto-generation-improvements-review.md` (8/8 합의)

---

## 1. 현재 상태

시뮬레이션 테스트 결과, 현재 설계의 예상 달성율 **(podo-ontology 단일 기준)**:

| 카테고리 | podo-ontology 기준 | 현재 예상 | 100%까지 gap |
|---------|:------------------:|:--------:|:-----------:|
| 엔티티 65개 | 65 | 95% (~62) | 5% (~3건) |
| enum 50개 | 50 | 98% (~49) | 2% (~1건) |
| 관계 162개 | 162 | 75% (~122) | 25% (~40건) |
| 행위 166개 | 166 | 85% (~141) | 15% (~25건) |
| 상태 전이 10개 | 10 | 70% (~7) | 30% (~3건) |
| 정책 상수 18개 | 18 | 80% (~14) | 20% (~4건) |
| 도메인 흐름 18개 | 18 | Phase 2 | 100% |

> **측정 기준 (Panel Review #3 즉시 조치 #5)**:
> - **기준 코드베이스**: podo-ontology (단일). 일반화를 위해 2~3개 추가 코드베이스 검증이 필요합니다.
> - **추출율 정의**: 항목 수 기준 (podo-ontology의 카테고리별 항목 수 대비 자동 생성된 항목 수).
> - **가중치**: 건수 비례 (엔티티 65건 = 관계 162건과 동일 가중치가 아님). 가중 평균 산출 시 건수를 분모로 사용.

**현재 가중 평균 (도메인 흐름 제외): ~84%**

**입력 범위 상한선 (Panel Review #3 용어 수정)**: ~93%. 이것은 "정적 분석의 원리적 한계"가 아니라 **"현재 Stage 1 입력 범위(코드 파일)의 상한선"**입니다. 입력을 확장(문서, 테스트, 설정 파일)하면 상한선이 재정의됩니다.

---

## 2. 카테고리별 개선안

### 개선안 간 의존 관계 (DAG)

```
C(RelationCandidate 일원화) ─→ A(Embedded/Inheritance)
                             ─→ B(공동 사용 패턴)
D(서비스 메서드 진입점) ─→ F(상태 변경 메서드 추적)
                       ─→ H(설정 파일 스캔) — 도달 범위 확장이 F, H 실효성에 영향
G(enum 전이 후보) ─→ F(상태 변경 메서드) — F의 결과와 교차 검증 필요

독립: I(전수 스캔), J(as const), E(비동기 추적)
```

### 2.1 관계 75% → 목표: 90%

**누락 원인 분석:**
- 탐지 가능: FK(@ManyToOne, @JoinColumn), 타입 참조(field: OtherEntity), 행위 참조(CallSite 체인)
- 누락: @Embedded 관계, @Inheritance 상속 관계, 암묵적 관계(코드 로직으로만 존재)

**개선안 C: IR에 `relation_candidates` 필드 추가 [Phase 1 최우선 — 8/8 합의]**

A, B의 선행 조건입니다. 현재 관계 데이터가 `EntityCandidate.fields[is_fk]`, `call_graph`, `referenced_by` 3곳에 분산되어 있어, Stage 2 에이전트가 관계를 조합할 수 없습니다. `RelationCandidate` 타입으로 일원화하되, 기존 분산 저장소에서 **이동**(복제 아님)합니다.

```typescript
export interface RelationCandidate {
  from_entity: string;
  to_entity: string;
  kind: "fk" | "embedded" | "inheritance" | "type_ref";
  confidence_basis: "structural";    // Phase 1은 구조적 증거만
  evidence_kind: string;             // "annotation" | "field_type" | "fk_column"
  evidence_detail: string;           // 구체적 근거
  file_path: string;
  line: number;
  basis: "extracted";                // Stage 1 추출 결과
}
```

> **Panel Review #3 반영**:
> - `kind`에서 `"co_occurrence"` 제거 — 통계적 추론은 구조적 증거와 혼합하지 않음 (onto_semantics S1)
> - `confidence_basis: "structural" | "statistical"` 축 분리 — Phase 2에서 B(공동 사용 패턴) 추가 시 `"statistical"` 도입 (6/8 합의)
> - `evidence: string` → `evidence_kind` + `evidence_detail` 분리 (onto_semantics S4)
> - `basis: "extracted" | "inferred"` 축 도입 — Stage 1 추출과 Stage 2 추론을 타입 수준에서 구분 (Philosopher)

**개선안 A: @Embedded/@Inheritance 어노테이션 추출 [Phase 1 — C 이후]**
- Stage 1 추출 규칙에 `@Embedded`, `@Inheritance`, `@MappedSuperclass` 패턴 추가
- 추출 결과는 `RelationCandidate(kind: "embedded" | "inheritance")`로 기록 (C에 통합)
- 예상 개선: +10% (→ 85%)
- Touch Point: §5.3 추출 규칙 2건 추가 (EntityCandidate에 별도 필드 추가 불필요 — C가 일원화)

**개선안 B: 공동 사용 패턴 기반 관계 추론 [Phase 2b]**
- "동일 서비스 메서드에서 두 엔티티가 함께 사용되면 관계 후보"
- Stage 2 에이전트 프로토콜에서 규칙으로 정의
- 결과는 `RelationCandidate(kind: "co_occurrence", confidence_basis: "statistical", basis: "inferred")`로 기록
- 예상 개선: +5% (→ 90%)

> **Panel Review #3 반영**: B의 결과가 IR(`CodeStructureExtract`)에 직접 기록되면 Stage 2→Stage 1 역방향 의존이 발생합니다 (onto_dependency 그룹 3). B의 결과는 Stage 2 내부에서만 소비하고, IR에는 기록하지 않습니다.

### 2.2 행위 85% → 목표: 93~95%

**개선안 D: 서비스 public 메서드를 보조 진입점으로 취급 [Phase 2a — 8/8 합의]**

> **Panel Review #3 반영**:
> - `"service_method"` 대신 `"auxiliary_service_method"` 사용 — `EntryPoint`의 "외부 트리거" 정의와 구분 (onto_semantics S2)
> - `EntryPoint`에 `primary: boolean` 필드 추가 — 기존 진입점(HTTP 등)은 `true`, 보조 진입점은 `false`
> - 2-pass 처리 필요: 1st pass에서 기존 진입점 탐색 → 2nd pass에서 미도달 서비스 메서드를 보조 진입점으로 등록 (onto_structure S-4)
> - **Phase 2a 배치 근거**: D는 호출 그래프 도달 범위를 확장하므로, F와 H의 실효성에 영향 (onto_coverage 핵심 지적)

- 예상 개선: +5~8% (→ 90~93%)

**개선안 E: 비동기 호출 추적 강화 [Phase 2b]**
- `CallSite.kind`에 `"async"` 추가
- 예상 개선: +2% (→ 95%)

### 2.3 상태 전이 70% → 목표: 85%

**개선안 F: 상태 변경 메서드 추적 심화 [Phase 2a]**
- `changeStatus`, `updateStatus`, `setStatus`, `transitionTo` 같은 상태 변경 관용 메서드를 호출 그래프에서 추적
- 예상 개선: +10% (→ 80%)

**개선안 G: enum 필드의 모든 값 조합을 전이 **가설**로 생성 [Phase 2b — 조건부]**

> **Panel Review #3 반영 (7/8 합의)**:
> - 코드 증거 없는 항목을 `StateAssignment`에 혼합하면 안 됩니다 (onto_semantics S3)
> - 별도 타입 `TransitionHypothesis`로 분리합니다
> - Stage 1의 역할은 "가설 생성", Stage 2의 역할은 "비즈니스적 유효성 판정"으로 재정의 (onto_logic L2)

```typescript
/** Stage 1이 생성하는 전이 가설. 코드 증거 없이 enum 조합으로 생성. */
export interface TransitionHypothesis {
  entity: string;
  field_name: string;
  from: string;
  to: string;
  basis: "inferred";           // 추론 결과임을 명시
  enum_source: string;         // 근거 enum 타입명
}
```

- 예상 개선: +5% (→ 85%). false positive는 Stage 2가 걸러냄
- **전제 조건**: F의 결과와 교차 검증하여, 이미 `StateAssignment`에 존재하는 전이는 `TransitionHypothesis`에서 제외

### 2.4 정책 상수 80% → 목표: 90%

**개선안 H: 설정 파일 스캔 확장 [Phase 2a]**

> **Panel Review #3 반영 (6/8 합의)**:
> - `ParsedModule.language`에 "config"를 추가하는 것이 아니라, `GeneratorInput`에 `config_files` 필드를 추가하는 방식 (onto_structure S-3)
> - 설정 파일 어댑터는 `ParserAdapter`와 독립적인 `ConfigAdapter` 인터페이스로 구현

```typescript
// GeneratorInput 확장
export interface GeneratorInput {
  files: { path: string; content: string }[];
  dependency_graph: { from: string; to: string }[];
  config_files?: { path: string; content: string; format: "yaml" | "properties" | "env" }[];
}
```

- 예상 개선: +10% (→ 90%)
- `PolicyConstantCandidate`에 `source_type: "code" | "config"` 필드 추가

### 2.5 엔티티 95% → 목표: 98%

**개선안 I: 진입점 비의존 전수 스캔 모드 [Phase 1]**
- 모든 파일에서 `@Entity` 어노테이션을 직접 스캔
- 예상 개선: +3% (→ 98%)

### 2.6 enum 98% → 목표: 99%

**개선안 J: `as const` 배열 패턴 탐지 [Phase 1]**
- TypeScript: `const X = [...] as const`
- Kotlin: `sealed class`, `companion object` 내 상수 집합
- 예상 개선: +1% (→ 99%)

---

## 3. 입력 범위 확장 (Phase 3 — 운영 결과 관찰 후 결정)

> **Panel Review #3 합의 (8/8)**: 98% 목표를 철회합니다. Phase 3은 Phase 1+2 운영 결과를 관찰한 후 결정합니다.

현재 입력 범위 상한선 ~93~95%의 원인:
1. 암묵적 관계 (코드에 구조적 힌트 없음)
2. 인라인 매직넘버 (의미 표지 없음)
3. 런타임 결정값 (현재 입력 범위 밖)

### 3.1 접근법: 문서 기반 보조 입력 (Stage 2 보조 입력)

> **Panel Review #3 반영**: "Stage 1.5" 명칭을 폐기합니다 (8/8 합의). 결정론적/비결정론적 경계를 흐리기 때문입니다. 대신 Stage 2의 **보조 입력**(독립 파이프라인)으로 설계합니다.

```
Stage 1 → CodeStructureExtract ─┐
                                 ├→ Stage 2 → YAML
문서 파싱 → DocumentationHints ──┘
```

- JavaDoc/KDoc/TSDoc 주석에서 구조적 태그(`@see`, `@link`, `@param`)만 결정론적으로 추출 → Stage 1 확장 (`ParsedModule.doc_tags`)
- 자연어 내용의 의미 해석 → Stage 2가 `DocumentationHints`를 보조 입력으로 소비

```typescript
export interface DocumentationHints {
  hints: DocumentationHint[];
}

export interface DocumentationHint {
  source: "javadoc" | "kdoc" | "tsdoc" | "readme";
  entity_ref?: string;
  content: string;              // 원문만 기록. hint_type 분류는 Stage 2가 수행
}
```

> **Panel Review #3 반영**: `hint_type` 분류("terminology", "business_rule" 등)는 비결정론적이므로 Stage 2로 이관 (onto_logic L4, onto_dependency F-2). Stage 1은 `content: string`만 기록합니다.

### 3.2 접근법: 테스트 명세 추출 (Stage 2 보조 입력)

> **Panel Review #3 반영**: "역공학" 명칭을 "명세 추출(specification extraction)"로 수정합니다 (onto_semantics S7). 실제 작업은 결정론적입니다.

- 테스트 파일을 별도 패스로 분석
- `source_kind: "production" | "test"` 필드로 프로덕션 코드와 구분 (7/8 합의)
- IR 통합 대신 별도 보조 입력(`TestEvidenceExtract`)으로 Stage 2에 전달 (onto_evolution)
- 테스트 커버리지가 낮은 코드베이스에서의 graceful degradation 규칙 필요

### ~~3.3 접근법: Git 히스토리 분석~~ → 제거

> **Panel Review #3 권장 (5/8)**: "+1%"에 비해 비용이 과대하고, 입력 소스의 변동성이 최고입니다. 로드맵에서 제거합니다.

---

## 4. 종합 로드맵

### Phase 1: 0% → ~88% (핵심 가치: cold start 해소)

> **Philosopher 관점**: PO에게 중요한 것은 "84%를 93%로 올리는 것"이 아니라 "0%에서 동작하는 것으로 전환하는 것"입니다. Phase 1 완성이 최우선입니다.

| 순서 | 개선안 | 내용 | 의존성 |
|:----:|--------|------|--------|
| 1 | **C** | `RelationCandidate` IR 일원화 (기존 분산 데이터 이동) | 없음 |
| 2 | **A** | @Embedded/@Inheritance 추출 → RelationCandidate에 기록 | C |
| 3 | **I** | 진입점 비의존 @Entity 전수 스캔 | 없음 |
| 4 | **J** | `as const` / sealed class 패턴 탐지 | 없음 |

### Phase 2a: ~88% → ~93% (입력 범위 확장)

| 순서 | 개선안 | 내용 | 의존성 |
|:----:|--------|------|--------|
| 5 | **D** | 서비스 public 메서드 보조 진입점 (2-pass) | 없음 |
| 6 | **F** | 상태 변경 메서드 추적 심화 | D (도달 범위 확장) |
| 7 | **H** | 설정 파일 스캔 (`GeneratorInput.config_files`) | D (도달 범위 확장) |

### Phase 2b: ~93% → ~95% (Stage 2 프로토콜)

| 순서 | 개선안 | 내용 | 의존성 |
|:----:|--------|------|--------|
| 8 | **B** | 공동 사용 패턴 → Stage 2 내부 소비 (IR 미기록) | C |
| 9 | **E** | 비동기 호출 추적 (`CallSite.kind: "async"`) | 없음 |
| 10 | **G** | `TransitionHypothesis` 가설 생성 + Stage 2 판정 | F |

### Phase 3: 운영 결과 관찰 후 결정

- 문서 기반 보조 입력 (§3.1)
- 테스트 명세 추출 (§3.2)
- Stage 2 소비자 계약 정의가 선행 조건 (Philosopher 권장)

> **Philosopher 권장**: Stage 2가 어떤 IR 필드를 어떤 순서로 소비하는지 정의되지 않은 채 IR을 확장하면, 입력 과잉이 핵심 정보의 가시성을 저하시킬 수 있습니다. Phase 3 착수 전에 Stage 2 소비 프로토콜을 먼저 정의해야 합니다.

---

## 5. Panel Review #3 반영 기록

### 즉시 조치 (8/8 합의)

| # | 조치 | 상태 |
|---|------|------|
| 1 | §1 표에 "podo-ontology 기준" 라벨 + 측정 기준 정의 | 반영 |
| 2 | 개선안 C: `RelationCandidate`를 Phase 1 최우선, 기존 분산 데이터에서 이동 | 반영 |
| 3 | 개선안 G: `TransitionHypothesis` 별도 타입 분리 | 반영 |
| 4 | 개선안 B: `confidence_basis` 축 분리, IR 미기록 (역방향 의존 방지) | 반영 |
| 5 | "Stage 1.5" 폐기 → Stage 2 보조 입력 독립 파이프라인 | 반영 |
| 6 | Phase 2를 2a/2b로 세분화 + 순서 의존성 DAG 명시 | 반영 |

### 권장 사항

| # | 권장 | 상태 |
|---|------|------|
| R1 | Stage 2 소비 프로토콜을 IR 확장 전에 정의 (Phase 3 전제 조건) | 반영 |
| R2 | IR에 `basis: "extracted" \| "inferred"` 축 도입 | 반영 (C, G 타입에 포함) |
| R3 | Git 히스토리 분석(§3.3) 로드맵에서 제거 | 반영 |
| R4 | 2~3개 추가 코드베이스에서 카테고리별 분포 검증 (향후) | §1에 명시 |
| R5 | `StateAssignment`에 `source_kind: "production" \| "test"` 추가 (Phase 3) | §3.2에 명시 |
