# Harden Get User Preferences and Add HTTP Integration Plan

## Goal

Make `GET /api/v1/users/preferences` accurately named, securely authenticated,
contract-consistent, and covered from the Express route through request context,
authorization middleware, controller, use case, and persistence boundary.

The plan is implementation-ready except for the missing-preferences response
decision recorded below. Preserve unrelated staged and working-tree changes
during implementation.

## Context

The generated route invokes
`UserController.getCurrencies`, whose `getUserPreferences` operation delegates
to `userUseCase.getPreferences`. The use case reads the authenticated user from
`AsyncLocalStorage` and queries `userPreferencesRepo.findById(user.id)`. The
repository selects `core.user_preferences.id = authenticated user.id` and maps
the JSONB record to the domain type.

Authentication is actually enforced by `appContext` plus
`isAuthenticatedUser`; TSOA's `expressAuthentication` is intentionally a
passthrough. Existing unit tests cover the use case's successful and missing
context paths, the authentication middleware, the mapper's happy path, and the
domain entity. There is no `test/http/user` suite and no repository test for
this read path.

## Confirmed Findings

1. **High — The authorization parser does not enforce the Bearer scheme.**
   `get-auth-user-from-request.helper.ts` takes the second whitespace-delimited
   value from any `Authorization` header, so values such as
   `Basic <valid-access-token>` reach token verification. This violates the
   advertised bearer-auth contract. Existing helper tests cover missing and
   invalid tokens but not a wrong scheme, extra segments, or malformed spacing.
2. **Medium — The missing-record response contradicts the generated API
   contract.** `IUserPreferencesRepo.findById` can return `null`, and the use
   case passes it through as `200 null`; generated OpenAPI documents the 200
   response as a non-null `IUserPreferences`. No test specifies the intended
   behavior when an authenticated user has no preferences row.
3. **Low — The controller method is incorrectly named `getCurrencies`.** The
   operation ID and URL are correct, but generated routes, middleware metadata,
   stack traces, direct controller calls, and coverage all use the unrelated
   currency name.
4. **Medium — Persistence output bypasses domain validation and immutability.**
   `user-preferences.mapper.ts` casts JSONB directly to
   `IUserAppPreferences` and returns a mutable object. Invalid persisted enum
   values can therefore be exposed by the endpoint, and this conflicts with
   the repository's strong-immutability rule. Mapper tests cover only valid
   round trips.
5. **Medium — The endpoint has no HTTP integration coverage.** There are no
   tests confirming that authentication context is propagated, the repository
   is scoped to the authenticated user's ID, preferences are serialized
   correctly, unauthenticated/malformed credentials are rejected, or unexpected
   failures are sanitized.
6. **Low — The read repository has no focused automated coverage.** Its
   ID-filter, limit, correlation/transaction query selection, null result, and
   mapper delegation are only indirectly represented by mocked use-case tests.

## Scope

### Expected Changes

- `src/interface/http/controllers/user.controller.ts` — rename the method to
  `getUserPreferences`, add an explicit return contract, and document all
  selected response statuses.
- `generated/routes.ts` and `generated/swagger.json` — regenerate TSOA outputs
  after controller/contract changes; do not hand-edit generated files.
- `src/interface/http/helpers/get-auth-user-from-request.helper.ts` — strictly
  parse the Bearer authorization scheme.
- `src/interface/http/helpers/__specs__/get-auth-user-from-request.helper.spec.ts`
  — cover wrong schemes and malformed headers without invoking token or user
  lookup.
- `src/app/user/usecases/get-preferences.usecase.ts` — enforce the selected
  missing-preferences contract and retain authenticated-user scoping.
- `src/app/user/usecases/__specs__/get-preferences.usecase.spec.ts` — cover a
  missing row, repository failures, exact user/correlation propagation, and
  ensure unauthorized access performs no preferences query.
- `src/infra/persistence/mappers/user/user-preferences.mapper.ts` and its nearby
  spec — reconstruct a validated, deeply immutable domain value from persisted
  JSONB, including invalid-data tests.
- `src/infra/persistence/repos/user/user-preferences.repo.impl.ts` and a nearby
  repository spec — cover exact ID filtering, one-row selection, null, mapper
  delegation, and query-option handling.
- `test/http/user/get-user-preferences.get.spec.ts` — add the full HTTP
  integration suite using `createApplication` and controlled spies at external
  authentication/database boundaries.

### Conditional Changes

- `src/app/user/errors/*` or `src/shared/errors/*` — add or reuse a not-found
  error only if the selected missing-preferences contract is `404`.
- User creation/event persistence code — ensure a default preferences row is
  atomically created only if the product invariant is that every completed user
  must always have preferences.
- Response DTO/mapper files under `src/app/user/dtos` — add an interface DTO if
  the endpoint should not expose the domain persistence shape directly.

