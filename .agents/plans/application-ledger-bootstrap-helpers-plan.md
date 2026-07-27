# Application Ledger Bootstrap Helpers Plan

## Goal

Move ledger-family bootstrap orchestration out of domain services and into
application-owned helper modules under `src/app/ledger/services/helpers`, while
retaining one flat, public `AccountsBootstrapService` capability and preserving
its current contract, output ordering, repository-read behavior, and rejection
semantics.

This plan is implementation-ready. It is an ownership-only migration: it does
not redesign bootstrap as one-shot creation versus idempotent recovery. Preserve
all unrelated staged and working-tree changes during implementation, including
the staged opening-balance service edit.

## Context

- `src/app/ledger/services/accounts-bootstrap.service.ts` is already the
  cross-family application capability. It calls five domain services in asset,
  liability, equity, revenue, and expense order, combines their accounts,
  events, and audits, and rejects inconsistent account/audit pairings.
- The family bootstrap implementations query `ILedgerAccountRepo` for existing
  state and invoke domain entity factories to construct accounts, events, and
  audit deltas. The repository lookups and selection of default accounts are
  application bootstrap policy; the entity factories remain the domain owners
  of account validity, ledger codes, control relationships, materialized paths,
  events, and audits.
- `create-accounting-entity.usecase.ts` is the only production caller of the
  application bootstrap service. It chooses whether to include posting accounts
  from the application usage mode and persists the returned accounts in its
  existing transaction.
- `src/infra/ioc/services/ledger.ts` currently constructs all five domain
  services and injects them into the application service. After the move, the
  application service needs only `ILedgerAccountRepo`.
- The earlier `service-ownership-consolidation-plan.md` classified the family
  bootstraps as domain services. This focused plan supersedes only that ledger
  bootstrap disposition; durable ownership rules and the current code remain
  authoritative for all other work.

## Confirmed Findings

1. **The family bootstrap behavior has an application owner.** It provisions a
   selected default chart, reads existing workflow state, accepts repository
   options, and applies a posting-account policy chosen by the application use
   case. It does not independently enforce a persisted domain invariant.
2. **Four domain services become empty after the move.** Liability, equity,
   revenue, and expense account service contracts expose only bootstrap
   operations, so their implementations, contracts, mocks, and service tests
   should be deleted rather than retained as empty abstractions.
3. **The asset account service has a surviving domain capability.** Its
   `makePettyCashSubAccount` operation validates and allocates a petty-cash
   account and is used by `create-petty-cash-account.usecase.ts`. The asset
   service should be narrowed to that operation rather than deleted.
4. **Existing bootstrap coverage is at the wrong layer after migration.** The
   five domain service test suites cover header creation, posting-account
   selection, existing-account skips, and asset/liability conditional defaults.
   Those cases must move to application helper specs; domain entity tests remain
   responsible for entity invariants.
5. **The public bootstrap and transaction seams do not need to change.**
   `IAccountsBootstrapService`, `create-accounting-entity.usecase.ts`, ledger
   persistence, history construction, transaction ownership, and event
   publication can remain unchanged.
6. **Ordering is observable.** The current service returns entries and events in
   asset, liability, equity, revenue, then expense order. The migration must not
   parallelize or reorder family execution as part of this structural change.

## Scope

### Expected Changes

- `src/app/ledger/services/helpers/*-accounts-bootstrap.helper.ts` — add one
  application helper factory for each ledger family. Each module defines its
  own input, result, and local dependency interface containing
  `ledgerAccountRepo: ILedgerAccountRepo`.
- `src/app/ledger/services/helpers/__specs__/*.spec.ts` — relocate the family
  bootstrap behavior tests to the application layer.
- `src/app/ledger/services/accounts-bootstrap.service.ts` — construct and
  coordinate the five helpers from a single repository dependency instead of
  injected domain services.
- `src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts` — mock
  the helper modules as application collaborators and retain orchestration,
  policy forwarding, aggregation, ordering, and inconsistent-audit rejection
  coverage.
- `src/domain/ledger/asset-account/services/asset-account.service.ts`, its
  service type, mock, and test — remove bootstrap operations and retain only the
  petty-cash domain capability and its tests.
- `src/domain/ledger/{liability-account,equity-account,revenue-account,expense-account}/services`
  and each corresponding `types/*-account.service.types.ts` — remove the
  bootstrap-only domain implementations, contracts, mocks, and tests after
  their behavior is covered by application helper specs.
- `src/infra/ioc/services/ledger.ts` — stop constructing the four deleted domain
  services, retain the narrowed asset service, and inject the concrete ledger
  account repository into `makeAccountsBootstrapService`.
