# Sprint Kit

Sprint Kit is a clean-room redesign of the earlier sprint workflow.

The goal is not to generate many planning documents. The goal is to let a product expert:

- approve direction at `JP1`
- approve the concrete target at `JP2`
- let the system compile the approved target into a delta and execution pack

The current v1 direction is intentionally narrow:

- user-facing entrypoints: `/sprint-kit`, `/jp1`, `/jp2`
- supported change classes: `experience_change`, `interface_change`
- supported surfaces: `preview`, `contract_diff`
- storage model: `events.ndjson` as source of truth, `case.md` as rendered current view

## Core Flow

```text
/sprint-kit
-> grounding
-> direction proposal
-> JP1

/jp1
-> direction verdict
-> target surface generation
-> JP2

/jp2
-> target verdict + hidden requirement decisions
-> compile / crystallize
-> apply / validate
```

## Repository Layout

```text
docs/   architecture and execution planning
cases/  change-case bundle layout and examples
src/    future implementation modules
```

## Current Documents

- `docs/architecture.md`
- `docs/execution-plan.md`
- `docs/execution-pack-template.md`
- `docs/jp1-template.md`
- `docs/jp2-template.md`
- `docs/judgment-document-flow.md`
- `docs/case-view-template.md`
- `docs/event-log-contract.md`

## Reference Context

This repository is being designed from:

- the previous `podo-sprint-kit` product philosophy and root docs
- the clean-room `Change Case Kernel v2` proposal
- the agreement to keep the surface small and the runtime explicit
