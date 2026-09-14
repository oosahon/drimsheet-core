# ADR 0018: First-Class Domain Validations

## Status

Accepted

## Context

Domain entity, value, and service helper directories currently mix validation
with getters, derivations, factories, repository-backed lookups, and
coordinated domain behavior. The generic helper classification obscures
ownership and makes it easy to add another broad helper object without deciding
what behavior it contains.

Validation needs an explicit domain owner and test surface. Genuine helpers
also need a deliberately narrow shape so they cannot become another bucket for
unrelated behavior.

## Decision

- Reusable entity validation lives in
  `src/domain/<domain>/entities/validations/<subject>.validation.ts`.
- Reusable value validation lives in
  `src/domain/<domain>/values/validations/<subject>.validation.ts`.
- Reusable domain-service validation lives in
  `src/domain/<domain>/services/validations/<subject>.validation.ts`.
- Validation filenames omit redundant `.entity`, `.value`, and `.service`
  segments.
- Each validation module default-exports one frozen object containing the
  subject's validators and has no named exports.
- Validators include throwing assertions and boolean predicates that answer a
  validity or case question. Throwing alone does not make a function a
  validator.
- Each helper module default-exports exactly one getter, selector, or derivation
  function and has no named exports or wrapper object.
- A helper's exported function uses an explicit subject-specific name that is
  unambiguous at the call site, even though its filename remains concise.
- Entity modules may import helpers and validations. An entity helper may import
  an entity validation directly, but entity helpers and validations must not
  import composed entity modules.
- Entity modules spread their entity validation object into the frozen entity
  API. Helpers remain direct imports and are not re-exported through entities.
- Value-object modules spread their own validation object into the frozen value
  API. Value helpers remain direct imports and are not re-exported through
  value objects.
- Consumers import shared value validation directly when no owning value object
  exists. Value helpers and validations must not import the composed value
  object that consumes them.
- Domain services import their service validation objects directly.
- Domain rules and named service behavior retain their existing owners; they do
  not become validations or helpers merely because they reject invalid state.

## Consequences

### Positive

- Validation ownership and import paths become explicit.
- Validation objects receive dedicated tests.
- Entity and value callers retain a cohesive validation API through their
  owning domain object.
- Entity exports contain entity operations instead of accumulating utility
  helper behavior.
- One-function helper files make each helper addition an intentional design
  choice.

### Negative

- Migrating existing helper bundles requires coordinated file, import, and test
  changes across several domains.
- Entities and value objects deliberately expose their own validators in
  addition to their operations, while helper consumers must use direct imports.