- `src/infra/ioc/usecases/ledger.ts` — rename the local
  `ledgerDomainServices` import binding to `ledgerServices`, because the
  collection contains both domain and application capabilities.

### Out of Scope

- Changing `IAccountsBootstrapService`, its mock, or the
  `create-accounting-entity` call shape.
- Moving domain entity factories, ledger-code configuration, domain events,
  account types, or entity tests into the application layer.
- Removing repository reads or renaming the capability to one-shot default
  account creation.
- Making expense and revenue posting-account creation retry-safe; preserve their
  current behavior and address consistency across families separately.
- Changing transaction ownership, persistence order, history generation, event
  enrichment/publication, or HTTP behavior.
- Running families concurrently or introducing a generic/base bootstrap helper,
  helper registry, shared dependency container, or public helper contracts.

## Proposed Approach

### 1. Introduce application-owned family helpers

- Add `asset-accounts-bootstrap.helper.ts`,
  `liability-accounts-bootstrap.helper.ts`,
  `equity-accounts-bootstrap.helper.ts`,
  `revenue-accounts-bootstrap.helper.ts`, and
  `expense-accounts-bootstrap.helper.ts` under
  `src/app/ledger/services/helpers`.
- Give every helper module a local, non-exported `IDependencies` containing the
  ledger account repository. This intentional structural duplication avoids a
  shared implementation-types file and prevents helpers from importing types
  from the service that imports them.
- Define a family-specific helper input containing the accounting entity,
  repository read options, and, where applicable, the posting-account flag.
  Return the existing normalized family result shape: accounts, events, and
  audits.
- Move each family implementation with the smallest possible behavioral diff:
  preserve entity factory calls, account names, hierarchy construction,
  repository queries, repository options, conditional posting-account logic,
  and result collection.
- Keep subsidiary posting-account functions private to their owning family
  helper. They are implementation details of bootstrap, not separately
  injectable capabilities.
- Continue importing and invoking domain entity factories directly. Those
  factories remain responsible for account invariants and for producing the
  immutable entity/event/audit tuples.

### 2. Recompose the application bootstrap service

- Replace the five domain-service dependencies with
  `ledgerAccountRepo: ILedgerAccountRepo` in the service's local dependency
  interface.
- Construct the five family helpers once inside
  `makeAccountsBootstrapService`, passing the same dependency object to each;
  TypeScript structural typing will validate each helper's local dependency
  shape without shared helper dependency types.
- Invoke the helpers sequentially in the existing asset, liability, equity,
  revenue, expense order. Pass the posting-account flag only to families that
  currently support it.
- Preserve the current account/event/audit aggregation and
  `ledgerAppError.InconsistentBootstrap` validation. The service remains a
  rejecting application capability: repository failures, domain construction
  failures, and inconsistent helper results propagate to the caller; it does
  not catch, retry, report, persist, or publish.
- Keep `IAccountsBootstrapService` and `IAccountsBootstrapResult` unchanged so
  the accounting use case and its mock remain stable.

The retained capability can complete the repository's service test as follows:
the system needs a named capability to prepare the configured ledger account
families for an accounting entity, owned by the application ledger layer, with
repository-backed partial-bootstrap selection, domain entity construction,
ordered aggregation, and rejecting failure semantics.

### 3. Remove obsolete domain bootstrap APIs

- In the asset account service, delete `bootstrapHeaderAccounts` and
  `bootstrapIndividualPostingAccounts`, their bootstrap-only imports/types, and
  their mock methods. Retain `makePettyCashSubAccount`, its repository-backed
  control-account validation/allocation behavior, its contract, mock, and
  domain tests.
- Delete the liability, equity, revenue, and expense service implementations,
  service type files, service mocks, and service tests after their helper specs
  exist. Do not delete their entity, config, event, error, or account-type
  modules because the new application helpers still consume them.
- Run repository-wide symbol searches after deletion to remove stale imports
  and confirm that no production caller relied on a deleted service API.

### 4. Simplify IoC composition

- In `src/infra/ioc/services/ledger.ts`, retain construction/export of the asset
  petty-cash domain service, ledger persistence application service, and
  accounts bootstrap application service.
- Remove construction and export of liability, equity, revenue, and expense
  domain services. Construct the accounts bootstrap service with
  `ledgerRepos.ledgerAccount` directly.
- Keep `ledgerServices.accountsBootstrap`, `ledgerServices.persistence`, and
  `ledgerServices.assetAccount` property names stable so accounting and petty-
  cash use-case wiring does not change beyond the accurate local collection
  name in ledger use-case IoC.

### 5. Relocate and strengthen tests at the owning layer

