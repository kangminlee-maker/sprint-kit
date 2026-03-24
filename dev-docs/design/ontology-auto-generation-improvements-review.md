# 8-Agent Panel Review: ontology-auto-generation-improvements.md

> 이 리뷰는 onto-review 세션에서 잔여 에이전트가 수행한 결과입니다.
> 리뷰 대상: `dev-docs/design/ontology-auto-generation-improvements.md`
> 참조: `dev-docs/design/ontology-auto-generation.md`
> 날짜: 2026-03-24
> 상태: 7인 Round 1 + Philosopher 종합 완료. 쟁점 토론 불필요 판정

---

## onto_structure (구조적 완전성) — high 3건, medium 3건, low 1건

### 발견 사항

| # | 발견 | severity | 유형 |
|---|------|----------|------|
| S-1 | `RelationCandidate`가 `CodeStructureExtract`에 배치되지 않아 고립 타입 | high | 고립 요소 |
| S-2 | 개선안 A와 C가 동일 정보(Embedded/Inheritance)를 중복 기록 | medium | 중복 경로 |
| S-3 | 설정 파일 어댑터(개선안 H)의 파이프라인 연결 경로 부재. `ParsedModule`의 `language`에 config 없음 | high | 끊어진 경로 |
| S-4 | 서비스 메서드 진입점(개선안 D)이 호출 그래프와 순환 관계 형성. 2-pass 처리 필요 | medium | 순환 관계 |
| S-5 | Stage 1.5의 IR 연결 관계 미정의. `CodeStructureExtract`와의 관계, 입력 소스, 출력 전달 경로 모두 누락 | high | 누락된 관계 |
| S-6 | 개선안 B, E, G의 "Stage 2 프로토콜 위임"이 IR 데이터 경로 없이 기술됨 | medium | 누락된 관계 |
| S-7 | 테스트 역공학의 입력 경로 미정의. `GeneratorInput`에 테스트 파일 포함 여부 불명확 | low | 누락된 관계 |

### §5 검토 요청 답변 요약

- **우선순위**: C(1순위, 선행 조건) → A(2순위) → I+D(3순위) → H(4순위) → F,G(5순위) → B,E,J(6순위)
- **RelationCandidate 가치**: 가짐. 현재 관계 데이터 3곳 분산이 주요 취약점. 일원화 시 이동(복제 아님) 방식 필요
- **Stage 1.5**: 조건부 양립. 결정론적 부분(JavaDoc 파싱)만 Stage 1 확장, 비결정론적 부분(의미 해석)은 Stage 2 위임
- **98% 목표**: 93% 이후 매 단계마다 파이프라인 입력 경로 증가. Phase 2(93%)까지는 기존 구조 확장, Phase 3부터 구조 변경
- **테스트 역공학**: "탐지" 영역. `StateAssignment`에 `source_kind: "production" | "test"` 필드 추가 필요

---

## onto_semantics (의미적 정확성) — high 3건, medium 2건, low 1건

### 발견 사항

| # | 대상 | 유형 | 심각도 | 내용 |
|---|------|------|:------:|------|
| S1 | 개선안 C `RelationCandidate.kind` | 동형이의어 | **high** | 구조적 증거(fk, embedded, inheritance, type_ref)와 통계적 추론(co_occurrence)이 동일 필드에 혼합. `confidence_basis: "structural" | "statistical"` 축 분리 필요 |
| S2 | 개선안 D `"service_method"` | 정의 확장 | medium | `EntryPoint`의 "외부 트리거" 정의와 충돌. `primary: boolean` 필드 추가 또는 `"auxiliary_service_method"` 접두사 필요 |
| S3 | 개선안 G enum 조합 | 타입 과장 | **high** | 코드 증거 없는 항목을 `StateAssignment`에 혼합. 별도 타입(`TransitionHypothesis`) 필요 |
| S4 | §5.2 `evidence: string` | 구조 소실 | low | 근거의 종류를 `evidence_kind` + `evidence_detail`로 분리 필요 |
| S5 | §3.1 "Stage 1.5" 명칭 | 원칙 충돌 | **high** | 결정론적/비결정론적 경계를 흐림. "Stage 1.5" 폐기하고 2단계 분리 유지 권장 |
| S6 | §3 "구조적 상한선" 명칭 | 용어 부정확 | medium | "정적 분석의 원리적 한계"가 아닌 "현재 Stage 1 입력 범위의 상한선". 입력 확장으로 재정의 가능 |
| S7 | §3.2 "역공학" 명칭 | 명칭 부정확 | medium | 실제 작업은 "명세 추출(specification extraction)". 결정론적 작업인데 비결정론적 인상을 줌 |

