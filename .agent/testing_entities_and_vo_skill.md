# Skill: Testing Domain Entities & Value Objects

**Objective**: Guarantee 100% test coverage without using `any` types, while avoiding mocks. Maintain strict type safety across assertions.

## Principles & Rules

1. **Never use `any` casting**: Do not bypass the TypeScript compiler using `variable as any`.
2. **Do not use Mocking**: Test the real functions. Domain entities and Value Objects should be mostly pure functions in this architecture and so never require `jest.mock()`.
3. **Ensure 100% Test Coverage**: Every branch, statement, and logical condition must be comprehensively tested.
4. **Use Factories for Dependencies**: If another value object or entity is needed during testing, use the factories (or existing predefined values, such as currency) of those entities or value objects, unless you are specifically testing a failure case.

## Testing Best Practices

### 1. Structure Valid Input Payloads First

Always create base valid payloads and valid properties using a `beforeEach` block or at the `describe` root. Reusing strict `validPayload` ensures modifications for breaking cases remain localized.

```typescript
const validPayload: TCreationOmits<ILedgerAccount> = {
  code: '101001',
  type: ELedgerType.Asset,
  // ... other fields
};
```

### 2. Leverage `@ts-expect-error` properly

Typing tests with valid object types makes TypeScript shout when we intentionally pass invalid data properties. Instead of substituting types with `any`, utilize `// @ts-expect-error` specifically over the expression that triggers the type-check failure.

**Correct usage:**

```typescript
it('should throw if target invalid parameter is passed', () => {
  const invalidPayload = {
    ...validPayload,
    isControlAccount: 'yes', // TS understands this as string instead of a boolean
  };

  // Place the directive immediately preceding the erroring invocation
  // @ts-expect-error testing invalid control account flag
  expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow(AppError);
});
```

### 3. Handle Timers accurately

If your Entity depends on `new Date()` statically evaluated during `make()` instantiation, make use of Jest Fake Timers natively so the freeze frames exactly equal what you test:

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

### 4. Validate output integrity

Testing shouldn't end at simple creation. Validate standard `make` processes for entities:

- Validate every property maps accurately to the return values.
- Ensure the objects follow Domain policies (e.g., verify that `Object.isFrozen(entity)` is `true`).

### 5. Validate with Full Coverage

Run your unit tests using full coverage locally to discover uncovered lines immediately:

```bash
yarn test src/domain/path/to/__tests__/file.test.ts --coverage
```

Ensure Statement, Line, Branch, and Func coverages reflect 100%. If gaps exist, create missing iterations across `invalid` and `valid` boundaries.
