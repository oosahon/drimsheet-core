# Improve Test Coverage Plan

## Goal

Achieve 100% test coverage on the requested list of files:

- `src/shared/utils/sanitizer.ts`
- `src/shared/helpers/validate-version-in-repo.ts`
- `src/shared/helpers/passon-repo-transaction.ts`
- `src/shared/helpers/drizzle-filters.ts`
- `src/interface/http/middlewares/is-optional-authenticated-user.middleware.ts`
- `src/interface/http/middlewares/is-authenticated-user.middleware.ts`
- `src/interface/http/middlewares/accounting-entity-access.middleware.ts`
- `src/infra/persistence/mappers/accounting/reporting-period-history.mapper.ts`
- `src/infra/persistence/mappers/accounting/reporting-context-history.mapper.ts`
- `src/infra/persistence/mappers/accounting/fiscal-year-history.mapper.ts`
- `src/infra/persistence/mappers/accounting/accounting-period-history.mapper.ts`
- `src/infra/persistence/mappers/accounting/accounting-entity-history.mapper.ts`
- `src/infra/persistence/cache/cache-storage.impl.ts` (tested by `src/infra/persistence/cache/__specs__/cache-storage.impl.spec.ts`)
- `src/domain/user/entities/helpers/user.entity.helpers.ts`
- `src/app/notification/services/transaction-email.service.ts`
- `src/app/notification/templates/email-verification-email.ts`
- `src/app/notification/templates/password-reset-request-email.ts`
- `src/app/auth/usecases/reset-password.usecase.ts`
- `src/app/auth/usecases/verify-email.usecase.ts`
- `src/app/auth/services/token.service.ts`
- `src/app/auth/services/password.service.ts`

## Context

The repository uses Jest as its test runner. The unit tests reside in folders named `__specs__` or `__tests__` adjacent to the files being tested. Many of the targeted files either lack test suites entirely or have small uncovered branches (such as error cleanups, parameter validation edge cases, or exception blocks). We will write focused unit tests to exercise all branches.

## Scope

### Expected Changes

We will modify or create the following spec files to achieve 100% coverage on their respective implementation files:

- `src/shared/utils/__specs__/sanitizer.spec.ts` — cover exception handling, regex matching, and diverse input types.
- `src/shared/helpers/__specs__/drizzle-filters.spec.ts` [NEW] — cover pagination sorting.
- `src/shared/helpers/__specs__/passon-repo-transaction.spec.ts` [NEW] — cover transactional context passing.
- `src/shared/helpers/__specs__/validate-version-in-repo.spec.ts` [NEW] — cover expected version verification.
- `src/interface/http/middlewares/__specs__/is-optional-authenticated-user.middleware.spec.ts` [NEW] — cover basic optional authentication middleware.
- `src/interface/http/middlewares/__specs__/is-authenticated-user.middleware.spec.ts` [NEW] — cover unauthorized, forbidden, and authorized paths.
- `src/interface/http/middlewares/__specs__/accounting-entity-access.middleware.spec.ts` [NEW] — cover validateAccess and next() invocation.
- `src/infra/persistence/mappers/accounting/__specs__/reporting-period-history.mapper.spec.ts` [NEW] — cover mapping reporting period history.
- `src/infra/persistence/mappers/accounting/__specs__/reporting-context-history.mapper.spec.ts` [NEW] — cover mapping reporting context history.
- `src/infra/persistence/mappers/accounting/__specs__/fiscal-year-history.mapper.spec.ts` [NEW] — cover mapping fiscal year history.
- `src/infra/persistence/mappers/accounting/__specs__/accounting-period-history.mapper.spec.ts` [NEW] — cover mapping accounting period history.
- `src/infra/persistence/mappers/accounting/__specs__/accounting-entity-history.mapper.spec.ts` [NEW] — cover mapping accounting entity history.
- `src/infra/persistence/cache/__specs__/cache-storage.impl.spec.ts` — implement mock-Redis based storage unit tests.
- `src/domain/user/entities/helpers/__tests__/user.entity.helpers.test.ts` [NEW] — cover user validation rules.
- `src/app/notification/services/__specs__/transaction-email.service.spec.ts` [NEW] — cover verify email and reset password link dispatching.
- `src/app/notification/templates/__specs__/email-verification-email.spec.ts` [NEW] — cover template HTML placeholder replacement.
- `src/app/notification/templates/__specs__/password-reset-request-email.spec.ts` [NEW] — cover template HTML placeholder replacement.
- `src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts` — add test case for claim release cleanup error path.
- `src/app/auth/usecases/__specs__/verify-email.usecase.spec.ts` — add test case for generic error rethrowing.
- `src/app/auth/services/__specs__/token.service.spec.ts` — add test cases for claim release and concurrent claim conflicts.

