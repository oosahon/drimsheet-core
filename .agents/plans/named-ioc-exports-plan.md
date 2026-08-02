# Named IoC Exports Plan

## Goal

Replace default-exported aggregate objects in `src/infra/ioc/*` with named exports for each wired service, use case, worker, and handler entrypoint.

This plan is implementation-ready. The migration should preserve unrelated staged and working-tree changes, keep IoC modules as wiring-only modules, and avoid behavior changes in app, domain, interface, persistence, or messaging code.

## Context

The repository rule for Inversion of Control says IoC modules compose dependencies and should not become behavioral services, handlers, or use cases. It also warns that exported IoC collections should be named for what they contain.

Current IoC modules often construct several dependencies and default-export one object, such as `ledgerUseCases`, `ledgerServices`, `authUseCase`, and `ledgerWorkers`. This makes the exports read as collective facades even though each property is an independently wired dependency.

`src/infra/ioc/usecases/money.ts` and `src/infra/ioc/services/journal-entry.ts` already use named exports, so they provide the closest local pattern for the target style.

## Confirmed Findings

1. **Most IoC modules still default-export aggregates.** `src/infra/ioc/services/accounting.ts`, `src/infra/ioc/services/auth.ts`, `src/infra/ioc/services/counterparty.ts`, `src/infra/ioc/services/fx-lot-cost-basis.ts`, `src/infra/ioc/services/ledger.ts`, `src/infra/ioc/services/money.ts`, `src/infra/ioc/services/notification.ts`, `src/infra/ioc/services/repo.ts`, `src/infra/ioc/usecases/accounting.ts`, `src/infra/ioc/usecases/auth.ts`, `src/infra/ioc/usecases/counterparty.ts`, `src/infra/ioc/usecases/journal-entry.ts`, `src/infra/ioc/usecases/ledger.ts`, `src/infra/ioc/usecases/user.ts`, and all worker IoC modules currently default-export an object or single binding.
2. **Some IoC modules already use named exports.** `src/infra/ioc/services/journal-entry.ts` exports `journalEntryService` and `journalEntryPersistenceService`; `src/infra/ioc/usecases/money.ts` exports `currencyUseCase` and `exchangeRateUseCases`; `src/infra/ioc/handlers/user.ts` exports `userEventsRegistry`.
3. **Runtime consumers import aggregates directly.** Controllers, middlewares, worker registries, OAuth config, bootstrap files, and messaging consumers import default IoC modules and dereference properties, for example `ledgerUseCases.createBankAccount`, `authUseCase.loginWithEmail`, `authService.token`, and `ledgerWorkers.ledgerAccountBalanceAdjustment`.
4. **HTTP tests mock default IoC modules.** Specs under `test/http/**` import and mock default exports from `src/infra/ioc/services/auth` and several `src/infra/ioc/usecases/*` modules. These mocks will need to move to named-export module shapes.
5. **The requested ledger worker target is straightforward.** `src/infra/ioc/workers/ledger.ts` can export `ledgerAccountBalanceAdjustmentWorker` directly after calling `makeLedgerAccountBalanceAdjustmentWorker`, and import `adjustLedgerAccountBalance` directly from the ledger use-case IoC module.

## Scope

### Expected Changes

- `src/infra/ioc/services/*.ts` — export each constructed service as a named const, including singletons like `repoService`, `passwordService`, `tokenService`, `transactionalEmailService`, `exchangeRateService`, and domain or persistence services.
- `src/infra/ioc/usecases/*.ts` — export each wired use case as a named const, for example `createAccountingEntity`, `loginWithEmail`, `createCounterparty`, `createOpeningBalance`, `adjustLedgerAccountBalance`, and `getAuthUserProfile`.
- `src/infra/ioc/workers/*.ts` — export each worker as a named const, for example `ledgerAccountBalanceAdjustmentWorker`, `exchangeRateIngestionWorker`, and `transactionalEmailWorker`.
- `src/infra/ioc/handlers/user.ts` — optionally export `userEmailVerifiedEventHandler` as a named handler and keep `userEventsRegistry` as the event registry because the registry is an intentional event-name map.
- `src/interface/**`, `src/infra/**`, and `test/http/**` import sites — replace default aggregate imports with named imports and update property dereferences.

### Conditional Changes

- Type-only helper aliases may be added if the compiler needs stable function types for Jest mocks after named-export migration.
- Barrel files should be added only if there is an existing local import pattern that justifies them; otherwise, import from the specific IoC module.

### Out of Scope

- Renaming IoC files.
- Moving behavior between domain, app, interface, and infra layers.
- Extracting new services or changing service/use-case contracts.
- Changing transaction ownership, event publication, queues, repositories, or observability semantics.

