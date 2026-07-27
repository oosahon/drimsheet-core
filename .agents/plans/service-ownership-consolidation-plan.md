# Service Ownership Consolidation Plan

## Goal

Establish one coherent service philosophy and bring the existing service-shaped
code into alignment with it. Every surviving service must represent a named,
independently meaningful domain or application capability; behavior that is
actually an entity rule, policy, request-specific helper, persistence detail,
technical adapter, dead abstraction, or IoC wiring must move to its real owner.

This plan is implementation-ready and intentionally staged so that correctness
fixes, removals, ownership changes, and auth refactoring can be reviewed and
shipped independently. Preserve unrelated staged and working-tree changes
during implementation.

## Context

- The repository contains 31 `*.service.ts` files: 22 behavioral implementations
  and 9 infrastructure IoC modules.
- The focused service baseline is green: 22 suites and 132 tests pass with
  `npm test -- --runInBand --testPathPatterns='/services/'`.
- `.agents/rules/service-ownership.md` already provides the right architectural
  center: services are named capabilities with clear owners, domain services
  own invariants, application services own reusable coordination, and use cases
  own request-specific workflows and transactions.
- `CONTRIBUTING.md` still says all services are pure and side-effect-free, which
  conflicts with the documented application-service model and with legitimate
  queueing, reporting, and reusable persistence capabilities.
- Existing use cases already demonstrate the desired orchestration model:
  validation and request context at the application boundary, domain creation
  before persistence where possible, request-owned transaction boundaries, and
  post-commit publication or best-effort side effects.

## Confirmed Findings

1. **High — “Service” currently names unrelated architectural roles.** Domain
   creation, repository-backed invariants, cross-domain application
   coordination, transaction wrappers, JWT/bcrypt adapters, and IoC composition
   all use the same suffix without a consistent ownership test.
2. **High — Four behavioral wrappers do not currently justify service status.**
   `user-preferences.service.ts` has no production caller;
   `ledger-account.service.ts` re-reads an account already loaded by its only
   caller; `exchange-rate.service.ts` wraps one conditional and one repository
   call for one workflow; and `fx-cost-basis-persistence.service.ts` extracts
   persistence used by only `create-petty-cash-account.usecase.ts`.
3. **High — Technical auth implementations are presented as application
   services.** `password.service.ts` combines password policy with bcrypt, while
   `token.service.ts` combines JWT encoding, configuration, cache-key policy,
   access/refresh tokens, signup tokens, and password-reset token claims behind
   a 14-method contract.
4. **High — Signup-token claim ownership is not concurrency-safe.** Signup claims
   use the token as the lock value and release with unconditional deletion;
   password-reset claims already use a unique owner and compare-and-delete, so a
   stale signup workflow can release a newer claim after the original TTL has
   expired.
5. **High — Expense and revenue posting-account bootstrap is not retry-safe.**
   Their posting-account methods always construct default accounts without
   checking repository state, unlike asset and liability bootstrapping.
6. **Medium — Some justified application services contain unowned domain
   decisions.** Opening-balance creation, transaction-entry creation, and
   balance propagation are reused capabilities, but control-account,
   opening-date, journal-line compatibility, and balance-delta decisions are
   implemented in the application service rather than a domain entity or rule.
7. **Medium — Persistence ownership is inconsistent.**
   `domain/ledger/shared/services/ledger-account-persistence.service.ts` owns a
   transaction and repository writes despite an inline TODO acknowledging that
   it belongs in the application layer. Conversely,
   `fx-cost-basis-persistence.service.ts` mixes a domain consistency check into
   a one-workflow persistence wrapper.
8. **Medium — Public contracts expose misleading or unnecessary operations.**
   `grantUserAccess` only checks ownership; `validateAccountAccess` returns a
   boolean; `verifySignupToken` and `verifyPasswordResetToken` are production-
   unused convenience compositions; and the posting-account bootstrap methods
   are public even though production only invokes them internally.
9. **Medium — IoC modules do not exclusively perform composition.**
   `auth.usecases.ts` constructs `emailVerificationService`, while
   `infra/ioc/services/repo.service.ts` contains the PostgreSQL transaction
   implementation itself. `user.service.ts` constructs an unused service and
   `money.service.ts` exists only to wire the one-caller exchange-rate wrapper.
