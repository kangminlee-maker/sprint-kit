# Source Layout

Planned module boundaries:

- `kernel/` event store, reducers, state machine
- `commands/` `/sprint-kit`, `/jp1`, `/jp2`
- `renderers/` `case.md`, JP packets, concrete surface views
- `compilers/` compile / crystallize flow
- `validators/` apply and validation runners

The first implementation goal is one end-to-end usable slice, not a broad framework.
