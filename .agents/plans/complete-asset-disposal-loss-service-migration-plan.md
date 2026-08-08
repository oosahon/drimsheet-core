# Complete Asset Disposal Loss Service Migration Plan

## Goal

Finish the migration from the legacy asset-disposal-loss entity-labeled factory
to the existing repository-backed asset-disposal-loss domain service. All
production consumers must use the service through dependency injection, the
legacy entity, helper, and entity test must be removed, and touched behavioral
modules must retain 100% statements, branches, functions, and lines coverage.

This plan is implementation-ready. Preserve unrelated staged and working-tree
changes during implementation, including the current staged service, contract,
expense-code, and expense-type work.

## Context

The current branch already contains the intended domain-service pattern for
cash, receivables, payables, short-term loans, equity, and suspense accounts.
The staged
[`asset-disposal-loss.service.ts`](../../src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts)
and
[`asset-disposal-loss.service.types.ts`](../../src/domain/ledger/types/asset-disposal-loss.service.types.ts)
follow that pattern: a frozen service factory owns header uniqueness and
control-account validation, uses the ledger-account repository only to enforce
those invariants, and returns audited ledger-account creation results.

The existing service implementation is the migration target. This work must not
reshape it to match the legacy entity API.

## Confirmed Findings

1. **The service migration is present but not connected.**
   [`asset-disposal-loss.service.ts`](../../src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts)
   exposes asynchronous `createHeader` and `createSubAccount` operations through
   `IAssetDisposalLossAccountService`, but
   [`ledger.ts`](../../src/infra/ioc/services/ledger.ts) does not construct it and
   the application bootstrap path does not accept it as a dependency.
2. **There is one production consumer of the legacy factory.** Repository-wide
   TypeScript reference searches show that
   [`expense-accounts-bootstrap.helper.ts`](../../src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts)
   is the only production file importing
   `asset-disposal-loss.entity.ts`; the other direct import is its colocated
   entity unit test.
3. **The service owns stronger invariants than the legacy factory.** Header
   creation rejects an existing `512000` header, and sub-account creation uses
   the existing `controlAccountResolverHelper` to require an expense,
   loss-on-asset-disposal control account with an allowed behavior before
   allocating the next `512xxx` code and materialized path.
4. **The branch establishes the wiring precedent.** Domain service contracts
   are mocked in
   [`ledger.domain.services.mock.ts`](../../src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts),
   injected into the appropriate account-family bootstrap helper through
   [`accounts-bootstrap.service.ts`](../../src/app/ledger/services/accounts-bootstrap.service.ts),
   and constructed once in
   [`src/infra/ioc/services/ledger.ts`](../../src/infra/ioc/services/ledger.ts)
   with `ledgerRepos.ledgerAccount`.
5. **The legacy helper API is redundant after migration.**
   `asset-disposal-loss.entity.helpers.ts` only derives the header/sub-ledger
   code and materialized path; the service now derives those through
   `EXPENSE_LEDGER_CODES`, `ledgerAccountEntity`, and the unchanged shared
   control-account resolver.

## Scope

### Expected Changes

- `src/domain/ledger/services/expense-account/__tests__/asset-disposal-loss.service.test.ts`
  — add public-API coverage for the existing service and its invariants.
- `src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts` — add a
  typed, bare-function mock for `IAssetDisposalLossAccountService`.
- `src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts` —
  replace only the asset-disposal-loss legacy factory calls with injected,
  awaited service calls.
- `src/app/ledger/services/helpers/__specs__/expense-accounts-bootstrap.helper.spec.ts`
  — configure the shared service mock and verify header/posting delegation,
  payloads, repository options, aggregation, and existing-account behavior.
- `src/app/ledger/services/accounts-bootstrap.service.ts` — accept the service
  contract and pass it only to the expense bootstrap helper.
- `src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts` —
  verify the new dependency is forwarded to the expense helper.
- `src/infra/ioc/services/ledger.ts` — construct the asset-disposal-loss service
  with the ledger-account repository and inject the constructed instance into
  the accounts-bootstrap service.
- `src/domain/ledger/expense-account/entities/asset-disposal-loss.entity.ts`,
  `src/domain/ledger/expense-account/entities/helpers/asset-disposal-loss.entity.helpers.ts`,
  and
  `src/domain/ledger/expense-account/entities/__tests__/asset-disposal-loss.entity.test.ts`
  — delete after all consumers and coverage move to the service.

### Out of Scope

- Do not change
  `src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts`
  or its service contract merely to preserve the legacy entity call shape.
- Do not change
  `src/domain/ledger/services/liability-account/short-term-loan.service.ts`.
- Do not change
  `src/domain/ledger/services/helpers/control-account-resolver.ts`.
- Do not migrate the seven other expense-account entities in this change; they
  are covered by the separate expense-account services migration plan.
- Do not change account names, codes, ordering, bootstrap flags, persistence,
  event publication, or transaction ownership.

## Proposed Approach

### Phase 1 — Service Migration and Domain Coverage

- Treat `IAssetDisposalLossAccountService` as the application-facing domain
  contract and the existing `makeAssetDisposalService` factory as the owner of
  the named capability: create asset-disposal-loss headers and sub-accounts
  while enforcing unique headers, valid control-account ancestry, and
  sequential `512xxx` allocation.
- Add the service unit test beside the service. Compose a local typed
  `ILedgerAccountRepo` mock, as domain tests cannot import application-layer
  mocks.
- Cover `createHeader` when no header exists and when a duplicate exists.
  Assert the repository call, functional-currency derivation, complete expense
  ledger invariants, frozen result, event, and audit.
- Cover `createSubAccount` beneath both allowed control-account behaviors,
  allocation with and without a latest sibling, control-account ID/path usage,
  immutable audited output, missing control accounts, and each invalid
  validator dimension: ledger type, subtype, control status, and behavior.
