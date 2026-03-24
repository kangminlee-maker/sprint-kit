# Ontology Auto-Generation — 통합 작업리스트

> 출처: `ontology-auto-generation.md` §11 + `ontology-auto-generation-improvements.md` §4
> 최종 업데이트: 2026-03-24
> 커밋: `f2f1e6a` (Phase 1 완료), 2.1 프로토콜 완료

---

## Phase 1: Stage 1 완성 + 개선안 C/A/I/J — ✅ 완료

> 커밋 `f2f1e6a` — 13파일, +3,252줄, 47파일 1,065개 테스트 통과

| # | 작업 | 상태 | 산출물 |
|---|------|:----:|--------|
| 1.1 | `CodeStructureExtract` + `GeneratorInput` + `RelationCandidate` 타입 정의 | ✅ | `generators/types.ts` |
| 1.2 | `ParserAdapter` + ts-morph 어댑터 (TS/JS, as const 탐지) | ✅ | `parsers/ts-morph-adapter.ts` |
| 1.3 | 진입점 탐지기 (6종, 11규칙) | ✅ | `entry-point-detector.ts` |
| 1.4 | 호출 그래프 빌더 (BFS, 20-hop) | ✅ | `call-graph-builder.ts` |
| 1.5 | 구조 추출기 (엔티티/enum/상태전이/관계/정책상수) | ✅ | `structure-extractor.ts` |
| 1.6 | YAML 생성기 (v3, code_aliases만) | ✅ | `yaml-generator.ts` |
| 1.7 | 테스트 (23개) | ✅ | `generators.test.ts` |
| 1.8 | E2E graceful degradation 테스트 | ✅ | generators.test.ts에 포함 |
| 1.9 | gate-guard 양방향 차단 규칙 | ✅ | `check-dependency-direction.ts` |

---

## Phase 2a: 입력 범위 확장 (~88% → ~93%) — 다음

> Stage 2 에이전트 프로토콜 + 호출 그래프 도달 범위 확장.
> **선행 조건**: Phase 1 완료 ✅

### 작업 목록

| # | 작업 | 의존성 | 산출물 | 내용 |
|---|------|--------|--------|------|
| 2.1 | **Stage 2 에이전트 프로토콜 설계** ✅ | Phase 1 | `docs/agent-protocol/ontology-generate.md` | Stage 2의 소비자 계약 정의. LLM이 `CodeStructureExtract`의 각 필드를 어떤 순서로 소비하여 YAML을 생성하는지 명시. DomainFlowSeed + domain_flows YAML 스키마 확장 포함 |
| 2.2 | **서비스 public 메서드 보조 진입점** ✅ (개선안 D) | Phase 1 | `entry-point-detector.ts` 확장 | `@Service`/`@Component` 클래스의 public 메서드를 `EntryPoint(kind: "auxiliary_service_method")`로 수집. 2-pass 처리: 1st pass 기존 진입점 → 2nd pass 미도달 서비스 메서드. `EntryPoint.primary: boolean` 필드 추가 |
| 2.3 | **상태 변경 메서드 추적 심화** ✅ (개선안 F) | 2.2 | `call-graph-builder.ts` 확장 | `changeStatus`, `updateStatus`, `setStatus`, `transitionTo` 등 상태 변경 관용 메서드를 호출 그래프에서 추적. 해당 메서드 내부의 상태 할당까지 탐색 깊이 확장 |
| 2.4 | **설정 파일 스캔** ✅ (개선안 H) | 2.2 | `config-adapter.ts` 신규 | `GeneratorInput.config_files` 경로로 application.yml/properties/.env 파서 구현. `PolicyConstantCandidate.source_type: "config"` |

### 2.1 상세: Stage 2 프로토콜에 포함해야 할 것

이 작업은 코드가 아닌 **에이전트 프로토콜 문서**입니다. Phase 2a의 나머지 작업(2.2~2.4)의 설계 기준이 됩니다.

포함 항목:
1. **소비 순서**: Stage 2가 `CodeStructureExtract`의 필드를 어떤 순서로 읽는지
2. **YAML 필드별 생성 규칙**: 각 YAML 필드(canonical, meaning, display_name, trigger 등)를 어떤 IR 필드에서 생성하는지
3. **DomainFlowSeed 도입**: IR에 `domain_flow_seeds` 필드 추가 + domain_flows YAML 스키마 정의 + `buildOntologyIndex()` 확장
4. **Stage 2 실패 시 fallback**: meaning="" 등 placeholder 규칙
5. **code_aliases vs semantic_aliases 처리 절차**: Stage 1이 추출한 code_aliases와 Stage 2가 생성한 semantic_aliases의 병합 규칙
6. **캐시 키 규칙**: `CodeStructureExtract` 해시 기반 캐시, ETag 패턴과의 일관성

### 2.2~2.4의 IR 변경 사항 (2.1 프로토콜 반영 후 확정)

| 변경 | 대상 파일 | 내용 |
|------|----------|------|
| `EntryPoint.primary` 필드 추가 | `types.ts` | `primary: boolean` — 기존 진입점 true, 보조 진입점 false |
| `EntryPointKind`에 `"auxiliary_service_method"` 추가 | `types.ts` | 서비스 public 메서드 |
| `GeneratorInput.config_files` 필드 추가 | `types.ts` | 이미 optional로 정의됨 ✅ |
| `PolicyConstantCandidate.source_type` | `types.ts` | 이미 정의됨 ✅ |

