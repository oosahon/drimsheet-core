# Harden `resetPassword` and Add HTTP Integration Coverage Plan

## Goal

Harden `POST /api/v1/auth/reset-password` from the assembled HTTP boundary
through validation, abuse controls, reset-token claiming, password persistence,
session replacement, cookie issuance, and event publication. Add the missing
HTTP integration spec under `test/http/auth`.

This plan is implementation-ready. It preserves the existing successful
contract—a `200` response containing an access token and an HTTP-only refresh
cookie—and preserves unrelated staged and working-tree changes.

## Context

- `AuthController.resetPassword` currently forwards the TSOA-validated body to
  `makeResetPasswordUseCase`.
- App validation enforces a non-empty token, an 8–128 character complex
  password, and matching confirmation.
- The token service validates an HS256 reset JWT against the active Redis value
  and creates a 30-second Redis claim before the use case begins.
- The use case hashes the password, updates auth state, revokes all prior
  sessions, and creates the replacement session in one PostgreSQL transaction.
  It then consumes the reset token, sets the refresh cookie, publishes the
  password-reset event, and returns the access token.
- Existing focused unit suites pass (22 tests), but there is no
  `test/http/auth/reset-password.post.spec.ts`.

## Confirmed Findings

1. **High — the reset endpoint has no endpoint-specific abuse control.**
   [`auth.controller.ts`](../../src/interface/http/controllers/auth.controller.ts)
   applies no middleware to `resetPassword`, while login, email verification,
   and reset-link issuance have dedicated limiters. An attacker can submit
   unlimited forged or stolen-token attempts until the much looser global
   limiter intervenes. A token-keyed limiter alone is insufficient because an
   attacker can rotate arbitrary values; this endpoint needs both a
   privacy-preserving token bucket and an IP bucket.
2. **High — the 30-second token claim can expire while reset work is still in
   progress.**
   [`token.service.ts`](../../src/app/auth/services/token.service.ts) gives the
   claim a fixed 30-second TTL, but password hashing, database waits, and
   downstream latency have no matching upper bound. A second request can claim
   and use the same reset token after the lease expires. Moreover, release and
   finalize delete claim keys by user ID without verifying ownership, so a
   delayed first request can delete a newer request's claim.
3. **High — a reset token can become replayable after a committed password
   change.**
   [`reset-password.usecase.ts`](../../src/app/auth/usecases/reset-password.usecase.ts)
   marks the database transaction committed before deleting the active reset
   token. If Redis finalization fails, the request returns an error, but the
   password and replacement session are already committed. Once the short
   claim expires, the still-active token can reset the account again.
4. **Medium — post-commit failures produce false failure responses and
   inconsistent client state.**
   Cookie issuance and event publication occur after the irreversible database
   commit. An event-bus failure returns `500` after the password changed and
   token was consumed; a cookie failure similarly leaves a committed session
   the client may not possess. Retrying cannot reliably recover because the
   credential may already be invalid.
5. **Medium — the credential-bearing success response is cacheable by default.**
   Unlike login, email verification, reset-link issuance, and refresh,
   [`AuthController.resetPassword`](../../src/interface/http/controllers/auth.controller.ts)
   does not set `Cache-Control: no-store`, despite returning an access token and
   setting a refresh cookie.
6. **Low — the published HTTP contract is incomplete.**
   The controller documents only `400` and `422`; its normal invalid,
   malformed, or expired token errors map to `401`, future endpoint throttling
   maps to `429`, and unexpected dependency failures map to `500`. Generated
   OpenAPI consequently omits these responses.
7. **Test gaps — current unit coverage proves only the main validation,
   lookup, strategy, and happy paths.**
   The use-case suite does not assert claim release on lookup/transaction
   failures, non-release after commit, transaction rollback behavior,
   finalization failure, cookie/event ordering and failures, complete
   old-session revocation, refresh-cookie issuance, or that sensitive inputs
   stay out of errors. The token-service suite does not cover malformed,
   expired, mismatched, finalized, ownership, lease-expiry, or finalize-failure
   reset-token behavior. There is no assembled HTTP coverage for the endpoint's
   status/body/header/cookie/error/rate-limit contract.

## Scope