- Create one application spec per family helper under
  `services/helpers/__specs__`. Use the existing shared typed ledger account
  repository mock, configure it per test, and invoke real domain entity
  factories through the helper.
- Transfer the existing family cases without weakening them:
  - all families create their configured headers when none exist;
  - existing headers are skipped;
  - the posting-account flag controls asset, liability, revenue, and expense
    defaults;
  - asset suspense/statutory-receivable defaults honor existing subtype and
    behavior state;
  - liability suspense/statutory-payable defaults honor existing subtype and
    behavior state;
  - equity creates only its configured accounts;
  - events and audits remain paired with every created account.
- Keep assertions focused on application selection and repository interaction.
  Domain entity test suites continue to cover account validation and emitted
  domain semantics.
- Update the accounts bootstrap service spec to mock the five helper factories,
  verifying construction with the repository, sequential policy forwarding,
  ordered aggregation, and both inconsistent account/audit rejection branches
  without exposing helpers through the production service contract.
- Retain the asset service's petty-cash domain tests and existing
  `create-petty-cash-account` use-case specs. Run the accounting-entity use-case
  spec as a regression check for the unchanged public bootstrap contract and
  transaction workflow.

## Test Plan

- **Application unit:** Add five helper specs covering default selection,
  existing-state behavior, posting-account policy, repository option
  propagation, and emitted account/event/audit collections. Update the parent
  service spec for helper coordination, order, aggregation, and rejection.
- **Domain unit:** Narrow the asset account service test to petty-cash account
  validation/allocation. Delete only bootstrap-only domain service suites after
  equivalent application coverage is green; retain all ledger entity tests.
- **Regression:** Verify `create-accounting-entity` still requests posting
  accounts only for non-power users, persists returned accounts and histories
  in the existing transaction, and publishes the same bootstrap events. Verify
  petty-cash creation still receives the narrowed asset service unchanged.

## Verification

Run focused helper/service tests first, then affected use cases and repository-
wide static checks:

```bash
npm test -- --runInBand --testPathPatterns='accounts-bootstrap|asset-account.service'
npm test -- --runInBand --testPathPatterns='create-accounting-entity|create-petty-cash-account'
npm run lint
npm run build
npm test -- --runInBand
```

The build may require runtime environment variables used by configuration
imports. If so, use the repository's documented test environment rather than
weakening configuration validation.

## Assumptions

- This is a behavior-preserving ownership migration. Existing partial-bootstrap
  checks—including the current difference between asset/liability and
  revenue/expense posting-account behavior—remain unchanged. Validate this by
  moving every existing bootstrap test case before deleting its domain suite.
- The helper modules are private implementation collaborators and do not need
  app contracts or shared mocks. Their factory exports are sufficient for
  direct helper specs and module-level mocking in the parent service spec.
- `IAccountsBootstrapService` remains a justified reusable application seam
  despite its current single production caller because it coordinates five
  independently evolving account families and exposes focused failure and
  result semantics.

## Risks

- **Behavior drift during a large move:** Account names, ordering, preceding
  codes, parent paths, or existing-state queries could change accidentally.
  Mitigate with small family-by-family moves and green focused specs before
  deleting the original implementation.
- **Lost idempotency coverage:** Deleting domain suites before their application
  replacements are green could conceal regressions. Add and run each helper
  spec first, then remove the corresponding domain suite.
- **Event or audit ordering changes:** Concurrent helper execution or different
  flattening can affect persistence and publication order. Preserve sequential
  family execution and the current aggregation sequence.
- **Stale service artifacts:** Bootstrap-only service contracts, mocks, or IoC
  exports may survive because their directories also contain valid domain
  entities. Use focused symbol searches and the full TypeScript build after
  cleanup.
- **Working-tree collision:** An unrelated opening-balance edit is already
  staged. Leave that staged content untouched while implementing and validating
  this migration.

## Completion Criteria

- The five family bootstrap implementations live under
  `src/app/ledger/services/helpers` and each declares its own ledger-repository
  dependency shape.
- `AccountsBootstrapService` is the only public bootstrap capability and
  depends directly on `ILedgerAccountRepo`, while its public contract, result
  ordering, and rejection behavior remain unchanged.
- No domain service contract exposes `bootstrapHeaderAccounts` or
  `bootstrapIndividualPostingAccounts`.
- Liability, equity, revenue, and expense bootstrap-only domain service
  implementations, contracts, mocks, tests, and IoC exports are removed.
- The asset account service and mock expose only the surviving petty-cash
  capability, and petty-cash behavior remains green.
- All former family bootstrap cases have application-layer helper coverage, and
  touched behavior retains 100% coverage.
- Focused tests, lint, build, and the full test suite pass.
- Unrelated staged and working-tree changes remain unchanged.