---

## Phase 2b: Stage 2 프로토콜 적용 (~93% → ~95%)

> Stage 2 에이전트가 수행하는 의미 부여 + 추론 기반 보완.
> **선행 조건**: Phase 2a 완료

| # | 작업 | 의존성 | 산출물 | 내용 |
|---|------|--------|--------|------|
| 2.5 | **공동 사용 패턴 관계 추론** (개선안 B) | 2.1, 1.1(C) | Stage 2 프로토콜 규칙 | Stage 2 내부에서만 소비 (IR 미기록 — 역방향 의존 방지). `confidence_basis: "statistical"` |
| 2.6 | **비동기 호출 추적** (개선안 E) | Phase 1 | 파서 어댑터 확장 | `CallSite.kind`에 `"async"` 추가. `CompletableFuture.supplyAsync`, `@Async`, `launch { }` 패턴 |
| 2.7 | **enum 전이 가설 생성** (개선안 G) | 2.3(F) | `structure-extractor.ts` 확장 | `TransitionHypothesis` 별도 타입. Stage 2가 비즈니스적 유효성 판정. F의 결과와 교차 검증 |

### IR 변경 사항

| 변경 | 대상 파일 | 내용 |
|------|----------|------|
| `CallSite.kind`에 `"async"` 추가 | `types.ts` | `kind: "direct" \| "unresolved" \| "async"` |
| `TransitionHypothesis` 타입 추가 | `types.ts` | `basis: "inferred"`, `enum_source: string` |
| `CodeStructureExtract.transition_hypotheses` 필드 추가 | `types.ts` | `TransitionHypothesis[]` |

---

## Phase 2c: 다중 언어 지원

> **선행 조건**: Phase 1(1.2 ParserAdapter) 완료 ✅. 독립적으로 착수 가능.

| # | 작업 | 의존성 | 산출물 | 내용 |
|---|------|--------|--------|------|
| 2.8 | **tree-sitter 어댑터** (Kotlin/Java) | 1.2 | `parsers/tree-sitter-adapter.ts` | `ParserAdapter` 인터페이스 구현. Kotlin/Java 파일 → `ParsedModule` 변환. tree-sitter 바인딩 의존성 추가 필요 |

---

## Phase 3: 운영 결과 관찰 후 결정

> **전제 조건**: Stage 2 소비 프로토콜 정의 (2.1에서 작성). Phase 1+2 운영 결과 관찰.
> **결정 시점**: Phase 2 완료 후, 실제 코드베이스에서의 추출율을 측정한 뒤.

| # | 작업 | 내용 | 결정 기준 |
|---|------|------|----------|
| 3.1 | **Stage 2 소비 프로토콜 정교화** | IR 필드별 소비 순서 + 우선순위. Phase 3의 IR 확장이 정당한지 판단하는 기준 | Phase 2 운영에서 Stage 2의 IR 필드 활용 패턴 관찰 |
| 3.2 | **문서 기반 보조 입력** | JavaDoc 태그 → Stage 1 확장(`ParsedModule.doc_tags`), 자연어 → Stage 2 보조 입력(`DocumentationHints`) | 코드 주석이 풍부한 코드베이스에서 추출율 개선 효과 측정 |
| 3.3 | **테스트 명세 추출** | `TestEvidenceExtract` 별도 보조 입력. `source_kind: "production" \| "test"` 필드. 테스트 커버리지 낮은 코드베이스 graceful degradation | 테스트 코드에서 발견되는 비즈니스 규칙의 양과 질 측정 |
| 3.4 | **추가 코드베이스 검증** | podo-ontology 외 2~3개 코드베이스에서 카테고리별 추출율 검증. 현재 수치의 일반화 가능성 확인 | Phase 2 완료 후 |

---

## 작업 의존 관계 (DAG)

```
Phase 1 ✅
  1.1 → 1.2 → 1.4 → 1.5 → 1.6 → 1.7/1.8/1.9
  1.1 → 1.3 ┘

Phase 2a (다음)
  Phase 1 → 2.1 (프로토콜 — 2.2~2.4의 설계 기준)
  Phase 1 → 2.2 → 2.3
                 → 2.4

Phase 2b
  2.1 + C → 2.5
  Phase 1 → 2.6
  2.3(F)  → 2.7

Phase 2c (독립)
  1.2 → 2.8

Phase 3 (운영 후)
  3.1 → 3.2, 3.3, 3.4
```

---

## 수치 요약

| Phase | 목표 | 작업 수 | 상태 |
|:-----:|------|:------:|:----:|
| 1 | 0% → ~88% | 9건 | ✅ 완료 |
| 2a | ~88% → ~93% | 4건 | 다음 |
| 2b | ~93% → ~95% | 3건 | 대기 |
| 2c | 다중 언어 | 1건 | 독립 착수 가능 |
| 3 | 운영 후 결정 | 4건 | 보류 |
| **합계** | | **21건** | **9건 완료, 12건 잔여** |
