# Deprecated Documents

These documents are from earlier design iterations and are no longer active.
They are preserved for reference only.

The current architecture is defined in `dev-docs/spec/architecture.md`.
For terminology mapping (old → new), see the Terminology Mapping section in `dev-docs/spec/architecture.md`.

## Files

### 초기 설계 (Sprint Kit 이전)
- `jp1-template.md` → replaced by Align Packet (`docs/agent-protocol/align.md`)
- `jp2-template.md` → replaced by Draft Packet (`docs/agent-protocol/draft-*.md`)
- `execution-pack-template.md` → replaced by Build Spec (`dev-docs/spec/build-spec-compile.md`)
- `case-view-template.md` → replaced by `scope.md` render
- `event-log-contract.md` → replaced by `dev-docs/spec/event-state-contract.md`
- `judgment-document-flow.md` → replaced by Core Flow in `dev-docs/spec/architecture.md`
- `execution-plan.md` → replaced by `dev-docs/guide/implementation-plan.md`

### 역할 종료 (2026-03-15)
- `align-draft-templates.md` → 동일 내용이 `docs/agent-protocol/align.md`, `docs/agent-protocol/draft-*.md`로 분할됨
- `golden-example.md` → 산출물 예시. 이후 상태/이벤트 구조 변경으로 현재 시스템과 괴리
- `schema-as-ontology-restructuring.md` → Panel Review 판정 완료 (수준 B 채택). `docs/ontology-map.md` 자동 생성으로 구현됨
