# Ontology-Guided Selection Boundary — Runtime와 에이전트 책임 분리

> 상태: **설계 초안** — Repo Review findings #2, #3 대응 (2026-04-05)
> 선행: `ontology-guided-constraint-discovery.md`, `docs/agent-protocol/start.md`

---

## 1. 배경

Repo review에서 ontology-guided code selection 경로에 두 가지 문제가 확인되었다.

1. runtime이 brief를 읽지 않고, ontology glossary 전체를 `keywords`처럼 사용해 `queryOntology()`를 호출한다.
2. runtime이 소스의 역할을 명시 계약이 아니라 경로/URL 문자열 휴리스틱으로 추정한다.

현재 `src/commands/start.ts`의 grounding 후반부는 다음을 한 번에 수행한다.

1. `path.includes("ontology")` / `url.includes("ontology")`로 ontology source를 추정
2. YAML 3종(`code-mapping.yaml`, `behavior.yaml`, `model.yaml`)을 로드
3. glossary 전체에서 키워드를 생성
4. `queryOntology()` → `resolveCodeLocations()` → `collectRelevantChunks()`를 실행해 `build/relevant-chunks.json`을 생성

이 구현은 `docs/agent-protocol/start.md`의 계약과 다르다. 프로토콜은 다음 순서를 요구한다.

1. 에이전트가 `brief.md`에서 도메인 키워드를 추출
2. 추출된 키워드로 `queryOntology()` 호출
3. `resolveCodeLocations()` / `collectRelevantChunks()` 수행

즉, 현재 문제는 단순 버그가 아니라 **runtime과 에이전트의 책임 경계가 흐려진 상태**다.

---

## 2. 문제 정의

### 2.1. Finding #2 — runtime이 relevance를 대신 판단한다

glossary 전체를 키워드로 사용하면 `queryOntology()` 결과는 "이번 brief와 관련된 엔티티"가 아니라 "이 ontology에 존재하는 거의 모든 엔티티"에 가까워진다.

이 문제의 본질은 검색 품질이 아니라 책임 경계다.

- **brief에서 어떤 용어가 중요한지 선택**하는 일은 의미 판단이다.
- **이번 변경과 관련된 ontology entity를 고르는 일**도 의미 판단이다.
- runtime이 해야 할 일은 이런 판단이 아니라, 주어진 입력이 구조적으로 유효한지 확인하는 것이다.

따라서 `start` 단계에서 runtime이 `relevant-chunks.json`을 미리 만드는 현재 흐름은 원칙 위반이다.

### 2.2. Finding #3 — runtime이 source role을 추정한다

현재 구현은 소스의 역할을 다음 방식으로 판정한다.

- `add-dir` 경로에 `"ontology"` 문자열이 포함되어 있으면 ontology source로 간주
- `github-tarball` URL에 `"ontology"` 문자열이 포함되어 있으면 ontology source로 간주
- tarball에서는 repo root의 `code-mapping.yaml`, `behavior.yaml`, `model.yaml`만 fetch

이 방식은 세 가지 문제가 있다.

1. **역할 추론**이다. runtime이 소스의 의미를 추측하고 있다.
2. **중첩 경로에 취약**하다. `sources/domain/` 아래 YAML이 있어도 놓칠 수 있다.
3. **tarball 재현성이 약하다**. 현재 `github-tarball`은 `HEAD`를 대상으로 받고, 추출한 임시 디렉터리는 곧바로 삭제된다.

이 문제도 본질적으로는 "더 똑똑한 휴리스틱"으로 해결할 대상이 아니다. source role은 추정이 아니라 **명시 계약**이어야 한다.

---

## 3. 설계 원칙

### 3.1. Runtime의 역할

runtime은 다음만 수행한다.

- 명시된 source 계약을 검증
- ontology 파일의 존재와 구조를 검증
- 결정론적인 파싱/인덱싱 수행
- 재현 가능한 manifest를 생성
- 실패를 warning/skip으로 기록하고 grounding 자체는 유지

### 3.2. 에이전트의 역할

에이전트는 다음을 수행한다.

- brief 해석
- 도메인 키워드 선택
- ontology relevance 판단
- 0건 매칭 시 fallback 전략 결정
- `relevant-chunks.json` 생성

### 3.3. 금지 원칙

다음은 runtime에서 수행하지 않는다.

- brief 기반 키워드 추출
- glossary 전체를 이용한 relevance 대체 판단
- grounding 단계에서의 `queryOntology()` 호출
- grounding 단계에서의 `relevant-chunks.json` 생성
- 경로명/URL 문자열 기반 ontology source 추정

---

## 4. 결정

### 4.1. `start` runtime은 ontology를 "준비"만 한다

`/start`의 ontology 관련 책임은 다음으로 축소한다.

1. ontology source가 **명시적으로 선언되었는지** 확인
2. 선언된 source 안에서 ontology 파일 3종의 위치를 결정론적으로 해석
3. YAML을 읽고 `buildOntologyIndex()`가 성공하는지 검증
4. 결과를 `build/ontology-manifest.json`에 기록

