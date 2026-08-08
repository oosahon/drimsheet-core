# Migrate Remaining Expense Account Entities to Services Plan

## Goal

Replace each of the seven remaining files under
`src/domain/ledger/expense-account/entities/*.entity.ts` with its own
repository-backed domain service, migrate all callers to typed service
contracts, wire every service through the established ledger IoC path, remove
the legacy entity/helper/test files, and keep 100% statements, branches,
functions, and lines coverage for touched behavioral modules.

This plan is implementation-ready after the asset-disposal-loss migration plan
has been completed and revalidated. Preserve unrelated staged and working-tree
changes during implementation.

## Context

The remaining expense account files represent account-creation capabilities,
not independently identified domain entities. The branch already establishes
the target pattern in
[`asset-disposal-loss.service.ts`](../../src/domain/ledger/services/expense-account/asset-disposal-loss.service.ts),
[`payables.service.ts`](../../src/domain/ledger/services/liability-account/payables.service.ts),
and
[`short-term-loan.service.ts`](../../src/domain/ledger/services/liability-account/short-term-loan.service.ts):
an asynchronous frozen domain service, a typed contract under
`src/domain/ledger/types`, invariant checks through the ledger-account
repository, shared control-account resolution, public-API domain tests, and IoC
construction outside application code.

The migration must adopt that service pattern directly. It must not reproduce
the legacy entity's `make`, `makeHeader`, `getCode`, parent-details, or spread
helper API under a new filename.

## Confirmed Findings

1. **Seven legacy factories remain after asset disposal loss.** They are bank
   charge, direct costs, finance cost, interest, rent and utilities, tax
   expense, and unrealized loss. Each has one entity file, one private helper,
   and one colocated entity test.
2. **All seven production imports are centralized.** Repository-wide TypeScript
   reference searches show that
   [`expense-accounts-bootstrap.helper.ts`](../../src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts)
   is their only production consumer. Their only other direct consumers are
   the seven legacy entity tests.
3. **The code configuration is ready for services.**
   [`expense-codes.config.ts`](../../src/domain/ledger/config/expense-codes.config.ts)
   defines `HEADER` and `PREFIX` for all seven account families, so each service
   can use the same configured header/sequence mechanism as the asset-disposal
   service without retaining per-entity code helpers.
4. **The account-family invariants are already typed.**
   [`expense-account.types.ts`](../../src/domain/ledger/types/expense-account.types.ts)
   defines each family's account interface, subtype, behavior, debit normal
   balance, and no-contra/no-adjunct rules. Direct costs is the only remaining
   family whose current caller supplies a behavior; the current bootstrap uses
   `DefaultDirectCost`.
5. **The application and IoC seams already exist.** The asset/liability branch
   migrations establish centralized typed domain-service mocks, dependency
   forwarding from `makeAccountsBootstrapService` to family helpers, and
   construction with `ledgerRepos.ledgerAccount` in
   `src/infra/ioc/services/ledger.ts`.

## Scope

### Expected Changes

- `src/domain/ledger/services/expense-account/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.service.ts`
  — add one named domain capability per current account family.
- `src/domain/ledger/types/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.service.types.ts`
  — add one explicit service contract per service.
- `src/domain/ledger/services/expense-account/__tests__/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.service.test.ts`
  — add public-API invariant and branch coverage.
- `src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts` — add
  typed bare mocks for all seven contracts.
- `src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts` and
  its spec — replace direct entity calls with injected, awaited service calls
  while preserving the bootstrap workflow.
- `src/app/ledger/services/accounts-bootstrap.service.ts` and its spec — accept
  and forward all seven services only to the expense helper.
- `src/infra/ioc/services/ledger.ts` — construct all seven services and inject
  them into the accounts-bootstrap service.
- `src/domain/ledger/expense-account/entities/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.entity.ts`
  — delete after caller migration.
- `src/domain/ledger/expense-account/entities/helpers/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.entity.helpers.ts`
  — delete after their code/path responsibility moves to the services.
- `src/domain/ledger/expense-account/entities/__tests__/{bank-charge,direct-costs,finance-cost,interest,rent-and-utilities,tax-expense,unrealized-loss}.entity.test.ts`
  — delete after service tests replace them.

### Out of Scope

- Do not alter the completed asset-disposal-loss service implementation as part
  of this migration.
- Do not change
  `src/domain/ledger/services/liability-account/short-term-loan.service.ts`.
- Do not change
  `src/domain/ledger/services/helpers/control-account-resolver.ts`.
- Do not add a generic expense-account service, combine multiple legacy files
  into one service, or add convenience wrappers/barrels without an existing
  precedent.
- Do not add new expense subtypes, behaviors, codes, meta models, transaction
  ownership, persistence, or event-publication behavior.
- Do not change account display names, creation order, bootstrap flags, or
  audited-result aggregation.

## Proposed Approach

### Phase 1 — Domain Service Migration