### Out of Scope

- Adding an update-preferences endpoint.
- Reworking the application-wide TSOA passthrough authentication design.
- Changing unrelated user/profile or authentication endpoints.
- Applying persistence validation changes to unrelated mappers.

## Proposed Approach

### 1. Lock the HTTP and authentication contract

- Rename the controller method and declare its return type so route generation
  and API documentation reflect the endpoint.
- Parse authorization as exactly one case-insensitive `Bearer` scheme plus one
  non-empty token; reject other schemes and malformed values before token
  verification.
- Regenerate routes/specs and verify the generated route invokes
  `getUserPreferences`.

### 2. Make missing and persisted data behavior explicit

- Implement the chosen missing-row behavior consistently in the use case,
  controller response metadata, OpenAPI output, and tests.
- Rehydrate repository records through domain validation (without generating a
  domain event for a read), preserving persisted timestamps while returning a
  deeply frozen value.
- Keep repository behavior limited to selecting by the authenticated user's
  primary key and mapping the result.

### 3. Add layered regression coverage

- Extend helper and use-case unit specs for malformed authorization,
  unauthorized short-circuiting, missing data, dependency failures, and exact
  correlation/user ID propagation.
- Add a focused repository spec around the Drizzle query boundary and mapper.
- Add `test/http/user/get-user-preferences.get.spec.ts` that boots the real
  Express application and exercises the global context middleware, route
  middleware, controller, and real use case while spying only on token/user and
  preferences persistence boundaries.

## Test Plan

- **Unit/component:** Verify strict Bearer parsing; valid mapper rehydration and
  deep immutability; rejection/sanitization of invalid persisted preference
  enums; use-case success, unauthorized, missing-row, and repository-failure
  behavior; repository filtering, null, and mapper behavior.
- **HTTP integration:** Under `test/http/user`, verify a valid bearer token
  returns only the authenticated user's preferences with ISO date
  serialization; no header, wrong scheme, malformed token, deleted/missing user,
  and invalid token return `401` without querying preferences; another user's
  preferences cannot be requested by headers/query/body; the selected
  missing-row response is honored; unexpected persistence errors return a
  sanitized `500` with no token or internal error leakage.
- **Regression:** Confirm the operation remains
  `GET /api/v1/users/preferences`, successful responses match the generated
  OpenAPI schema, correlation IDs reach repository options, and profile/auth
  routes continue to work.

## Verification

Run focused tests before generated-output, type, and broader checks:

```bash
npx jest src/interface/http/helpers/__specs__/get-auth-user-from-request.helper.spec.ts src/app/user/usecases/__specs__/get-preferences.usecase.spec.ts src/infra/persistence/mappers/user/__specs__/user-preferences.mapper.spec.ts test/http/user/get-user-preferences.get.spec.ts --runInBand
npm run build:routes
npm run build
npm run lint
npx jest test/http/user --runInBand
npm test -- --runInBand
```

If the repository spec uses the test PostgreSQL instance rather than a mocked
Drizzle boundary, also run the project test-database setup/reset workflow; that
check depends on local test database credentials and infrastructure.

## Open Decisions

- **What should an authenticated user receive when no preferences row exists?**
  Recommended: return a typed `404` because the current repository explicitly
  models absence and the documented 200 contract requires a preferences object.
  Alternative: return a deterministic default preferences DTO with `200` if
  absence is a valid product state. A third option is to guarantee row creation
  with the user and treat absence as an invariant violation; that expands the
  change into user-creation persistence and recovery/backfill.

## Risks

- Tightening authorization parsing can reject clients that currently send
  non-standard headers; this is intended security hardening and should be noted
  as a compatibility correction.
- Rehydration validation may surface legacy invalid JSONB rows. Before release,
  inspect existing values or provide a repair migration if invalid enum values
  exist.
- HTTP tests must restore spies and use per-test token values to avoid leaking
  singleton IoC state or rate-limit buckets between tests.
- TSOA-generated files can drift if the build step is skipped; generated route
  and OpenAPI assertions plus regeneration prevent stale method names/contracts.

## Completion Criteria

- `GET /api/v1/users/preferences` invokes a method named
  `getUserPreferences` and generated artifacts contain no
  `UserController_getCurrencies` reference.
- Only a well-formed Bearer access token can establish the authenticated user.
- The preferences lookup is demonstrably restricted to the authenticated
  user's ID and preserves the request correlation ID.
- Successful and missing-row responses match the declared OpenAPI contract.
- Invalid persisted preferences cannot be returned as trusted domain data.
- Unit, repository, and `test/http/user` integration cases cover all behaviors
  listed above and focused/build/lint/broader verification passes.
- Unrelated staged and working-tree files remain unchanged.
