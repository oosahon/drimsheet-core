---
name: domain-entity-creation
description: Use when creating or changing domain entities, value objects, or their tests.
---

# Domain Entity Creation

## Load

- [Folder Responsibility](../../rules/folder-responsibility.md)
- [Domain Modeling](../../rules/domain-modeling.md)
- [Error Creation](../../rules/error-creation.md)
- [Domain Unit Tests](../../rules/testing/domain.md)

## Entity Pattern

- Entity: `src/domain/<domain>/entities/<name>.entity.ts`.
- Helpers: `src/domain/<domain>/entities/helpers/<name>.entity.helpers.ts`.
- Tests: `src/domain/<domain>/entities/__tests__/<name>.entity.test.ts`.
- Freeze returned entities and exported entity objects.
- Return `[entity, events, audit]` for creation/mutation methods when the local pattern does.
- Export the frozen entity object as default.

Use nearby entities as the source of truth for exact typing and audit/event shape.
