# Harden Accounting Entity Creation Plan

## Goal

Make `POST /api/v1/accounting/accounting-entity` safe and deterministic from
the assembled HTTP boundary through validation, domain construction,
persistence, context update, and event publication, and add a proper Supertest
integration spec under `test/http/user`.

This plan is implementation-ready. Implementation must preserve unrelated
staged and working-tree changes.

## Context

The controller authenticates the request and delegates the body unchanged to
the IoC-wired creation use case. The use case validates the DTO, permits only
individual entities, checks whether the authenticated user already owns one,
constructs the accounting/reporting hierarchy and initial ledger accounts,
persists them in one outer transaction, updates request context, and publishes
the accumulated domain events.

Existing tests cover domain objects, DTO schemas, middleware, persistence
components, and several mocked use-case success paths, but there is no assembled
HTTP spec for this endpoint. The requested integration location is
`test/http/user`, even though the route is under `/accounting`.

## Confirmed Findings

1. **P1 — Concurrent requests can create duplicate individual accounting entities.** The use case performs a read-before-write conflict check at
   `src/app/accounting/usecases/create-accounting-entity.usecase.ts:75`, but the
   `core.accounting_entities` schema has no unique constraint over `owner_id`
   and `type` at `src/infra/config/drizzle/schema.ts:231`. Two requests can both
   observe no existing row and commit duplicates, violating the use case's
   one-individual-entity rule. Enforce the invariant atomically in PostgreSQL
   and map the expected constraint violation to HTTP 409.
2. **P1 — Initial ledger-account histories are duplicated and attached to every account creation.** The use case builds the complete audit list once and
   passes that entire list to every per-account persistence call at
   `src/app/accounting/usecases/create-accounting-entity.usecase.ts:267` and
   `:303`. `ledger-account.repo.impl.ts` saves every supplied history on each
   call, yielding N copies of each history for N accounts. Associate each
   account with only its own history (or persist the accounts and histories in
   one correctly paired batch).
3. **P1 — Event publication failures are not observed or logged.** Although
   `IEventBus.publish` returns `Promise<void>`, the use case does not await it at
   `src/app/accounting/usecases/create-accounting-entity.usecase.ts:334`. The API
   can return success before publication finishes, and a rejection can become
   unhandled. Observe the publication promise, log failures, and still return
   success because these events drive non-critical UX behavior such as
   suggestions and onboarding emails.
4. **P2 security/availability — Period generation accepts unsafe numeric and
   date bounds.** `periodCreationDtoSchema` accepts any JavaScript number at
   `src/app/accounting/dtos/accounting/accounting.dto.validation.ts:76`, while
   `period.helpers.ts:71` checks positivity but not integer-ness or a bounded
   fiscal-year duration. Fractional counts produce a surprising number of loop
   iterations, and a caller-controlled far-future range with day-sized periods
   can allocate and persist a very large object/event graph. Require integer
   counts and enforce explicit product limits on fiscal-year span and generated
   period counts before allocation.
5. **P2 — The HTTP contract documents 201 but does not declare a response type.** `AccountingController.createAccountingEntity` has no explicit return
   type at `src/interface/http/controllers/accounting.controller.ts:33`.
   Declare the public response contract and use the HTTP integration spec to
   ensure only the intended accounting-entity fields are serialized with 201.
6. **Test gap — Existing use-case assertions are too coarse to detect the
   confirmed failures.** The success tests mostly assert that collaborators
   were called. They do not verify one history per matching ledger account,
   awaiting/rejecting event publication, transaction rollback on a persistence
   failure, context mutation only after commit, exact bootstrap flags, exact
   event composition, or conflict handling at the persistence race boundary.
7. **Test gap — There is no assembled HTTP coverage.** Authentication failure,
   malformed authorization, TSOA body/date validation, unsupported values,
   caller-supplied identity/header manipulation, conflict mapping, sanitized
   500 responses, the 201 response contract, and security headers are not
   exercised for this endpoint.