- Add one service and one contract for each legacy factory. Each service exists
  because the ledger domain needs a named capability to create that specific
  expense account family while enforcing unique headers, valid control-account
  ancestry, and family-specific sequential code allocation.
- Use the established `createHeader`/`createSubAccount` service surface rather
  than carrying forward legacy method or helper names. Each service factory
  receives `ILedgerAccountRepo`, returns an `Object.freeze`d typed service, and
  returns the existing audited ledger-account tuple from `ledgerAccountEntity`.
- Implement headers with the configured `HEADER`, duplicate lookup and
  `HeaderAccountAlreadyExists`, functional currency from the accounting entity,
  `ELedgerType.Expense`, debit normal balance, active status, control-account
  status, null parent/meta, and the existing no-contra/no-adjunct rules.
- Implement sub-accounts through the unchanged `controlAccountResolverHelper`.
  Validate expense type, the service's subtype, control-account status, and only
  the established default/family behavior set. Allocate code from the configured
  `PREFIX` and resolver-provided predecessor, derive materialized path from the
  resolver-provided parent, and use the resolved account ID as the control
  account. Do not reintroduce parent-details or code helpers at the call site.
- Keep direct-cost behavior selection typed as
  `IDirectCostsAccount['behavior']`, because that is existing domain behavior
  and the current bootstrap explicitly supplies `DefaultDirectCost`. The other
  six services keep their fixed existing family behaviors. Do not invent
  additional methods or behavior variants.

| Legacy factory                 | New service                     | Code     | Subtype            | Creation behavior                                                                 |
| ------------------------------ | ------------------------------- | -------- | ------------------ | --------------------------------------------------------------------------------- |
| `bank-charge.entity.ts`        | `bank-charge.service.ts`        | `507xxx` | `BankCharge`       | `BankCharge`                                                                      |
| `direct-costs.entity.ts`       | `direct-costs.service.ts`       | `500xxx` | `DirectCosts`      | Caller-supplied existing direct-cost behavior; bootstrap uses `DefaultDirectCost` |
| `finance-cost.entity.ts`       | `finance-cost.service.ts`       | `508xxx` | `FinanceCost`      | `FinanceCost`                                                                     |
| `interest.entity.ts`           | `interest.service.ts`           | `509xxx` | `Interest`         | `Interest`                                                                        |
| `rent-and-utilities.entity.ts` | `rent-and-utilities.service.ts` | `502xxx` | `RentAndUtilities` | `RentAndUtilities`                                                                |
| `tax-expense.entity.ts`        | `tax-expense.service.ts`        | `510xxx` | `IncomeTaxExpense` | `TaxExpense`                                                                      |
| `unrealized-loss.entity.ts`    | `unrealized-loss.service.ts`    | `511xxx` | `UnrealizedLoss`   | `UnrealizedLoss`                                                                  |

- Add one domain test file per service using a local typed repository mock.
  Cover the common header/sub-account matrix and the direct-cost behavior input
  through each service's public API. Keep the legacy factories in place until
  Phase 2 has moved every application consumer.

### Phase 2 — Application and IoC Wiring

- Add seven `jest.Mocked<I...AccountService>` exports to the centralized ledger
  domain-service mock file. Each shared mock contains only bare `jest.fn()`
  methods; configure audited returns in the owning specs.
- Replace the seven entity imports in the expense bootstrap helper with service
  contract dependencies. Make all service creation calls asynchronous and
  awaited while retaining the helper's current sequence:
  direct costs, rent and utilities, bank charge, finance cost, interest, tax
  expense, unrealized loss, then asset-disposal loss.
- Preserve each header lookup so the application workflow remains idempotent
  and can retain an existing header for posting-account creation. When a header
  is missing, call that family's `createHeader` with the existing name, creator,
  full accounting entity, and repository options.
- When posting accounts are requested, call each `createSubAccount` with the
  current posting name, creator, accounting entity/currency shape required by
  its typed contract, `isControlAccount: false`, the corresponding resolved
  header code, and the same repository options. Pass
  `DefaultDirectCost` only to the direct-cost service. Do not pass legacy parent
  materialized paths, control-account IDs, or helper state.
- Extend `makeAccountsBootstrapService` with the seven contracts and forward
  them only to `makeExpenseAccountsBootstrapHelper`. Update its spec's
  construction and exact dependency assertions without changing family
  execution order or consistency validation.
- In `src/infra/ioc/services/ledger.ts`, construct and export each service with
  `ledgerRepos.ledgerAccount`, then inject those already-constructed instances
  into `makeAccountsBootstrapService`. Keep the IoC module composition-only.
- Expand the expense-helper spec to configure all service mocks and assert exact
  header/posting payloads, repository options, awaited audited tuples, existing
  header reuse, skip behavior, account order, and the existing counts of eight
  headers and eight default posting accounts.

### Phase 3 — Legacy Removal and Coverage Gate

- Delete the seven legacy entity files, their seven private helpers, and their
  seven entity tests only after all service wiring compiles.
