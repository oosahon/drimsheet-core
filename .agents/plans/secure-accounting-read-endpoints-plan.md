# Secure Accounting Read Endpoints Plan

## Goal

Make `GET /accounting/jurisdictions`, `GET /accounting/accounting-entities`,
and `GET /accounting/accounting-entity` accurate, tenant-safe, explicitly
documented, and covered through the assembled HTTP boundary under
`test/http/user`.

This plan is implementation-ready. It preserves unrelated staged and
working-tree changes during implementation.

## Context

The controller delegates directly to application use cases. Authentication and
the optional `x-accounting-entity-id` context are assembled globally before the
controller runs. Jurisdictions come from static domain configuration; the user
entity list queries by the authenticated context user's ID; the active-entity
use case returns the accounting entity placed in request context.

The three GET endpoints currently have application-level unit coverage, and the
shared authentication/context middleware has isolated unit coverage, but none
of these endpoints has a Supertest integration spec. The only accounting HTTP
spec under `test/http/user` covers entity creation.

## Confirmed Findings

1. **High — Entity existence can be disclosed across users.**
   `getAccountingEntityFromRequest` loads by caller-supplied entity ID alone
   (`src/interface/http/helpers/get-accounting-entity-from-request.helper.ts:24`),
   and ownership is checked later by `isAuthenticatedUser`
   (`src/interface/http/middlewares/is-authenticated-user.middleware.ts:20`). A
   foreign existing ID therefore produces `403`, while an unknown ID is stored
   as an empty context and can proceed. This creates an authenticated entity-ID
   enumeration oracle and makes an irrelevant foreign header block the user
   entity-list endpoint.
2. **High — The active-entity endpoint violates its declared success contract.**
   Missing or unknown `x-accounting-entity-id` values become `{}` in app context
   (`src/interface/http/middlewares/app-context-init.middleware.ts:73`), and the
   active-entity use case returns that value without validation
   (`src/app/accounting/usecases/get-active-accounting-entity.usecase.ts:9`). The
   controller consequently returns `200 {}` despite declaring
   `Promise<IAccountingEntity>`.
3. **Medium — The controller's documented error contracts are incomplete and
   inaccurate.** The authenticated endpoints can return `403` from ownership
   enforcement and `500` from unexpected dependency failures, but do not
   declare them. They declare `409`, although neither read use case raises a
   conflict. The active endpoint also needs the chosen missing-entity status
   documented. Return types are absent for jurisdictions and the user entity
   list, weakening generated API contracts.
4. **Medium — There is no assembled HTTP coverage for the three routes.**
   Existing use-case specs do not verify route registration, authentication,
   header parsing, context propagation, serialization of dates, response
   headers, status mapping, or sanitization of unexpected failures.
5. **Medium — Persistence read behavior is uncovered.**
   `accounting-entity.repo.impl.spec.ts` covers only `create`; neither
   `findById` nor `findByUserId` is tested. The ownership-safe lookup required to
   close the enumeration issue therefore also needs adapter-level query and
   mapping coverage.
6. **Low — Existing isolated tests encode only the insecure lookup shape and
   the happy path.** The request helper test expects lookup by entity ID without
   owner scope, and the active-use-case spec has no missing-context case. The
   user-entity use-case specs cover populated and empty results but not
   dependency failure propagation/correlation behavior at the HTTP boundary.

## Scope

### Expected Changes

- `src/interface/http/controllers/accounting.controller.ts` — add explicit
  success types and truthful `400`/`401`/`403`/`404`/`500` response metadata;
  remove unsupported `409` metadata from the read routes.
- `src/interface/http/helpers/get-accounting-entity-from-request.helper.ts` —
  resolve requested entities through an ownership-scoped repository operation
  so foreign and nonexistent IDs are indistinguishable.
- `src/domain/accounting/repos/accounting-entity.repo.ts` — define the minimal
  ownership-scoped read contract needed by request-context assembly.
