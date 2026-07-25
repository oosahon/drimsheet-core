# Harden Logout and Add HTTP Integration Coverage Plan

## Goal

Make `POST /api/v1/auth/logout` reliably revoke the presented refresh-token
session, remain idempotent when there is no usable session, and expose a
sanitized failure when revocation cannot be completed. Add assembled HTTP
integration coverage under `test/http/auth`.

This plan is implementation-ready. Preserve the unrelated deletion of
`.agents/plans/harden-refresh-access-token-plan.md` and all other unrelated
staged or working-tree changes during implementation.

## Context

The controller delegates to `authUseCase.logout` without authentication
middleware because logout is driven by the `refresh_token` cookie. The request
context reads that HttpOnly, `SameSite=Lax` cookie and can clear it with the
same `/api/v1/auth` path and production-only `Secure` setting. The logout use
case verifies the refresh JWT, deletes the matching user-session row, and then
clears the cookie.

Refresh tokens are valid for 15 days and are accepted only when their
user-session row can be consumed by the refresh flow. Access tokens are
stateless and remain valid for their existing 15-minute lifetime; this plan
does not introduce access-token denylisting or a logout-all-sessions contract.

## Confirmed Findings

1. **P1 — Logout can report success while leaving the refresh token usable.**
   `src/app/auth/usecases/logout.usecase.ts` catches every verification or
   repository error, logs it, clears the browser cookie, and resolves
   successfully. If `userSessionRepo.delete` fails, the session row remains
   available to `refresh-access-token.usecase.ts`; a copied refresh token can
   therefore continue refreshing for up to its 15-day lifetime even though the
   user received a successful logout response.
2. **P2 — Unexpected token-verification failures are also hidden as successful
   logout.** Invalid or expired refresh tokens should be handled idempotently,
   but the current broad catch does not distinguish those expected auth errors
   from programming or runtime failures. This prevents the HTTP error handler
   from producing and reporting a sanitized `500` response.
3. **P2 — The logout response lacks explicit anti-caching protection.**
   Unlike login, verification, password reset, and refresh, the logout
   controller does not set `Cache-Control: no-store`, even though its response
   mutates authentication-cookie state.
4. **P2 — There is no assembled HTTP integration spec for logout.**
   `test/http/auth` covers the neighboring auth endpoints but has no
   `logout.post.spec.ts`, so route registration, status/body contract,
   cookie-expiry attributes, cache headers, and error sanitization are
   unverified.
5. **P2 — Existing logout unit tests do not cover the security-critical
   persistence failure.** The suite covers a valid token, no token, and
   verification exceptions, but it neither makes `userSessionRepo.delete`
   reject nor asserts whether expected versus unexpected errors are propagated
   or logged. It also does not cover the repository's `false` result, which
   represents an already-absent session and should remain an idempotent
   success.
6. **Security boundary verified — cross-site cookie sending is constrained,
   but logout is intentionally unauthenticated.** The refresh cookie is
   HttpOnly and `SameSite=Lax`, and credentialed CORS is restricted to the
   configured allowlist. The endpoint therefore does not need an access token
   to clear an absent, invalid, or current refresh session. No new
   authentication middleware is proposed.

## Scope

### Expected Changes

- `src/app/auth/usecases/logout.usecase.ts` — distinguish expected invalid-token
  handling from unexpected verification or persistence failures, and guarantee
  that a successful logout means the presented server session is absent.
- `src/app/auth/usecases/__specs__/logout.usecase.spec.ts` — cover all success,
  idempotency, invalid-token, missing-session, and failure branches with
  explicit cookie, repository, and logging assertions.
- `src/interface/http/controllers/auth.controller.ts` — mark logout responses
  `no-store` and document the sanitized internal-error response.
- `test/http/auth/logout.post.spec.ts` — exercise the assembled route with
  Supertest and the existing auth-use-case boundary mocking convention.
- `generated/routes.ts` and `generated/swagger.json` — regenerate TSOA output
  after controller response metadata changes.

### Out of Scope

- Revoking every session belonging to the user.
- Denylisting already-issued access tokens; they retain the current 15-minute
  expiry behavior.
- Changing global CORS, CSRF, cookie, or rate-limit policy.
- Changing refresh-token storage from plaintext to a token hash; that is a
  broader persistence migration and threat-model decision.

## Proposed Approach

### 1. Make logout revocation semantics explicit

