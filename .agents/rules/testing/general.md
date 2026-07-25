# Testing

## General Rules

- Keep coverage at 100% for touched behavior.
- Do not use `any`.
- Prefer existing shared mocks from `__mocks__`.
- Do not create ad hoc dependency mocks when a shared mock should exist.
- Clean up temporary agent-created files.
- Run the narrowest useful test first, then broader validation when risk
  justifies it.

## Naming

- Domain unit tests use `.test.ts` files inside `__tests__`.
- Dependency-free DTO and mapper unit tests use `.test.ts` files inside
  `__tests__`, regardless of layer.
- Other tests outside the domain layer use `.spec.ts` files inside `__specs__`.
- HTTP integration specs follow
  [HTTP Integration](http-integration.md#file-naming).
