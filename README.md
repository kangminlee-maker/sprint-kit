# Sprint Kit

[![npm version](https://img.shields.io/npm/v/sprint-kit.svg)](https://www.npmjs.com/package/sprint-kit)

제품 변경을 계획할 때, 현재 시스템의 제약(constraint)을 3개 관점에서 발견하고 정리하여 판단을 돕는 도구입니다.

(Sprint Kit은 Ontology-as-Code 구조로 설계된 Knowledge-Based Design 프로젝트입니다. 도메인 엔티티, 상태 전이, 제약 관계를 코드로 정의하고, 이 정의를 기반으로 제품 변경 과정을 자동 검증합니다.)

**사용자는 제품 전문가(PO)입니다.** 방향을 결정하고, 화면(Surface)을 확인하며, 각 제약에 대해 어떻게 처리할지 선택합니다. 기술적인 분석과 구현 명세 생성은 시스템이 수행합니다.

## 설치

```bash
npm install sprint-kit
```

## 이 도구가 하는 일

제품 변경은 "이렇게 바꾸고 싶다"에서 시작하지만, 실제로 진행하면 기존 시스템과 충돌하는 지점이 나타납니다. 예를 들어:

- **Experience(사용자 경험)**: 새 화면을 추가하면 기존 화면의 흐름이 끊어지는 경우
- **Code(코드)**: 변경에 필요한 데이터가 현재 API에서 제공되지 않는 경우
- **Policy(정책)**: 이용약관이나 사업 규칙과 충돌하는 경우

Sprint Kit은 이런 충돌(constraint)을 소스 코드, 정책 문서, 디자인 시스템에서 미리 찾아내고, PO가 각각에 대해 "반영한다(inject) / 보류한다(defer) / 무시한다(override)"를 결정할 수 있도록 정리합니다.

## 진행 흐름

```
(Brief 또는 대화) → Exploration → Align → Draft → Compile → Pre-Apply Review → Apply → Validate → Close
```

| 단계 | 하는 일 | 누가 결정하나 |
|------|---------|-------------|
| **Start** | 목표를 말하거나, Brief를 작성합니다. Brief 없이 대화만으로도 시작할 수 있습니다 | PO가 시작 |
| **Exploration** | sprint-kit이 현재 서비스 상태를 설명하고, 옵션을 제시하며, 대화를 통해 요구사항을 함께 구체화합니다. 6개 Phase(목적→영역→현재 상태→시나리오→가정 검증→범위)를 거칩니다 | PO + sprint-kit 공동 |
| **Align** | Exploration 결과로 Align Packet을 생성하여 방향과 범위를 확정합니다 | PO가 방향 승인 |
| **Draft** | 화면 모형(Surface)을 만들고, PO가 확인합니다. 확정 후 상세 제약을 발견하여 Draft Packet으로 각 제약의 처리 방법을 묻습니다 | PO가 각 제약을 결정 |
| **Compile** | PO의 결정을 바탕으로 구현 명세(Build Spec), 변경 파일 목록(delta-set), 검증 계획(validation-plan), PRD를 자동 생성합니다 | 시스템이 자동 생성 |
| **Pre-Apply Review** | 구현 전에 정책 정합성, 기존 기능 정합성, 작동 로직을 검증합니다 | 에이전트 + PO 확인 |
| **Apply** | 생성된 명세에 따라 실제 코드를 수정합니다 | Builder가 실행 |
| **Validate** | 검증 계획의 시나리오를 실행하여 구현이 올바른지 확인합니다 | Builder가 실행 |

### PO가 직접 다루는 명령어

| 명령어 | 시점 | 하는 일 |
|--------|------|---------|
| `/start` | 시작할 때 | 대화 또는 Brief로 시작합니다. Exploration을 거쳐 Align Packet이 생성됩니다 |
| `/align` | Align Packet을 받았을 때 | 방향과 범위를 승인/수정/거절합니다 |
| `/draft` | 방향이 확정된 후 | 화면 모형을 확인하고, 각 제약에 대해 결정합니다. 이후 자동으로 Compile까지 진행됩니다 |

## 3개 관점

Sprint Kit이 제약을 찾는 3개 관점입니다.

| 관점 | 무엇을 보는가 | 예시 |
|------|-------------|------|
| **Experience** | 사용자가 보고 만지는 것 | 화면 배치 충돌, 누락된 흐름, 디자인 규격 위반 |
| **Code** | 시스템이 실행하는 것 | DB 스키마 부재, API 호환성, 상태 전이 누락 |
| **Policy** | 규칙이 제약하는 것 | 이용약관 충돌, 사업 규칙 모순, 규제 요건 |

## 제약(Constraint) 결정 방법

발견된 각 제약에 대해 PO가 선택합니다:

| 결정 | 의미 | 예시 |
|------|------|------|
| **inject** | 이 제약을 구현에 반영합니다 | "노쇼 후 재신청 화면을 추가합니다" |
| **defer** | 이번에는 보류하고 다음에 처리합니다 | "정규 수강생 화면 변경은 다음 scope에서" |
| **override** | 알고 있지만 의도적으로 무시합니다 | "이 규격 차이는 허용합니다" |
| **clarify** | 외부 확인이 필요합니다 | "법무팀에 약관 적용 여부를 확인해야 합니다" |

## 산출물

Sprint Kit이 생성하는 주요 문서입니다.

| 산출물 | 언제 생성되나 | 내용 |
|--------|-------------|------|
| **Align Packet** | `/start` 완료 시 | 요청(to-be) vs 현재 상태(as-is) + 충돌 지점 정리 |
| **Surface** | `/draft` 진행 중 | 화면 모형 (브라우저에서 확인 가능) |
| **Draft Packet** | Surface 확정 후 | 각 제약별 상황 설명 + 선택지 + 추천 |
| **Build Spec** | Compile 완료 시 | 구현 항목, 변경 파일 목록, 검증 계획 |
| **PRD** | Compile 완료 시 | scope 전체 과정에서 축적된 정보를 하나의 문서로 통합 |
| **Exploration Log** | Exploration 중 | 대화 전문 — 왜 그렇게 결정했는가의 맥락 기록 |

## Compile Defense

Compile이 생성하는 구현 명세가 올바른지 자동으로 검증합니다. PO가 별도로 조치할 필요는 없습니다.

| 검증 단계 | 하는 일 | 문제 발견 시 |
|-----------|---------|-------------|
| **L1** | 모든 제약이 구현 명세에 빠짐없이 포함되었는지 확인 | 자동 재시도 |
| **L2** | 각 결정(inject/defer/override)이 올바르게 반영되었는지 확인 | 자동 재시도 |
| **L3** | 미검증 가정, 정책 변경 필요, 불변 제약 미커버 등을 경고 | 경고만 (진행 가능) |

## AI 도구 지원

Sprint Kit은 AI 코딩 에이전트와 함께 동작합니다.

| 도구 | 상태 |
|------|------|
| **Claude Code** | 사용 가능 (hooks, skills, MCP 내장) |
| **Codex (OpenAI)** | 계획 중 |
| **Cursor** | 계획 중 |

핵심 워크플로우는 도구에 독립적입니다. 도구별로 달라지는 것은 에이전트 프로토콜 문서와 hook 설정뿐입니다.

## 소스 설정

`.sprint-kit.yaml` 파일에 프로젝트의 소스를 등록합니다.

```yaml
target_stack:
  framework: "Next.js 15"
  styling: "Tailwind CSS v3 + CVA"

default_sources:
  - type: github-tarball
    url: https://github.com/org/app
    description: 앱 소스코드
    usage_hint: context
  - type: add-dir
    path: ./sources
    description: 디자인 가이드, 이용약관
    usage_hint: context
  - type: mcp
    provider: clickhouse
    description: 사용자 행동 이벤트 분석
    usage_hint: context
```

`usage_hint`는 소스를 언제 읽을지 제어합니다:
- `grounding_only` (기본값) — Align 단계에서 1회 스캔
- `context` — Surface 생성과 Compile 시에도 다시 읽음
- `full` — 모든 단계에서 항상 참조

소스 유형: `add-dir`(로컬), `github-tarball`(GitHub), `figma-mcp`(Figma), `obsidian-vault`(Obsidian), `mcp`(MCP 서버 — ClickHouse 등 외부 데이터 소스)

## 프로젝트 구조

```text
src/              시스템 코드 (kernel, commands, scanners, compilers, renderers 등)
docs/             런타임 문서 (에이전트 프로토콜, ontology-map)
dev-docs/         개발 문서 (spec, design, guide, deprecated)
scripts/          도구 스크립트 (ontology-map 생성, 의존 방향 검증 등)
scopes/           scope 작업 공간 (프로젝트별로 생성)
sources/          로컬 참고 자료 (디자인 가이드, 이용약관 등)
.sprint-kit.yaml  프로젝트 설정 (소스 목록, 기술 스택)
```

## 상세 문서

### 런타임 문서 (`docs/`) — 에이전트가 실행 중 참조

| 문서 | 내용 |
|------|------|
| `docs/agent-protocol/` | 에이전트 실행 프로토콜 (start, align, draft, exploration) |
| `docs/ontology-map.md` | 자동 생성 타입 맵 (`npm run ontology-map`) |

### 개발 문서 (`dev-docs/`) — 시스템 명세, 설계, 참고

| 문서 | 내용 |
|------|------|
| `dev-docs/spec/blueprint.md` | 시스템 정의 — 상태 기계, 모듈 구조, 신뢰 모델 |
| `dev-docs/spec/architecture.md` | 시스템 설계, 데이터 흐름, 저장 구조 |
| `dev-docs/spec/event-state-contract.md` | 이벤트 분류, 상태 전이 매트릭스 |
| `dev-docs/spec/constraint-discovery.md` | 3개 관점 탐색, 제약 생명주기 |
| `dev-docs/spec/build-spec-compile.md` | Build Spec 구조, Compile Defense 규칙 (L1/L2/L3) |
| `dev-docs/design/` | 설계 제안서 (Adaptive Align) |

## 현재 규모

- 소스 파일 45+개, 테스트 44파일 1,025건
- 상태 15개 (`exploring` 포함), 이벤트 44종, Compile Defense 규칙 15개
- Exploration 이벤트 3종 (전이 이벤트), Pre-Apply Review 이벤트 1종

## License

ISC
