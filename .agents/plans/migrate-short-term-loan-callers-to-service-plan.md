# Migrate Short-Term Loan Callers to the Domain Service Plan

## Goal

Remove the obsolete short-term-loan entity implementation and helper, migrate
every caller to the existing repository-backed short-term-loan domain service,
wire that service through application composition and infrastructure IoC, and
provide 100% statement, branch, function, and line coverage for the migrated
domain capability.

This plan is implementation-ready. Implementation must preserve unrelated
staged and working-tree changes, including the user's existing migration work,
and must leave
`src/domain/ledger/services/liability-account/short-term-loan.service.ts`
unchanged.

## Context

The new
[`short-term-loan.service.ts`](../../src/domain/ledger/services/liability-account/short-term-loan.service.ts)
is a repository-backed domain service that owns short-term-debt header
uniqueness, control-account validation, ledger-code allocation, and creation of
short-term-loan and credit-card accounts. Its public contract is
[`short-term-loan.service.types.ts`](../../src/domain/ledger/types/short-term-loan.service.types.ts).

The remaining production dependency on the obsolete entity is in
[`liability-accounts-bootstrap.helper.ts`](../../src/app/ledger/services/helpers/liability-accounts-bootstrap.helper.ts),
which creates the short-term-debt header synchronously after its own existence
check. The replacement service API is asynchronous, accepts the accounting
entity and repository options, and intentionally creates the header with the
new service's prescribed behavior. The application bootstrap dependency chain
currently exposes payables and suspense domain services but not the
short-term-loan service.

## Confirmed Findings

1. **The obsolete entity has one production caller.** Repository-wide search
   found the entity import and `makeHeader` invocation only in
   `src/app/ledger/services/helpers/liability-accounts-bootstrap.helper.ts`;
   the other references are its own tests and stale domain documentation.
2. **The obsolete implementation has a dedicated helper and test suite.**
   `short-term-loan.entity.ts`,
   `helpers/short-term-loan.entity.helpers.ts`, and
   `__tests__/short-term-loan.entity.test.ts` form the removable entity unit.
3. **The replacement service already has its contract and supporting credit-card
   value object, but no tests or runtime construction.** The service depends on
   `ILedgerAccountRepo`, is not constructed in `src/infra/ioc/services/ledger.ts`,
   and is absent from the centralized ledger domain-service mock.
4. **IoC must flow through the application service.**
   `makeAccountsBootstrapService` constructs the liability bootstrap helper, so
   `IShortTermLoanAccountService` must be accepted there, forwarded to the
   helper, constructed once in ledger service IoC, and injected into the
   accounts bootstrap service.
5. **The new API is intentionally not behavior-compatible with the old entity
   API.** The old bootstrap path creates a `DefaultShortTermDebt` header from a
   supplied currency; the new service resolves functional currency itself,
   rejects duplicate headers, returns a promise, and creates the prescribed
   `ShortTermLoan` behavior. Callers and tests must assert the new contract
   rather than recreate old entity semantics.
6. **Documentation still names a short-term-loan entity and obsolete methods.**
   `src/domain/ledger/__doc__/03-mvp-scope.md` and
   `src/domain/ledger/__doc__/04-2-liability-accounts.md` contain stale entity
   paths or API descriptions.

## Scope

### Expected Changes

- `src/domain/ledger/liability-account/entities/short-term-loan.entity.ts` —
  delete the obsolete entity implementation.
- `src/domain/ledger/liability-account/entities/helpers/short-term-loan.entity.helpers.ts`
  — delete entity-owned code/path helpers superseded by the domain service and
  shared ledger-account behavior.
- `src/domain/ledger/liability-account/entities/__tests__/short-term-loan.entity.test.ts`
  — delete tests for the removed API.
- `src/domain/ledger/services/liability-account/__tests__/short-term-loan.service.test.ts`
  — add domain tests for all public service operations, invariants, outcomes,
  and validator branches.
