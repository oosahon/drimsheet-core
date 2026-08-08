# Migrate Revenue Account Entities to Services Plan

## Goal

Replace each of the six factories under
`src/domain/ledger/revenue-account/entities` with its own repository-backed
domain service, migrate every production and test consumer to typed service
contracts, wire all six services through the established ledger IoC path,
remove the legacy entity/helper/test files, and retain 100% statements,
branches, functions, and lines coverage for touched behavioral modules.

This plan is implementation-ready. Preserve unrelated staged, tracked, and
untracked work during implementation, including the current expense-account
service files.

## Context

The requested directory is
[`src/domain/ledger/revenue-account/entities`](../../src/domain/ledger/revenue-account/entities);
there is no `revenue-account/entites` directory in the repository.

The branch already establishes the target domain-service pattern in
[`asset-disposal-loss.service.ts`](../../src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts),
[`payables.service.ts`](../../src/domain/ledger/services/liability-account/payables.service.ts),
and
[`short-term-loan.service.ts`](../../src/domain/ledger/services/liability-account/short-term-loan.service.ts):
an asynchronous frozen domain service, a typed contract under
`src/domain/ledger/types`, repository-backed uniqueness and control-account
invariants, code/path allocation through `ledgerAccountEntity` and the shared
resolver, public-API domain tests, application-layer typed mocks, and IoC
construction outside application code.

The migration must adopt that service pattern directly. It must not reproduce
the legacy entity's `make`, `makeHeader`, `getCode`, parent-details, or spread
helper API under new filenames.

## Confirmed Findings

1. **Six legacy revenue factories remain.** The directory contains services,
   employment income, gain on asset sale, unrealized gain, grants, and gifts.
   Each factory has one private code/materialized-path helper and one colocated
   entity test.
2. **The production consumer is centralized.** Repository-wide TypeScript
   searches show that
   [`revenue-accounts-bootstrap.helper.ts`](../../src/app/ledger/services/helpers/revenue-accounts-bootstrap.helper.ts)
   is the only production module importing the six factories. It creates six
   headers and, when requested, six default posting accounts in a fixed order.
3. **Services-account test fixtures are additional direct consumers.**
   `services.entity.ts` is also imported by
   [`journal-entry.service.test.ts`](../../src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts),
   [`entry-rules.test.ts`](../../src/domain/journal-entry/rules/__tests__/entry-rules.test.ts),
   and
   [`create-receipt.usecase.spec.ts`](../../src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts).
   These imports must be migrated before the legacy directory can be deleted.
4. **Revenue code configuration needs the established service seam.**
   [`revenue-codes.config.ts`](../../src/domain/ledger/config/revenue-codes.config.ts)
   currently exposes only `HEADER`; each private legacy helper hardcodes the
   corresponding three-digit prefix. The expense, liability, and asset service
   implementations establish `HEADER` plus `PREFIX` in centralized ledger-code
   configuration as the replacement.
5. **The six account-family invariants are already typed.**
   [`revenue-account.types.ts`](../../src/domain/ledger/types/revenue-account.types.ts)
   defines the fixed subtype and behavior for every family. All six use revenue
   type, credit normal balance, active status, and no-contra/no-adjunct rules.
   Unlike expense accounts, the current revenue behavior set has no generic
   `Default` behavior.
6. **The application and IoC precedents already exist.** Domain service
   contracts are mocked in
   [`ledger.domain.services.mock.ts`](../../src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts),
   passed from
   [`accounts-bootstrap.service.ts`](../../src/app/ledger/services/accounts-bootstrap.service.ts)
   to the owning family helper, and constructed with
   `ledgerRepos.ledgerAccount` in
   [`src/infra/ioc/services/ledger.ts`](../../src/infra/ioc/services/ledger.ts).

## Scope

### Expected Changes

- `src/domain/ledger/config/revenue-codes.config.ts` — add typed `PREFIX`
  values alongside the six existing headers.
- `src/domain/ledger/services/revenue-account/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.service.ts`
  — add one named revenue-account creation capability per legacy factory.
- `src/domain/ledger/types/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.service.types.ts`
  — add one explicit service contract per service.
- `src/domain/ledger/services/revenue-account/__tests__/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.service.test.ts`
  — add public-API invariant and branch coverage.
