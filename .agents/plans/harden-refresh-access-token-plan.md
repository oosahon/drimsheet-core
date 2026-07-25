# Harden Refresh Access Token Plan

## Goal

Make `POST /api/v1/auth/refresh-access-token` rotate refresh tokens as a
single-use, concurrency-safe operation, return a consistent HTTP contract, and
cover the assembled endpoint and its owning application/service behavior.

This plan is implementation-ready. Preserve unrelated staged and working-tree
changes during implementation.

## Context

The controller delegates to the assembled auth use case and sets
`Cache-Control: no-store`. Request middleware exposes the `refresh_token`
cookie through `clientSession`; the use case verifies the JWT, loads its user,
checks the persisted session, and delegates rotation to
`issue-user-session.helper.ts`. That helper generates both tokens, deletes the
old persisted token and inserts the replacement in a transaction, then writes
the replacement HTTP-only cookie.

The existing HTTP spec uses Supertest but mocks the use case and covers only a
successful response and the cache header. Focused controller, use-case, and
token-service suites currently pass (23 tests).

## Confirmed Findings

1. **High — refresh-token reuse is not consumed atomically.** The use case
   checks the persisted token before starting the rotation transaction
   (`src/app/auth/usecases/refresh-access-token.usecase.ts:37`), while deletion
   happens later inside `issue-user-session.helper.ts:41`. Two concurrent
   requests can both pass the pre-check and receive valid replacement
   credentials. The current `FOR UPDATE` lookup checks the newly generated
   token, not the presented token, so it does not close this race.
2. **High — a “rotated” JWT can equal the presented JWT.** Refresh tokens contain
   only `id`, `type`, and second-resolution JWT timestamps
   (`src/app/auth/services/token.service.ts:127`). Reissuing within the same
   second can produce the same signed value, leaving the supposedly consumed
   credential reusable and making the duplicate-token cleanup path replace it
   with itself.
3. **Medium — the refresh endpoint has no endpoint-specific abuse limit.**
   Unlike login, verification, and password-reset endpoints, the controller
   applies only the global 700-requests-per-15-minutes limiter. A stolen,
   malformed, or revoked cookie can therefore drive repeated JWT verification
   and database reads at that limit.
4. **Medium — invalid/revoked refresh attempts leave the stale credential in
   the browser.** Missing, malformed, expired, userless, and unpersisted tokens
   all fail without clearing `refresh_token`, so clients repeatedly resend a
   credential the server has rejected.
5. **Low — the documented HTTP responses do not match reachable behavior.**
   The controller advertises 400 and 422 responses, while known refresh
   failures map to 401 and unexpected dependency failures map to 500; 500 is
   not documented.
6. **Test gap — the use-case spec mocks the rotation helper and does not prove
   old-token consumption, replacement persistence/cookie attributes, unique
   token generation, rollback behavior, or concurrent replay handling.**
7. **Test gap — the HTTP spec does not assert use-case invocation, rotated
   `Set-Cookie` security attributes, missing/invalid/revoked-cookie 401
   responses, stale-cookie clearing, rate limiting, error sanitization, or the
   absence of token leakage.**

## Scope

### Expected Changes

- `src/app/auth/services/token.service.ts` and its spec — add a unique JWT ID to
  every access/refresh token issuance and prove repeated issuance is unique.
- `src/app/auth/usecases/refresh-access-token.usecase.ts` and its spec — consume
  the presented persisted session inside the rotation transaction and define
  consistent rejection/cleanup behavior.
- `src/app/auth/contracts/user-session.repo.contract.ts` — expose the minimal
  atomic persistence operation needed to consume a matching session.
- `src/infra/persistence/repos/user/user-session.repo.impl.ts` and nearby specs
  — implement atomic delete-and-report semantics using the active transaction.
- `src/app/auth/usecases/helpers/issue-user-session.helper.ts` and its spec —
  accept the transaction/consumed-session flow without re-reading or
  re-deleting the presented cookie, while retaining shared login/session
  issuance behavior.
- `src/interface/http/controllers/auth.controller.ts` — apply the refresh
  limiter and align documented response statuses with runtime behavior.
- `src/infra/config/rate-limiter.config.ts` and its specs — add refresh-token
  throttling using an HMAC-derived cookie key with IP fallback, never the raw
  token.
- `src/interface/http/middlewares/app-context-init.middleware.ts` and its spec,
  if needed — provide a single safe way for the use case to expire a rejected
  cookie with attributes matching the original cookie.
- `test/http/auth/refresh-access-token.post.spec.ts` — expand the Supertest
  integration contract.

### Out of Scope

- Changing refresh-token lifetime or replacing JWT refresh tokens with opaque
  tokens.
- Global session-management UI or “log out all devices” behavior.
- Broad refactoring of login, OAuth, password-reset, or logout flows except
  adjustments required to keep their shared session issuance compatible.

## Proposed Approach

### 1. Make issued credentials unambiguously unique

- Add a cryptographically random `jti` when signing access and refresh tokens.
- Keep verification restricted to HS256 and retain the existing token `type`
  check and expiry.
