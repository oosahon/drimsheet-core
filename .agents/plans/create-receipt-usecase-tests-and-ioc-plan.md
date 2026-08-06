# Create Receipt Use Case Tests and IoC Plan

## Goal

Make `create-receipt` implementation-ready by completing focused use-case test
coverage and wiring the use case into the journal-entry IoC module.

This plan is implementation-ready. Preserve unrelated staged and working-tree
changes during implementation.

## Context

`src/app/journal-entry/usecases/create-receipt.usecase.ts` already orchestrates
receipt creation: it validates the request, reads app context, fetches the
source and destination ledger accounts, finds or creates counterparties, calls
`journalEntryService.createReceipt`, persists new counterparties and the journal
entry in one repository transaction, propagates ledger balances, publishes
counterparty events before journal-entry events, and returns an
`IJournalEntryDto`.

The existing receipt spec lives at
`src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts`, which
matches repository test naming rules for app-layer use cases. The nearby
opening-balance use case and spec provide the closest local pattern for
transaction, persistence, balance propagation, and failure tests.

The current journal-entry IoC module,
`src/infra/ioc/usecases/journal-entry.ts`, wires only
`createOpeningBalanceUseCase`. The dependencies required by `create-receipt`
already exist in nearby IoC service modules:
`counterpartyAppService` and `counterpartyPersistenceService` from
`src/infra/ioc/services/counterparty.ts`, `journalEntryService` and
`journalEntryPersistenceService` from
`src/infra/ioc/services/journal-entry.ts`,
`ledgerAccountBalancePropagationService` from `src/infra/ioc/services/ledger.ts`,
`repoService` from `src/infra/ioc/services/repo.ts`, `ledgerRepos.ledgerAccount`,
`appContext`, and `messaging.eventBus`.

## Confirmed Findings

1. **Incomplete use-case coverage.** The receipt spec currently has one test
   that verifies event ordering only. It does not assert payload mapping into
   `journalEntryService.createReceipt`, account lookup behavior, transaction
   persistence, counterparty persistence, balance propagation, DTO return value,
   or failure behavior.
2. **Missing IoC export.** `src/infra/ioc/usecases/journal-entry.ts` imports and
   exports only `createOpeningBalanceUseCase`; no `createReceiptUseCase` is
   wired for runtime use.
3. **Focused receipt spec currently passes.** Running
   `npm test -- src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts --runInBand`
   passed 1 test, so the immediate issue is missing/incomplete assertions rather
   than a reproduced red receipt spec.
4. **No current delivery integration was found.** Searching `src/interface`,
   `src/infra`, and `src/app` found no controller or route importing a receipt
   use case. Adding a new HTTP endpoint is therefore outside this plan unless a
   separate requirement asks for it.

## Scope

### Expected Changes

- `src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts` —
  expand focused coverage for successful orchestration, persistence, event
  publishing, DTO return mapping, and failure paths.
- `src/infra/ioc/usecases/journal-entry.ts` — import
  `makeCreateReceiptUsecase`, import the existing counterparty and journal-entry
  services required by the workflow, and export `createReceiptUseCase`.

### Conditional Changes

- `src/app/**/contracts/__mocks__/*.mock.ts` — update only if TypeScript shows a
  shared mock no longer satisfies its contract. Keep shared mocks as bare
  `jest.fn()` shapes with no default behavior.
- `src/interface/**` — change only if implementation discovers an existing
  receipt controller import target that already expects an IoC export.

### Out of Scope

- Creating a new receipt HTTP endpoint or controller action.
- Changing receipt domain behavior or journal-entry balancing rules.
- Refactoring `create-receipt.usecase.ts` unless test implementation exposes a
  concrete bug that must be fixed to satisfy existing behavior.

## Proposed Approach

### 1. Complete Receipt Use-Case Spec

- Add a local `getUseCase` helper to mirror the opening-balance spec and remove
  repeated dependency construction from each test.
- Keep contract mocks behavior-free; configure all default resolved values in
  `beforeEach` and override per test.
