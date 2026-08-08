# Precedent And Deviation

Never silently turn a plan gap, assumption, or missing precedent into
implementation.

## Implementation Basis

Before making a structural decision, identify its basis as one of:

- an explicit user requirement or user-resolved plan decision;
- a durable repository rule;
- a concrete local precedent, cited by path and symbol; or
- an approved deviation.

Inspect the owning layer, nearby contracts, tests, callers, and wiring before
concluding that no suitable precedent exists. Match precedents by responsibility,
ownership, and semantics rather than superficial file similarity.

## Assumptions And Decisions

- Validate each material plan assumption before relying on it.
- Treat choices affecting behavior, public or shared contracts, ownership,
  persistence, data compatibility, security, dependencies, transactions,
  failure semantics, or repository-wide conventions as material.
- Do not convert an unresolved material decision into code. Pause for user
  direction unless an explicit user requirement or recorded prior user decision
  resolves it.
- Small, reversible implementation details may follow the nearest established
  pattern when they do not change scope, behavior, or architecture.

## No-Precedent Gate

Before implementing a pattern without suitable local precedent, state to the
user:

- the outcome and responsibility the pattern addresses;
- the repository areas searched and closest candidate precedents;
- why those candidates do not satisfy the requirement;
- the smallest proposed deviation and its owner; and
- the affected contracts, data, wiring, tests, and maintenance surface.

Use the heading `New-pattern decision required` and confirm that the deviation
has not been implemented when user approval is required.

Do not implement a material deviation until the user explicitly approves it
after disclosure or a prior user instruction specifically names and authorizes
the same deviation. A generic request to plan or implement work does not grant
that approval. For repository-wide architectural novelty, follow the
[ADR workflow](../../docs/09_architecture_decisions.md) after approval; do not
create, rename, or delete ADR files manually.

## Plan Drift

- Revalidate plans against durable rules and the current repository before
  editing.
- Disclose a stale or conflicting plan step before deviating from it.
- Pause for material scope or approach changes. State non-material corrections
  before proceeding and preserve the plan's intended outcome.
- Exclude optional improvements that are not required by the plan.
- At completion, state either `Implemented without deviation` or list each
  approved deviation and its verification evidence.
