# Skill: Testing Usecases

**Objective**: Guarantee 100% test coverage for application use cases without using `any` types. Maintain strict type safety, verify architectural dependencies correctly, and avoid polluting the codebase with new one-off test files or duplicate mocks.

## Principles & Rules

1. **Never use `any` casting**: Do not bypass the TypeScript compiler using `variable as any`. For Jest matchers, avoid `expect.any(Object)` where possible in favor of specific object matching or exact variables (e.g., `{ correlationId }`). If type assertions are absolutely necessary for partial mocks, use `as unknown as Type`.
2. **Use Existing Mocks**: Usecase dependencies (Repositories, EventBus, RequestContext) must be mocked. However, you must _only_ use existing, shared mocks from the codebase (found in `__mocks__` or `__mock__` folders adjacent to their implementations, such as `infra/persistence/repos/__mocks__`). Do not create new ad-hoc `jest.fn()` structures for standard infrastructure contracts.
3. **Ensure 100% Test Coverage**: Every branch, statement, and logical condition must be comprehensively tested.
4. **Use Domain Factories**: When setting up mock return values for repositories or building test payloads, generate real objects using the domain entity and value object factories (e.g., `ledgerAccountEntity.make(...)`, `moneyValue.make(...)`) instead of hardcoding raw data structures.

## Testing Best Practices

### 1. Structure Common Data First

Define your core domain entities, users, and correlation IDs at the root level of your `describe` block. Generate them properly via their domain factories to ensure structural integrity across all tests.

```typescript
describe('createOpeningBalanceUseCase', () => {
  const correlationId = 'test-corr-id';

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    // ...
  });

  const [mockAssetAccount] = cashAndEquivalentAccountEntity.make({
    // ...
  });
});
```

### 2. Setup Base Mocks in `beforeEach`

Clear all mocks and establish the "happy path" behavior for all shared mocks. This ensures your primary success tests remain clean, while specific failure tests can simply override one or two mock behaviors.

```typescript
beforeEach(() => {
  jest.clearAllMocks();

  mockRequestContext.get.mockReturnValue({
    correlationId,
    clientSession: mockClientSession,
    user: mockUser,
    accountingEntity: mockAccountingEntity,
  } as unknown as IRequestContextData);

  mockLedgerAccountRepo.findById.mockResolvedValue(mockAssetAccount);
  mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue([]);
});
```

### 3. Centralize Use Case Instantiation

Provide a single instantiation helper function within the suite to supply all the mocked dependencies to the use case factory. This avoids repetitive DI boilerplate in every test block.

```typescript
const getUseCase = () =>
  makeCreateOpeningBalanceUseCase(
    mockRequestContext,
    mockExchangeRateRepo,
    mockLedgerAccountRepo
    // ...other shared mocks
  );
```

### 4. Override Mocks for Specific Branches

When testing failure conditions or alternative paths, reset and override the specific mock within that test block to trigger the exact branch you need to cover.

```typescript
it('should throw ErrorResourceNotFound if the account is not found', async () => {
  const useCase = getUseCase();

  // Reset default mock and simulate failure scenario
  mockLedgerAccountRepo.findById.mockReset().mockResolvedValue(null);

  const payload = {
    /* ... */
  };

  await expect(useCase(payload)).rejects.toThrow('Account not found.');
});
```

### 5. Validate Dependencies and Side-Effects

Don't just test that the usecase resolves. Assert that the underlying repositories, event buses, and domain services were called with the correct parameters, tracing variables, and payload shapes.

```typescript
it('should successfully record opening balance', async () => {
  const useCase = getUseCase();
  const payload = {
    /* ... */
  };

  await useCase(payload);

  // Validate tracing propagation and correct side-effects
  expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
    payload.accountId,
    { correlationId } // Strict matching, avoid expect.any(Object)
  );
  expect(mockJournalEntryRepo.save).toHaveBeenCalled();
});
```

### 6. Validate with Full Coverage

Always run your unit tests locally using full coverage to discover uncovered lines immediately:

```bash
yarn test src/app/usecases/domain/__specs__/file.usecase.spec.ts --coverage
```

Ensure Statement, Line, Branch, and Func coverages reflect 100%. If gaps exist, add targeted tests to cover the missing logic paths.