- Read and verify the presented refresh token.
- Treat an absent cookie as an idempotent success and expire the cookie.
- Catch only the expected invalid/expired refresh-token error, expire the
  unusable cookie, and return success without attempting persistence.
- For a valid token, call `userSessionRepo.delete` with its decoded user ID,
  exact refresh token, and correlation ID.
- Treat a `false` delete result as idempotent success because the session is
  already absent.
- Clear the cookie only after revocation succeeds or absence is confirmed.
- Allow unexpected verification and repository errors to propagate so the
  shared error handler reports a sanitized `500`; do not emit a success
  response that falsely claims server-side revocation.
- Remove the logger dependency from the use case if it becomes unused, relying
  on the centralized error handler/reporter for unexpected failures.

### 2. Harden the HTTP contract

- Set `Cache-Control: no-store` in `AuthController.logout`.
- Add the controller's `500` response metadata and regenerate TSOA routes and
  OpenAPI artifacts.
- Keep the successful response at `200` with no token-bearing response body,
  preserving the current public contract.

### 3. Complete automated coverage

- Expand the use-case spec to assert:
  - valid token deletion happens before cookie clearing;
  - no cookie clears idempotently without verification or persistence;
  - invalid/expired token clears without persistence;
  - a missing session (`delete` returns `false`) still clears and succeeds;
  - unexpected verification failure propagates and does not clear the cookie;
  - repository rejection propagates and does not clear the cookie.
- Add `test/http/auth/logout.post.spec.ts` using `createApplication`,
  Supertest, and a spy on `authUseCase.logout`.
- Under `200 Response`, verify route invocation, an empty/non-sensitive body,
  `Cache-Control: no-store`, and a clearing `Set-Cookie` header containing an
  empty `refresh_token`, expiry, `HttpOnly`, `SameSite=Lax`, and the exact
  `/api/v1/auth` path. Cover both a presented cookie and an absent cookie to
  preserve idempotency.
- Under `500 Response`, make the use-case boundary reject with an error
  containing a private token marker and verify the standardized sanitized body,
  no marker leakage, and no misleading cookie-clear header.

## Test Plan

- **Application unit:** update
  `src/app/auth/usecases/__specs__/logout.usecase.spec.ts` for all revocation,
  idempotency, and propagation branches.
- **HTTP integration:** add `test/http/auth/logout.post.spec.ts` for the
  assembled Express/TSOA boundary, cookie attributes, cache behavior, response
  contract, and sanitized failure handling.
- **Regression:** run the refresh-access-token HTTP and use-case specs to
  confirm a successful logout remains compatible with refresh-session
  consumption and invalid-session handling.

## Verification

Run focused checks first, then generated-contract and broader static checks:

```bash
yarn test src/app/auth/usecases/__specs__/logout.usecase.spec.ts --runInBand
yarn test test/http/auth/logout.post.spec.ts --runInBand
yarn test src/app/auth/usecases/__specs__/refresh-access-token.usecase.spec.ts test/http/auth/refresh-access-token.post.spec.ts --runInBand
yarn build
yarn lint
```

Run focused coverage for the touched behavior and confirm it remains at 100%:

```bash
yarn test src/app/auth/usecases/__specs__/logout.usecase.spec.ts test/http/auth/logout.post.spec.ts --coverage --runInBand
```

## Risks

- If clients currently treat every logout response as success even during
  storage outages, surfacing `500` changes that failure contract. The
  mitigation is to reserve failure only for cases where server-side revocation
  is genuinely unknown and retain idempotent `200` responses for missing,
  invalid, expired, or already-deleted sessions.
- Keeping the cookie on an unexpected failure permits a deliberate retry but
  also leaves the session locally present. The client should treat `500` as an
  incomplete logout; successful responses will continue to expire the cookie.
- Generated files can contain unrelated churn if the local generator version
  differs. Inspect generated diffs and retain only changes caused by logout
  metadata.

## Completion Criteria

- A `200` logout guarantees the presented refresh session is already absent or
  was successfully deleted and expires the refresh cookie with the existing
  security attributes.
- Invalid, expired, absent, and already-deleted sessions remain idempotent
  successful logouts.
- Unexpected verification or persistence failures produce a sanitized `500`
  and do not falsely signal completion by clearing the cookie.
- Logout responses include `Cache-Control: no-store`, and the OpenAPI contract
  documents both `200` and `500`.
- Updated unit tests, the new HTTP integration spec, refresh-token regression
  specs, build, lint, and focused coverage checks pass.
- Unrelated working-tree and staged changes remain untouched.