### Expected Changes

- `src/interface/http/controllers/auth.controller.ts` — add `no-store`,
  reset-specific rate-limit middleware, and accurate response metadata.
- `src/infra/config/rate-limiter.config.ts` — add separate hashed-token and IP
  reset-attempt limiters without retaining raw tokens in limiter keys.
- `src/app/auth/contracts/token-service.contract.ts` — represent claim
  ownership explicitly so only the owning reset operation can release or
  finalize a claim.
- `src/app/auth/services/token.service.ts` — make claim/finalize/release
  ownership-safe and prevent the claim from expiring before the reset token or
  operation completes.
- `src/shared/contracts/cache-storage.contract.ts` and
  `src/infra/persistence/cache/cache-storage.impl.ts` — add the smallest atomic
  compare-and-delete/consume primitive required for owner-safe Redis state
  transitions.
- `src/app/auth/usecases/reset-password.usecase.ts` — use the owned claim,
  define pre-commit cleanup, make committed success deterministic, and prevent
  post-commit event delivery failures from changing the HTTP result.
- Existing shared mocks and focused specs for the contracts/services/use case —
  cover every new branch and failure boundary.
- `test/http/auth/reset-password.post.spec.ts` — add the assembled Supertest
  suite following repository naming and status-grouping conventions.
- `generated/routes.ts` and `generated/swagger.json` — regenerate after
  controller metadata/middleware changes; do not edit generated files by hand.

### Conditional Changes

- Event delivery adapter/outbox files — change only if inspection during
  implementation shows there is no existing safe mechanism to report/retry a
  post-commit password-reset event without failing the completed HTTP
  operation.
- Refresh-cookie/session orchestration helper — reuse or extract shared session
  issuance behavior only if it can preserve reset-specific “revoke every
  session, then create one” semantics without widening the change.

### Out of Scope

- The reset-link request/email flow except where its token contract must adapt
  to owner-safe claims.
- Password-policy changes, refresh-token-at-rest redesign, or a general
  authentication/session refactor.
- End-to-end tests requiring a live email provider, Redis, or PostgreSQL; the
  HTTP spec will exercise the assembled Express/TSOA boundary and mock the use
  case as permitted by the HTTP testing rules.

## Proposed Approach

### 1. Secure the HTTP boundary

- Add two reset-attempt limiters: a keyed HMAC of a non-empty submitted token
  and an independent normalized IP key. Never place the raw reset token in
  limiter storage, logs, reports, response bodies, or test names.
- Choose limits consistent with verification/reset-link endpoints and assert
  both same-token throttling and rotating-token IP throttling.
- Set `Cache-Control: no-store` before invoking the use case.
- Document `401`, `422`, `429`, and `500` responses and regenerate the TSOA
  artifacts.

### 2. Make reset-token ownership and consumption race-safe

- Return an opaque claim handle from `claimPasswordResetToken`; include the
  decoded user ID for lookup and a random owner value used only for atomic
  claim transitions.
- Give the claim a lifetime that cannot reopen replay during a valid reset
  operation. Prefer tying it to the reset token's remaining lifetime; if a
  renewable lease is used instead, renewal and timeout behavior must be
  explicit and tested.
- Implement atomic owner-checked release and finalization in the cache adapter.
  A stale request must never delete a newer owner's claim. Finalization must
  invalidate the active token in a fail-closed way; a Redis error after the
  database commit must leave the owned claim blocking replay for the remaining
  token lifetime.

### 3. Define deterministic transaction and side-effect semantics

- Keep password update, failed-attempt reset, deletion of all old sessions, and
  creation of exactly one replacement session in the existing database
  transaction.
- On any failure before commit, atomically release only this operation's claim
  and preserve the original error if cleanup also fails.
- After commit, never release the claim. Finalize it when Redis is available;
  otherwise report the finalization failure while retaining the fail-closed
  claim.
- Treat event publication as post-commit delivery: report/retry failure through
  the existing messaging mechanism (or an outbox if required), but do not tell
  the client the committed password reset failed.
- Set the refresh cookie and return the access token only for the committed
  operation. Keep tokens/passwords out of reporter and error payloads.

### 4. Complete automated coverage

