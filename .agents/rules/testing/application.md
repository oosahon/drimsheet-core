# Application Unit Tests

- Put application DTO and mapper unit tests in an owning unit's `__tests__`
  folder and name them `<subject>.test.ts`.
- Put other application unit tests in an owning unit's `__specs__` folder and
  name them `<subject>.spec.ts`.
- Test orchestration, dependency calls, mapping, and application error
  propagation.
- Mock ports and external dependencies at the application boundary.
- Prefer existing shared mocks from `__mocks__`.
- Keep domain behavior assertions in domain tests.

Follow [General Testing](general.md).