- Add a successful orchestration test that asserts:
  - `appContext.get` supplies `correlationId`, `idempotencyKey`, user, and
    accounting entity.
  - source and destination accounts are looked up with accounting entity ID and
    `{ correlationId, idempotencyKey }`.
  - `counterpartyAppService.findOrCreateMany` receives all provided
    counterparties and the same trace.
  - `journalEntryService.createReceipt` receives a receipt payload containing
    header context, mapped `Money` values, optional exchange-rate values, source
    account, destination account, and resolved counterparties.
  - `repoService.runInTransaction` is called, new counterparties are persisted
    with history inside the transaction, and `journalEntryPersistenceService`
    receives the journal entry plus generated history records.
  - balance propagation runs after the transaction with the full trace.
  - events are enriched/published after balance propagation and keep new
    counterparty events before journal-entry events.
  - the returned value equals `journalEntryDtoMapper.toDto(journalEntry)`.
- Add a success-path variant where `findOrCreateMany` returns only existing
  counterparties, and assert `counterpartyPersistenceService.create` is not
  called while journal-entry persistence still runs.
- Add failure tests for source account not found and destination account not
  found. Assert the use case rejects with `ledgerAppError.AccountNotFound` and
  does not create counterparties, call the journal-entry domain service, open a
  transaction, propagate balances, or publish events after the failed lookup.
- Add a failure test for `journalEntryService.createReceipt` rejecting. Assert no
  transaction, persistence, balance propagation, or event publishing occurs.
- Add a validation failure test using an invalid receipt payload shape. Assert no
  dependency beyond validation/app setup is invoked.

Ownership: validation remains app DTO validation, account existence failures are
app-layer ledger errors, receipt balancing and journal-line invariants remain in
the domain journal-entry service, transaction ownership stays in the
create-receipt use case, persistence stays in app persistence services, event
publication stays in the use-case workflow, and balance propagation stays in the
existing ledger app service.

### 2. Wire IoC

- Update `src/infra/ioc/usecases/journal-entry.ts` to import
  `makeCreateReceiptUsecase`.
- Import `counterpartyAppService` and `counterpartyPersistenceService` from
  `../services/counterparty`.
- Import `journalEntryService` alongside `journalEntryPersistenceService` from
  `../services/journal-entry`.
- Export `createReceiptUseCase = makeCreateReceiptUsecase({ ... })` with:
  `appContext`, `counterpartyAppService`, `journalEntryService`,
  `ledgerRepos.ledgerAccount`, `counterpartyPersistenceService`,
  `journalEntryPersistenceService`, `repoService`, `messaging.eventBus`, and
  `ledgerAccountBalancePropagationService`.

This follows the existing IoC rule: the use-case module injects repositories,
ports, transaction services, and already-constructed app/domain services; it
does not call service factories itself.

## Test Plan

- **Unit/component:** expand
  `src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts` for
  success, existing-counterparty, account-not-found, domain-service-failure, and
  validation-failure behavior.
- **Regression:** keep the existing event-order assertion, either as its own
  test or as a clear assertion inside the success test.

## Verification

Run focused checks first:

```bash
npm test -- src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts --runInBand
npm run build
npm run lint
npm run test:names
```

If the IoC change exposes broader journal-entry interactions, also run:

```bash
npm test -- src/app/journal-entry/usecases/__specs__ --runInBand
```

## Assumptions

- The use case should be exported from the existing journal-entry IoC module
  rather than a new IoC module, because receipt creation belongs to the same app
  area as opening-balance creation.
- No delivery/controller changes are required for this task because no current
  receipt controller import target was found.

## Risks

- Receipt orchestration has several ordered side effects. Mitigate by asserting
  the absence of persistence/publication on pre-transaction failures and by
  checking event order on success.
- The app context trace includes `idempotencyKey` for receipt but not for the
  older opening-balance use case. Mitigate by asserting the exact receipt trace
  passed into lookups, counterparty creation, domain creation, balance
  propagation, and event enrichment.

## Completion Criteria

- `createReceiptUseCase` is exported from `src/infra/ioc/usecases/journal-entry.ts`
  with all required dependencies injected from existing IoC modules.
- The receipt use-case spec covers successful orchestration, existing
  counterparties, missing source account, missing destination account,
  journal-entry creation failure, validation failure, transaction persistence,
  balance propagation, event publication order, and DTO return mapping.
- Focused receipt tests pass.
- Build, lint, and test-name checks pass or any infrastructure-dependent failure
  is documented with the failing command and reason.
- No unrelated files or behavior are changed.