---

## onto_dependency (의존성 무결성) — 그룹 3 위험 1건, 추가 발견 3건

### §5 검토 요청 답변 요약

**의존 방향 안전성 기준 3개 그룹 분류:**

| 그룹 | 개선안 | 판정 |
|------|--------|------|
| 그룹 1 — 안전 | A, I, J, F, H | 의존 방향 변경 없음 |
| 그룹 2 — 주의 | C, D, E, G | 타입 계약 확장 필요하나 방향 유지 |
| 그룹 3 — 위험 | B | co-occurrence 결과가 `RelationCandidate`(IR)에 기록되면 Stage 2→Stage 1 역방향 의존 |

**RelationCandidate**: source of truth 이중화 위험. 기존 분산 저장소를 **이동**(복제 아님)하거나, 변환 레이어에서 **뷰**로 생성하는 구조 필요

**Stage 1.5**: 양립하지 않음. Stage 1.5가 `CodeStructureExtract`에 필드를 추가하면 Stage 1의 타입 정의가 Stage 1.5에 역방향 의존. 대안: 문서 파싱을 Stage 2의 **보조 입력**(독립 파이프라인)으로 분리

```
Stage 1 → CodeStructureExtract ─┐
                                 ├→ Stage 2
문서 파싱 → DocumentationHints ──┘
```

**98% 목표**: 의존 그래프가 5노드 4간선 → 8노드 7간선으로 확장. Stage 2의 팬인 증가. Phase 2(~95%)까지 기존 구조, Phase 3은 운영 결과 관찰 후 결정 권장

### 추가 발견

- **F-1**: 개선안 B의 결과 저장 위치 미정의. 역방향 의존 여부 판단 불가
- **F-2**: `DocumentationHint.hint_type` 분류의 결정론성 미확인. Stage 2 위임 또는 구조적 기준(태그 기반)으로 한정 필요
- **F-3**: 개선안 C+A 동시 구현 시 source of truth 이중화(다이아몬드)

---

## onto_logic (논리적 일관성) — medium 4건, low 2건

### 발견 사항

| # | 유형 | 심각도 | 내용 |
|---|------|--------|------|
| L1 | ME 위반 | medium | 개선안 A와 C의 관계 정보 이중 기록. A를 C의 하위 작업으로 통합하거나 단일 소유권 명시 필요 |
| L2 | 역할 경계 모순 | medium | 개선안 G가 "코드에서 발생하는지 판정"을 Stage 2에 위임 — Stage 1의 역할을 Stage 2에 맡기는 것. Stage 2 역할을 "비즈니스적 유효성 판정"으로 재정의 필요 |
| L3 | 순서 의존성 미명시 | medium | §4 Phase 2 내 D+F+H → B+E+G 순서 의존성. Phase 2를 2a/2b로 세분화 필요 |
| L4 | 경계 불명확 | medium | Stage 1.5의 `hint_type` 중 "terminology", "business_rule"은 비결정론적. Stage 2로 재배치 필요 |
| L5 | 수치 관계 모호 | low | §3.1/3.2/3.3의 순차/병렬 관계 미명시 (96→98 순차? 96→97 병렬?) |
| L6 | 범위 제외 미기록 | low | §2.4 런타임 설정 서비스(Config Server)의 의도적 범위 제외 미명시 |

### §5 답변 요약

- **C를 A보다 먼저 또는 동시에 구현해야** (ME 위반 L1 해소)
- **G는 역할 경계 모순 해결 후에만 구현 가능** (L2 해소 필요)
- §1과 §4의 산술은 일관 (83.9%→87.7% 검증 통과)

---

## onto_pragmatics (활용 적합성) — 핵심 판정 + 추가 발견 2건

### §5 검토 요청 답변 요약