- `src/infra/persistence/repos/accounting/accounting-entity.repo.impl.ts` —
  filter by both entity ID and authenticated owner ID in one database query.
- `src/app/accounting/usecases/get-active-accounting-entity.usecase.ts` — reject
  an absent active entity instead of returning an object-shaped sentinel.
- `src/app/accounting/usecases/__specs__/get-active-accounting-entity.usecase.spec.ts`
  — cover the missing-active-entity error.
- `src/interface/http/helpers/__specs__/get-accounting-entity-from-request.helper.spec.ts`
  and relevant middleware specs — assert ownership is passed into lookup and
  that missing/foreign entities produce the same context state.
- `src/infra/persistence/repos/accounting/__specs__/accounting-entity.repo.impl.spec.ts`
  — cover the new scoped read plus existing `findById`/`findByUserId` mapping,
  filtering, empty-result, and failure behavior.
- `test/http/user/get-jurisdictions.get.spec.ts` — cover the public static-list
  endpoint through Express/Tsoa.
- `test/http/user/get-user-accounting-entities.get.spec.ts` — cover authenticated
  user scoping and list serialization through the HTTP boundary.
- `test/http/user/get-active-accounting-entity.get.spec.ts` — cover active
  context selection, authorization, non-disclosure, and missing selection.

### Conditional Changes

- `src/app/accounting/errors/accounting.error.ts` and HTTP error-status mapping
  — add/use a context-owned active-entity-not-found error if no existing
  accounting application error represents the missing selection while mapping
  it to `404`.
- Shared repository mocks and their consumers — add the ownership-scoped method
  where the repository contract change makes it necessary; use the existing
  shared mock rather than ad hoc unit-test doubles.
- Generated Tsoa routes/OpenAPI artifacts — regenerate only if they are tracked
  by the repository workflow.

### Out of Scope

- Changing the jurisdiction catalogue or requiring authentication for the
  currently public jurisdiction endpoint.
- Expanding ownership into a multi-user membership/role model; current domain
  access is owner-only.
- Reworking the global request-context sentinel representation across unrelated
  endpoints.

## Proposed Approach

### 1. Close the ownership lookup oracle

- Add an accounting-entity repository read that accepts both entity ID and
  authenticated user ID and applies both predicates in the SQL `WHERE` clause.
- Use it during request-context initialization. Return the same `null` result
  for nonexistent and foreign entities, and retain `400` for malformed UUIDs.
- Update helper, middleware, repository, and mock tests so ownership scoping
  cannot regress into a load-then-authorize sequence.

### 2. Make active-entity absence explicit

- In the application use case, treat an empty/missing accounting entity in app
  context as a not-found outcome and raise the accounting application error
  mapped to `404`.
- Keep the valid path orchestration-only: return the already authorized entity
  from request context.
- Declare the actual controller response type/statuses and verify that foreign
  and nonexistent IDs have the same external response and do not expose entity
  attributes.

### 3. Correct contracts for all three endpoints

- Type jurisdictions as `IJurisdictionDto[]` and the user entity list as
  `IAccountingEntity[]`; retain the active entity's explicit type.
- Align Tsoa response annotations with reachable behavior. Include `500`, add
  authentication/authorization/not-found statuses where applicable, and remove
  read-route `409` declarations that have no producer.
- Assert only intended public/domain fields are serialized, including ISO date
  serialization for accounting entities and the exact jurisdiction DTO shape.

### 4. Add HTTP integration coverage

- Follow the existing `test/http/user` pattern: create the real application,
  drive it with Supertest, and mock authentication, use cases, and persistence
  only at established external/IoC boundaries.
- For jurisdictions, assert `200`, JSON content type, security headers, exact
  DTO shape, no authentication requirement, and sanitized `500` behavior.