- `src/domain/ledger/values/__tests__/credit-card-meta.vo.test.ts` — add the
  owning value-object tests for normalization, validation, and immutability.
- `src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts` — add a
  typed `IShortTermLoanAccountService` mock with bare `jest.fn()` methods.
- `src/app/ledger/services/helpers/liability-accounts-bootstrap.helper.ts` —
  replace the entity import with an injected service contract and await
  `createHeader` with the new payload and repository options.
- `src/app/ledger/services/helpers/__specs__/liability-accounts-bootstrap.helper.spec.ts`
  — inject/configure the centralized service mock and verify service delegation,
  aggregation, and existing-header skipping.
- `src/app/ledger/services/accounts-bootstrap.service.ts` — accept the
  short-term-loan service and forward it to the liability helper.
- `src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts` —
  inject the new mock and assert exact dependency forwarding.
- `src/infra/ioc/services/ledger.ts` — construct the domain service once with
  the ledger-account repository and inject it into the accounts bootstrap
  service.
- `src/domain/ledger/__doc__/03-mvp-scope.md` and
  `src/domain/ledger/__doc__/04-2-liability-accounts.md` — replace obsolete
  entity paths and API descriptions with the service path and current public
  operations.

### Out of Scope

- Any implementation or contract change to
  `src/domain/ledger/services/liability-account/short-term-loan.service.ts` or
  `src/domain/ledger/types/short-term-loan.service.types.ts`.
- Changes that make the new service mimic the deleted entity's synchronous API,
  header behavior, payload shape, or removed overdraft/metadata helpers.
- Refactoring `control-account-resolver.ts`, repository behavior, transactions,
  or other ledger account services.
- Database migrations or persistence-schema changes; this migration changes
  domain ownership and dependency composition only.

## Proposed Approach

### 1. Replace the liability bootstrap dependency

- Add `IShortTermLoanAccountService` to the liability helper's dependencies and
  remove its direct entity import.
- Keep the bootstrap workflow's existing header lookup and ordering. When the
  short-term-debt header is absent, call and await
  `shortTermLoanAccountService.createHeader` with the name, accounting entity,
  `createdBy`/`userId` values derived from `accountingEntity.ownerId`, and the
  existing `repoOptions`; aggregate the returned audited entity tuple exactly
  like the other domain services.
- Do not compensate for the service's intentional output differences or move
  its uniqueness invariant into the application layer. The domain service owns
  duplicate-header rejection and account construction; the application helper
  owns bootstrap ordering and result aggregation.

### 2. Propagate and compose the service

- Add the service contract to `makeAccountsBootstrapService` dependencies and
  forward the already-constructed instance to
  `makeLiabilityAccountsBootstrapHelper`.
- In `src/infra/ioc/services/ledger.ts`, import the existing factory, construct
  `shortTermLoanAccountService` with `ledgerRepos.ledgerAccount`, export it
  alongside the other ledger domain services, and inject it into
  `makeAccountsBootstrapService`.
- Extend the centralized ledger domain-service mock and update the application
  specs so application and infrastructure boundaries use the typed contract
  instead of ad hoc doubles.

### 3. Replace obsolete tests with owner-level coverage

- Delete the entity test suite rather than retaining assertions for removed
  methods.
- Add `short-term-loan.service.test.ts` beside the service, using a locally
  composed typed repository mock as required for domain tests.
- Cover successful and duplicate header creation; repository calls and options;
  functional-currency resolution; account fields, code/materialized path,
  immutability, events, and audit output.
- Cover short-term-loan sub-account creation with supported control-account
  behaviors and with/without a latest preceding account, plus missing and
  invalid control accounts. Use a parameterized invalid-control matrix to
  execute every `type`, `subType`, `isControlAccount`, and behavior validator
  branch.
- Cover credit-card sub-account creation for both supported control-account
  behaviors, code/path allocation, normalized/frozen metadata, missing control
  accounts, and every invalid-control validator branch.