- **우선순위**: C(필수 선행) → A(높음) → I+J(높음) → D(중간) → F+G(중간) → H(중간) → B+E(낮음)
- **RelationCandidate**: "가시성 향상"이 아닌 **"질의 가능성 확보"**로 재정의해야. 현재 4곳 분산은 Stage 2 에이전트가 조합 불가능한 상태. `stage: 1 | 2` 필드 추가 권장
- **Stage 1.5**: 양립 가능하나 명칭이 설계 원칙과 충돌. Stage 1에 `documentation_hints` 추가 + Stage 2가 소비하는 구조 권장
- **98% 목표**: **부적절**. (1) 측정 방법 미정의(podo-ontology 한정), (2) 카테고리 가중치 미명시, (3) 93→98% 비용이 0→93%에 준하는 규모. 93%(Phase 1+2) 목표 후 운영 결과 기반으로 Phase 3 결정 권장
- **테스트 역공학**: 원칙 부합하나, "탐지 소스의 신뢰도 차등" 문제 도입. `source_kind: "production" | "test"` + Stage 2 교차 확인 규칙 필수

### 추가 발견

- **F-1**: 개선안 간 의존 관계 미명시 (C→A,B 선행, D→호출그래프 의존)
- **F-2**: §1 카테고리별 달성율의 시뮬레이션 방법론/근거 부재

---

## onto_evolution (확장·진화 적합성) — Touch Point 기반 분석

### Touch Point Count 기반 우선순위

| 그룹 | 개선안 | Touch Point |
|------|--------|:-----------:|
| 즉시 실행 | A, I, J | 각 2~3개 |
| 조건부 실행 | D, E | 각 2~4개 |
| Stage 2 의존 | B, F, G | 코드 1~2 + 프로토콜 1 |
| 새 파이프라인 | H | 어댑터 1 + IR 1 (실제 3~4) |

### §5 답변 요약

- **RelationCandidate**: **현재 보류 권장**. Phase 1에서는 FK+embedded+inheritance=3개로 일원화 이점이 추가 Touch Point를 상회하지 않음. Phase 2에서 co_occurrence/type_ref 도입 시 재검토
- **Stage 1.5**: 2단계 원칙과 조건부 양립. 결정론적 부분은 `ParsedModule.doc_tags`로, 비결정론적 부분은 Stage 2 보강으로 분리
- **98% 목표**: **비용 대비 부적절. 95%를 실용적 상한선으로 권장.** 95→98% 구간에서 Touch Point 15개+ 추가, 새 파이프라인 2개 도입
- **테스트 역공학**: IR 통합 대신 **별도 보조 입력**(`TestEvidenceExtract`) 권장. Touch Point 8~14개, 새 mock 프레임워크마다 2~3개 추가

### 추가 발견

- 개선안 간 의존성 미명시 (C→A,B / G→F)
- Git 히스토리 분석(§3.3): 변동성 최고의 입력 소스. "+1%"에 비해 비용 과대. 로드맵에서 제거 또는 "실험적" 격하 권장

---

## onto_coverage (도메인 포괄성) — 핵심 지적 + 추가 결함 2건

### §5 답변 요약

- **우선순위**: C(1) → A(2) → I(3) → D(4) → H(5) → F(6) → G(7) → E(8) → B(9) → J(10). **핵심 지적: D가 Phase 2로 밀린 것이 문제** — D는 호출 그래프 도달 범위를 확장하므로 Phase 1의 A, F, H 실효성에 영향
- **RelationCandidate**: 가치 있음. "가시성 향상"은 과소 평가 — 실질 가치는 (1) Stage 2 입력 포괄성 보장, (2) 개선안 B의 전제 조건. §4.2 교차 검증 표 갱신 필요
- **Stage 1.5**: 조건부 양립. `hint_type` 분류는 Stage 2로 이관. Stage 1 확장으로 `content: string`만 기록
- **98% 목표**: **부적절**. (1) 93→98% 비용이 아키텍처 변경 수준, (2) 도메인 흐름 18개가 목표에 미포함(0%), (3) depth-breadth tradeoff 미명시. "Phase 1: 88%, Phase 2: 93~95%, Phase 3: 검토 후 결정" 권장
- **테스트 역공학**: 원칙 부합. 단, (1) IR에 `source_kind` 필드 필요, (2) 테스트 커버리지 낮은 코드베이스에서의 한계/graceful degradation 미명시

