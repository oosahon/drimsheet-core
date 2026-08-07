# 100% Test Coverage for `cash-account.service.ts`

## Goal

Achieve 100% statement, branch, function, and line coverage for `cash-account.service.ts` by expanding the test suite in `cash-account.service.test.ts`. This is a test-only change.

## Context

The current test coverage for `cash-account.service.ts` stands at:

- Statements: 84.37%
- Branches: 70%
- Functions: 88.88%
- Lines: 84.37%

The uncovered regions include the `createHeader` method (lines 39-73) and several validator branches in the control account resolution step for `createBankSubAccount`.

## Confirmed Findings

1. **Uncovered `createHeader` method.** The `makeCreateHeader` factory and its returned method are completely untested.
2. **Untested bank control account validator branches.** The `createBankSubAccount` method uses a validator callback that checks control account properties (`type`, `subType`, `behavior`, `isControlAccount`), but the test suite does not exercise the failure cases of these conditions.

## Scope

### Expected Changes

- `src/domain/ledger/services/__tests__/cash-account.service.test.ts` — We will add tests here to exercise the uncovered branches and logic.

## Proposed Approach

### Add Test Cases

- **Import changes:** Import `ledgerAccountError` from `../../errors/ledger-account.error`.
- **Test `createHeader`:**
  - Test successful cash header account creation (verify code `'100000'`, materialized path `'100000'`, default behavior, and events).
  - Test validation error if the functional currency code is invalid.
  - Test throwing `HeaderAccountAlreadyExists` if the repository returns an existing header.
- **Test `createPettyCashSubAccount`:**
  - Test creating a petty cash account with `isControlAccount: true`.
  - Test throwing `ControlAccountNotFound` error explicitly if the control account is missing.
- **Test `createBankSubAccount`:**
  - Test creating a bank account with `isControlAccount: true`.
  - Test successful creation when the control account's behavior is `Bank`.
  - Test validator failure paths for bank control account checks (incorrect type, incorrect subType, incorrect behavior like `PettyCash`, and `isControlAccount: false`).
  - Test invalid bank details payload validations (country code, bank name, account name, account number).

## Test Plan

- **Unit:** Unit tests in `src/domain/ledger/services/__tests__/cash-account.service.test.ts`.

## Verification

```bash
./node_modules/.bin/jest src/domain/ledger/services/__tests__/cash-account.service.test.ts --coverage --collectCoverageFrom=src/domain/ledger/services/cash-account.service.ts
npm run lint
npm run build
```

## Completion Criteria

- Jest shows 100% statement, branch, function, and line coverage for `cash-account.service.ts`.
- `npm run lint` and `npm run build` run successfully.
