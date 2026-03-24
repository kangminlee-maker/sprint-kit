# Ontology Auto-Generation — 통합 작업리스트

> 출처: `ontology-auto-generation.md` §11 + `ontology-auto-generation-improvements.md` §4
> 날짜: 2026-03-24

---

## Phase 1: Stage 1 완성 + 개선안 C/A/I/J (0% → ~88%)

> **핵심 가치**: cold start 해소. 수작업 YAML 없이도 코드베이스에서 온톨로지 YAML을 자동 생성.
> **LLM 불필요**. code_aliases만 있는 YAML 생성.

### 1단계: 타입 정의 + 기반

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 1.1 | `CodeStructureExtract` + `GeneratorInput` + `RelationCandidate` 타입 정의 | 없음 | `src/scanners/generators/types.ts` | 개선안 C 포함. 관계 데이터를 `RelationCandidate`로 일원화 |
| 1.2 | `ParserAdapter` 인터페이스 + ts-morph 어댑터 (TS/JS) | 1.1 | `parsers/ts-morph-adapter.ts` | `as const` 패턴 탐지 포함 (개선안 J) |
| 1.3 | 진입점 탐지기 | 1.1 | `generators/entry-point-detector.ts` | HTTP, Scheduled, EventListener, KafkaListener, batch, main |

### 2단계: 파이프라인 코어

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 1.4 | 호출 그래프 빌더 | 1.2, 1.3 | `call-graph-builder.ts` | 20-hop 제한, visited set 순환 방지 |
| 1.5 | 구조 추출기 | 1.4 | `structure-extractor.ts` | @Entity→EntityCandidate, enum→EnumCandidate, 상태할당→StateAssignment(id 합성), 매직넘버→PolicyConstantCandidate, @Embedded/@Inheritance→RelationCandidate (개선안 A), @Entity 전수 스캔 fallback (개선안 I) |
| 1.6 | YAML 생성기 (code_aliases만, v3 형식) | 1.5 | `yaml-generator.ts` | `meaning: ""` placeholder (Stage 2 실패 시 graceful degradation) |

### 3단계: 통합 + 검증

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 1.7 | YAML→소비 통합 테스트 | 1.6 | `yaml-consumer-integration.test.ts` | 생성 YAML → `buildOntologyIndex()` 통과 검증 |
| 1.8 | E2E 테스트 (Stage 1) | 1.6 | `e2e-stage1.test.ts` | 합성 코드 → CodeStructureExtract → YAML |
| 1.9 | gate-guard 규칙 추가 | 1.6 | `check-deps` 업데이트 | generators/↔ontology-*.ts 양방향 차단 |

### Phase 1 완료 기준
- [ ] 합성 Kotlin 코드(시뮬레이션 1)에서 glossary/actions/transitions YAML 자동 생성
- [ ] 생성된 YAML이 `buildOntologyIndex()` 통과
- [ ] sprint-kit 자체 코드에서 graceful degradation 정상 작동 (진입점 0건 → method: "none")
- [ ] gate-guard 규칙이 양방향 import 차단
- [ ] 테스트 전체 통과

---

## Phase 2a: 입력 범위 확장 (~88% → ~93%)

> Stage 2 에이전트 프로토콜 + 호출 그래프 도달 범위 확장.

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 2.1 | Stage 2 에이전트 프로토콜 설계 | Phase 1 | `docs/agent-protocol/ontology-generate.md` | DomainFlowSeed + domain_flows YAML 스키마 확장 포함 |
| 2.2 | 서비스 public 메서드 보조 진입점 (개선안 D) | Phase 1 | `entry-point-detector.ts` 확장 | 2-pass 처리. `EntryPoint.primary` 필드 추가 |
| 2.3 | 상태 변경 메서드 추적 심화 (개선안 F) | 2.2 | `call-graph-builder.ts` 확장 | changeStatus/updateStatus 관용 메서드 추적 |
| 2.4 | 설정 파일 스캔 (개선안 H) | 2.2 | `config-adapter.ts` 신규 | `GeneratorInput.config_files` 경로. yaml/properties/env 파서 |