- `src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts` — add
  typed, bare-function mocks for all six contracts.
- `src/app/ledger/services/helpers/revenue-accounts-bootstrap.helper.ts` and
  its spec — replace direct factory calls with injected, awaited service calls
  while preserving the bootstrap workflow.
- `src/app/ledger/services/accounts-bootstrap.service.ts` and its spec — accept
  and forward all six services only to the revenue helper.
- `src/infra/ioc/services/ledger.ts` — construct all six services and inject
  them into the accounts-bootstrap service.
- `src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts`,
  `src/domain/journal-entry/rules/__tests__/entry-rules.test.ts`, and
  `src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts` —
  replace Services entity fixtures with the new Services revenue service.
- `src/domain/ledger/revenue-account/entities/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.entity.ts`
  — delete after every consumer is migrated.
- `src/domain/ledger/revenue-account/entities/helpers/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.entity.helpers.ts`
  — delete after code/path ownership moves into the services.
- `src/domain/ledger/revenue-account/entities/__tests__/{services,employment-income,gain-on-sale,unrealized-gain,grants,gifts}.entity.test.ts`
  — delete after service tests replace them.

### Out of Scope

- Do not change
  `src/domain/ledger/services/helpers/control-account-resolver.ts`.
- Do not update existing asset, liability, equity, expense, suspense, or other
  domain-service implementations as part of this migration.
- Do not add services for sales, subscriptions, or interest income; no matching
  legacy factory exists in the requested directory.
- Do not add a generic revenue-account service, combine multiple legacy files
  into one service, or add compatibility wrappers, convenience barrels, or
  re-export APIs without an existing precedent.
- Do not add new revenue subtypes, behaviors, codes, metadata, error types,
  transactions, persistence, or event-publication behavior.
- Do not change revenue account names, creation order, bootstrap flags,
  journal-entry rules, or audited-result aggregation.
- Do not modify, format, stage, or otherwise absorb the current unrelated
  untracked expense-account service and contract files.

## Proposed Approach

### Phase 1 — Domain Service Migration

- Update `REVENUE_LEDGER_CODES` with a typed `Keys = 'HEADER' | 'PREFIX'`
  contract and move each verified prefix from its legacy helper into the
  matching configured family. Do not change any existing header value.
- Add one service and one contract for each legacy factory. Each service exists
  because the ledger domain needs a named capability to create that specific
  revenue account family while enforcing unique headers, valid
  control-account ancestry, and family-specific sequential code allocation.
- Use the established `createHeader`/`createSubAccount` public surface rather
  than carrying forward legacy method or helper names. Each service factory
  receives `ILedgerAccountRepo`, returns an `Object.freeze`d typed service, and
  returns the audited tuple produced by `ledgerAccountEntity`.
- Implement each header by querying the configured `HEADER` for the accounting
  entity, throwing the existing `HeaderAccountAlreadyExists` error when found,
  deriving currency from the accounting entity's functional currency, and
  creating a revenue control account at the header materialized path.
- Implement each sub-account through the unchanged
  `controlAccountResolverHelper`. Its validator must require revenue type, the
  service's exact subtype, `isControlAccount: true`, and the service's exact
  behavior. Do not invent a generic accepted behavior that is absent from
  `ERevenueAccountBehavior`.
- Allocate sub-account codes with the configured `PREFIX` and the resolver's
  predecessor, derive materialized paths from the resolver's parent path, and
  use the resolved account ID as `controlAccountId`. Keep application
  bootstrap orchestration, persistence, transactions, and event publication
  outside these services.

| Legacy factory                | New service                    | Code     | Subtype            | Behavior           |
| ----------------------------- | ------------------------------ | -------- | ------------------ | ------------------ |
| `services.entity.ts`          | `services.service.ts`          | `401xxx` | `Services`         | `Services`         |
| `employment-income.entity.ts` | `employment-income.service.ts` | `403xxx` | `EmploymentIncome` | `EmploymentIncome` |
| `gain-on-sale.entity.ts`      | `gain-on-sale.service.ts`      | `405xxx` | `GainOnAssetSale`  | `GainOnAssetSale`  |
| `unrealized-gain.entity.ts`   | `unrealized-gain.service.ts`   | `406xxx` | `UnrealizedGains`  | `UnrealizedGains`  |
| `grants.entity.ts`            | `grants.service.ts`            | `407xxx` | `Grants`           | `Grants`           |
| `gifts.entity.ts`             | `gifts.service.ts`             | `408xxx` | `Gifts`            | `Gifts`            |

