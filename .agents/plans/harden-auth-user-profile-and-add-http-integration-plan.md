# Harden Auth User Profile and Add HTTP Integration Plan

## Goal

Make `GET /api/v1/users/profile` return an explicit, least-privilege profile
contract, remain securely scoped to the bearer-authenticated user, and gain
integration coverage from the assembled Express route through request context,
authentication middleware, controller, use case, and user persistence boundary.

This plan is implementation-ready. Preserve unrelated staged and working-tree
changes, including the existing modifications to `generated/routes.ts` and
`generated/swagger.json`, during implementation.

## Context

The generated `GET /api/v1/users/profile` route runs the global app-context
middleware, TSOA's documented-but-passthrough bearer authentication hook, and
`isAuthenticatedUser` before `UserController.getAuthUserProfile`. The global
middleware strictly parses the bearer token, resolves the token subject through
`userRepo.findById`, and stores that user in `AsyncLocalStorage`. The use case
then reads the same user and shallow-copies the complete `IUser` domain shape
through `userMapper.toInterface`.

Focused unit suites for the use case, mapper, authentication helper, and
authentication middleware currently pass (15 tests). There is no HTTP
integration spec for `/users/profile`; the existing user HTTP suite covers only
`/users/preferences`. Supertest execution is unavailable in the current
sandbox because binding its ephemeral listener fails with `listen EPERM`.

## Confirmed Findings

1. **Medium — The HTTP response is coupled to and exposes the complete domain
   persistence shape.** `user.dto.mapper.ts` returns `IUser` unchanged, so the
   generated schema and live response include the internal soft-deletion field
   `deletedAt` alongside the intended profile fields. The active-user repository
   already filters deleted rows, making this field always `null` for this path.
   Reusing `IUser` also means future internal fields can become public
   accidentally without an endpoint-level contract review.
2. **Medium — The use case's unauthenticated guard does not reject the actual
   empty-object sentinel.** `app-context-init.middleware.ts` stores `{}` cast as
   `IUser` when no user is resolved, while `get-profile.usecase.ts` checks only
   `if (!user)`. The route middleware currently prevents an unauthenticated HTTP
   request from reaching the use case, but direct or future orchestration that
   omits that middleware can receive `{}` as a successful profile. Its unit
   spec tests a missing property, not the runtime sentinel.
3. **Medium — The endpoint has no assembled HTTP integration coverage.** No test
   proves its successful JSON contract and date serialization, exact bearer
   parsing, token-to-user binding, rejection of missing/deleted users, resistance
   to caller-supplied user identifiers, or sanitization of internal failures.
4. **Low — Existing unit coverage leaves important boundaries unspecified.**
   The use-case suite does not cover the empty-object context sentinel or mapper
   failures; the mapper suite asserts that every `IUser` field is copied,
   reinforcing the over-broad response rather than a public DTO allowlist. The
   existing helper and middleware suites cover bearer parsing and principal
   enforcement and should be retained as regression coverage.

## Scope

### Expected Changes

- `src/app/user/dtos/user/user.dto.ts` (or the repository's chosen nearby DTO
  contract file) — define the explicit authenticated-profile response fields.
- `src/app/user/dtos/user/user.dto.mapper.ts` — allowlist the public profile
  fields instead of spreading the domain user.
- `src/app/user/dtos/user/__test__/user.dto.mapper.test.ts` — verify the exact
  DTO, ISO-compatible date values, immutability, and exclusion of internal or
  extra source properties.
- `src/app/user/usecases/get-profile.usecase.ts` — reject an absent or empty
  authenticated principal and return the explicit profile DTO.
- `src/app/user/usecases/__specs__/get-profile.usecase.spec.ts` — cover the
  runtime empty-object sentinel, success mapping, and mapper failure propagation.
- `src/interface/http/controllers/user.controller.ts` — declare the explicit
  promise return type.
- `test/http/user/get-auth-user-profile.get.spec.ts` — add the assembled
  Supertest integration suite.
- `generated/routes.ts` and `generated/swagger.json` — regenerate with TSOA
  after contract changes; merge carefully with the user's existing edits rather
  than overwriting them blindly.

### Out of Scope