## Scope

### Expected Changes

- `src/interface/http/controllers/accounting.controller.ts` — make the 201
  response contract explicit while keeping the controller orchestration-only.
- `src/app/accounting/dtos/accounting/accounting.dto.validation.ts` — reject
  fractional/unbounded period requests and fiscal years longer than 18 months
  before domain graph construction; add a TODO to source this limit from
  jurisdiction data after the follow-up ticket is implemented.
- `src/app/accounting/dtos/accounting/__test__/accounting.dto.validation.test.ts`
  — cover all new boundaries and malicious/oversized inputs.
- `src/app/accounting/usecases/create-accounting-entity.usecase.ts` — pair
  account histories correctly, observe and log publication failures without
  failing creation, and preserve correct post-commit context ordering.
- `src/app/accounting/usecases/__specs__/create-accounting-entity.usecase.spec.ts`
  — replace call-only assertions with exact orchestration, transaction,
  history, event, and failure-path assertions.
- `src/infra/config/drizzle/schema.ts` and a new database migration — enforce
  the one-owner/individual-type invariant atomically.
- `src/infra/persistence/repos/accounting/accounting-entity.repo.impl.ts` and
  nearby specs — translate only the named uniqueness violation into the app
  conflict error while preserving unknown database failures.
- `test/http/user/create-accounting-entity.post.spec.ts` — add the assembled
  Supertest contract and security suite requested by the user.

### Conditional Changes

- Ledger persistence contracts/service/repository files — change only if a
  batch API is the smallest way to persist account/history pairs without N
  nested calls; otherwise keep the current contract and pass the matching
  single history per account.
- Error mapping helpers — change only if the repository's constraint-error
  translation cannot reuse an existing typed conflict mapping.

### Out of Scope

- Supporting sole-trader or private-company creation; the current use case
  intentionally rejects them.
- Changing authorization semantics for unrelated accounting endpoints.
- Introducing a transactional outbox across the whole application. The event
  publication fix treats these events as non-critical UX side effects and logs
  failures without failing entity creation.

## Proposed Approach

### 1. Lock down input and the HTTP contract

- Hardcode a named 18-month maximum fiscal-year span and apply integer/positive/
  upper-bound period validation at the DTO/application boundary. Add a TODO
  beside the constant noting that jurisdiction data should own this limit once
  the follow-up ticket is implemented.
- Retain domain validation as defense in depth, including integer validation in
  `periodHelpers.getIntervals` so non-HTTP callers cannot bypass the invariant.
- Declare `Promise<IAccountingEntity>` on the controller and verify that TSOA
  produces a 201 response with the intended serialized fields.

### 2. Make creation persistence race-safe and audit-correct

- Add a partial unique database constraint/index for the supported individual
  entity invariant (owner plus individual type), so future entity types are not
  accidentally restricted to one unless product rules require that.
- Add the constraint directly; the application has no production data requiring
  duplicate cleanup or a migration precondition.
- Catch and map only that constraint's PostgreSQL error to `appError.Conflict`;
  retain the preliminary lookup for a friendly fast path, but rely on the
  database for correctness.
- Zip ledger accounts to their audit records by entity ID and pass/save each
  history exactly once. Reject inconsistent bootstrap output rather than
  silently dropping or cross-associating audits.

### 3. Define completion and failure ordering

- Keep all database writes inside the existing outer transaction and assert
  that any child persistence failure prevents later context/event actions.
- Set the accounting entity in request context only after commit.
- Observe event publication in a `try`/`catch`, log a rejection with correlation
  context through the injected logger, and still return the committed entity
  with HTTP 201. These events are non-critical UX side effects, so publication
  failure must not change the creation result.

### 4. Add precise automated coverage

- Strengthen the use-case spec with exact payload/transaction options,
  per-account history ownership and cardinality, bootstrap-mode arguments,
  enriched event set, call ordering, and failure paths.
