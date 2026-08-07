# Remove the Receivables Entity Plan

## Goal

Delete `src/domain/ledger/asset-account/entities/receivables.entity.ts` and
make `src/domain/ledger/services/receivables-account.service.ts` the only
receivables account creation API used by production code and tests.

This plan is implementation-ready. It treats the new service and its existing
contract as authoritative; it does not recreate the legacy entity API or expand
the migration into changes to cash-account behavior or shared resolution logic.
Preserve unrelated staged and working-tree changes during implementation.

## Context

The receivables account creation rules have already moved to
`makeReceivablesAccountService`. The remaining work is consumer migration,
dependency composition, test replacement, and removal of obsolete files and
documentation references.

## Confirmed Findings

1. **The legacy entity still has production callers.**
   `src/app/ledger/services/helpers/asset-accounts-bootstrap.helper.ts` imports
   it directly to create the receivables header, trade receivables, statutory
   receivables, and the default statutory posting account.
2. **The new service is not wired into the application.**
   `src/infra/ioc/services/ledger.ts` does not construct or inject
   `makeReceivablesAccountService`, and the accounts-bootstrap dependency
   contracts do not expose `IReceivablesAccountService`.
3. **Tests and documentation still reference the removed abstraction.** The
   legacy entity test, the journal-entry rules fixture, the asset bootstrap
   tests, and ledger documentation must be updated to use or describe the new
   service.
4. **The old helper is entity-private.**
   `receivables.entity.helpers.ts` is imported only by the legacy entity and can
   be deleted with it.

## Scope

### Expected Changes

- `src/app/ledger/services/helpers/asset-accounts-bootstrap.helper.ts` — replace
  every `receivablesAccountEntity` call with the corresponding injected
  `IReceivablesAccountService` method and await the result.
- `src/app/ledger/services/accounts-bootstrap.service.ts` — accept the
  receivables service as a dependency and pass it to the asset bootstrap helper.
- `src/infra/ioc/services/ledger.ts` — construct, export, and inject the
  receivables account service.
- `src/app/ledger/contracts/__mocks__/ledger.domain.services.mock.ts` — add a
  typed shared mock for `IReceivablesAccountService`.
- `src/app/ledger/services/helpers/__specs__/asset-accounts-bootstrap.helper.spec.ts`
  and `src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts` —
  update dependency setup and assertions for the injected service.
- `src/domain/ledger/services/__tests__/receivables-account.service.test.ts` —
  add focused tests for the new service's current public contract and domain
  invariants.
- `src/domain/journal-entry/rules/__tests__/entry-rules.test.ts` — create the
  receivables fixture through `makeReceivablesAccountService`.
- `src/domain/ledger/asset-account/entities/receivables.entity.ts`,
  `src/domain/ledger/asset-account/entities/helpers/receivables.entity.helpers.ts`,
  and `src/domain/ledger/asset-account/entities/__tests__/receivables.entity.test.ts`
  — delete the obsolete entity implementation, its private helper, and its
  entity-specific test suite.
- `src/domain/ledger/__doc__/02-architecture.md`,
  `src/domain/ledger/__doc__/03-mvp-scope.md`, and
  `src/domain/ledger/__doc__/04-1-asset-accounts.md` — replace the legacy entity
  name, path, and method list with the receivables service API.

### Out of Scope

- Redesigning `receivables-account.service.ts` or
  `receivables-account.service.types.ts`.
- Reproducing the legacy entity's `make`, `getCode`, `getMaterializedPath`, or
  parent-object API in the new service.
- Changing `control-account-resolver.ts`, `cash-account.service.ts`, or their
  tests as part of this migration.
- Adding receivables HTTP endpoints or use cases.
- Changing persistence or transaction ownership.
- Migrating other ledger-account entity factories.

## Proposed Approach

### 1. Wire the existing service

- Import `makeReceivablesAccountService` in
  `src/infra/ioc/services/ledger.ts`.
- Construct and export one service instance with
  `ledgerRepos.ledgerAccount`, following the existing cash-account service
  composition pattern.
- Inject the constructed service into `makeAccountsBootstrapService`.
- Add `IReceivablesAccountService` to the dependency types in
  `accounts-bootstrap.service.ts` and
  `asset-accounts-bootstrap.helper.ts`, then pass the same instance through to
  the helper. Do not instantiate the service in application code or a use-case
  IoC module.

