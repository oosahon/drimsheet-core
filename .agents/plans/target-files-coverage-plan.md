# Target Files Coverage Plan

## Goal

Achieve 100% test coverage (statements, branches, functions, and lines) for the following files:

1. `src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts`
2. `src/app/journal-entry/usecases/create-receipt.usecase.ts`
3. `src/infra/persistence/helpers/get-db-query.ts`
4. `src/infra/persistence/repos/journal-entry/mappers/journal-entry.mapper.ts`

This plan is implementation-ready. Unrelated changes will be preserved.

## Context

1. **`journal-entry.entity.helpers.ts`**: Currently at 96.15% line coverage. The truthy branch of `validateVoidedAt` has not been tested with a non-null valid Date value.
2. **`create-receipt.usecase.ts`**: Currently at 71.42% branch coverage. Missing branch coverage for `exchangeRate` parameters (both source and destination lines) and fallback to `null` for counterparties if `getFoundOrCreated` returns null/undefined.
3. **`get-db-query.ts`**: No tests exist. It needs a new test file validating connection transaction resolution logic.
4. **`journal-entry.mapper.ts`**: Currently at 75% branch coverage. Missing coverage for mapping `voidedAt` when it is truthy in both `toDomain` and `toRepo`.

## Confirmed Findings

1. **`journal-entry.entity.helpers.ts`**: Needs tests covering `validateVoidedAt`, `validateVoidingEntryId`, `validateCounterparties`, and other helpers. A dedicated test file `journal-entry.entity.helpers.test.ts` under `src/domain/journal-entry/entities/__tests__/` will be created.
2. **`create-receipt.usecase.ts`**: In `create-receipt.usecase.spec.ts`, there are no cases passing exchange rate details or null counterparty resolutions. Adding cases for these will bring branch coverage to 100%.
3. **`get-db-query.ts`**: Needs a test file `get-db-query.test.ts` under `src/infra/persistence/helpers/__tests__/`.
4. **`journal-entry.mapper.ts`**: In `journal-entry.mapper.test.ts`, adding a concrete Date for `voidedAt` in mapper tests will cover the truthy branches of `fromRepoDate`/`toRepoDate`.

## Scope

### Expected Changes

#### [MODIFY] [create-receipt.usecase.spec.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts)

- Add tests covering `exchangeRate` payloads and unresolved counterparties.

#### [NEW] [journal-entry.entity.helpers.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/entities/__tests__/journal-entry.entity.helpers.test.ts)

- Implement a test suite covering all helper functions in `journal-entry.entity.helpers.ts`.

#### [NEW] [get-db-query.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/helpers/__tests__/get-db-query.test.ts)

- Implement a test suite to check transaction/postgres connection fallback logic in `get-db-query.ts`.

#### [MODIFY] [journal-entry.mapper.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-entry.mapper.test.ts)

- Add test coverage for truthy `voidedAt` mapping in both direction transformations.

## Proposed Approach

### Step 1: Implement entity helpers tests

- Create `src/domain/journal-entry/entities/__tests__/journal-entry.entity.helpers.test.ts`.
- Test:
  - `validateStatus` with valid and invalid inputs.
  - `validateTransition` with valid and invalid inputs.
  - `validateLine` with valid and invalid inputs (balanced vs unbalanced, unique sequence orders, etc.).
  - `isUniqueSequenceOrder`.
  - `getMemo` with empty/null, too long, and normal strings.
  - `validateSourceType` with valid and invalid inputs.
  - `validateCounterparties` with various source types and line states.
  - `validatePostedAt` with null and non-null values.
  - `validateVoidedAt` with null and non-null values (covering line 123-124).
  - `validateVoidingEntryId` with null and valid/invalid UUIDs.

### Step 2: Implement `get-db-query.test.ts`

- Create `src/infra/persistence/helpers/__tests__/get-db-query.test.ts`.
- Test that:
  - It returns `options.tx` when `tx` is provided.
  - It returns `postgres` when `tx` is undefined.

### Step 3: Implement mapper test changes

- Edit `src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-entry.mapper.test.ts`.
- Update/add tests that include a valid `voidedAt` Date so that the mapper maps this field using `toRepoDate` and `fromRepoDate` to cover those branches.

### Step 4: Implement use case test changes

- Edit `src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts`.
- Add a test case passing a non-null `exchangeRate` in `sourceLine` and `destinationLines`.
- Add a test case where `getFoundOrCreated` resolves to null/undefined, making sure that `sourceLineCounterparty` and `lineCounterparty` fall back to `null` gracefully.

## Test Plan

### Automated Tests

Run Jest to verify coverage targets:

```bash
npm test -- --coverage --collectCoverageFrom="src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts" --collectCoverageFrom="src/app/journal-entry/usecases/create-receipt.usecase.ts" --collectCoverageFrom="src/infra/persistence/helpers/get-db-query.ts" --collectCoverageFrom="src/infra/persistence/repos/journal-entry/mappers/journal-entry.mapper.ts" --runInBand
```

Verify that the whole test suite runs and passes:

```bash
npm test -- --runInBand
```

## Verification

```bash
npm run lint
npm run build
```

## Completion Criteria

- 100% statement, branch, function, and line coverage achieved for all four target files.
- All new and existing tests pass.
- Code linting and build succeed.
