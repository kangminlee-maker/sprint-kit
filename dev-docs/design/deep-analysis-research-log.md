# Deep Analysis 리서치 로그

> 2026-03-20 ~ 2026-03-22. RLM 기반 Deep Analysis PoC → 5차 Panel Review → 방향 전환 결정.

## 1. 배경

기존 패턴 매칭 스캐너는 구조 정보(API, schema, import)만 추출하며, 비즈니스 로직 수준의 제약(예: "체험 수업 완료 판정이 anyMatch로 1회만 확인")은 발견하지 못한다.

## 2. RLM PoC 결과

### 무엇을 했는가

RLM(Recursive Language Models, alexzhang13/rlm)을 사용하여 대형 레포의 비즈니스 로직 제약을 LLM 재귀 탐색으로 발견하는 PoC를 진행했다.

### PoC 성과

- sprint-kit src/ (98파일): 172초, 15개 제약 발견
- podo-backend (1,552파일): 271초, 10개 제약 발견
- **부가 가치 60%** — 10개 중 6개는 기존 스캐너로 발견 불가능
- 발견된 제약: anyMatch 버그, 가격 하드코딩, 단일 티켓 검증, 언어별 제한 정책 등

### 시스템 통합 시도

- `src/commands/deep-analysis.ts`: TypeScript 측 Python 프로세스 spawn + Zod 검증
- `scripts/deep-analysis.py`: RLM 실행 엔트리포인트
- `DiscoveryStage`에 `"deep_analysis"` 추가, `DeepAnalysisCompletedPayload` 정의
- 5차례 8-Agent Panel Review로 설계 검증

### 해결하지 못한 문제

1. **RLM 추가 파라미터가 동작을 변경**: `custom_tools`, `max_tokens`, `max_timeout`, `compaction` 등을 추가하면 iteration 시간이 대폭 증가하고 결과가 0개로 떨어짐. PoC에서 작동한 최소 설정(파라미터 없이 max_iterations만)으로만 동작.
2. **결과 안정성**: 동일 입력에 대해 실행마다 다른 제약 집합이 발견됨 (비결정론적).
3. **context 폭주 방어 부재**: 30 iteration 동안 message_history가 누적되면 context window 초과 가능. RLM의 compaction을 활성화하면 동작이 변경되어 결과가 나오지 않음.
4. **save_constraint() custom_tools 미작동**: 단독 테스트에서는 동작하나, 실제 분석 세션에서 모델이 호출하지 않음.

## 3. Panel Review 주요 결론

### 1차 Review: PoC 설계안 (8/8 합의)
- RLM은 "새로운 스캐너"가 아니라 "Discovery Depth의 확장"
- scanners/ 계층이 아닌 commands/ 후처리로 배치

### 2차 Review: 통합 설계 문서
- deep_analysis.completed 이벤트 신설 (grounding.completed에서 usage 분리)
- constraint_id에서 index 제거 → perspective + summary hash
- DeepAnalysisError 별도 타입

### 3차 Review: 컨텍스트 폭주
- budget_warning_tokens dead config (선언만 있고 사용 코드 없음)
- compaction + max_tokens 미설정 → context overflow 비제어
- proc.killed 판정 버그

### 4차 Review: RLM 라이브러리 분석
- persistent + 다중 completion은 RLM 공식 지원 패턴
- save_constraint() 클로저 변수는 Python 힙에 존재하여 RLM과 무관하게 유지
- E2E 실패 근본 원인: stdout 오염 (RLM REPL 출력과 최종 JSON이 섞임)
- **Philosopher 판정**: persistent + 다중 completion 도입은 현재 불필요. stdout 격리만으로 충분.

### 5차 Review: RLM 사용 패러다임 재검토
- **"RLM을 잘못 사용하고 있다"는 주장 기각 (7/7)**
- 현재 방식(메타데이터 context + open() 선택적 접근)은 RLM 설계 의도에 부합
- "소스코드를 context로 전달"은 물리적으로 불가능 (15MB = 3.75M 토큰, API 한도 18.8배 초과)
- RLM 논문 성공 사례(정보 검색)와 우리 과제(의미 추론)는 다른 유형

## 4. 광범위 리서치 결과 (2026-03-22)

### 대형 코드베이스 분석 접근법

| 접근법 | 비즈니스 로직 적합도 | 안정성 | 비용 |
|--------|---------------------|--------|------|
| RLM (현재) | 중 | **낮음** | ~$0.50 |
| SAST+LLM 하이브리드 (Semgrep) | **높음** | **높음** | ~$0.50 |
| 의존성 클러스터+LLM (Ripple, ICSE 2026) | **높음** | 중-높 | ~$0.60 |
| GraphRAG (심볼 그래프) | **높음** | 중-높 | ~$1.00 |
| LLMap (파일별 Map-Reduce) | 중 | 중 | ~$0.21 |

핵심 교훈:
- **Semgrep**: 순수 LLM 단독 88% false positive → 결정론적 분석 + LLM 하이브리드 39%
- **Ripple**: 의존성 클러스터로 LLM 추론 범위를 한정하면 F1 39.7% 향상
- **ToCS**: belief state 외재화(구조화된 JSON 기록)가 성능 13.8 F1pt 향상

### 온톨로지 기반 코드 RAG

핵심 발견: **"비즈니스 도메인 용어 ↔ 코드 식별자" 자동 매핑은 미해결 gap**