10. **Medium — Verification-email rendering is inconsistent.** Password-reset
    email rendering escapes the user’s first name; verification-email rendering
    interpolates it without escaping.

## Scope

### Expected Changes

- `.agents/rules/service-ownership.md` and `CONTRIBUTING.md` — align human and
  agent guidance around the same service taxonomy and extraction gate.
- `src/app/auth/{services,contracts,policies}` and auth use cases — separate
  password policy, password hashing, session tokens, and single-use token
  lifecycle capabilities; remove obsolete convenience methods.
- `src/infra/auth` and `src/infra/ioc/services/auth.service.ts` — own bcrypt/JWT
  implementations and construct all auth application services in one IoC module.
- `src/app/bookkeeping/services`, relevant domain rules, and their tests — keep
  reusable application coordination while moving business decisions to domain
  owners and normalizing balance-propagation naming.
- `src/domain/ledger/**/services`, `src/app/ledger/services`, ledger use cases,
  contracts, mocks, and IoC — make bootstrap capabilities explicit, split petty
  cash creation from asset bootstrapping, move reusable account persistence to
  the app layer, and remove the redundant access service.
- `src/app/ledger/usecases/create-petty-cash-account.usecase.ts` and its IoC/tests
  — absorb request-specific exchange-rate resolution and FX persistence.
- `src/domain/user/services`, its contract/mock/tests, and
  `src/infra/ioc/services/user.service.ts` — remove currently dead service code.
- `src/app/notification/services/transaction-email.service.ts` and its specs —
  consistently escape user-controlled template values.
- `src/shared/contracts/repo.contract.ts`, transaction consumers, and
  infrastructure persistence/IoC — rename the vague `IRepoService` behavior to
  a transaction-manager port and move its PostgreSQL implementation out of IoC.

### Conditional Changes

- Domain error files — move or rename errors only when their owning invariant
  moves; preserve existing client-facing keys unless a current key violates the
  repository error rules.
- Shared bootstrap helpers — add a pure, strongly typed tuple-collection helper
  only if the five family refactors still duplicate the same event/audit
  collection algorithm. Do not introduce a generic base bootstrap service.
- `src/domain/accounting/rules/fx-cost-basis/acquisition.rule.ts` — implement or
  remove the current empty rule only if the acquisition-consistency invariant
  is confirmed to exist independently of the by-construction guarantee in the
  FX lot acquisition service.

### Out of Scope

- Database schema or migration changes.
- HTTP response changes, route changes, or new product capabilities.
- A generic service framework, base class, registry, decorator, or service
  locator.
- Broad repository-interface redesign beyond the transaction-manager rename and
  dependencies directly affected by the service cleanup.
- Unrelated domain placeholders or TODOs that are not needed by an affected
  capability.

## Proposed Approach

### 1. Codify the disposition test and protect current correctness

- Update `service-ownership.md` and `CONTRIBUTING.md` with one shared rule:
  “A service is a named domain or reusable application capability, not a suffix
  for helpers, adapters, persistence, or grouping.”
- Document the required pre-creation questions: capability name, owner,
  independent contract, caller/reuse evidence, dependencies, transaction owner,
  and rejection versus best-effort semantics.
- Explicitly classify `.service.ts` files under `infra/ioc/services` as
  composition modules required by the IoC convention, not behavioral service
  implementations.
- Before structural work, add regression tests and fixes for unique signup claim
  ownership, compare-and-delete release/finalization, retry-safe expense/revenue
  posting bootstrap, and escaped verification-email names.
- Preserve current public outcomes while making these safety properties explicit.

### 2. Apply a service-by-service disposition