- For the user entity list, assert authenticated `200` populated/empty results,
  authenticated-user repository scoping (ignoring caller-supplied user IDs),
  ISO dates, missing/malformed/expired auth `401`, missing user `401`, foreign
  entity-header non-disclosure, malformed entity-header `400`, and sanitized
  repository/use-case `500` failures.
- For the active entity, assert authenticated `200` only with an owned selected
  entity, ISO dates and exact fields, malformed header `400`, missing/unknown/
  foreign IDs with the agreed identical `404` response, authentication failures
  as `401`, and sanitized `500` failures.

## Test Plan

- **Application unit:** extend active-entity coverage for valid and empty
  context; retain jurisdiction mapping and authenticated-user ID/correlation ID
  assertions for list retrieval.
- **Interface unit:** cover UUID validation, ownership-scoped request lookup,
  null handling, and middleware behavior without `any` or ad hoc mocks.
- **Infrastructure adapter:** verify scoped SQL predicates, optional type filter,
  mapper calls, empty results, and database error propagation for entity reads.
- **HTTP integration:** add the three GET specs under `test/http/user`, grouped
  by numeric response status, asserting contract, headers, authentication,
  authorization/non-disclosure, orchestration boundaries, and safe errors.
- **Regression:** retain accounting-entity creation behavior and verify its
  foreign-context `403` expectation is updated only if the ownership-scoped
  lookup intentionally normalizes that path.

## Verification

Run focused suites before broader static and regression checks:

```bash
yarn test test/http/user/get-jurisdictions.get.spec.ts test/http/user/get-user-accounting-entities.get.spec.ts test/http/user/get-active-accounting-entity.get.spec.ts --runInBand
yarn test src/app/accounting/usecases/__specs__/get-active-accounting-entity.usecase.spec.ts src/interface/http/helpers/__specs__/get-accounting-entity-from-request.helper.spec.ts src/interface/http/middlewares/__specs__/app-context-init.middleware.spec.ts src/interface/http/middlewares/__specs__/is-authenticated-user.middleware.spec.ts src/infra/persistence/repos/accounting/__specs__/accounting-entity.repo.impl.spec.ts --runInBand
yarn test test/http/user/create-accounting-entity.post.spec.ts --runInBand
yarn build
yarn lint
yarn test --coverage --runInBand
```

The integration suites use mocked infrastructure boundaries and should not
require a live database or external credentials.

## Assumptions

- Jurisdictions are intentionally public because the controller has no auth
  middleware today and the returned configuration contains no tenant or secret
  data; validate this against product requirements before changing exposure.
- A missing, nonexistent, or inaccessible active entity should be represented
  uniformly as `404` to prevent existence disclosure. If the public API already
  mandates a different status, keep the non-disclosure invariant and update the
  controller/tests consistently.

## Risks

- Ownership-scoping the global context lookup changes a foreign entity header
  from an explicit `403` into an indistinguishable missing context. Mitigate by
  documenting the security-driven behavior and updating all affected HTTP
  regression tests together.
- Changing a repository interface affects shared mocks and all structural
  implementations. Use a narrow method addition and let TypeScript identify
  every required update.
- Returning `404` instead of `200 {}` can affect clients that relied on the
  invalid sentinel response. Treat the declared `IAccountingEntity` contract as
  authoritative and call out the correction in release notes if needed.

## Completion Criteria

- Foreign and nonexistent accounting entity IDs are externally
  indistinguishable and no cross-user entity data is returned.
- The active endpoint never returns `200` without a complete
  `IAccountingEntity`.
- The list endpoint queries only with the authenticated context user's ID and
  returns populated and empty lists correctly.
- The jurisdiction endpoint returns only the documented static DTO fields.
- Controller/Tsoa response and return types match reachable runtime behavior.
- All new unit, adapter, and HTTP integration tests pass with 100% coverage for
  touched behavior; build, lint, and existing accounting HTTP regressions pass.
- Unrelated files and behavior remain unchanged.