| 발견 | 출처 | 시사점 |
|------|------|--------|
| 온톨로지 RAG가 사실 재현율 55% 증가 | OG-RAG (EMNLP 2025) | 도메인 온톨로지가 있으면 검색 정밀도 극적 향상 |
| GraphRAG가 멀티홉 추론에서 벡터 RAG 대비 3.4배 | RAG vs GraphRAG 평가 | 관계 추론에는 그래프 기반이 필수 |
| 텍스트 유사도로 못 찾는 cross-file 증거를 62%에서 발견 | Neo4j + LLM (Infosys) | 그래프 확장이 누락 방지에 핵심 |
| CodeGraphContext: 14개 언어, MCP 통합 완료 | 오픈소스 | Sprint Kit에 즉시 연결 가능 |

Sprint Kit이 이미 보유한 인프라:
- `glossary.yaml`: canonical 용어 → code_entity, db_table, fk_variants (= "bridges")
- `actions.yaml`: 도메인 액션 → source_code (= 코드 위치)
- `transitions.yaml`: 상태 전이 → trigger + source_code

## 5. 현재 기준 결론

### RLM에 대한 판정

RLM은 "대량 텍스트에서 정보를 찾는 도구"로 설계되었으며, PoC에서 비즈니스 로직 제약 발견 가능성을 입증했다. 그러나 시스템 통합 시 다음 한계가 확인되었다:

1. **파라미터 민감성**: 최소 설정에서만 동작하고, 추가 제어(토큰 제한, 타임아웃, custom tools)를 붙이면 동작이 변경됨
2. **비결정론성**: 동일 입력에 다른 결과. 이벤트 소싱 시스템에서 재현 불가능한 발견은 신뢰성 문제
3. **과제 유형 불일치**: RLM의 검증된 영역(정보 검색)과 우리 과제(의미 추론)가 다름

### 다음 방향: 온톨로지 유도 제약 발견 (Ontology-Guided Constraint Discovery)

> 6차 Panel Review (2026-03-22) 즉시 조치 3건 반영.

RLM의 "LLM이 어떤 파일을 읽을지 스스로 판단"하는 비결정론적 탐색 대신, **온톨로지가 관련 코드를 결정론적으로 선별**하고, **에이전트가** 선별된 코드에서 제약을 추론하는 구조.

```
1단계: brief → 온톨로지 키워드 추출 (비결정론적 — LLM 또는 규칙 기반)
2단계: 키워드 → 온톨로지 매칭 → 코드 위치 (결정론적)
3단계: 코드 위치 → 호출 그래프 1-2 hop 확장 → 관련 코드 청크 (결정론적)
4단계: 관련 코드 청크 → 에이전트 프로토콜에 전달 → 에이전트가 제약 추론 (에이전트 위임)
```

**6차 Panel Review 즉시 조치 반영**:

1. **"결정론적" 주장 정정**: 1단계(brief→keywords)만 비결정론적이고, 2단계 이후는 결정론적입니다. RLM(전 단계가 비결정론적)과의 차이가 여기에 있습니다.

2. **온톨로지 매칭 0건 시 fallback**: `queryOntology()`가 0건 반환 시 기존 패턴 매칭 스캐너(`ScanResult`)로 fallback합니다. 코드 주석에 이미 명시(`ontology-query.ts` 46행).

3. **4단계 실행 주체: 에이전트 프로토콜 위임**: Sprint Kit 런타임이 LLM API를 직접 호출하지 않습니다. 1~3단계(결정론적 코드 선별)만 코드로 구현하고, 선별된 코드 청크를 에이전트에게 전달합니다. 이렇게 하면 "탐지는 코드, 판정은 에이전트" 원칙이 유지됩니다.

**장점**:
- **비결정론적 경계를 1단계로 한정**: 2단계 이후 동일 입력에 동일 코드 청크 (재현 가능)
- **Semgrep 교훈 적용**: 결정론적 필터 + 에이전트 추론 = false positive 감소
- **기존 원칙 유지**: 런타임 ≠ 추론 엔진
- **비용 예측 가능**: 코드 청크 수에 비례

**적용 조건**: 모든 scope에 무조건 적용하는 기반이 아닙니다. "brief 용어와 코드 식별자가 불일치하고, 관련 코드가 여러 모듈에 분산된 경우"에 가치가 발생합니다.

**기존 인프라 구분**:
- 파서 코드(있음): `ontology-index.ts`, `ontology-query.ts`, `buildOntologyIndex()`, `queryOntology()`
- 데이터(프로젝트별): glossary/actions/transitions YAML은 대상 프로젝트에 작성되어야 함. 자동 생성은 미해결 과제.

**실제 코드 도달 경로 (onto_semantics 검증 반영)**:
- `GlossaryEntry.code_entity`: queryOntology()에서 직접 사용되지 않음. 참고용 동의어.
- **실제 브릿지**: `ActionEntry.source_code`와 `TransitionEntry.source_code`가 코드 위치를 제공.
- 미해결: `source_code` 문자열(예: `"PodoScheduleServiceImplV2.match()"`)을 실제 파일 경로로 해석하는 resolution 로직.

### 다음 단계

구현 설계: `dev-docs/design/ontology-guided-constraint-discovery.md`

### 보존할 산출물

- `dev-docs/design/rlm-deep-analysis-integration.md`: RLM 통합 설계 문서 (Panel Review 5차 반영)
- `dev-docs/design/ontology-guided-constraint-discovery.md`: 구현 설계 (6차 Panel Review 기반)
- 이 파일 (`dev-docs/design/deep-analysis-research-log.md`): 작업 과정 + 리서치 결과 + 결론