### 추가 포괄성 결함

- **결함 1**: 개선안 간 의존 관계 미명시
- **결함 2**: "가중 평균" 산출 기준(건수 비례? 균등? 도메인 중요도?) 미정의

---

## 7인 교차 합의 사항 (Philosopher 종합 미수행이므로 팩트 기반 정리)

### 전원 합의 (7/7)

1. **개선안 C(RelationCandidate)는 A, B의 선행 조건** — 7인 모두 C의 우선순위를 최상위 또는 상위로 배치
2. **Stage 1.5 명칭의 문제** — 결정론적/비결정론적 분리가 필요하다는 점에 7인 합의
3. **98% 목표 부적절** — 7인 모두 95% 또는 93%를 실용적 목표로 권장
4. **테스트 역공학에 source_kind 구분 필요** — 프로덕션 vs 테스트 증거의 신뢰도 차등 구분 필수

### 다수 합의 (5+/7)

5. **개선안 G(enum 전이 후보)의 역할 경계 문제** — onto_logic, onto_semantics, onto_pragmatics가 독립적으로 지적
6. **개선안 H(설정 파일)의 파이프라인 연결 비용 과소평가** — onto_structure, onto_evolution, onto_coverage가 지적

### 미합의 (관점 차이)

7. **RelationCandidate 도입 시점**: onto_evolution은 Phase 2 보류 권장, 나머지 6인은 Phase 1 도입 권장. 근거 차이: evolution은 Touch Point 비용, 나머지는 Stage 2 입력 정규화 가치. **Philosopher 판정: Phase 1 도입이 적절** (6:1, Phase 2 미루면 이중 마이그레이션 발생)

---

## Philosopher 종합 (추가)

### 간과된 전제

1. **"가중 평균 84%"가 podo-ontology 단일 기준에 과적합** — podo에 `@Embedded` 3건이 있어 개선안 A가 +10%이지만, @Embedded 없는 코드베이스에서는 0%. 최소 2~3개 코드베이스에서의 카테고리별 분포 검증 필요
2. **개선안 B, G는 Stage 1의 "추출" 역할을 넘어 "추론/생성"을 수행** — `basis: "extracted" | "inferred"` 축 또는 별도 타입(`relation_hypotheses`, `TransitionHypothesis`)으로 분리 필요

### 새로운 관점

**Stage 2의 "소비자 계약" 미정의 상태에서 Stage 1의 IR을 확장 중** — Stage 2가 어떤 IR 필드를 어떤 순서로 소비하는지 정의되지 않은 채, "더 많은 정보를 넣으면 더 좋을 것"이라는 전제로 IR이 확장되고 있음. LLM 기반 Stage 2에서는 입력 과잉이 핵심 정보의 가시성을 떨어뜨릴 수 있음

### 즉시 조치 필요

| # | 조치 | 합의 |
|---|------|------|
| 1 | §1 표에 "podo-ontology 기준" 라벨 명시 | 8/8 |
| 2 | 개선안 C: `RelationCandidate`를 IR에 배치, 기존 분산 저장소에서 **이동** | 7/8 |
| 3 | 개선안 G: `TransitionHypothesis` 별도 타입 분리 | 6/8 |
| 4 | 개선안 B: `confidence_basis: "structural" | "statistical"` 축 분리 | 6/8 |
| 5 | "Stage 1.5" → Stage 2 보조 입력 독립 파이프라인으로 재설계 | 7/8 |
| 6 | §4 Phase 2를 2a/2b로 세분화, 순서 의존성 명시 | 5/8 |

### 권장 사항

| # | 권장 | 합의 |
|---|------|------|
| 1 | Stage 2 소비 프로토콜을 IR 확장 전에 정의 | 1/8 (신규) |
| 2 | IR에 `basis: "extracted" | "inferred"` 축 도입 | 3/8 |
| 3 | Git 히스토리 분석(§3.3) 로드맵에서 제거 또는 "실험적" 격하 | 5/8 |
| 4 | 2~3개 추가 코드베이스에서 카테고리별 분포 검증 | 1/8 (신규) |
| 5 | `StateAssignment`에 `source_kind: "production" | "test"` 추가 | 7/8 |
