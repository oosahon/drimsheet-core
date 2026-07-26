# Increase Test Coverage Plan

## Goal

Achieve 100% statement, branch, function, and line coverage on:

1. `src/app/accounting/usecases/create-accounting-entity.usecase.ts`
2. `src/domain/user/entities/user-preferences.entity.ts`
3. `src/infra/persistence/mappers/user/user-history.mapper.ts`
4. `src/interface/http/middlewares/request-logger.middleware.ts`

Ensure all new and modified tests comply with the repository's coding and testing rules (e.g. no usage of `any` where avoidable, correct file naming and placement).

## Context

Based on running Jest with coverage, the current test coverage status is:

1. [create-accounting-entity.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/usecases/create-accounting-entity.usecase.ts): **98.8%** coverage. Line 323 is uncovered (throwing `InternalServerError` if a ledger account's history is missing).
2. [user-preferences.entity.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/user/entities/user-preferences.entity.ts): **92%** coverage. Lines 75-77 are uncovered (the `rehydrate` function is not tested).
3. [request-logger.middleware.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/interface/http/middlewares/request-logger.middleware.ts): **86.95%** coverage. Lines 43, 50, 52 are uncovered (logging errors/warnings and reporting slow requests).
4. [user-history.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/mappers/user/user-history.mapper.ts): **0%** coverage (no unit test suite exists).

## Scope

### Expected Changes

#### [MODIFY] [create-accounting-entity.usecase.spec.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/usecases/__specs__/create-accounting-entity.usecase.spec.ts)

- Add a unit test verifying that `createAccountingEntityUseCase` throws `InternalServerError` if the bootstrapped accounts and history audits match in count but have mismatched entity IDs.

#### [MODIFY] [user-preferences.entity.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/user/entities/__tests__/user-preferences.entity.test.ts)

- Add a new `describe('rehydrate')` block to test success and failure paths for the `rehydrate` function.

#### [NEW] [user-history.mapper.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/mappers/user/__tests__/user-history.mapper.test.ts)

- Create a unit test suite to test mapping domain user histories to database user profiles.

#### [MODIFY] [request-logger.middleware.spec.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/interface/http/middlewares/__specs__/request-logger.middleware.spec.ts)

- Add tests for server errors (>= 500), client errors (>= 400 and < 500), and slow requests (duration exceeding the threshold).

## Proposed Approach

### Step 1: Cover create-accounting-entity.usecase.ts

- In `create-accounting-entity.usecase.spec.ts`, add a test case where:
  - `bootstrapHeaderAccounts` for asset accounts returns an account with ID A and an audit history with ID B.
  - Assert that the use case rejects with `app_error_internal_server_error`.

### Step 2: Cover user-preferences.entity.ts

- In `user-preferences.entity.test.ts`, add a `describe('rehydrate')` test block:
  - Test that `rehydrate` reconstructs a frozen entity correctly given valid inputs.
  - Test that `rehydrate` throws an error if given an invalid UUID.

### Step 3: Cover user-history.mapper.ts

- Create `src/infra/persistence/mappers/user/__tests__/user-history.mapper.test.ts`.
- Follow the structure of `accounting-entity-history.mapper.test.ts` to map a user history object to the repo representation.

### Step 4: Cover request-logger.middleware.ts

- In `request-logger.middleware.spec.ts`, spy on `performance.now` to mock test request duration.
- Write tests for:
  - **Server Error (statusCode 500):** Verify `logger.error` is called.
  - **Client Error (statusCode 400):** Verify `logger.warn` is called.
  - **Slow Request:** Verify `logger.warn` and `reporter.report` are called.

## Test Plan

We will run the corresponding Jest unit tests for each file and collect coverage.

## Verification

Run the following commands:

```bash
./node_modules/.bin/jest src/app/accounting/usecases/__specs__/create-accounting-entity.usecase.spec.ts --collectCoverageFrom=src/app/accounting/usecases/create-accounting-entity.usecase.ts --coverage
./node_modules/.bin/jest src/domain/user/entities/__tests__/user-preferences.entity.test.ts --collectCoverageFrom=src/domain/user/entities/user-preferences.entity.ts --coverage
./node_modules/.bin/jest src/infra/persistence/mappers/user/__tests__/user-history.mapper.test.ts --collectCoverageFrom=src/infra/persistence/mappers/user/user-history.mapper.ts --coverage
./node_modules/.bin/jest src/interface/http/middlewares/__specs__/request-logger.middleware.spec.ts --collectCoverageFrom=src/interface/http/middlewares/request-logger.middleware.ts --coverage
```

## Completion Criteria

- All unit tests pass.
- 100% test coverage is reported for the four target files.
- The project type-checks and lint checks successfully.
