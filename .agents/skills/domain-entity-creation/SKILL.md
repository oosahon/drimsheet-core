---
name: domain-entity-creation
description: Use when creating or changing domain entities, value objects, or their tests.
---

# Domain Entity Creation

## Load

- [Folder Responsibility](../../rules/folder-responsibility.md)
- [Domain Modeling](../../rules/domain-modeling.md)
- [Domain Validations And Helpers](../../rules/domain-validations.md)
- [Error Creation](../../rules/error-creation.md)
- [Readability](../../rules/readability.md)
- [Domain Unit Tests](../../rules/testing/domain.md)

## Entity Pattern

- Entity: `src/domain/<domain>/entities/<name>.entity.ts`.
- Validations:
  `src/domain/<domain>/entities/validations/<name>.validation.ts`.
- Helpers: one default-exported function per
  `src/domain/<domain>/entities/helpers/<name>.helper.ts`.
- Tests: `src/domain/<domain>/entities/__tests__/<name>.entity.test.ts`.
- Freeze returned entities and exported entity objects.
- Delegate reusable validation to the entity's frozen validation object; keep
  entity methods focused on construction or transition, events, and audits.
- Spread the entity's validation object into the frozen entity API. Import
  helpers directly and do not re-export them through the entity object.
- Return `[entity, events, audit]` for creation/mutation methods when the local pattern does.
- Export the frozen entity object as default.

Use nearby entities as the source of truth for exact typing and audit/event shape.

## Value Pattern

- Value: `src/domain/<domain>/values/<name>.vo.ts`.
- Validations:
  `src/domain/<domain>/values/validations/<name>.validation.ts`.
- Helpers: one default-exported function per
  `src/domain/<domain>/values/helpers/<name>.helper.ts`.
- Validation tests:
  `src/domain/<domain>/values/validations/__tests__/<name>.validation.test.ts`.
- Value tests: `src/domain/<domain>/values/__tests__/<name>.vo.test.ts`.
- Freeze returned values and exported value objects.
- Spread the value's validation object into the frozen value API. Import helpers
  directly and do not re-export them through the value object.
- Import shared value validations directly when no owning value object exists.
- Keep private construction assertions with their value factory when they do
  not form a reusable validation API.

Use nearby values as the source of truth for exact typing and immutable result
shape.