## Proposed Approach

### 1. Establish Export Naming

- Use the post-wiring capability name as the exported binding.
- Prefer names that include enough domain context when the generic property name would be ambiguous outside the old aggregate:
  - `accountingEntityService`, `accountingPeriodService`
  - `passwordService`, `tokenService`
  - `counterpartyService`, `counterpartyPersistenceService`
  - `fxCostBasisLotService`, `fxCostBasisPersistenceService`
  - `assetAccountService`, `ledgerAccountPersistenceService`, `accountsBootstrapService`, `ledgerAccountBalancePropagationService`
  - `exchangeRateService`, `transactionalEmailService`, `repoService`
- For use cases and workers, keep existing property names when they are already clear, and add the layer suffix only where needed for clarity:
  - `getBanks`, `getLedgerAccounts`, `adjustLedgerAccountBalance`
  - `signupWithEmail`, `loginWithEmail`, `refreshAccessToken`
  - `ledgerAccountBalanceAdjustmentWorker`, `exchangeRateIngestionWorker`, `transactionalEmailWorker`

### 2. Migrate Service IoC First

- Convert each service module from:

```ts
const ledgerServices = Object.freeze({
  assetAccount,
  persistence,
});

export default ledgerServices;
```

to direct named exports:

```ts
export const assetAccountService = makeAssetAccountService(...);
export const ledgerAccountPersistenceService = makeLedgerAccountPersistenceService(...);
```

- Update dependent IoC modules to import the named services directly.
- Keep factories invoked exactly once at module load, preserving current singleton wiring behavior.

### 3. Migrate Use-Case IoC

- Export each use case immediately after wiring, matching the requested style:

```ts
export const adjustLedgerAccountBalance = makeAdjustLedgerAccountBalanceUseCase(
  {
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
  }
);
```

- Update controllers, middlewares, OAuth config, workers, and tests to import the specific use cases they call.
- Preserve existing helper exports such as the Google OAuth helper, but rename from `makeGoogleOAuthHelper` if needed so the exported value does not read like an unwired factory.

### 4. Migrate Worker and Handler IoC

- Export workers by their concrete wired names. For the requested ledger worker, use:

```ts
export const ledgerAccountBalanceAdjustmentWorker =
  makeLedgerAccountBalanceAdjustmentWorker({
    reporter: observability.reporter,
    adjustLedgerAccountBalance,
  });
```

- Update worker registries and consumers to import named workers.
- Keep `userEventsRegistry` as a named registry export because it is intentionally a lookup keyed by domain event names, not a convenience aggregate.

### 5. Update Tests and Mocks

- Replace default imports in `test/http/**` with named imports.
- Update `jest.mock` factories to expose named bindings rather than `default`.
- Prefer mocking only the named dependency exercised by a spec where practical, while avoiding broad test rewrites unrelated to this migration.

## Test Plan

- **Unit or component:** no new behavior tests are required because this is an IoC export-shape migration. Existing HTTP/controller specs provide regression coverage for import and mock compatibility.
- **Regression:** run the HTTP specs that mock IoC modules, plus type checking or the repository's standard test command, to catch stale default imports and broken Jest module factories.

## Verification

Focused checks should confirm there are no remaining default exports under IoC and no default imports from IoC modules:

```bash
rg "export default" src/infra/ioc
rg "import [A-Za-z0-9_]+ from ['\"].*infra/ioc" src test
```

Then run project validation:

```bash
uv run pytest
npm test -- --runInBand
npm run lint
npm run typecheck
```

Use the commands that exist in the repository scripts; if a command is unavailable, record the nearest successful focused validation.

## Assumptions

- Existing IoC aggregate object identity is not part of any public contract. Consumers only dereference properties from those objects, so named imports can replace them without behavior changes.
- Keeping factories at top level preserves current singleton construction order closely enough for runtime behavior and tests.

## Risks

- **Large import churn.** Many HTTP tests and controllers depend on default IoC modules. Mitigation: migrate service IoC first, then use-case IoC, then workers, running `rg` after each step.
- **Jest mock breakage.** Default mock factories differ from named export mock factories. Mitigation: update mocks in the same patch as their corresponding production imports and run focused HTTP specs.
- **Name ambiguity.** Old property names like `persistence` and `domain` are too vague as free-standing exports. Mitigation: include domain context in named exports.

## Completion Criteria

- `src/infra/ioc/**` has no `export default`.
- Production code has no default imports from `src/infra/ioc/**`.
- Tests import and mock named IoC exports.
- The ledger worker matches the requested named export shape.
- Focused `rg` checks pass and the selected test/type/lint verification commands complete successfully or documented unavailable commands are replaced with repository-supported equivalents.
