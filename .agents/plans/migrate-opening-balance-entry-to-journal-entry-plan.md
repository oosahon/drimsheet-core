# Migrate Opening-Balance Entry Creation to the Journal-Entry Service Plan

## Goal

Move the repository-backed opening-balance journal-entry creation capability into `journal-entry.service.ts` as `createOpeningBalance`, so receipt and opening-balance entry construction share one domain-service contract and rule-specification convention. The plan is implementation-ready. Preserve unrelated staged and working-tree changes during implementation.

## Context

`opening-balance-entry.service.ts` is explicitly marked `TODO: move to journal entry service`. It constructs the opening-balance entry and enforces control-account, duplicate-opening-balance, and configured-equity-account invariants. `journal-entry.service.ts` already constructs receipt entries and validates those entries against `receipt-entry.rule.ts` through the journal-entry rule validator. The existing opening-balance rule permits any source account and permits only an opening-balance equity destination, but the dedicated service does not currently apply that rule specification.

The opening-balance service has three production callers: the explicit opening-balance use case plus petty-cash and bank-account creation. All callers use the returned audited entry before their own persistence transaction, balance propagation, and event publication.

## Confirmed Findings

1. **Domain capability — the move keeps the correct owner.** Opening-balance creation coordinates domain state and queries only the ledger account and balance state needed to enforce domain invariants; it neither persists nor publishes events. `src/domain/journal-entry/services/opening-balance-entry.service.ts` and `src/domain/journal-entry/services/journal-entry.service.ts` therefore belong behind one `IJournalEntryService` capability.
2. **Caller-owned side effects must stay unchanged.** `src/app/journal-entry/usecases/create-opening-balance.usecase.ts`, `src/app/ledger/usecases/create-petty-cash-account.usecase.ts`, and `src/app/ledger/usecases/create-bank-account.usecase.ts` each retain responsibility for histories, transactions, persistence, balance propagation, and publishing.
3. **The source/destination rule model is reusable, but opening-balance-specific invariants are not receipt validation.** `src/domain/journal-entry/rules/opening-balance-entry.rule.ts` already specifies the allowed counterpart account. The opening-balance operation must retain its distinct checks and errors for a control account, an existing opening-balance date, an existing balance adjustment, and an unconfigured opening-balance equity account.
4. **The standalone contract is fully contained.** `IOpeningBalanceEntryService`, its payload type, factory, mock, test, IoC export, and all callers are confined to the journal-entry and ledger/application areas identified above; no HTTP contract or database migration is needed.

## Scope

### Expected Changes

- `src/domain/journal-entry/types/journal-entry.service.types.ts` — add the opening-balance payload and `IJournalEntryService.createOpeningBalance` contract.
- `src/domain/journal-entry/services/journal-entry.service.ts` — inject the two existing ledger repositories and implement `createOpeningBalance` beside `createReceipt`.
- `src/domain/journal-entry/services/helpers/journal-entry.service.helpers.ts` — make the rule-specification validation reusable for the opening-balance source/destination pair, without weakening receipt-specific account, date, or counterparty validation.
- `src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts` — move the opening-balance fixtures and coverage into the unified service specification and cover rule-driven validation.
- `src/app/journal-entry/usecases/create-opening-balance.usecase.ts`, `src/app/ledger/usecases/create-petty-cash-account.usecase.ts`, and `src/app/ledger/usecases/create-bank-account.usecase.ts` — depend on `IJournalEntryService` and call `createOpeningBalance`.
- Corresponding use-case specs and `src/app/journal-entry/contracts/__mocks__/journal-entry.service.mock.ts` — use the expanded shared journal-entry mock and assert the renamed call.
- `src/infra/ioc/services/journal-entry.ts`, `src/infra/ioc/usecases/journal-entry.ts`, and `src/infra/ioc/usecases/ledger.ts` — construct one journal-entry service with all required dependencies and inject that single instance into all three callers.

### Removals

- `src/domain/journal-entry/services/opening-balance-entry.service.ts`
- `src/domain/journal-entry/types/opening-balance-entry.service.types.ts`
- `src/domain/journal-entry/types/__mocks__/opening-balance-entry.service.mock.ts`
- `src/domain/journal-entry/services/__tests__/opening-balance-entry.service.test.ts`

### Out of Scope

- Changes to opening-balance persistence, transaction boundaries, balance propagation, event publication, or the opening-balance HTTP API.
- Adding accounting-period validation to opening-balance creation. Although receipts validate posting periods, the current opening-balance behavior does not; this migration should not silently change that policy.

## Proposed Approach

### Consolidate the domain contract and implementation

