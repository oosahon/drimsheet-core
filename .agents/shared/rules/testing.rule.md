# Testing Rules

## General Rules

- **Coverage**: Tests must achieve 100% coverage.
- **Type Safety**: Tests must not use `any`. Always ensure `yarn tsc` is ran to verify that there are no type issues.
- **Workspace Cleanliness**: Always delete every temporary file you create for your own workflow (that is not related to the project) to ensure you do not pollute the workspace.

## Testing Domain Entities & Value Objects

- **No Mocking**: Never mock anything when testing entities and value objects (with the exception of mocking time if necessary).
- **Helper Methods**: Have a dedicated `describe` block for helper methods.

## Testing Domain Services, Use Cases, and Handlers

- **Dependency Injection Mocks**: Always use existing repository (or other services) mocks. **NEVER** create a custom mock just for that dependency within the test file.
  - Repository mocks are usually located in `src/infra/**/*/__mocks__`.
  - This rule applies to every service, use case, or handler that uses dependency injection.
- **Creating Missing Mocks**: If a mock does not exist for a repository, create one by following the **"Mock Completeness"** rule outlined in `.agent/shared/rules/repo-implementation.rule.md`.

## Reusable factories

- Never hardcode entities or value objects. Always use the `make` method of the respective entity or factory.
- When working with currencies, never hardcode the currency. Always use one of the systems currencies in `src/domain/currency/config/currency.config.ts`.

## Prototype Test Examples

When writing tests, refer to the following files as standard prototypes:

- **Domain Entities**: `src/domain/accounting/entities/__tests__/accounting-entity.entity.test.ts`
- **Domain Services**: `src/domain/ledger/services/__tests__/asset-account.service.test.ts`
- **Use Cases**: `src/app/usecases/accounting/__specs__/create-accounting-entity.usecase.spec.ts`
- **Infrastructure Services**: `src/infra/services/__tests__/auth.service.spec.ts`
