# CLAUDE.md

## Communication Principles

The user is a product expert, not a developer. Follow these rules strictly:

### 1. No Metaphors
Do not use analogies or metaphors. Explain things directly.

### 2. Use Technical Terms As-Is, Then Explain
Use exact terms like `--add-dir`, `tarball`, `MCP` without simplification. Always follow with a plain explanation of what the term means and does.

### 3. Reveal Logical Structure
For every concept, answer three questions in order:
1. **What it is** — definition and function
2. **Why it exists** — the problem it solves, and what breaks without it
3. **How it relates** — its position relative to other components in the system

### 4. Assume No Domain Expertise
The user may lack specialized knowledge in the technical domain. Ensure that mechanisms, trade-offs, and decisions are understandable without prior expertise — while preserving full technical accuracy.

These principles apply to all artifacts and documents produced by the system.

## System Structure

- **Ontology Map**: `docs/ontology-map.md` — 도메인 엔티티, union type, 관계 구조, Reverse Index (자동 생성, `npm run ontology-map`)
- **Gate Guard**: `npm run check-deps` — kernel/ 모듈의 의존 방향 검증 (외부 모듈 import 차단)
- **Protocol Refs Check**: `npm run check-refs` — 에이전트 프로토콜 문서의 타입/이벤트 참조가 코드와 일치하는지 검증
- **Ontology Consumption Pipeline**: `scanners/ontology-index.ts` → `ontology-query.ts` → `ontology-resolve.ts` → `code-chunk-collector.ts` — 도메인 온톨로지 기반 6관점 코드 청크 자동 수집
- **Ontology Generation Pipeline**: `scanners/generators/` — 코드베이스에서 도메인 온톨로지 YAML을 자동 생성하는 2단계 파이프라인 (Stage 1: 구조 추출, Stage 2: LLM 의미 부여). 에이전트 프로토콜: `docs/agent-protocol/ontology-generate.md`

## Commit Protocol

커밋 또는 푸시 전에 다음 문서가 현재 코드를 반영하는지 확인하고, 필요시 업데이트합니다:
- `CHANGELOG.md` — 새 버전/변경 사항 추가
- `README.md` — 현재 규모 (파일 수, 테스트 수) + 새 기능 반영
- `CLAUDE.md` — System Structure 섹션에 새 모듈/파이프라인 반영
- `dev-docs/design/ontology-auto-generation-tasks.md` — 작업 상태 업데이트 (해당 시)

이 규칙은 의미적 판단이므로 모든 커밋에 적용하지 않습니다. 기능 추가/구조 변경 커밋에만 적용합니다. 단순 버그 수정이나 typo 수정에는 불필요합니다.

## Agent Review

- **domain**: software-engineering