### 2. Replace legacy production calls

- Remove the `receivablesAccountEntity` import from the asset bootstrap helper.
- Map only the required public operations:
  - `makeHeader` to `createHeader`.
  - `makeTradeReceivableAccount` to
    `createTradeReceivableSubAccount`.
  - `makeStatutoryReceivableAccount` to
    `createStatutoryReceivableSubAccount`.
- Build payloads from the accounting entity, user ID, currency, control-account
  code, and repository options expected by the existing service contract.
- Await each service call and keep the helper's existing account/event/audit
  aggregation and bootstrap ordering unchanged.
- Do not port calls to the legacy entity's generic `make`, `getCode`, or
  `getMaterializedPath` methods. Code generation and validation remain owned by
  the new service.

### 3. Replace tests at the public boundary

- Add a typed `mockReceivablesAccountService` to the centralized application
  domain-service mocks and inject it into accounts-bootstrap tests.
- Update asset bootstrap tests to configure audited results from the service and
  assert the correct `createHeader`, `createTradeReceivableSubAccount`, and
  `createStatutoryReceivableSubAccount` calls. Retain the existing observable
  assertions for created accounts, events, and audits.
- Add receivables service tests based on the service's current API and owned
  invariants: header uniqueness, allowed receivables control accounts, fixed
  account behavior/rules, repository option forwarding, and audited output.
  Do not copy the deleted entity test suite method-for-method.
- Update the journal-entry rules fixture to construct the service with its local
  ledger repository mock and create the receivables header asynchronously.

### 4. Delete obsolete artifacts and documentation references

- Delete the entity, its private helper, and its legacy tests after all imports
  have moved to the service.
- Update ledger documentation to call the abstraction a domain service, link to
  `services/receivables-account.service.ts`, and list the three current
  `create*` methods.
- Search the repository for the old path, filename, and exported object name;
  no source, test, or documentation reference may remain.

## Test Plan

- **Domain unit:** Verify the new service through its own public API and current
  invariants rather than preserving the deleted entity's internal helper API.
- **Application component:** Verify both accounts-bootstrap layers receive and
  delegate to `IReceivablesAccountService` while retaining existing bootstrap
  output.
- **Regression:** Verify journal-entry rules still recognize a receivables
  account created through the new service.

## Verification

```bash
npm test -- --runInBand src/domain/ledger/services/__tests__/receivables-account.service.test.ts
npm test -- --runInBand src/app/ledger/services/helpers/__specs__/asset-accounts-bootstrap.helper.spec.ts src/app/ledger/services/__specs__/accounts-bootstrap.service.spec.ts src/domain/journal-entry/rules/__tests__/entry-rules.test.ts
rg -n "receivables\\.entity|receivablesAccountEntity|02-receivables\\.entity\\.ts" src
npm run test:names
npm run lint
npm run build
npm test -- --runInBand
```

The `rg` command must return no matches. Keep coverage at 100% for touched
behavior.

## Assumptions

- The staged `receivables-account.service.ts` and
  `receivables-account.service.types.ts` define the intended replacement API
  and require no redesign for this migration.

## Risks

- **Accidental compatibility layer:** Reintroducing the entity's generic factory
  or helper methods would preserve the wrong abstraction. Prevent this by
  migrating only to the three existing service operations.
- **Incomplete dependency migration:** A test-only or documentation reference
  can survive after production compilation succeeds. Prevent this with the
  repository-wide search and full test run.
- **Overlap with staged work:** Inspect staged and unstaged diffs before editing
  and preserve the user's existing service changes.

## Completion Criteria

- The legacy receivables entity, its helper, and its test no longer exist.
- No reference to the legacy path, filename, or exported entity object remains.
- Every production receivables creation call uses the injected
  `IReceivablesAccountService`.
- `src/infra/ioc/services/ledger.ts` constructs the service with the ledger
  account repository and injects it into the accounts bootstrap service.
- New tests target the service's public invariants without mirroring the legacy
  entity's private API.
- Focused tests, test-name validation, lint, build, and the full test suite pass.
- Unrelated staged and working-tree changes remain intact.
