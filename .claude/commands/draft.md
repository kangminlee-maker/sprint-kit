Surface 생성/수정, deep discovery, compile, PRD 생성, apply를 수행합니다.

$ARGUMENTS를 처리합니다.

현재 scope의 상태를 scope.md에서 확인하고, 해당 상태의 프로토콜만 읽으세요:

| 현재 상태 | 읽을 파일 |
|-----------|----------|
| `align_locked`, `surface_iterating` | `docs/agent-protocol/draft-surface.md` |
| `surface_confirmed`, `constraints_resolved` | `docs/agent-protocol/draft-constraint.md` |
| `target_locked` | `docs/agent-protocol/draft-compile.md` |
| `compiled` (prd.rendered 이벤트 없음) | `docs/agent-protocol/draft-prd.md` |
| `compiled` (prd.rendered 이벤트 있음), `applied`, `validated` | `docs/agent-protocol/draft-apply.md` |