### Phase 2a 완료 기준
- [ ] Stage 2 프로토콜 문서 작성 완료
- [ ] 보조 진입점(service_method)을 통해 추가 행위 탐지
- [ ] 상태 변경 메서드 내부의 상태 할당 추적
- [ ] application.yml에서 정책 상수 추출

---

## Phase 2b: Stage 2 프로토콜 적용 (~93% → ~95%)

> Stage 2 에이전트가 수행하는 의미 부여 + 추론 기반 보완.

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 2.5 | 공동 사용 패턴 관계 추론 (개선안 B) | 2.1, Phase 1(C) | Stage 2 프로토콜 규칙 | IR 미기록. Stage 2 내부 소비. `confidence_basis: "statistical"` |
| 2.6 | 비동기 호출 추적 (개선안 E) | Phase 1 | 파서 어댑터 확장 | `CallSite.kind: "async"` 추가 |
| 2.7 | enum 전이 가설 생성 (개선안 G) | 2.3(F) | `structure-extractor.ts` 확장 | `TransitionHypothesis` 별도 타입. Stage 2가 유효성 판정 |

### Phase 2b 완료 기준
- [ ] Stage 2 에이전트가 semantic_aliases, meaning, display_name 생성
- [ ] 비동기 호출이 "async"로 기록 (unresolved 대신)
- [ ] TransitionHypothesis → Stage 2 판정 → 유효 전이만 transitions.yaml에 포함

---

## Phase 2c: 다중 언어 지원

| # | 작업 | 의존성 | 산출물 | 비고 |
|---|------|--------|--------|------|
| 2.8 | tree-sitter 어댑터 (Kotlin/Java) | 1.2 | `parsers/tree-sitter-adapter.ts` | ParserAdapter 인터페이스 구현 |

---

## Phase 3: 운영 결과 관찰 후 결정

> **전제 조건**: Stage 2 소비 프로토콜 정의 (Philosopher 권장). IR 확장 전에 Stage 2가 어떤 필드를 어떤 순서로 소비하는지 정의해야 합니다.

| # | 작업 | 비고 |
|---|------|------|
| 3.1 | Stage 2 소비 프로토콜 정의 | Phase 3의 전제 조건. IR 필드별 소비 순서 + 우선순위 |
| 3.2 | 문서 기반 보조 입력 (§3.1) | JavaDoc 태그 → Stage 1 확장, 자연어 → Stage 2 보조 입력 |
| 3.3 | 테스트 명세 추출 (§3.2) | `TestEvidenceExtract` 별도 보조 입력. `source_kind` 필드 |
| 3.4 | 2~3개 추가 코드베이스 검증 | podo-ontology 외 코드베이스에서 카테고리별 추출율 검증 |

---

## 작업 의존 관계 요약 (DAG)

```
Phase 1:
  1.1 ──→ 1.2 ──→ 1.4 ──→ 1.5 ──→ 1.6 ──→ 1.7
  1.1 ──→ 1.3 ──┘                        ──→ 1.8
                                          ──→ 1.9

Phase 2a:
  Phase 1 ──→ 2.1
  Phase 1 ──→ 2.2 ──→ 2.3
                   ──→ 2.4

Phase 2b:
  2.1 + C ──→ 2.5
  Phase 1 ──→ 2.6
  2.3(F)  ──→ 2.7

Phase 2c:
  1.2 ──→ 2.8

Phase 3:
  3.1 ──→ 3.2, 3.3, 3.4
```

---

## 작업 수 요약

| Phase | 작업 수 | 예상 산출물 |
|:-----:|:------:|-----------|
| Phase 1 | 9건 | types.ts, ts-morph-adapter.ts, entry-point-detector.ts, call-graph-builder.ts, structure-extractor.ts, yaml-generator.ts, 테스트 3건, gate-guard |
| Phase 2a | 4건 | 프로토콜 문서, entry-point 확장, call-graph 확장, config-adapter |
| Phase 2b | 3건 | 프로토콜 규칙, 파서 확장, structure-extractor 확장 |
| Phase 2c | 1건 | tree-sitter-adapter |
| Phase 3 | 4건 | 소비 프로토콜, 문서 파싱, 테스트 추출, 검증 |
| **합계** | **21건** | |