## Proposed Approach

### Step 1: Shared Primitives and Utilities

- Update `src/shared/utils/__specs__/sanitizer.spec.ts` to add test cases for:
  - Null and undefined values passed to `sanitizeData`.
  - Non-object, Date, RegExp, and Buffer values passed to `sanitizeData`.
  - A plain string matching `SENSITIVE_TEXT_REGEX` (e.g., `"password=123"`).
  - Simulating an exception in `new URLSearchParams()` using a spy.
- Create spec files for `drizzle-filters.ts`, `passon-repo-transaction.ts`, and `validate-version-in-repo.ts` testing all input branches.

### Step 2: History Mappers

- Create unit test spec files for the 5 remaining history mappers under `src/infra/persistence/mappers/accounting/__specs__/`. Each will assert that `toRepo()` correctly transforms the domain model and history audit records into the corresponding Drizzle schema format.

### Step 3: Cache Storage

- Write tests in the empty `src/infra/persistence/cache/__specs__/cache-storage.impl.spec.ts` file. Mock the Redis client from `redis.config` to assert correct call invocations for `set`, `setIfNotExists`, `deleteIfValueMatches`, `get`, and `del`.

### Step 4: User Entity Helpers

- Create `src/domain/user/entities/helpers/__tests__/user.entity.helpers.test.ts`. Cover scenarios for valid user, deleted user (assert throw), invalid ID (assert throw), and invalid names (assert throw).

### Step 5: Email templates and services

- Create spec files for `email-verification-email.ts` and `password-reset-request-email.ts` to verify they generate the correct HTML strings.
- Create `src/app/notification/services/__specs__/transaction-email.service.spec.ts` to mock `ITransactionalEmailQueue` and cover the two email dispatch methods, which also exercise HTML escaping.

### Step 6: Authentication Services and Use Cases

- In `token.service.spec.ts`, cover `releaseSignupTokenClaim` and adding a signup token claim when one already exists.
- In `verify-email.usecase.spec.ts`, cover rethrowing of non-Auth/User errors.
- In `reset-password.usecase.spec.ts`, mock the token service to throw when releasing a claim, ensuring the cleanup error is caught and reported to the reporter.

### Step 7: Middlewares

- Create spec files for optional auth, user auth, and accounting entity access middlewares. Test all branches including unauthorized/forbidden throws and normal next() continuation.

## Test Plan

All tests are unit tests and will run locally in standard sandbox mode without requiring database or redis connections (using Jest mocks).

## Verification

We will verify by running the individual spec files and checking the coverage reports:

```bash
./node_modules/.bin/jest src/shared/utils/__specs__/sanitizer.spec.ts --coverage --collectCoverageFrom="src/shared/utils/sanitizer.ts"
./node_modules/.bin/jest src/shared/helpers --coverage --collectCoverageFrom="src/shared/helpers/**/*.ts"
./node_modules/.bin/jest src/interface/http/middlewares --coverage --collectCoverageFrom="src/interface/http/middlewares/*.ts"
./node_modules/.bin/jest src/infra/persistence/mappers/accounting --coverage --collectCoverageFrom="src/infra/persistence/mappers/accounting/*-history.mapper.ts"
./node_modules/.bin/jest src/infra/persistence/cache/__specs__/cache-storage.impl.spec.ts --coverage --collectCoverageFrom="src/infra/persistence/cache/cache-storage.impl.ts"
./node_modules/.bin/jest src/domain/user/entities/helpers/__tests__/user.entity.helpers.test.ts --coverage --collectCoverageFrom="src/domain/user/entities/helpers/user.entity.helpers.ts"
./node_modules/.bin/jest src/app/notification --coverage --collectCoverageFrom="src/app/notification/**/*.ts"
./node_modules/.bin/jest src/app/auth --coverage --collectCoverageFrom="src/app/auth/services/token.service.ts" --collectCoverageFrom="src/app/auth/usecases/verify-email.usecase.ts" --collectCoverageFrom="src/app/auth/usecases/reset-password.usecase.ts"
```

## Completion Criteria

- All targeted files reach 100% statement, branch, function, and line coverage.
- All newly added and existing unit tests pass successfully.
- Unrelated files remain unchanged.
