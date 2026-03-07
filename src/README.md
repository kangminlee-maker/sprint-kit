# Source Layout

Planned module boundaries:

- `kernel/` event store, reducers, state machine, constraint pool, stale detection
- `commands/` `/start`, `/align`, `/draft` entrypoints
- `renderers/` `scope.md`, Align Packet, Draft Packet, surface views
- `compilers/` compile, Build Spec generation
- `validators/` apply and validation runners

The first implementation goal is one end-to-end usable slice, not a broad framework.
