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
  # ── Code ──
  - type: github-tarball          # GitHub 레포를 tarball로 다운로드
    url: https://github.com/org/backend
    description: 백엔드 소스

  - type: add-dir                 # 로컬 파일 또는 디렉토리
    path: ./src
    description: 프론트엔드 소스

  # ── Policy ──
  - type: github-tarball
    url: https://github.com/org/ontology
    description: 도메인 모델 (온톨로지)

  - type: add-dir
    path: ./scopes/terms-of-service.md
    description: 서비스 이용약관

  - type: obsidian-vault           # Obsidian vault 디렉토리
    path: /vaults/company-docs
    description: 회사 정책 문서

  # ── Design ──
  - type: figma-mcp               # Figma 파일 (MCP로 조회)
    file_key: xxxxx
    description: 디자인 시스템
```

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

## 실행 순서

`/start {projectName}` 실행 시, scope 폴더와 이벤트 로그 상태에 따라 3가지 경로 중 하나로 분기합니다.

### 경로 판별

```
scopesDir/{projectName}-{YYYYMMDD}-* 폴더가 존재하는가?
├─ 없음 → Path A (신규)
└─ 있음 → events.ndjson이 비어있거나 없는가?
    ├─ 예 → Path B (brief 작성 완료 후 첫 grounding)
    └─ 아니오 → Path C (재개)
```

---

### Path A — 신규 (폴더 없음)

scope 폴더를 생성하고 brief 템플릿을 만듭니다. grounding은 실행하지 않습니다.

```typescript
import { generateScopeId } from "src/kernel/scope-manager";
import { createScope } from "src/kernel/scope-manager";

const scopeId = generateScopeId(scopesDir, projectName);
const paths = createScope(scopesDir, scopeId, {
  projectName,
  defaultSources,  // .sprint-kit.yaml에서 로드한 소스 목록 (선택)
});
```

- `scopeId`: `{projectName}-{YYYYMMDD}-{NNN}` 형식 (예: tutor-block-20260309-001)
- `YYYYMMDD`: scope 생성 날짜
- `NNN`: 같은 날짜+프로젝트명 조합에서 순차 부여 (001부터)

#### brief.md 자동 생성

`createScope`는 `inputs/brief.md` 템플릿을 자동으로 생성합니다.
- 변경 목적, 대상 사용자, 기대 결과 등 필수 항목을 포함
- `.sprint-kit.yaml`의 `default_sources`가 있으면 소스 목록을 자동으로 채움
- 이미 `brief.md`가 존재하면 덮어쓰지 않음 (멱등성 보장)

#### 사용자 안내

다음 내용을 사용자에게 표시합니다:

> `scopes/{scopeId}/inputs/brief.md`가 생성되었습니다.
>
> 다음 필수 항목을 작성한 후 `/start {projectName}`을 다시 실행해 주세요:
> - **변경 목적** — 무엇을 왜 변경하는가
> - **대상 사용자** — 이 변경의 영향을 받는 사용자
> - **기대 결과** — 변경이 성공하면 달라지는 것

**이벤트 기록 없음** — `scope.created`는 Path B에서 기록합니다.

---

### Path B — brief 작성 완료 (폴더 있음 + events.ndjson 없거나 비어있음)

brief를 검증하고, 통과하면 grounding을 실행합니다.

#### B-1. 경로 확인

```typescript
import { resolveScopePaths } from "src/kernel/scope-manager";

const paths = resolveScopePaths(scopesDir, scopeId);
```

#### B-2. brief.md 검증

필수 항목이 채워져 있는지 확인합니다. (검증 기준은 아래 "Brief 검증 규칙" 참조)

- 비어있는 필수 항목이 있으면 → 안내 후 중단:
  > "다음 필수 항목이 비어 있습니다: {목록}. 작성 후 다시 실행해 주세요."
- 모든 필수 항목이 채워져 있으면 → 계속 진행

#### B-3. brief.md에서 정보 추출

```
title       ← 변경 목적에서 핵심 명사구 추출
description ← 변경 목적 + 기대 결과 합성
추가 소스    ← "추가 소스" 섹션에서 체크된 항목 파싱
```

#### B-4. 소스 수집

`.sprint-kit.yaml`의 `default_sources` + brief.md 추가 소스 + CLI 인자를 병합합니다.
- 중복 제거 키: `{type}:{identifier}` (예: `add-dir:./src`, `github-tarball:https://...`)
- 결과는 `inputs/sources.yaml`에 기록

#### B-5. scope.created 이벤트 기록

```typescript
import { appendScopeEvent } from "src/kernel/event-pipeline";

appendScopeEvent(paths, {
  type: "scope.created",
  actor: "user",
  payload: { title, description, entry_mode },
});
```

- `entry_mode`: 사용자가 지정하지 않으면 `"experience"` 기본값

#### B-6. Grounding 이후 단계 실행

