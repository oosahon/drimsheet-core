# Testing

## General Rules

- Keep coverage at 100% for touched behavior.
- Do not use `any`.
- Prefer existing shared mocks from `__mocks__`.
- Do not create ad hoc dependency mocks when a shared mock should exist.
- Clean up temporary agent-created files.
- Run the narrowest useful test first, then broader validation when risk
  justifies it.

## Shared Mocks

- Shared `*.mock.ts` files define typed contract shapes with bare `jest.fn()`
  methods only.
- Do not put implementations, internal state, fixtures, default return values,
  or default resolved or rejected values in shared mocks.
- Reset shared mocks and configure their behavior in the owning spec's setup or
  in the individual test that needs it.
- Keep stateful or behaviorally realistic test doubles local to the owning spec;
  they are fakes, not shared mocks.

## Naming

- Domain unit tests use `.test.ts` files inside `__tests__`.
- Dependency-free DTO and mapper unit tests use `.test.ts` files inside
  `__tests__`, regardless of layer.
- Other dependency-free tests under `src/shared/**` use `.test.ts` files inside
  `__tests__`.
- Other tests outside the domain layer use `.spec.ts` files inside `__specs__`.
- Do not use singular `__test__` or `__spec__` directories.
- HTTP integration specs follow
  [HTTP Integration](http-integration.md#file-naming).