여기서 종료한다. relevance query는 수행하지 않는다.

### 4.2. ontology-guided selection은 agent protocol 단계로 이동한다

`docs/agent-protocol/start.md`의 기존 절차를 구현 기준으로 승격한다.

1. 에이전트가 `brief.md`에서 키워드를 추출
2. manifest를 읽어 ontology bundle을 로드
3. `queryOntology(index, keywords)` 호출
4. `resolveCodeLocations()` / `collectRelevantChunks()` 수행
5. `build/relevant-chunks.json` 기록

즉, `build/relevant-chunks.json`은 더 이상 grounding의 자동 산출물이 아니라, **에이전트가 선택적으로 생성하는 분석 산출물**이 된다.

---

## 5. Source 계약 제안

### 5.1. `SourceEntry`에 content role을 추가한다

현재 `type`은 transport를 의미한다 (`add-dir`, `github-tarball`, `figma-mcp` 등). ontology 여부는 transport가 아니라 content role에 속한다.

제안:

```ts
type ContentRole = "reference" | "ontology_bundle";

type SourceEntry =
  | {
      type: "add-dir";
      path: string;
      description?: string;
      usage_hint?: "grounding_only" | "context" | "full";
      content_role?: ContentRole;
      ontology_files?: {
        code_mapping?: string;
        behavior?: string;
        model?: string;
      };
    }
  | {
      type: "github-tarball";
      url: string;
      ref?: string;
      description?: string;
      usage_hint?: "grounding_only" | "context" | "full";
      content_role?: ContentRole;
      ontology_files?: {
        code_mapping?: string;
        behavior?: string;
        model?: string;
      };
    };
```

의도는 단순하다.

- `type`: 어디서 읽는가
- `usage_hint`: 언제 읽는가
- `content_role`: 무엇이 들어있는가

### 5.2. `content_role: ontology_bundle`가 선언된 source만 ontology 준비 대상으로 본다

명시 계약이 없는 source는 ontology pipeline의 입력으로 간주하지 않는다.

이 결정은 다음을 방지한다.

- `includes("ontology")` 같은 문자열 추측
- 온톨로지와 일반 레퍼런스 소스의 혼동
- 런타임이 더 많은 휴리스틱을 계속 축적하는 현상

### 5.3. `ontology_files`는 override이고, exact filename 탐색은 fallback이다

`content_role: ontology_bundle`인 source에서 파일 위치를 정하는 순서는 다음과 같다.

1. `ontology_files`가 있으면 그 경로를 사용
2. 없으면 source 내부에서 exact filename 3종을 탐색
3. 탐색 결과가 1:1로 확정되지 않으면 manifest를 `invalid`로 기록하고 agent fallback으로 넘김

이 fallback은 **결정론적 파일 탐색**이므로 허용된다. 중요한 점은 "이 source가 ontology인가?"를 추정하는 것이 아니라, **이미 ontology로 선언된 source 안에서 파일을 찾는 것**이라는 점이다.

---

## 6. Runtime 산출물 제안: `ontology-manifest.json`

### 6.1. 목적

runtime은 ontology를 해석해 agent에게 건네줄 수 있는 **기계적 사실**만 남긴다.

- 어떤 source가 ontology bundle인가
- 어떤 파일이 사용되었는가
- 파싱이 성공했는가
- index의 기본 규모는 어떠한가

### 6.2. 예시 구조

```json
{
  "version": 1,
  "generated_at": "2026-04-05T12:00:00.000Z",
  "source": {
    "key": "github-tarball:https://github.com/acme/platform",
    "type": "github-tarball",
    "content_role": "ontology_bundle",
    "url": "https://github.com/acme/platform",
    "ref": "3e91d4b"
  },
  "files": {
    "code_mapping": "ontology/code-mapping.yaml",
    "behavior": "ontology/behavior.yaml",
    "model": "ontology/model.yaml"
  },
  "status": "ready",
  "index_summary": {
    "glossary_entries": 65,
    "actions": 166,
    "transitions": 10
  },
  "warnings": []
}
```

### 6.3. status 의미

- `ready`: ontology bundle을 agent가 바로 사용할 수 있음
- `missing_files`: 선언은 되었으나 필수 YAML이 부족함
- `invalid`: YAML 구조나 index 구축이 실패함

### 6.4. `relevant-chunks.json`과의 구분

- `ontology-manifest.json`: runtime 산출물, 결정론적, 구조 검증 결과
- `relevant-chunks.json`: agent 산출물, brief 해석 이후 생성되는 relevance 결과

---

## 7. `github-tarball` 제약과 해결 방향

현재 `scanTarball()`은 tarball을 임시 디렉터리에 풀고, 스캔 후 즉시 삭제한다. 따라서 manifest가 local file path를 직접 가리키면 agent가 나중에 재사용할 수 없다.

