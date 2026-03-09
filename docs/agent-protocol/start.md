# /start Protocol

새로운 scope를 생성하고, 소스를 스캔하여 Align Packet을 렌더링합니다.

## 입력

```
/start {사용자 설명} [--add-dir 경로] [--github URL] [--figma file_key] [--obsidian 경로]
```

사용자가 변경하고 싶은 것을 자유 텍스트로 설명합니다.
추가 소스를 플래그로 지정할 수 있습니다. `.sprint-kit.yaml`의 기본 소스와 병합됩니다.

예시:
```
/start 튜터 차단 기능 추가 --add-dir /projects/app/src --figma abc123
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

#### 소스 병합 규칙

`.sprint-kit.yaml`의 `default_sources`와 `/start` 플래그 소스를 병합합니다.
- 키: `{type}:{identifier}` (예: `add-dir:./src`, `github-tarball:https://...`)
- 같은 키가 있으면 `/start` 플래그가 우선
- 결과는 `inputs/sources.yaml`에 기록

## 실행 순서

### 1. Scope 생성

```typescript
import { createScope } from "src/kernel/scope-manager";
import { appendScopeEvent } from "src/kernel/event-pipeline";

const paths = createScope(scopesDir, scopeId);

appendScopeEvent(paths, {
  type: "scope.created",
  actor: "user",
  payload: { title, description, entry_mode },
});
```

- `scopeId`: `SC-{YYYY}-{NNN}` 형식 (예: SC-2026-001)
- `entry_mode`: 사용자가 지정하지 않으면 `"experience"` 기본값
- `title`: 사용자 설명에서 핵심 명사구 추출
- `description`: 사용자 설명 원문

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