- Add one domain test file per service using a local typed
  `ILedgerAccountRepo` mock. Cover the service's complete public behavior before
  moving consumers. Keep the legacy factories temporarily so the application
  remains compilable until Phase 2.

### Phase 2 — Application, Test-Consumer, and IoC Wiring

- Add six named `jest.Mocked<I...AccountService>` exports to the centralized
  ledger domain-service mock file. Each shared mock contains only bare
  `jest.fn()` methods; configure audited results in the owning specs.
- Replace the six entity imports in the revenue bootstrap helper with service
  contract dependencies. Make posting-account creation and all service calls
  asynchronous and awaited while preserving the current order: services,
  employment income, gain on asset sale, unrealized gain, grants, then gifts.
- Preserve every header lookup so the application workflow remains idempotent
  and can reuse an existing header for posting-account creation. When a header
  is missing, call the matching `createHeader` with its existing display name,
  creator, full accounting entity, and the same repository options.
- When posting accounts are requested, call the matching `createSubAccount`
  with the current default posting name, creator, accounting-entity ID,
  functional currency, `isControlAccount: false`, the resolved header's code as
  `controlAccountCode`, and the same repository options. Do not pass legacy
  parent materialized paths, control-account IDs, or `meta`; the service owns
  parent validation and account construction.
- Extend `makeAccountsBootstrapService` with the six service contracts and pass
  them only into `makeRevenueAccountsBootstrapHelper`. Update its spec's
  construction and exact dependency assertions without changing account-family
  execution order or consistency validation.
- In `src/infra/ioc/services/ledger.ts`, construct and export each service with
  `ledgerRepos.ledgerAccount`, then inject those already-constructed instances
  into `makeAccountsBootstrapService`. Keep the IoC module composition-only.
- Replace the three direct Services entity fixture imports:
  - In `entry-rules.test.ts`, construct the Services revenue service with the
    existing local ledger repository mock and create the header asynchronously
    in the existing setup phase, matching the prior `makeHeader` intent.
  - In `journal-entry.service.test.ts` and
    `create-receipt.usecase.spec.ts`, construct the Services revenue service
    with the test's existing ledger repository mock and create a header plus
    sub-account through its public API, matching the prior posting-account
    `make` intent. Configure header/control/sibling repository responses
    explicitly so these calls do not consume mocks intended for cash-account
    fixtures.
  - Keep domain tests on their local typed repository mocks. Keep the
    application spec on the existing centralized ledger repository mock, as
    required by the layer testing rules.
- Expand the revenue-helper spec to configure all six service mocks and assert
  exact header/posting payloads, repository options, awaited audited tuples,
  existing-header reuse, skip behavior, fixed account order, and the existing
  counts of six headers and six default posting accounts.

### Phase 3 — Legacy Removal and Coverage Gate

- Delete the six legacy entity files, six private helpers, and six entity tests
  only after all production and fixture consumers use the services.
- Remove unused parent-details types, code casts, functional-currency
  construction owned by the service headers, and synchronous factory imports
  from the revenue bootstrap helper. Do not remove shared revenue account types
  or configured ledger codes.
- Search `src` and `test` for imports from
  `domain/ledger/revenue-account/entities`, all six deleted filenames, and the
  six former `...AccountEntity` identifiers. Zero references must remain.
- Run focused domain, bootstrap, and journal-entry tests. Require 100%
  statements, branches, functions, and lines for all revenue service files and
  the touched bootstrap behavioral modules.
- Run test-name validation, lint, build/typecheck, and the broader ledger and
  journal-entry suites. The build is the verification seam for the
  composition-only IoC module.

## Test Plan

- **Domain unit:** Each new `*.service.test.ts` covers successful frozen header
  creation, duplicate rejection, functional-currency derivation, immutable
  audited output, successful sub-account creation, first and subsequent
  sibling allocation, correct materialized path/control ID, missing control
  accounts, and every invalid validator dimension: type, subtype, control
  status, and behavior.
- **Application component:**
  `revenue-accounts-bootstrap.helper.spec.ts` uses the centralized service
  mocks to cover all-new, all-existing, and posting-enabled/disabled flows,
  exact service inputs, result ordering, and account/event/audit aggregation.
