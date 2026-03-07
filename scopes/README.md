# Scopes

Each scope uses this bundle shape:

```text
scopes/{scope-id}/
  inputs/
    sources.yaml
  events.ndjson
  scope.md
  state/
    reality-snapshot.json
    constraint-pool.json
  surface/
    preview/          # experience: React + MSW app
    contract-diff/    # interface: API diff
  build/
    align-packet.md
    draft-packet.md
    build-spec.md
    delta-set.json
    validation-plan.md
```

Rules:

- `events.ndjson` is append-only (source of truth)
- `scope.md` is rendered from events (read-only)
- `state/` contains materialized views from events (read-only)
- `surface/` stores the confirmed surface artifact
- `build/` stores derived compile and validation outputs
