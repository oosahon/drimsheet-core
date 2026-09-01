# <Outcome> Plan

## Goal

Describe the user-visible, technical, or architectural outcome this plan should
achieve.

State whether the plan is implementation-ready or whether a decision must be
resolved first. Preserve unrelated staged and working-tree changes during
implementation.

## Context

Summarize the verified current behavior, relevant architecture, and constraints
that shape the proposed work.

Keep this section concise. Link claims to concrete files, contracts, or observed
behavior where useful.

## Domain Language And Existing Guarantees

- **Authoritative state:** Identify the source of truth and any derived, read, or
  UI-oriented state.
- **Domain terms:** Define the established terms this change must use; do not
  introduce architectural synonyms.
- **Existing guarantees:** Record relevant versions, constraints, transaction
  boundaries, queue semantics, and consistency expectations before proposing
  new coordination.

Omit this section only when none of these concerns applies to the change.

## Confirmed Findings

1. **<Priority, when relevant> — <Finding>.** Describe the evidence, impact,
   and affected behavior.
2. **<Finding>.** Describe the evidence, impact, and affected behavior.

Include only findings confirmed through repository inspection, reproduction, or
provided requirements. Put unresolved assumptions and decisions in their
dedicated sections instead.

## Implementation Basis

| Decision or structural change | Basis                                               | Current requirement and production consumer | Evidence or rationale                                     |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `<decision>`                  | Requirement, rule, precedent, or approved deviation | Name both.                                  | Cite paths and symbols, or record the approved rationale. |

Classify every structural decision and identify its present requirement and
current production consumer. A possible future consumer is not sufficient; put
future-only work under `Out of Scope`. For a local precedent, cite the concrete
path and symbol that owns the same responsibility. If no suitable precedent
exists, label the basis `Pending deviation`, record what was searched and why
the closest candidates do not suffice, and resolve the decision before marking
the plan implementation-ready. Use `Approved deviation` only when a prior user
instruction specifically names and authorizes it, and cite that decision. A
generic request to create or implement the plan is not approval. One row may
cover a purely mechanical group of changes that follows the same precedent.

## Scope

### Expected Changes

- `<path>` — explain why this file or area should change.

### Conditional Changes

- `<path>` — state the condition that would make this change necessary.

### Out of Scope

- Identify adjacent and future-only work that this plan intentionally excludes.

Omit any scope subsection that does not add useful information.

## Proposed Approach

Describe the implementation at the granularity appropriate to the task. Use a
short ordered list for small changes, steps when order matters, workstreams when
work can proceed independently, and phases only for genuine milestones or
rollouts.

### <Step or Workstream>

- Describe a concrete change or decision.
- State important constraints or dependencies.
- Describe the expected result.

Add, rename, or remove subsections as needed. Do not manufacture multiple steps
for work that has one coherent implementation.

Do not place future-only ideas in the proposed approach. Record them under
`Out of Scope` or as a follow-up decision until a current requirement and
production consumer exist.

Identify the owner of each invariant, side effect, and transaction. For every
proposed service, state the named reusable capability it represents and cite
the existing contract or IoC seam it follows. Do not propose a service merely
to shorten a use case. Identify every persistence call and show the use case
that initiates it. A dedicated persistence service may compose an atomic
repository-write bundle, but it must be invoked directly by the use case rather
than by another service.

## Test Plan

- **Unit or component:** describe behaviors, boundaries, and expected location.
- **Browser integration:** describe user outcomes and expected location.
- **Regression:** identify existing behavior that must remain intact.

Include only applicable test layers. Explain when no new automated test is
warranted.

## Verification

List focused checks first, followed by broader checks justified by the change.

```bash
<focused test command>
<typecheck or static-analysis command>
<broader verification command>
```

Call out checks that depend on unavailable infrastructure, credentials, browser
binaries, or external repositories.

## Assumptions

- Record an assumption that the implementation may proceed with and explain how
  it can be validated.

Omit this section when the plan has no material assumptions.

## Open Decisions

- State the decision, available options, and the impact of each option.

Do not present unresolved decisions as implementation steps. Omit this section
when no decision blocks or materially changes the approach.

## Risks

- Describe a compatibility, migration, accessibility, security, performance, or
  delivery risk and its mitigation.

Omit this section when the work has no material risks beyond normal
implementation.

## Completion Criteria

- State observable, binary acceptance criteria.
- Confirm the required tests and verification checks pass.
- Confirm unrelated files and behavior remain unchanged.