- Changing token issuance, JWT claims, or session persistence.
- Adding profile update or deletion endpoints.
- Redesigning application-wide TSOA authentication.
- Refactoring unrelated user-preferences behavior.

## Proposed Approach

### 1. Establish a least-privilege profile contract

- Introduce a named response DTO containing only the fields intentionally
  returned to the authenticated user: `id`, `email`, `emailVerified`,
  `firstName`, `lastName`, `createdAt`, and `updatedAt`.
- Map fields explicitly and return a frozen DTO; do not expose `deletedAt` or
  spread arbitrary domain properties.
- Type both the use case and controller against this DTO, regenerate TSOA
  artifacts, and verify the OpenAPI schema no longer references `IUser` for this
  operation.

### 2. Harden authentication

- Treat an absent or structurally empty context user as unauthorized inside the
  use case, preserving defense in depth even when it is called outside the
  generated route.
- Keep bearer parsing, token validation, active-user lookup, and user-ID binding
  in their existing owners.

### 3. Add layered regression coverage

- Update mapper and use-case unit specs for the narrowed contract and the exact
  unauthenticated sentinel used by app-context initialization.
- Add `test/http/user/get-auth-user-profile.get.spec.ts` using
  `createApplication`, mocking only token and repository boundaries as the
  neighboring preferences suite does.
- Assert that no query/body/header value can choose another user: the returned
  principal must always come from the verified token subject and
  `userRepo.findById`.

## Test Plan

- **Unit/component:** Verify exact DTO allowlisting and freezing; reject both
  missing and `{}` context users without invoking the mapper; retain strict
  bearer-scheme and authentication-middleware regressions.
- **HTTP integration:** Under `test/http/user`, verify a valid bearer token
  returns the exact profile with ISO date strings and no `deletedAt`; missing,
  wrong-scheme, malformed, expired, and invalid tokens return `401`; a resolved
  token whose user is missing/deleted returns `401`; token and user repository
  failures are sanitized appropriately; caller-supplied user IDs cannot alter
  the lookup.
- **Regression:** Confirm `GET /api/v1/users/profile`, operation ID
  `getAuthUserProfile`, correlation-ID propagation to `userRepo.findById`, and
  authentication behavior on accounting-scoped endpoints remain unchanged.

## Verification

Run focused unit tests first, then HTTP, generated-contract, and broader checks:

```bash
npx jest src/app/user/usecases/__specs__/get-profile.usecase.spec.ts src/app/user/dtos/user/__test__/user.dto.mapper.test.ts src/interface/http/helpers/__specs__/get-auth-user-from-request.helper.spec.ts src/interface/http/middlewares/__specs__/is-authenticated-user.middleware.spec.ts --runInBand
npx jest test/http/user/get-auth-user-profile.get.spec.ts --runInBand
npm run build:routes
npm run build
npm run lint
npx jest test/http/user --runInBand
npm test -- --runInBand
```

Supertest commands require an environment that permits binding an ephemeral
local listener; the current sandbox returns `listen EPERM`. TSOA regeneration
must be reviewed against the pre-existing generated-file modifications before
those outputs are accepted.

## Risks

- Narrowing the response removes `deletedAt`; clients that incorrectly depend
  on that internal field will need to update. Regenerated OpenAPI output makes
  the intentional contract change visible.
- Singleton IoC modules and `AsyncLocalStorage` can leak mock state between
  integration cases. Clear mocks before each test, create a fresh application,
  and use distinct token/user fixtures.
- Generated artifacts already contain user changes. Regenerate only after
  preserving and understanding that diff, then review the combined output.

## Completion Criteria

- `GET /api/v1/users/profile` returns only the explicitly approved profile
  fields and its generated OpenAPI response uses the dedicated DTO.
- Missing, malformed, expired, or unresolved authentication cannot reach a
  successful profile response, including when the use case sees the runtime
  `{}` sentinel directly.
- The authenticated token subject is the only source of the returned user ID;
  request-controlled IDs cannot select a different profile.
- Focused unit and HTTP integration tests cover the success, security,
  unauthorized, and sanitized-failure cases listed above.
- Route generation, build, lint, the user HTTP suite, and the broader Jest suite
  pass in an environment that permits Supertest listeners.
- Existing unrelated changes, especially generated artifacts, remain preserved.
