# Journal Entry Coverage Plan

## Goal

Achieve 100% test coverage on three target files:

- [journal-entry.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/mappers/journal-entry.mapper.ts)
- [journal-entry.service.helpers.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/helpers/journal-entry.service.helpers.ts)
- [journal-entry.entity.helpers.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts)

Preserve unrelated staged and working-tree changes during implementation.

## Context

1. **journal-entry.mapper.ts**: Currently has 80% branch coverage. The truthy path for the `voidedAt` date field in `toDomain` (line 34) and `toRepo` (line 53) is not covered because the existing tests in [journal-entry.mapper.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-entry.mapper.test.ts) only pass `null` or undefined for `voidedAt`.
2. **journal-entry.service.helpers.ts**: Currently has 94.11% statement / 91.66% branch coverage. The error throw on line 60 (`EffectiveDateIsBeforeOpeningDate`) is never tested. Furthermore, there is an inverted logic bug in line 56:
   ```typescript
   dateUtils.isLessThan(acc.openingBalanceDate, header.effectiveDate);
   ```
   This filters out accounts whose opening balance date is _before_ the entry's effective date (which is actually a valid state, not an error). It should be:
   ```typescript
   dateUtils.isLessThan(header.effectiveDate, acc.openingBalanceDate);
   ```
3. **journal-entry.entity.helpers.ts**: Currently has 96.15% statement / 91.66% branch coverage. The truthy check branch in `validateVoidedAt` (line 127) is not covered because it has never been invoked with a non-null/non-undefined value.

## Confirmed Findings

1. **Bug in journal-entry.service.helpers.ts**: The `validateAccounts` helper incorrectly filters out accounts with an opening balance date that is less than (i.e. before) the journal entry's effective date and throws `EffectiveDateIsBeforeOpeningDate`. This inverted date comparison was hidden because the only test case set the opening balance date to be exactly equal to the effective date.
2. **Missing Unit Tests**: There are no dedicated test files for both `journal-entry.service.helpers.ts` and `journal-entry.entity.helpers.ts`. We will introduce dedicated unit test suites for these files to test each helper method systematically.

## Scope

### Expected Changes

- [journal-entry.mapper.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-entry.mapper.test.ts) — Modify to add test cases covering non-null/truthy `voidedAt` dates.
- [journal-entry.service.helpers.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/helpers/journal-entry.service.helpers.ts) — Modify to fix the inverted `isLessThan` logic in the opening balance date comparison.
- [journal-entry.service.helpers.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/helpers/__tests__/journal-entry.service.helpers.test.ts) [NEW] — Create a dedicated unit test suite for the service helper.
- [journal-entry.entity.helpers.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/entities/helpers/__tests__/journal-entry.entity.helpers.test.ts) [NEW] — Create a dedicated unit test suite for the entity helper.

## Proposed Approach

### Phase 1: Mapper Tests Update

- In `journal-entry.mapper.test.ts`, add test cases under the `toRepo` and `toDomain` blocks where `voidedAt` is mapped and verified with a concrete `Date` value (truthy).

### Phase 2: Service Helpers Bug Fix & New Test Suite

- Fix the logic in `journal-entry.service.helpers.ts` to check if `header.effectiveDate` is less than `acc.openingBalanceDate` instead of vice versa.
- Create `journal-entry.service.helpers.test.ts` to test all checks inside `validateAccounts`:
  - Valid receipt payload (no throw)
  - `InvalidSourceType` when a source line account is not a revenue or liability account
  - `InvalidDestinationAccount` when a destination line account is not a cash or equivalent asset account
  - `InvalidAccountingEntity` when any account's `accountingEntityId` differs from `header.accountingEntityId`
  - `ControlAccountNotAllowed` when any account has `isControlAccount: true`
  - `EffectiveDateIsBeforeOpeningDate` when `openingBalanceDate` is null
  - `EffectiveDateIsBeforeOpeningDate` when `header.effectiveDate` is before `acc.openingBalanceDate` (after logic fix)

### Phase 3: Entity Helpers New Test Suite

- Create `journal-entry.entity.helpers.test.ts` to test each exported helper function:
  - `validateStatus`: valid status vs invalid status (throws `InvalidStatus`)
  - `validateTransition`: valid status transition vs invalid status transition (throws `InvalidStatusTransition`)
  - `validateLine`:
    - Valid debit/credit line set (sums are balanced, no throw)
    - Less than 2 lines (throws `InvalidLineItems`)
    - Missing debit or credit lines (throws `InvalidLineItems`)
    - Unbalanced debits/credits (throws `UnbalancedJournalEntry`)
    - Duplicate sequence orders (throws `DuplicateSequenceOrders`)
    - Line item side not Debit/Credit (throws `InvalidJournalLineItem` by passing an invalid side string)
  - `getMemo`: null/empty memo vs valid memo vs too-long memo (throws `InvalidMemo`)
  - `validateSourceType`: valid source type vs invalid source type (throws `InvalidSourceType`)
  - `validateCounterpartyId`:
    - Transfer with counterpartyId (throws `CounterpartyIdNotAllowed`)
    - Invalid UUID format (throws `InvalidCounterpartyId`)
    - Valid counterpartyId (no throw)
  - `validatePostedAt`: null/undefined vs valid Date vs invalid Date (throws `InvalidPostingDate`)
  - `validateVoidedAt`: null/undefined vs valid Date vs invalid Date (throws `InvalidVoidedAt`)
  - `validateVoidingEntryId`: null/undefined vs valid UUID vs invalid UUID (throws `InvalidValue`)

## Test Plan

- **Unit tests**: Run the unit test suites for journal entries:
  - `npm test -- --coverage --collectCoverageFrom="src/domain/journal-entry/services/helpers/journal-entry.service.helpers.ts" --collectCoverageFrom="src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts" --collectCoverageFrom="src/infra/persistence/repos/journal-entry/mappers/journal-entry.mapper.ts" --runInBand`

## Verification

```bash
npm test -- --runInBand
npm run lint
npm run build
```

## Completion Criteria

- All three files achieve 100% Statements, Branch, Functions, and Line coverage.
- All new and existing unit tests pass.
- Code lints and builds successfully.