- Extend token-service tests with frozen time to prove two tokens issued for the
  same user in the same second differ and both retain the expected claims.

### 2. Make refresh-token consumption and replacement atomic

- Add a repository operation that deletes a session only when both user ID and
  presented refresh token match, and reports whether a row was consumed.
- Start a transaction after cryptographic verification, load/validate the user,
  atomically consume the presented session within that transaction, and reject
  the request when no row is consumed.
- Issue and persist the replacement session in the same transaction, passing
  the transaction through instead of performing a second independent
  transaction.
- Set the replacement cookie only after commit. On failure, do not expose a
  token whose persistence rolled back.
- Remove or parameterize the shared helper’s implicit deletion of the current
  cookie so refresh rotation does not duplicate session-consumption logic while
  login/OAuth behavior remains unchanged.

### 3. Harden the HTTP boundary

- Clear the refresh cookie on any definitive 401 refresh rejection, without
  clearing it for an unexpected 500 that may be transient.
- Add an endpoint limiter keyed by an HMAC of the refresh cookie, with a
  normalized IP fallback for missing/malformed input; do not log or return the
  token.
- Retain `HttpOnly`, `SameSite=Lax`, auth-scoped `Path`, production-only
  `Secure`, 15-day max age, and `Cache-Control: no-store`.
- Update TSOA response decorators to document 200, 401, 429, and 500, removing
  unreachable 400/422 declarations unless implementation introduces those
  outcomes.

### 4. Close test gaps at the owning layers

- Replace the mocked-helper-only use-case coverage with assertions for atomic
  consume, transaction reuse, missing/expired/malformed/revoked/userless
  rejection, cookie replacement/clearing, rollback, and no event publication
  on failure.
- Add repository coverage showing exactly one of two consume attempts succeeds
  and user/token matching is enforced.
- Retain shared-helper regression tests for login/OAuth session replacement.

## Test Plan

- **Application/service:** test same-timestamp token uniqueness; all 401 paths;
  single-use consumption; successful atomic rotation; transaction rollback;
  post-commit cookie setting; and no persistence/event side effects after
  rejection.
- **HTTP integration:** in
  `test/http/auth/refresh-access-token.post.spec.ts`, group Supertest cases by
  200, 401, 429, and 500. Assert the response body, `Cache-Control`, complete
  `Set-Cookie`/expired-cookie attributes, use-case call count, rate-limit
  headers, sanitized failures, and that access/refresh tokens never appear in
  error bodies or limiter metadata.
- **Concurrency integration:** exercise two parallel refreshes using the same
  persisted token against the repository-backed transaction path; assert one
  succeeds, one is unauthorized, the old token is absent, and exactly one
  replacement session remains.
- **Regression:** run login, OAuth callback, email verification, reset-password,
  logout, session-helper, middleware, token-service, and auth HTTP suites
  because they share token generation, cookie handling, and session issuance.

## Verification

```bash
yarn test test/http/auth/refresh-access-token.post.spec.ts --runInBand
yarn test src/app/auth/usecases/__specs__/refresh-access-token.usecase.spec.ts src/app/auth/usecases/helpers/__specs__/issue-user-session.helper.spec.ts src/app/auth/services/__specs__/token.service.spec.ts --runInBand
yarn test test/http/auth src/app/auth src/interface/http/middlewares/__specs__/app-context-init.middleware.spec.ts --runInBand
yarn lint
yarn build
```

The repository-backed concurrency check requires the configured test database
and should run through the project’s test-database setup when it is not already
available.

## Assumptions

- A rejected refresh token should terminate that browser session by expiring
  the cookie; this can be validated against frontend handling of 401 responses.
- Single-use rotation is the intended policy, as the current implementation
  deletes the presented session before inserting a replacement.

## Risks

- Changing shared session issuance can regress login/OAuth/reset flows; isolate
  refresh-specific consumption and run all shared auth regressions.
- Concurrency correctness depends on checking the affected-row result inside
  one database transaction; a read-then-delete implementation would preserve
  the race.
- Aggressive rate-limit values can disrupt clients that refresh concurrently;
  choose a documented threshold compatible with expected tab/device behavior
  and test the bucket semantics.
- Clearing cookies must use the same path, `SameSite`, `HttpOnly`, and `Secure`
  options as issuance or browsers may retain the stale cookie.

## Completion Criteria

- Every refresh token contains a unique `jti`, including repeated issuance in
  the same second.
- A persisted refresh token can be consumed successfully only once under
  concurrent requests, and rotation commits old-token deletion plus
  replacement insertion atomically.
- Successful responses return only the access token, an uncached response, and
  a correctly secured replacement cookie.
- Invalid, expired, missing, userless, and revoked tokens return sanitized 401
  responses and expire stale cookies; abuse returns 429; unexpected failures
  return sanitized 500 responses.
- Focused, auth regression, lint, and build checks pass, with 100% coverage for
  touched behavior and unrelated files unchanged.