- Extend reset use-case specs with table-driven validation cases and explicit
  failure injection at user lookup, auth lookup, hashing, token generation,
  auth update, session deletion/creation, transaction commit, reset-token
  finalization, cookie issuance, and event publication.
- Assert transaction participation and ordering, exact session revocation,
  owner-safe claim cleanup, preservation of the primary error, and no
  post-commit release.
- Extend token-service/cache-adapter tests for wrong token type, malformed and
  expired JWTs, missing/mismatched cached values, concurrent claims, claim
  ownership, stale release/finalize attempts, successful finalization, and
  Redis failures.
- Add the HTTP integration suite described below.

## Test Plan

- **Application/service unit:** under the existing auth `__specs__`
  directories, cover validation boundaries; password/auth/session mutations;
  claim ownership; pre-commit rollback/retry; post-commit fail-closed behavior;
  event failure semantics; and the successful response.
- **Infrastructure adapter:** verify the Redis operation atomically changes
  state only for the matching claim owner and cannot allow stale cleanup to
  affect a newer claimant.
- **HTTP integration:** create
  `test/http/auth/reset-password.post.spec.ts` with
  `describe('POST /auth/reset-password')` and numeric status groups:
  - `200`: forwards the exact payload, returns only `{ accessToken }`, includes
    `Cache-Control: no-store`, and never echoes token/password fields.
  - `401`: maps invalid, malformed, and expired reset-token errors to sanitized
    auth responses.
  - `422`: rejects missing/wrong-type body fields before orchestration and maps
    app password-policy/mismatch validation without leaking credentials.
  - `429`: proves repeated use of one token is limited, rotating arbitrary
    token values cannot bypass the IP bucket, and the use case is not invoked
    after the limit.
  - `500`: sanitizes unexpected errors and does not expose the token, password,
    confirmation, dependency message, or stack.
- **Regression:** existing signup, verification, login, reset-link, token,
  session, rate-limiter, error-handler, and generated-route tests remain green.

## Verification

Run focused tests first, followed by static checks and the broader auth suite:

```bash
yarn test test/http/auth/reset-password.post.spec.ts src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts src/app/auth/services/__specs__/token.service.spec.ts src/infra/config/__tests__/rate-limiter.config.test.ts --runInBand
yarn build
yarn lint
yarn test test/http/auth src/app/auth --runInBand
yarn test --coverage --runInBand
```

Tests that exercise the real Redis atomic primitive may require the repository's
test Redis service; if unavailable, run the adapter contract test with the
project's test harness and record that infrastructure dependency explicitly.

## Risks

- PostgreSQL and Redis cannot participate in one transaction. The mitigation is
  an owned, long-lived/fail-closed claim plus explicit post-commit recovery and
  alerting, so infrastructure failure favors preventing token replay.
- Dual rate limiting can reject legitimate repeated recovery attempts from a
  shared IP. Keep the IP limit higher than the per-token limit and expose
  standard rate-limit headers so clients can back off.
- Changing the token-service contract affects signup-token patterns if shared
  types are generalized. Keep reset ownership changes scoped unless a tested
  shared primitive is clearly safer.
- Suppressing a post-commit event error without durable retry can lose an audit
  event. Do not suppress silently; use existing retry/reporting support or a
  transactional outbox.

## Completion Criteria

- The reset endpoint returns an uncached, sanitized response and is protected
  against both repeated-token and rotating-token abuse.
- Exactly one operation can own a reset token; stale operations cannot release
  or finalize another claim, and no committed reset can become replayable.
- A pre-commit failure rolls back password/session changes and permits a safe
  retry; a post-commit dependency failure does not falsely report that the
  password change itself failed.
- A successful reset updates the password, clears failed-login attempts,
  preserves/adds the email strategy, revokes every old session, creates exactly
  one new session, consumes the reset token, sets the secure refresh-cookie
  contract, and publishes or durably schedules the reset event.
- The new HTTP integration spec covers `200`, `401`, `422`, `429`, and `500`,
  including header and secret-non-disclosure assertions.
- Focused tests, build, lint, broader auth tests, and coverage pass with 100%
  coverage for touched behavior; generated API artifacts are current and
  unrelated files remain unchanged.
