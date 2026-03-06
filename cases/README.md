# Cases

Each change case will use this bundle shape:

```text
cases/{change-id}/
  inputs/
  events.ndjson
  case.md
  surface/
  build/
```

Notes:

- `events.ndjson` is append-only
- `case.md` is rendered from events
- `surface/` stores the current JP2 artifact
- `build/` stores derived compile and validation outputs
