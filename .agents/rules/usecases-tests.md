# Use Case Tests

## Rules

- Use shared mocks for injected dependencies.
- Keep a `makeUseCase` helper in the suite.
- Set happy-path mocks in `beforeEach`.
- Override only the dependency needed for each failure branch.
- Assert returned values and dependency calls.
- Cover validation, authorization/policy failures, missing dependencies, and success side effects.
- Do not use `any`; use `unknown as Type` only when a narrow test double needs it.