- Keep the legacy files temporarily during this phase so the application
  remains compilable until Phase 2 switches the consumer.

### Phase 2 — Application and IoC Wiring

- Add `mockAssetDisposalLossAccountService` to the centralized ledger domain
  service mocks, typed as `jest.Mocked<IAssetDisposalLossAccountService>` with
  bare `jest.fn()` methods only.
- Extend the expense bootstrap helper dependencies with the service contract.
  Preserve its existing header lookup, account ordering, audited-result
  aggregation, and `shouldBootstrapPostingAccounts` behavior.
- For a missing asset-disposal-loss header, await `createHeader` with the
  existing display name, `createdBy`, full `accountingEntity`, and the same
  `repoOptions`. Use the returned account as the header when posting accounts
  are requested.
- Make the posting-account subroutine asynchronous and await
  `createSubAccount` with the existing posting-account name, creator,
  accounting-entity ID, functional currency, `isControlAccount: false`, the
  resolved header's code as `controlAccountCode`, and the same `repoOptions`.
  Do not pass legacy parent paths, control-account IDs, or `meta`; those details
  are owned by the service.
- Extend `makeAccountsBootstrapService` with the service contract and pass it
  only into `makeExpenseAccountsBootstrapHelper`. Update its spec to prove this
  dependency route while preserving helper construction and execution order.
- In `src/infra/ioc/services/ledger.ts`, construct and export the service with
  `ledgerRepos.ledgerAccount`, following the existing payables and short-term
  loan composition, and inject the already-constructed instance into
  `makeAccountsBootstrapService`.
- Update the expense-helper spec with audited service results and exact-call
  assertions for both header and posting creation. Include the existing-header
  path to prove the header service is not called and the existing header code
  becomes the sub-account control code.

### Phase 3 — Legacy Removal and Coverage Gate

- Delete the legacy entity, its private code/materialized-path helper, and its
  entity test only after the application and IoC no longer import them.
- Search `src` and `test` for the deleted module path and legacy
  `assetDisposalLossAccountEntity` identifier; zero references must remain.
- Run focused domain and application tests with coverage collected from the
  service and the two touched behavioral application modules. Require 100% for
  statements, branches, functions, and lines.
- Run test-name validation, lint, build/typecheck, and the broader ledger test
  suites. The build is the verification seam for the composition-only IoC
  module.

## Test Plan

- **Domain unit:**
  `src/domain/ledger/services/expense-account/__tests__/asset-disposal-loss.service.test.ts`
  covers every public operation, accepted behavior, allocation branch, and
  rejection branch through the service API.
- **Application component:**
  `expense-accounts-bootstrap.helper.spec.ts` proves the helper awaits and
  aggregates service output, forwards exact payloads and repository options,
  uses existing headers correctly, and preserves the eight-header/eight-posting
  bootstrap result.
- **Application service:** `accounts-bootstrap.service.spec.ts` proves the new
  service is injected only into the expense helper without changing family
  ordering or result consistency checks.
- **Regression:** Existing asset, liability, equity, revenue, expense, and
  account-bootstrap tests continue to pass. No test should import the deleted
  entity or recreate its helper calculations.
- **Coverage:** Require 100% statements, branches, functions, and lines for the
  touched service, expense helper, and accounts-bootstrap service. The IoC file
  contains composition rather than behavioral branches and is verified by
  lint/build.

## Verification

```bash
npm test -- --runInBand src/domain/ledger/services/expense-account/__tests__/asset-disposal-loss.service.test.ts src/app/ledger/services/helpers/__specs__/expense-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts
npm test -- --runInBand src/domain/ledger/services/expense-account/__tests__/asset-disposal-loss.service.test.ts src/app/ledger/services/helpers/__specs__/expense-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts --coverage --collectCoverageFrom='src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts' --collectCoverageFrom='src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts' --collectCoverageFrom='src/app/ledger/services/accounts-bootstrap.service.ts' --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}'
rg -n "expense-account/entities/asset-disposal-loss|assetDisposalLossAccountEntity" src test
npm run test:names
npm run lint
npm run build
npm test -- --runInBand src/domain/ledger src/app/ledger
```

The `rg` verification is expected to return no matches after removal. The
commands require only the repository's installed Node dependencies; no external
credentials or services are expected for these focused suites.

## Risks

- Converting posting-account creation from synchronous entity calls to an
  asynchronous service call can produce an unawaited promise or alter result
  ordering. Make the nested routine and its caller explicitly async and assert
  the existing order in the helper spec.
- The bootstrap helper already checks whether a header exists, while the domain
  service independently enforces uniqueness. Preserve both ownership boundaries
  as established by the liability migration: the helper decides whether the
  bootstrap workflow needs creation; the service protects the invariant.
- The service, types, and code configuration are currently staged user changes.
  Do not overwrite or restage unrelated work while completing the migration.

## Completion Criteria

- All production asset-disposal-loss creation flows use the injected
  `IAssetDisposalLossAccountService`; no legacy entity import remains.
- The service is constructed with `ledgerRepos.ledgerAccount` in ledger IoC and
  passed through `makeAccountsBootstrapService` to the expense helper.
- The legacy asset-disposal-loss entity, private helper, and entity test are
  deleted.
- Header and posting account names, codes, ordering, currency, events, audits,
  and bootstrap behavior remain unchanged from the caller's perspective.
- Focused coverage reports 100% statements, branches, functions, and lines for
  every touched behavioral module.
- Focused tests, broader ledger tests, test-name validation, lint, and build all
  pass.
- `short-term-loan.service.ts`, `control-account-resolver.ts`, the remaining
  expense entities, and unrelated working-tree changes remain unchanged.