아래 "공통 실행 단계" (Step 2~7)를 실행합니다.

---

### Path C — 재개 (폴더 있음 + events.ndjson에 이벤트 있음)

이벤트 로그를 읽어 현재 상태를 확인하고, 상태에 맞는 안내를 제공합니다.

```typescript
import { readEvents } from "src/kernel/event-store";
import { reduce } from "src/kernel/reducer";

const events = readEvents(paths.events);
const state = reduce(events);
```

#### 상태별 동작

| 현재 상태 | 동작 |
|-----------|------|
| `draft` (grounding 미완료) | brief.md 검증 → 소스 재스캔. `grounding.started`가 이미 있으면 스캔만 재실행 (Step 2부터) |
| `grounded` (exploration 미시작) | "Align Packet이 아직 생성되지 않았습니다. 계속 진행합니다." → Step 4~7 실행 |
| `grounded` (exploration 진행 중) | `build/exploration-log.md`를 읽어 마지막 Phase와 합의 내용을 확인한 뒤, "Phase {N} 진행 중입니다. {M}개 시나리오 완료. 이어서 진행합니다." → `exploration.md` 프로토콜로 진입 |
| `align_proposed` | "Align Packet이 대기 중입니다. `/align`으로 결정해 주세요." |
| `align_locked` 이상 | "현재 `{state}` 상태입니다. `/draft`로 진행해 주세요." |
| `closed` / `deferred` / `rejected` | "이 scope는 종료되었습니다. 새 scope를 만드시려면 다른 이름으로 `/start`를 실행해 주세요." |

---

### Recovery Paths

#### grounded 이상에서 소스 변경 감지 시

`snapshot.marked_stale` 경로를 사용합니다. `grounded` 상태에서 self-transition을 허용하여, 소스를 재스캔하고 snapshot을 갱신합니다.

#### scope.created 후 grounding 실패 시

Path C의 `draft` 상태로 재진입합니다. brief 검증 → 소스 재스캔을 수행합니다.

---

### Brief 검증 규칙

필수 항목: **변경 목적**, **대상 사용자**, **기대 결과**

판단 기준:
- 해당 섹션의 `<!-- -->` 주석 아래에 공백이 아닌 텍스트가 1줄 이상 있으면 → **채워짐**
- 빈 줄만 있거나 주석만 있으면 → **비어있음**

---

## 공통 실행 단계 (Step 2~7)

Path B (B-6 이후) 또는 Path C (상태에 따라)에서 아래 단계를 실행합니다.

### 2. 소스 스캔 (Grounding)

사용자가 지정한 소스를 읽고, 3개 관점에서 현재 상태를 파악합니다.

**스캔 진행 피드백:** 각 소스 처리 전에 사용자에게 진행 상태를 안내합니다:
- "소스 스캔을 시작합니다 (N개 소스)"
- 소스별: "{description} 스캔 중 ({순서}/{전체})..." (예: "백엔드 소스 스캔 중 (1/4)...")
- 완료: "소스 스캔 완료 (파일 {N}개, constraint {M}건 발견)"

```typescript
appendScopeEvent(paths, {
  type: "grounding.started",
  actor: "system",
  payload: { sources: [{ type, path_or_url }] },
});
```

#### 소스 접근 방법

