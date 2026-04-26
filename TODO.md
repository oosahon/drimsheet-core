# Branch Analysis Report: `chore/pur-62` vs `main`

Based on the review of the changes introduced in this branch, here is the assessment covering test coverage gaps, hidden bugs, and positive architectural patterns.

## 1. What are we failing to write automated tests for?

While the test coverage report shows 100% for the executed suites, several newly created files (primarily orchestrators and infrastructure) were completely omitted from the test runs because they lack corresponding `__tests__` or `__specs__` files:

- **Use Cases:**
  - `src/app/usecases/accounting/adjust-balance-after-journal-entry.usecase.ts`
  - `src/app/usecases/accounting/create-ledger-account-balance.usecase.ts`
- **Mappers:**
  - `src/app/mappers/ledger-account-balance.mapper.ts`
- **Event Handlers:**
  - `src/app/handlers/journal-entry/journal-entry-created-event.handler.ts`
- **Workers (Infrastructure):**
  - `src/infra/messaging/jobs/workers/ledger-account-balance-adjustment.worker.ts`
- **Repositories (Infrastructure):**
  - `src/infra/persistence/repos/ledger-account-balance.repo.impl.ts` (Though `.mock.ts` was updated, the actual Drizzle implementation isn't tested against a live or test DB schema).

> \[!WARNING]\
> Because these files orchestrate the new event-driven balance adjustment logic, omitting tests for them hides the bugs detailed below.

---

## 2. Hidden bugs that may come back to bite us

### A. Fatal BullMQ Optimistic Concurrency (OCC) Retry Loop

The system correctly implements OCC (checking DB versions during updates), but the worker logic breaks the retry mechanism.

- **The Bug:** `makeRecursiveAdjustments` calculates the _exact_ `newBalance` amount and increments the `version` synchronously in memory, then enqueues this payload. If the worker's DB update fails due to a version mismatch (OCC failure), BullMQ retries the job. However, it retries with the **exact same pre-calculated `newBalance` and stale `expectedVersion`**.
- **The Impact:** The retry will permanently fail because the DB version has already advanced. The job will exhaust its attempts, land in the Dead Letter Queue, and the ledger account balance will permanently be out of sync.
- **The Fix:** The worker must re-fetch the latest balance from the DB, dynamically apply the `adjustment.amount` delta, and then attempt the save, rather than relying on a pre-calculated `newBalance` from the job payload.

### B. BullMQ JobId Deduplication Silently Dropping Adjustments

- **The Bug:** In `adjust-balance-after-journal-entry.usecase.ts`, if a single journal entry affects multiple sub-accounts that share the same parent account, `makeRecursiveAdjustments` generates separate adjustment payloads for that parent account. When enqueued, they use the `jobId` format: `ledger-account-balance-adjustment_${ledgerAccountId}_${correlationId}`.
- **The Impact:** Because they share the exact same `correlationId` and parent `ledgerAccountId`, BullMQ will silently deduplicate and drop the subsequent adjustments. The parent account's balance will only reflect the first sub-account's effect.
- **The Fix:** Aggregate all adjustments for the same `ledgerAccountId` within the use case _before_ enqueueing, or make the `jobId` unique per adjustment line.

### C. Fire-and-Forget Queue Insertion

- **The Bug:** In `adjust-balance-after-journal-entry.usecase.ts`, `queue.addLedgerAccountBalanceAdjustment` is called inside a standard `.forEach()` loop without `await` or `Promise.all()`.
- **The Impact:** If the Node process is terminated or crashes immediately after this synchronous loop completes, the asynchronous Redis insertions may be lost, leading to missing balance updates.

### D. Incomplete Decoupling of Petty Cash Creation

- **The Bug:** A previous conversation indicated a goal to resolve a race condition by decoupling the petty cash account creation from its opening balance journal entry. However, in `create-petty-cash-sub-account.usecase.ts`, both operations are still happening synchronously and are committed within the same database transaction.
- **The Impact:** Furthermore, the synchronous creation publishes a `LedgerAccountCreated` event, which triggers `createLedgerAccountBalance.usecase.ts`. This handler redundantly attempts to create a balance that was already synchronously created in the main transaction (though it safely skips due to a uniqueness check, it represents wasted compute).

---

## 3. What are we doing well?

### A. Event-Driven Background Processing

Moving the ledger balance aggregations to an asynchronous BullMQ worker correctly isolates the heavy, recursive parent-account updates. This unblocks the main request cycle and ensures the API remains highly responsive during complex journal entry postings.

### B. Domain Purity and Financial Type Safety

The implementation heavily leverages `IMoney` value objects and factory methods (`moneyValue.add`, `moneyValue.makeZeroAmount`) for all financial computations. This completely sidesteps floating-point rounding errors and enforces strict type safety without relying on `any`.

### C. Foundation for Optimistic Concurrency Control

Adding the `version` column to `ledger_account_balances` and strictly validating it during updates (`rowCount === 0`) is the correct architectural pattern for a financial ledger. Once the retry payload logic is fixed (as noted in 2A), this will guarantee rock-solid consistency against race conditions.

### D. Domain Layer Test Coverage

The `yarn test --coverage` run successfully verified the core domain entities, factories, and rules with 100% coverage. The tests for `get-balance-effect.rule.ts` and `accounting.service.ts` ensure the fundamental accounting double-entry logic behaves correctly.
