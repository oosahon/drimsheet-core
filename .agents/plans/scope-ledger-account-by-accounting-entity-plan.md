# Scope Ledger Account queries by Accounting Entity Plan

## Goal

Ensure that all ledger account retrievals via `findById` in `ILedgerAccountRepo` are properly scoped by `accountingEntityId` to maintain tenant isolation boundary. The plan is implementation-ready.

## Context

Currently, the `findById` method in `src/domain/ledger/shared/repos/ledger-account.repo.ts` takes only the account `id` and `options`, which does not scope the search to the current `accountingEntityId` (tenant boundary). The underlying Drizzle repository implementation `src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts` retrieves the account solely by its UUID `id`. This creates a vulnerability where cross-tenant account lookup is possible if an ID is leaked or guessed.

We will update `findById` in both the repo contract and its implementation to accept `accountingEntityId`, adjust all call-sites and tests accordingly, and run verification.

## Confirmed Findings

1. **Lack of Tenant Scoping in `findById`.** The interface [ledger-account.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/ledger/shared/repos/ledger-account.repo.ts) and the implementation [ledger-account.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts) define `findById(id: TEntityId, options: IReadRepoOptions)` which queries the database filtering only on `ledgerAccountsInCore.id`.
2. **Call-sites.** The method `findById` is called in the following use cases and services:
   - [create-opening-balance.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/journal-entry/usecases/create-opening-balance.usecase.ts)
   - [create-receipt.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/journal-entry/usecases/create-receipt.usecase.ts)
   - [ledger-account-balance-propagation.service.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/services/ledger-account-balance-propagation.service.ts)
   - [adjust-ledger-account-balance.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/usecases/adjust-ledger-account-balance.usecase.ts)
   - [get-account-transactions.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/usecases/get-account-transactions.usecase.ts)
   - [get-ledger-account.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/usecases/get-ledger-account.usecase.ts)

## Scope

### Expected Changes

- `src/domain/ledger/shared/repos/ledger-account.repo.ts` — Update interface signature of `findById`.
- `src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts` — Update query query constraints to include `accountingEntityId`.
- `src/app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto.ts` — Add `accountingEntityId` to the balance adjustment DTO interface.
- `src/app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto.validation.ts` — Update Zod validation schema to validate `accountingEntityId`.
- Call-sites and tests (as listed in Proposed Approach).

### Out of Scope

- Changes to `findAllByIds` or other queries since they do not directly lookup single entities by id under a tenant boundary, or are otherwise verified.

## Proposed Approach

### Step 1: Update Repo Contract and Implementation

- Modify [ledger-account.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/ledger/shared/repos/ledger-account.repo.ts) signature:
  ```typescript
  findById(
    id: TEntityId,
    accountingEntityId: TEntityId,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount | null>;
  ```
- Modify [ledger-account.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts):
  ```typescript
  findById: async (id, accountingEntityId, options) => {
    ...
    .where(
      and(
        eq(ledgerAccountsInCore.id, id),
        eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId)
      )
    );
  ```

### Step 2: Update Use Cases and Services call-sites

- **`create-opening-balance.usecase.ts`**: Pass `accountingEntity.id` as the second argument.
- **`create-receipt.usecase.ts`**: Pass `accountingEntity.id` for both source and line account find calls.
- **`ledger-account-balance-propagation.service.ts`**: Pass `journalEntry.accountingEntityId` as the second argument to `findById`.
- **`adjust-ledger-account-balance.usecase.ts`**: Add `accountingEntityId` to the DTO and validation, and pass it to `findById`.
- **`get-account-transactions.usecase.ts`**: Retrieve `accountingEntity` from `appContext` and pass `accountingEntity.id` to `findById`.
- **`get-ledger-account.usecase.ts`**: Pass `accountingEntity.id` to `findById`.

### Step 3: Update Test Mocks and Specs

- Update mock expectation and arguments inside:
  - `src/app/journal-entry/usecases/__specs__/create-opening-balance.usecase.spec.ts`
  - `src/app/ledger/services/__specs__/ledger-account-balance-propagation.service.spec.ts`
  - `src/app/ledger/usecases/__specs__/adjust-ledger-account-balance.usecase.spec.ts`
  - `src/app/ledger/usecases/__specs__/get-account-transactions.usecase.spec.ts`
  - `src/app/ledger/usecases/__specs__/get-ledger-account.usecase.spec.ts`

## Test Plan

- Run usecase and service unit tests to ensure that mock parameters match the new signature:
  - `npm test src/app/ledger`
  - `npm test src/app/journal-entry`

## Verification

```bash
npm test src/app/ledger
npm test src/app/journal-entry
```

## Completion Criteria

- All ledger account lookups via `findById` receive and filter by `accountingEntityId`.
- No compilation/type errors in use cases or tests.
- All automated tests run and pass successfully.