- **Application service:** `accounts-bootstrap.service.spec.ts` verifies all six
  revenue service dependencies reach only the revenue helper and existing
  orchestration order/error checks remain intact.
- **Cross-domain regression:** The two domain journal-entry tests and the
  create-receipt application spec use the Services revenue service for fixtures
  and preserve their existing rule, journal-entry, and use-case assertions.
- **Coverage:** Enforce 100% statements, branches, functions, and lines across
  `src/domain/ledger/services/revenue-account/*.service.ts`,
  `revenue-accounts-bootstrap.helper.ts`, and
  `accounts-bootstrap.service.ts`. IoC contains composition rather than
  behavioral branches and is verified by lint/build.

## Verification

```bash
npm test -- --runInBand src/domain/ledger/services/revenue-account/__tests__ src/app/ledger/services/helpers/__specs__/revenue-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts src/domain/journal-entry/rules/__tests__/entry-rules.test.ts src/app/journal-entry/usecases/__specs__/create-receipt.usecase.spec.ts
npm test -- --runInBand src/domain/ledger/services/revenue-account/__tests__ src/app/ledger/services/helpers/__specs__/revenue-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts --coverage --collectCoverageFrom='src/domain/ledger/services/revenue-account/*.service.ts' --collectCoverageFrom='src/app/ledger/services/helpers/revenue-accounts-bootstrap.helper.ts' --collectCoverageFrom='src/app/ledger/services/accounts-bootstrap.service.ts' --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}'
rg -n "domain/ledger/revenue-account/entities|servicesAccountEntity|employmentIncomeAccountEntity|gainOnAssetSaleAccountEntity|unrealizedGainAccountEntity|grantsAccountEntity|giftsAccountEntity" src test
npm run test:names
npm run lint
npm run build
npm test -- --runInBand src/domain/ledger src/app/ledger src/domain/journal-entry src/app/journal-entry
```

The `rg` verification is expected to return no matches after removal. The
focused suites require only the repository's installed Node dependencies; no
external credentials or infrastructure are expected.

## Risks

- Six synchronous bootstrap call paths and three synchronous test fixtures
  become asynchronous. A missed `await` can place promises into audited tuple
  collections or initialize journal-entry fixtures too late. Use explicit async
  setup and assert result order.
- The bootstrap helper's header lookups and each service's duplicate-header
  checks have different owners. Preserve both, following the asset/liability
  precedent: the helper owns idempotent bootstrap decisions and existing-header
  reuse; each domain service owns the creation invariant.
- The three journal-entry test modules share ledger repository mocks with other
  service fixtures. Unscoped `mockResolvedValueOnce` calls can be consumed in
  the wrong order. Configure the revenue fixture immediately before invoking
  it and assert its repository calls where ordering matters.
- `services.service.ts` is visually repetitive, but it directly preserves the
  established account-family name and one-service-per-legacy-factory mapping.
  Do not invent an alternate capability name solely to avoid the repetition.
- The worktree contains unrelated untracked expense services and contracts.
  Preserve them and avoid bulk formatting or staging commands that include
  those files.

## Completion Criteria

- Services, employment income, gain on asset sale, unrealized gain, grants, and
  gifts each have a distinct typed, frozen domain service and public service
  test.
- Every production and test creation path uses the appropriate service; no
  import references `src/domain/ledger/revenue-account/entities`.
- All six services are constructed with `ledgerRepos.ledgerAccount` and reach
  the revenue helper through `makeAccountsBootstrapService`.
- `REVENUE_LEDGER_CODES` exposes unchanged headers plus verified prefixes for
  all six migrated families.
- The six legacy entity files, six private helpers, and six entity tests are
  deleted.
- Existing account names, codes, subtypes, behaviors, currency, order, events,
  audits, bootstrap idempotency, journal-entry rules, and use-case outcomes
  remain unchanged at their owning boundaries.
- Focused coverage reports 100% statements, branches, functions, and lines for
  every touched behavioral module.
- Focused tests, broader ledger/journal-entry tests, test-name validation, lint,
  and build all pass.
- `control-account-resolver.ts`, existing domain services, unrelated expense
  work, and all other working-tree changes remain unchanged.