1. Move `ICreateOpeningBalancePayload` into `journal-entry.service.types.ts` and add `createOpeningBalance(payload, repoOptions)` to `IJournalEntryService`; retain the existing payload fields and audited-return type.
2. Extend the unified service dependency interface with `ILedgerAccountBalanceRepo` and `ILedgerAccountRepo`. The named capability remains: create a valid journal entry for a supported source type, owned by the journal-entry domain service; it rejects invariant violations and has no persistence or publication side effects.
3. Implement `makeCreateOpeningBalance` in `journal-entry.service.ts`. Preserve the current ordering and error semantics: reject a control source account and an account with an opening-balance date; query for previous adjustments; resolve the accounting entity's opening-balance equity account; reject missing configuration; construct the two posted lines and call `journalEntryEntity.make`.
4. Apply `openingBalanceEntryRule` through the same `journalEntryRuleValidator` convention used by `createReceipt`: validate the account line against the source permits and the resolved equity line against the destination permits. Map failures to the established source/destination journal-entry errors, while retaining the dedicated opening-balance errors for its existing invariants. The resolved equity account must be validated even though it was queried by subtype, so its required type, subtype, and behavior remain explicit in the domain rule.
5. Keep receipt behavior unchanged. Any helper refactor should expose a small rule-focused validation seam rather than force opening-balance-specific date and duplicate checks through receipt-only validation.

### Migrate callers and composition

1. Replace each `IOpeningBalanceEntryService` dependency with `IJournalEntryService`, rename the dependency property to `journalEntryService`, and invoke `createOpeningBalance` in the three affected use cases. Keep their payload mapping, audit/history work, transactions, post-commit propagation, and event behavior exactly as-is.
2. Update the journal-entry IoC module to build one `journalEntryService` with the accounting-period service and the two ledger repositories. Remove the separate factory/export, then inject the unified service into journal-entry and ledger use-case composition modules.
3. Expand the existing shared journal-entry service mock with `createOpeningBalance`; migrate all affected use-case specs to it. Delete the obsolete standalone contract, mock, factory, and test after no references remain.

### Preserve behavior with focused tests

1. Merge the existing opening-balance domain tests into `journal-entry.service.test.ts`, adapting construction to the unified dependency set. Retain coverage for creation, line sides, audit/events, control accounts, duplicate opening dates, prior adjustments, missing configured equity, and journal-line exchange-rate validation.
2. Add coverage that a resolved account which violates `openingBalanceEntryRule.destination` is rejected as an invalid destination. Keep receipt tests passing unchanged to prove the helper refactor preserves its rule, accounting-entity, control-account, effective-date, and counterparty checks.
3. Update the three application use-case specs to configure and assert `mockJournalEntryService.createOpeningBalance`, preserving their existing side-effect and transaction expectations.

## Test Plan

- **Domain unit:** run the unified journal-entry service and helper tests; verify both receipt and opening-balance construction, existing duplicate/configuration errors, and opening-balance rule validation.
- **Application specs:** run the opening-balance, petty-cash-account, and bank-account use-case specs; verify all call the unified service and preserve their persistence, propagation, FX, and event behavior.
- **Regression:** run the journal-entry rule tests to keep the declared opening-balance and receipt rule specifications intact.

## Verification

```bash
npm test -- src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts src/domain/journal-entry/services/helpers/__tests__/journal-entry.service.helpers.test.ts src/domain/journal-entry/rules/__tests__/entry-rules.test.ts
npm test -- src/app/journal-entry/usecases/__specs__/create-opening-balance.usecase.spec.ts src/app/ledger/usecases/__specs__/create-petty-cash-account.usecase.spec.ts src/app/ledger/usecases/__specs__/create-bank-account.usecase.spec.ts
npm run lint
npm run build
```

The build regenerates TSOA artifacts; review any generated changes and retain only those required by the implementation.

## Risks

- **Rule-refactor regression:** changing receipt helpers while adding opening-balance rule validation could alter receipt error ordering or checks. Mitigate by preserving the receipt validation sequence and retaining its existing service/helper tests.
- **Incomplete migration:** a stale standalone service import, mock, or IoC export would leave split contracts or fail compilation. Mitigate with a repository-wide search for `openingBalanceEntryService`, `IOpeningBalanceEntryService`, and `opening-balance-entry.service` before deletion and after compilation.
- **Policy creep:** treating the receipt flow as a mandate to validate opening-balance posting periods would change behavior. Keep that validation explicitly out of this migration unless separately requested.

## Completion Criteria

- `IJournalEntryService` exposes both `createReceipt` and `createOpeningBalance`, and all opening-balance callers use the latter.
- Opening-balance creation preserves the current posted entry, lines, invariants, errors, audited result, and caller-owned side effects.
- The opening-balance rule specification is applied through the same validator pattern used for receipts.
- The dedicated opening-balance service, contract, mock, and test are removed with no remaining references.
- Focused domain/application tests, lint, and build pass, and unrelated working-tree changes remain untouched.