- Add repository coverage for the unique constraint mapping and a focused
  database-backed concurrency test if the repository test harness supports
  transactions against PostgreSQL.
- Add the requested Supertest spec using the real Express/TSOA boundary. Mock
  authentication/user lookup and the creation use case as external boundaries,
  following the established `test/http/user` pattern; do not mock Express
  request or response objects.

## Test Plan

- **DTO/domain unit:** accept the supported minimum/maximum integer counts and
  an 18-month fiscal year; reject zero, negative, fractional, non-finite,
  excessive, reversed, equal/invalid, and greater-than-18-month ranges before
  interval allocation.
- **Use-case component:** verify 400 for unsupported entity type, fast-path and
  database-race conflicts, exact domain persistence in one transaction, one
  matching audit per ledger account, PowerUser/NonPowerUser bootstrap behavior,
  no context/event work after rollback, context update after commit, awaited
  publication, logged publish rejection, and a successful result after that
  rejection.
- **HTTP integration (`test/http/user/create-accounting-entity.post.spec.ts`):**
  group by 201/400/401/403/409/422/500. Cover the exact success body and content
  type, Helmet security headers, missing/malformed/expired authorization,
  nonexistent users, foreign `x-accounting-entity-id`, caller-supplied owner IDs,
  unsupported entity type/standard/jurisdiction/currency/mode, malformed and
  excessive period/date data, conflict mapping, and sanitized internal errors.
  Assert invalid requests never reach the creation use case.
- **Persistence regression:** prove two concurrent creates for the same owner
  and individual type yield one success and one conflict, with exactly one
  complete aggregate and no duplicate ledger audit rows.
- **Regression:** retain future fiscal-year and both app-usage-mode behavior,
  plus successful creation for all currently supported jurisdiction/standard
  and currency combinations.

## Verification

Run focused checks first, then the relevant HTTP and full static checks:

```bash
npx jest src/app/accounting/dtos/accounting/__test__/accounting.dto.validation.test.ts --runInBand
npx jest src/app/accounting/usecases/__specs__/create-accounting-entity.usecase.spec.ts --runInBand
npx jest test/http/user/create-accounting-entity.post.spec.ts --runInBand
npm run build
npm run lint
```

Run the database-backed uniqueness/concurrency verification through the
repository's test database workflow. It depends on a configured test PostgreSQL
instance and the new migration being applied.

## Assumptions

- The current product invariant is at most one `individual` accounting entity
  per user, matching the use-case lookup and conflict behavior. Confirm this
  against product requirements before choosing the partial unique index
  predicate.
- The requested `test/http/user` location is authoritative despite the route's
  accounting prefix.
- Event delivery is best-effort after database commit. Publication failures are
  logged and do not fail accounting-entity creation because the consumers
  provide non-critical UX behavior.

## Risks

- Stricter date/count limits can reject previously accepted payloads; publish
  the hardcoded 18-month limit in the generated API schema, test boundary
  values, and retain the TODO to move the rule into jurisdiction data.
- Logging and continuing means UX side effects can be missed. Include event and
  correlation context in the log so failures remain diagnosable.

## Completion Criteria

- Concurrent requests cannot create more than one individual accounting entity
  for a user, and the losing request receives the documented 409 contract.
- Each bootstrapped ledger account and balance is persisted once with exactly
  its own audit history, all within the aggregate transaction.
- Oversized or malformed period-generation inputs are rejected before expensive
  work, and valid supported payloads still succeed.
- Event publication failures are observed and logged, creation still returns
  201, and both success and failure ordering are covered.
- The new `test/http/user/create-accounting-entity.post.spec.ts` suite covers
  the assembled authentication, validation, response, error, and security
  contracts and passes alongside focused unit/component tests.
- Build and lint pass, with unrelated files and behavior unchanged.