| Current implementation                                                      | Disposition                  | Final owner and capability                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/auth/services/email-verification.service.ts`                           | Keep                         | Application capability: reserve cooldown, issue a verification token, and request delivery. Move construction into auth service IoC and document rejection/boolean semantics.                                   |
| `app/auth/services/password.service.ts`                                     | Split/remove current service | Password acceptance remains an app/domain policy; bcrypt becomes an infrastructure implementation of a password-hasher port. No combined password service.                                                      |
| `app/auth/services/token.service.ts`                                        | Split/remove current service | One app capability for session-token issue/verification, one for exclusive single-use token lifecycle, plus an infrastructure JWT codec. Remove production-unused `verify*` convenience compositions.           |
| `app/bookkeeping/services/journal-entry-persistence.service.ts`             | Keep                         | Reusable application capability: atomically persist a journal-entry header and lines, composing with an outer transaction. Rename `create` to `persist` if callers/tests remain clearer.                        |
| `app/bookkeeping/services/ledger-account-balance-propagation.service.ts`    | Keep and narrow              | Application capability: best-effort queue propagation and report-once failure semantics. Move line compatibility and delta calculation into a pure domain rule; align contract filename with propagation.       |
| `app/bookkeeping/services/opening-balance-entry.service.ts`                 | Keep and narrow              | Reusable cross-domain application capability used by opening-balance and petty-cash workflows. Repositories load facts; domain rules own eligibility decisions; the service coordinates journal-entry creation. |
| `app/bookkeeping/services/transaction-entry.service.ts`                     | Keep and narrow              | Reusable application capability shared by payment and transfer workflows. Existing and new domain rules own account eligibility, source/destination compatibility, and opening-date decisions.                  |
| `app/ledger/services/accounts-bootstrap.service.ts`                         | Keep                         | Application capability: coordinate all ledger-family bootstraps and validate account/audit pairing. Preserve this as the cross-family owner.                                                                    |
| `app/money/services/exchange-rate.service.ts`                               | Inline and delete            | Its only workflow receives `IExchangeRateRepo` and performs the short official-rate resolution locally. Re-extract only after a second real caller or a richer independent policy appears.                      |
| `app/notification/services/transaction-email.service.ts`                    | Keep                         | Reusable application capability: render supported transactional emails and enqueue delivery. Escape user-controlled values consistently.                                                                        |
| `app/subledger/fx-cost-basis/services/fx-cost-basis-persistence.service.ts` | Inline and delete            | The petty-cash use case owns its transaction-specific lot/acquisition writes. Consistency is guaranteed by domain creation or a domain rule, never by persistence.                                              |
| `domain/accounting/services/accounting-entity.service.ts`                   | Keep and narrow              | Domain capability: coordinated creation of the accounting entity, periods, and contexts. Move access predicates/assertions to a pure accounting access rule.                                                    |
| `domain/accounting/services/accounting-period.service.ts`                   | Keep                         | Repository-backed domain invariant: find and assert an open posting period.                                                                                                                                     |
| `domain/ledger/asset-account/services/asset-account.service.ts`             | Split/rename                 | `asset-account-bootstrap` remains a domain service; petty-cash allocation becomes a separate repository-backed domain capability. Posting bootstrap becomes private to the bootstrap service.                   |
| Equity, expense, liability, and revenue account services                    | Keep/rename                  | Explicit `<family>-account-bootstrap` domain capabilities. Make repeated execution and partial recovery idempotent; keep family-specific rules visible.                                                         |
| `domain/ledger/shared/services/ledger-account-persistence.service.ts`       | Move and rename              | Reusable app capability: atomically persist an account and initial balance. Remove the unused logger dependency.                                                                                                |
| `domain/ledger/shared/services/ledger-account.service.ts`                   | Replace and delete           | Put the pure ownership predicate on the ledger-account entity/helper; let the already-loaded-account caller use it without a second repository read.                                                            |
| `domain/subledger/fx-cost-basis/services/lot.service.ts`                    | Keep/rename                  | Domain capability: coordinated FX lot acquisition creation. A capability-specific name replaces the broad `lotService` name.                                                                                    |
| `domain/user/services/user-preferences.service.ts`                          | Delete                       | It has no production caller and duplicates entity `make`/`update` behavior. A future update use case should load via the repository and invoke the entity directly.                                             |
| `infra/ioc/services/repo.service.ts`                                        | Reclassify                   | Move runtime behavior to a PostgreSQL transaction-manager implementation; IoC only constructs and exposes it through a persistence composition module.                                                          |
| Other `infra/ioc/services/*.service.ts` modules                             | Keep as IoC                  | They are composition roots, not behavioral services. Normalize collection names to what they actually contain and remove empty modules after other deletions.                                                   |

### 3. Remove false services without moving their complexity elsewhere

- Delete the user-preferences service, contract, mock, tests, and unused user
  service IoC module. Retain entity tests as the owner of preference behavior.
- Replace `ledgerAccountService.validateAccountAccess(accountId, userId, ...)`
  with a pure predicate on the already-loaded account. Update the use-case spec
  to assert that only one account lookup occurs.
- Inject `IExchangeRateRepo` directly into petty-cash creation and keep the
  official-rate resolution as a private, named helper within that use-case
  factory.
- Inject the FX lot/acquisition repositories directly into petty-cash creation
  and perform their writes in the existing `persistCreation` phase and existing
  transaction. Delete the persistence contract, mock, implementation, and
  service-level specs; transfer relevant assertions to the use-case spec.
- Rename `IRepoService` to `ITransactionManager` and `repoService` dependencies
  to `transactionManager`. Put the PostgreSQL implementation under
  infrastructure persistence and keep IoC limited to construction.

### 4. Tighten domain and application capability boundaries

- Extract pure bookkeeping decisions from the three retained app services:
  account posting eligibility and opening-date checks, journal-line/account
  compatibility, and balance-delta calculation. Place each rule with the domain
  context that owns its error and test it directly.
- Keep repository loading, queue mapping, report-once error handling, and
  cross-domain coordination in the application services.
- Move ledger-account creation persistence into `src/app/ledger/services`, keep
  its account-plus-initial-balance atomicity, and retain optional outer-
  transaction composition because it is used by more than one workflow.
- Rename the five family services and their contracts/IoC properties around the
  `bootstrap` capability. Split petty-cash creation from asset bootstrap because
  it owns different invariants and has an independent caller.
- Make posting-account bootstrap private unless another production caller is
  found during implementation. Add existence checks based on stable code or
  behavior so every family can resume safely after partial creation.
- Keep the cross-family accounts bootstrap service responsible for combining
  results and validating account/audit pairing; do not create another ledger
  manager above it.

### 5. Separate auth policy, application lifecycle, and infrastructure

- Replace `IPasswordService` with an independently meaningful password-hasher
  port containing only `hash` and `compare`. Keep password validation in the
  existing password policy or a value object and call it explicitly from signup
  and reset-password use cases.
- Implement the password-hasher port with bcrypt under infrastructure; construct
  it in auth service IoC.
- Introduce a JWT codec port responsible only for signing and verifying typed
  payloads. Its infrastructure implementation owns `jsonwebtoken`, algorithm
  selection, secret configuration, and translation of library exceptions into
  the app contract’s neutral result/error form.
- Replace the broad token service with two named application capabilities:
  session-token issuance/verification and exclusive single-use token lifecycle.
  Keep signup and password-reset purpose semantics explicit, but share the
  unique-owner claim primitive internally rather than duplicating lifecycle
  code.
- Remove `verifySignupToken` and `verifyPasswordResetToken`; production workflows
  already require explicit claim, transactional work, finalize, and conditional
  release phases.
- Update middleware, use cases, mocks, tests, and IoC to depend only on the
  capability they consume. No caller should receive the entire auth token API.

### 6. Normalize contracts, naming, and composition

- Use capability names in filenames, factory names, dependency properties, and
  IoC collections. Avoid broad names such as `domain`, `persistence`,
  `ledgerAccountService`, `authService.token`, or `currencyServices` when a
  precise capability name exists.
- Keep app service contracts under the owning app feature and domain service
  contracts/types under the owning domain feature. Remove contracts that exist
  only to support deleted wrappers.
- Construct every surviving domain/application service under
  `src/infra/ioc/services`; use-case IoC modules only inject constructed
  capabilities, repositories, ports, and transaction management.
- Delete `money.service.ts` and `user.service.ts` if they become empty. Update the
  FX cost-basis IoC collection so its name reflects the remaining acquisition
  capability rather than a mixed `domain`/`persistence` object.
- Prefer frozen factory return objects consistently for surviving services, but
  do not add factories or interfaces to pure one-function rules solely for
  stylistic uniformity.

## Test Plan

- **Domain unit:** Add direct tests for accounting/ledger access predicates,
  posting eligibility and opening-date rules, journal-line compatibility,
  balance-delta calculation, retry-safe family bootstrap, and FX acquisition
  consistency if retained as an independent invariant. Keep these in the
  owning domain `__tests__` directories and exercise public entity/rule/service
  APIs.
- **Application component:** Preserve and relocate service specs for retained
  capabilities. Transfer exchange-rate and FX persistence assertions into the
  petty-cash use-case spec. Add tests for one account lookup during access,
  explicit token claim/finalize/release ordering, documented rejection versus
  best-effort behavior, and nested transaction composition.
- **Infrastructure component:** Add focused specs for bcrypt and JWT adapter
  behavior, including algorithm enforcement and library-error translation, and
  for the PostgreSQL transaction manager’s existing transaction passthrough.
- **Security regression:** Test that stale signup claim owners cannot release or
  finalize a newer claim and that all user-controlled email display values are
  escaped.
- **Regression:** Existing public use-case outputs, event publication timing,
  audit/history persistence, token TTLs, cache-key compatibility, journal-entry
  atomicity, and balance-propagation best-effort semantics must remain intact.

## Verification

Run the narrowest affected suites after each workstream, then the complete
service/use-case set and repository checks:

```bash
npm test -- --runInBand --testPathPatterns='token|password|transaction-email|bootstrap|create-petty-cash-account|get-account-transactions'
npm test -- --runInBand --testPathPatterns='/services/|/rules/|/usecases/'
npm run lint
npm run build
npm test -- --runInBand
```

The build may require runtime environment variables used by configuration
imports; if so, run it with the repository’s documented test environment rather
than weakening configuration validation.

## Assumptions

- Service contracts are internal TypeScript APIs rather than published package
  contracts. Compilation and repository-wide search will validate that no
  production caller remains before deletion.
- “Bootstrap” is intended to support retries and partial recovery. This is
  inferred from existing repository checks and partial-bootstrap tests; confirm
  by retaining the current idempotent behavior for asset/liability and extending
  it to expense/revenue.
- Token TTLs and existing cache-key prefixes are compatibility-sensitive. The
  auth split will preserve them unless a separate security/product requirement
  explicitly changes them.
- The work should be delivered in the numbered workstreams rather than one
  repository-wide rewrite, with the focused suite green after each workstream.

## Risks

- **Auth compatibility:** Splitting token capabilities can accidentally change
  claims, expiry, key names, or error mapping. Characterization tests must pin
  current wire behavior before moving code.
- **Concurrency:** Bootstrap existence checks alone do not replace database
  uniqueness under concurrent calls. Retain transactional locks/constraints and
  treat application checks as retry/partial-recovery behavior, not the sole
  guarantee.
- **Transaction drift:** Inlining FX persistence or moving ledger persistence
  can change atomicity if writes escape the existing transaction options. Tests
  must assert the same transaction context reaches every write.
- **Error ownership:** Moving a rule may change which error class escapes. Keep
  existing client-visible error keys unless the current class is demonstrably
  owned by the wrong context and mapping is updated deliberately.
- **Oversimplification:** Removing services can make large use cases harder to
  scan. Use private named helpers and progressive disclosure inside the owning
  factory; do not recreate deleted services merely to reduce line count.

## Completion Criteria

- Every behavioral `*.service.ts` has a documented named capability and correct
  domain/application owner; IoC `*.service.ts` files contain composition only.
- The four unjustified wrappers are removed, and no deleted contract, mock, IoC
  property, or production import remains.
- Password/JWT libraries are owned by infrastructure adapters, while auth use
  cases depend on narrow policy/hasher/session-token/single-use-token contracts.
- Signup claims use unique ownership and safe compare-and-delete semantics.
- All ledger-family bootstrap paths are retry-safe and covered for full,
  repeated, and partial bootstrap scenarios.
- Domain decisions extracted from bookkeeping app services are tested at the
  domain layer; app services retain only reusable coordination and documented
  side-effect semantics.
- Ledger account access uses the already-loaded account with no redundant
  repository read, and user-preferences behavior remains owned by its entity.
- Human and agent contribution guidance state the same service philosophy.
- Focused tests, complete tests, lint, and build pass, with 100% coverage for all
  touched behavior.
- Public API behavior, event/audit semantics, transaction atomicity, and
  unrelated files remain unchanged.