- Add focused `credit-card-meta.vo.test.ts` cases for trimmed issuer/digits,
  forced `lastReconciliationDate: null`, frozen output, valid boundaries, and
  short/long invalid issuer and last-four-digit inputs. This keeps value
  validation assertions at the owning layer while service tests verify the
  integration.
- Update liability-helper and accounts-bootstrap specs to configure
  `mockShortTermLoanAccountService.createHeader`, assert the exact new call, and
  confirm the helper is not called when the header already exists.

### 4. Remove the obsolete unit and repair references

- Delete the old entity, its helper, and its tests after all production callers
  compile against the service.
- Update ledger documentation to describe the repository-backed domain service
  and its `createHeader`, `createSubAccount`, and
  `createCreditCardSubAccount` API.
- Run a final repository-wide search to prove no source, test, plan-relevant
  documentation, or import path still refers to the removed entity/helper.

## Test Plan

- **Domain unit:** New service tests exercise the public async API, repository-
  backed invariants, allowed and rejected control-account variants, generated
  ledger structure, audited return tuples, and credit-card metadata integration.
- **Value unit:** New credit-card metadata tests cover normalization,
  immutability, boundary acceptance, and all validation failures.
- **Application component:** Updated liability bootstrap helper specs verify
  service delegation and audited-result aggregation; updated accounts bootstrap
  specs verify dependency propagation and unchanged workflow ordering.
- **Regression:** Existing ledger domain, app-service, and full test suites
  remain green. Focused coverage must report exactly 100% statements, branches,
  functions, and lines for `short-term-loan.service.ts` and
  `credit-card-meta.vo.ts`.

## Verification

```bash
npm test -- src/domain/ledger/services/liability-account/__tests__/short-term-loan.service.test.ts src/domain/ledger/values/__tests__/credit-card-meta.vo.test.ts --coverage --collectCoverageFrom=src/domain/ledger/services/liability-account/short-term-loan.service.ts --collectCoverageFrom=src/domain/ledger/values/credit-card-meta.vo.ts --runInBand
npm test -- src/app/ledger/services/helpers/__specs__/liability-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts --runInBand
rg -n "short-term-loan\.entity|shortTermLoanAccountEntity|short-term-loan\.entity\.helpers" src
npm run test:names
npm run lint
npm run build
npm test -- --coverage --runInBand
```

The `rg` command is expected to return no matches. The focused coverage command
is the acceptance gate for 100% coverage of the migrated implementation; the
full coverage run is the broader regression check because the repository does
not define a global 100% Jest threshold.

## Risks

- The service's header behavior and async repository check differ from the old
  entity by design. Mitigate accidental compatibility shims by asserting the
  service's current contract in domain and application tests and leaving its
  implementation untouched.
- The liability bootstrap currently checks header existence before invoking a
  service that enforces the same invariant, so a creation path performs the
  service's additional repository check. Preserve this behavior because the
  application check controls bootstrap branching while the domain check owns
  the invariant; do not optimize it as part of this migration.
- Removing the broad entity suite could silently drop coverage for behavior no
  longer exposed by the service. Mitigate this by mapping only current service
  and value-object operations to new owner-level tests and explicitly treating
  removed overdraft/entity helper APIs as out of scope rather than recreating
  them.

## Completion Criteria

- The obsolete entity, entity helper, and entity tests no longer exist, and a
  repository-wide search finds no stale code or documentation reference to
  them.
- Every former production caller obtains and awaits the injected
  `IShortTermLoanAccountService`; no application code imports the removed domain
  entity.
- Ledger IoC constructs one short-term-loan service with the ledger-account
  repository and injects it through the accounts bootstrap composition path.
- The existing `short-term-loan.service.ts` implementation and its contract are
  byte-for-byte unchanged by implementation of this plan.
- Focused Jest coverage reports 100% statements, branches, functions, and lines
  for the short-term-loan service and credit-card metadata value object.
- Focused application specs, test-name validation, lint, build, and the full
  test suite pass.
- Unrelated staged and working-tree changes remain intact.