이 제약 때문에 `github-tarball`에는 추가 계약이 필요하다.

### 7.1. `ref`를 명시적으로 지원한다

`github-tarball` source는 `ref`를 받을 수 있어야 한다.

```yaml
default_sources:
  - type: github-tarball
    url: https://github.com/acme/platform
    ref: 3e91d4b
    content_role: ontology_bundle
```

효과:

- grounding과 이후 agent fetch가 같은 revision을 본다
- default branch drift를 줄인다

### 7.2. `ref`가 없으면 runtime이 concrete revision을 manifest에 기록한다

호출 입력이 `HEAD`여도 runtime은 내부적으로 concrete revision을 해석해 manifest에 남겨야 한다. 그렇지 않으면 agent가 나중에 다른 YAML을 읽을 위험이 있다.

### 7.3. tarball ontology 파일 fetch는 "발견된 상대 경로" 기준이어야 한다

repo root에 `contents/code-mapping.yaml`를 가정하지 않는다. scan 결과에서 발견된 상대 경로를 manifest에 기록하고, 이후 fetch도 그 경로를 사용한다.

---

## 8. 실행 흐름

### 8.1. Runtime (`/start`)

```text
resolve sources
  -> scan sources
  -> pick sources with content_role == ontology_bundle
  -> resolve ontology file paths
  -> buildOntologyIndex() for validation
  -> write build/ontology-manifest.json
  -> grounding.completed
```

### 8.2. Agent protocol

```text
read brief.md
  -> extract domain keywords
  -> read ontology-manifest.json
  -> if status != ready: fallback exploration
  -> load ontology YAML by manifest
  -> queryOntology(index, keywords)
  -> if 0 matches: fallback exploration
  -> resolveCodeLocations()
  -> collectRelevantChunks()
  -> write build/relevant-chunks.json
```

이 구조에서 runtime은 preparation만, agent는 interpretation만 담당한다.

---

## 9. 대안 검토

### 대안 A. runtime이 glossary 전체로 계속 `queryOntology()`를 수행

기각한다.

- brief relevance를 runtime이 대신 판단하게 된다
- protocol 문서와 구현이 계속 어긋난다
- `relevant-chunks.json`의 의미가 약해진다

### 대안 B. 현재 휴리스틱을 유지하되 더 많은 문자열 패턴을 추가

기각한다.

- source role 추정 문제를 악화시킨다
- 예외 케이스가 계속 누적된다
- config contract보다 이름 규칙이 우선하는 구조가 된다

### 대안 C. ontology bundle을 무조건 repo root 고정 파일명으로 강제

기각한다.

- nested path를 가진 실제 레포를 수용하지 못한다
- tarball/monorepo 구조에 약하다

---

## 10. 영향 범위

### 10.1. 타입/설정

- `src/kernel/types.ts`
- `src/config/project-config.ts`
- `src/config/project-config.test.ts`
- `README.md`

### 10.2. runtime

- `src/commands/start.ts`
- `src/scanners/scan-tarball.ts`
- 필요 시 manifest helper 신규 모듈

### 10.3. 프로토콜/문서

- `docs/agent-protocol/start.md`
- `dev-docs/design/ontology-guided-constraint-discovery.md`

### 10.4. 테스트

- ontology source declaration 파싱 테스트
- nested ontology file resolution 테스트
- tarball `ref`/manifest 테스트
- `relevant-chunks.json`가 grounding에서 자동 생성되지 않음을 확인하는 회귀 테스트

---

## 11. 단계적 도입안

### Phase 1 — 계약 추가, 휴리스틱 deprecated

- `content_role`, `ontology_files`, `ref` 도입
- explicit ontology source가 있으면 새 경로 사용
- 기존 휴리스틱 경로는 warning과 함께 유지 가능

### Phase 2 — runtime relevance 제거

- `start`에서 `queryOntology()` / `collectRelevantChunks()` 호출 제거
- `ontology-manifest.json`만 남김

### Phase 3 — 휴리스틱 제거

- `includes("ontology")` 기반 경로 완전 제거
- protocol/README를 explicit contract 중심으로 정리

---

## 12. Out of Scope

이번 설계는 다음을 다루지 않는다.

- ontology query 알고리즘 자체 변경
- `queryOntology()`의 랭킹/precision 개선
- auto-generation Stage 1/Stage 2 파이프라인 재설계
- 에이전트의 키워드 추출 프롬프트 상세

---

## 13. 권장 결론

이슈 #2와 #3은 "start 쪽 로직 보정"으로 처리할 문제가 아니다. ontology-guided selection을 runtime 기능으로 계속 붙들고 있으면, runtime이 의미 판단을 계속 떠맡게 된다.

권장안은 다음 한 줄로 요약된다.

> runtime은 ontology bundle의 존재와 구조를 검증한 뒤 manifest만 남기고, brief relevance와 code selection은 agent protocol이 수행한다.
