# Scope And Simplicity

Implement present requirements with the smallest coherent change.

## Present-Need Gate

- Every new behavior, file, abstraction, setting, compatibility path, or hook
  must name a current requirement and a current production consumer.
- A possible future consumer, implementation, deployment, or migration is not
  sufficient. Keep future-only work out of production code, configuration,
  tests, and deployment instructions.

## Smallest-Coherent-Change Gate

- Prefer deletion, reuse, an internal constant, or a concrete implementation
  over a new layer or extension point.
- Do not solve unrequested follow-up work or add optional flexibility while
  implementing the current requirement.

## Configuration Gate

Add an environment variable only for one of these present needs:

- a secret;
- an environment-specific endpoint or identity;
- a demonstrated per-environment difference; or
- a currently owned operational kill switch.

Document its consumer, operational owner, default, validation, and failure
semantics. If all current environments use one value, keep that value as an
internal constant.

## Abstraction Gate

Do not introduce a generic service, factory, interface, version envelope,
feature flag, fallback, compatibility path, re-export layer, or similar seam
for a hypothetical second implementation or caller. Introduce an abstraction
only when the current requirement and consumers need the boundary now.

## Forward-Looking Work

Record future possibilities as non-goals or follow-up decisions. Put them under
`Out of Scope` in a plan instead of encoding them in the proposed approach.

## Deviations

A deliberate exception must follow
[Precedent And Deviation](precedent-and-deviation.md). Before approval, state
the immediate benefit, current consumer, and added code, testing, maintenance,
configuration, deployment, and operational surface.