| 소스 유형 | 접근 방법 |
|-----------|----------|
| `--add-dir` | 파일 시스템에서 직접 읽기 |
| `github-tarball` | URL에서 다운로드 후 파싱 |
| `figma-mcp` | MCP 서버를 통해 Figma 데이터 조회 |
| `obsidian-vault` | 파일 시스템에서 마크다운 파일 읽기 |

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
appendScopeEvent(paths, {
  type: "constraint.discovered",
  actor: "system",
  payload: {
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
  },
});
```

### 3. Grounding 완료 기록

```typescript
appendScopeEvent(paths, {
  type: "grounding.completed",
  actor: "system",
  payload: {
    snapshot_revision: 1,
    source_hashes: { [path]: contentHash(content) },
    perspective_summary: { experience: N, code: N, policy: N },
  },
});
```

`source_hashes`: 각 소스의 content hash를 기록합니다. 이후 stale 감지에 사용됩니다.

### 4. Constraint 발견 기록

**이벤트 기록 순서 (필수):**

`constraint.discovered`는 `grounded` 상태 이후에만 허용됩니다. 반드시 `grounding.completed`를 **먼저** 기록한 뒤 constraint를 기록하세요. 순서가 뒤바뀌면 상태 기계가 이벤트를 거부하며, 거부 시 `{ success: false, current_state, rejected_type }`이 반환됩니다.

```
올바른 순서: grounding.completed(→grounded) → constraint.discovered(×N) → align.proposed
잘못된 순서: constraint.discovered(draft 상태 → 거부됨) → grounding.completed
```

발견된 각 제약에 대해:

```typescript
appendScopeEvent(paths, {
  type: "constraint.discovered",
  actor: "system",
  payload: {
    constraint_id: "CST-001",  // scope 내 순차 부여
    perspective: "code",       // experience | code | policy
    summary: "한 줄 요약",
    severity: "required",      // required | recommended
    discovery_stage: "grounding",
    decision_owner: "product_owner",  // product_owner | builder
    impact_if_ignored: "처리하지 않으면 일어나는 일",
    source_refs: [{ source: "파일명", detail: "구체적 위치/내용" }],
  },
});
```

#### severity 판단 기준

- `required`: 이것 없이 기능 불능, 데이터 손실, 법규 위반, 보안 취약점
- `recommended`: 처리하면 더 좋지만 기능은 작동

#### decision_owner 판단 기준

- `product_owner`: 제품·사업 판단이 필요 (차단 한도, 약관 변경, 매칭 정책)
- `builder`: 구현 방식 판단이 필요 (DB 구조, API 설계, 인덱스 전략)

### 4.5. Exploration 진입 판별

Grounding 완료 후, brief의 상세도에 따라 exploration 진행 여부를 판별합니다.

| brief 상태 | 판별 | 다음 단계 |
|-----------|------|---------|
| brief 없음 또는 모든 필수 항목 비어 있음 | `entry_mode: "conversation"` | `exploration.md` 프로토콜로 진입 (Phase 1~6 전체) |
| 변경 목적만 채워짐 | `entry_mode: "brief_minimal"` | `exploration.md` 프로토콜로 진입 (Phase 1 확인 후 2~6) |
| 모든 필수 항목 채워짐 + 포함/제외 범위까지 명확 | `entry_mode: "brief_detailed"` | `exploration.md` 프로토콜로 진입 (Phase 1 재정위 후, 이미 결정된 부분 건너뜀) |

exploration 완료 후 Step 5(Align Packet 렌더링)로 진행합니다.
exploration에서 생성된 `build/exploration-log.md`의 Phase 6 결과가 AlignPacketContent의 입력이 됩니다.

상세 프로토콜: `docs/agent-protocol/exploration.md` 참조.

### 5. Align Packet 렌더링

```typescript
import { reduce } from "src/kernel/reducer";
import { readEvents } from "src/kernel/event-store";
import { renderAlignPacket } from "src/renderers/align-packet";

const state = reduce(readEvents(paths.events));

const content: AlignPacketContent = {
  user_original_text: "사용자 원문",
  interpreted_direction: "시스템이 해석한 방향 한 문장",
  proposed_scope: {
    in: ["포함할 기능 목록"],
    out: ["제외할 기능 목록"],
  },
  scenarios: ["시나리오 1: 행위자가 행동을 합니다..."],
  as_is: {
    experience: "Experience 관점 현재 상태 서술",
    policy: "Policy 관점 현재 상태 서술",
    code: "Code 관점 현재 상태 서술 (비즈니스 영향 중심)",
    code_details: "기술 상세 (Builder 참고용)",
  },
  tensions: [
    {
      constraint_id: "CST-001",
      what: "이것이 무엇인가",
      why_conflict: "왜 충돌하는가",
      scale: "변경 규모",
      options: ["선택지 (방향 판단에 필요한 경우만)"],
      details: "기술 상세 (<details> 안에 표시)",
    },
  ],
  decision_questions: [
    "위 범위(포함/제외)에 동의하십니까?",
    "이 N건의 충돌을 인지한 상태에서 이 방향으로 진행하겠습니까?",
  ],
};

const markdown = renderAlignPacket(state, content);
writeFileSync(join(paths.build, "align-packet.md"), markdown);
```

### 6. Align Proposed 이벤트 기록

```typescript
import { contentHash } from "src/kernel/hash";

appendScopeEvent(paths, {
  type: "align.proposed",
  actor: "system",
  payload: {
    packet_path: "build/align-packet.md",
    packet_hash: contentHash(markdown),
    snapshot_revision: 1,
  },
});
```

**반드시 파일을 먼저 쓰고, 해시를 계산한 뒤, 이벤트를 기록합니다.**

### 7. 사용자에게 Align Packet 제시

생성된 `build/align-packet.md`를 사용자에게 보여주고, `/align` 명령으로 결정을 요청합니다.

## 렌더링 규칙

- 기술 용어를 유지하고, 첫 등장 시 괄호 안에 설명
- 기술 상세는 `<details><summary>기술 상세 (Builder 참고용)</summary>` 안에 접기
- 비즈니스 영향 중심으로 서술
- "처리하지 않으면" 항목은 모든 constraint에 필수
- 포함/제외 테이블의 "동의하시나요?" 열은 렌더러가 자동 생성

## 오류 처리

렌더러가 에러를 throw하면 메시지에 수정 방법이 포함되어 있습니다. 메시지를 읽고 조치한 뒤 재시도하세요.