- Remove now-unused legacy imports, parent-details types, helper-derived code
  casts, and synchronous factory references from the expense bootstrap helper.
  Do not delete or alter shared expense account types or configured ledger
  codes.
- Search `src` and `test` for imports from
  `domain/ledger/expense-account/entities`, each deleted entity filename, and
  each former `...AccountEntity` identifier. Zero references must remain.
- Require 100% statements, branches, functions, and lines for all expense
  service files and the touched application bootstrap modules. Verify IoC
  composition with lint/build, then run the broader ledger suites.

## Test Plan

- **Domain unit:** Each new `*.service.test.ts` covers successful header
  creation, duplicate rejection, functional-currency derivation, immutable
  audited output, accepted control-account behaviors, first and subsequent
  sub-ledger allocation, correct materialized path/control ID, missing control
  accounts, and every invalid validator dimension. Direct-cost tests also cover
  its existing behavior choices without widening the domain enum.
- **Application component:** `expense-accounts-bootstrap.helper.spec.ts` uses
  the centralized service mocks to cover all-new, all-existing, and posting
  enabled/disabled flows, exact service inputs, result order, and aggregation of
  accounts/events/audits.
- **Application service:** `accounts-bootstrap.service.spec.ts` verifies all
  seven constructed-service dependencies reach only the expense helper and
  existing orchestration order/error checks remain intact.
- **Regression:** The completed asset-disposal-loss service tests and all other
  ledger family/service/helper tests remain green. No replacement test should
  import app-layer mocks into the domain layer or test deleted helper APIs.
- **Coverage:** Enforce 100% statements, branches, functions, and lines across
  the full `src/domain/ledger/services/expense-account/*.service.ts` set and the
  touched expense/accounts bootstrap behavioral modules. IoC remains a
  composition-only build/typecheck seam.

## Verification

```bash
npm test -- --runInBand src/domain/ledger/services/expense-account/__tests__ src/app/ledger/services/helpers/__specs__/expense-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts
npm test -- --runInBand src/domain/ledger/services/expense-account/__tests__ src/app/ledger/services/helpers/__specs__/expense-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts --coverage --collectCoverageFrom='src/domain/ledger/services/expense-account/*.service.ts' --collectCoverageFrom='src/app/ledger/services/helpers/expense-accounts-bootstrap.helper.ts' --collectCoverageFrom='src/app/ledger/services/accounts-bootstrap.service.ts' --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}'
rg -n "domain/ledger/expense-account/entities|bankChargeAccountEntity|directCostsAccountEntity|financeCostAccountEntity|interestAccountEntity|rentAndUtilitiesAccountEntity|taxExpenseAccountEntity|unrealizedLossAccountEntity" src test
npm run test:names
npm run lint
npm run build
npm test -- --runInBand src/domain/ledger src/app/ledger
```

The `rg` verification is expected to return no matches once this plan and the
asset-disposal-loss plan are complete. These focused tests should not require
external credentials or infrastructure.

## Assumptions

- The asset-disposal-loss migration plan is implemented first, so its service,
  contract, mock, expense-helper dependency, and IoC instance are already part
  of the target baseline. Revalidate this assumption before implementation; if
  the plans are combined into one change, add the seven services alongside that
  existing asset-disposal dependency without duplicating its work.

## Risks

- Seven synchronous call paths become asynchronous. A missed `await` can place
  promises into the audited tuple collection or change account ordering;
  exact-order component tests mitigate this.
- The helper's existing account lookups and each service's header uniqueness
  checks have different owners. Retain both, following the branch precedent:
  the helper owns idempotent bootstrap decisions and existing-header reuse;
  each domain service owns the invariant at creation time.
- Direct costs permits an existing family-specific behavior input while the
  other services use fixed behaviors. Preserve that typed distinction rather
  than flattening all contracts or broadening accepted behavior values.
- This branch contains staged user changes. Implement and stage only the files
  in scope, preserving unrelated index and working-tree content.

## Completion Criteria

- Bank charge, direct costs, finance cost, interest, rent and utilities, tax
  expense, and unrealized loss each have a distinct typed, frozen domain
  service and public service test.
- Every expense creation path uses an injected domain service; no production or
  test import references `src/domain/ledger/expense-account/entities`.
- All eight expense services, including asset disposal loss, are constructed
  with `ledgerRepos.ledgerAccount` and reach the expense helper through
  `makeAccountsBootstrapService`.
- The seven legacy entity files, seven private helpers, and seven entity tests
  are deleted.
- Existing account names, codes, subtypes, behaviors, currency, ordering,
  events, audits, and bootstrap idempotency remain unchanged at the application
  boundary.
- Focused coverage reports 100% statements, branches, functions, and lines for
  every touched behavioral module.
- Focused tests, broader ledger tests, test-name validation, lint, and build all
  pass.
- `asset-disposal-loss.service.ts`, `short-term-loan.service.ts`,
  `control-account-resolver.ts`, and unrelated working-tree changes remain
  unchanged.
