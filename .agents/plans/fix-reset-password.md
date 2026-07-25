# Fix `POST /auth/reset-password`

## Audit findings

- **Critical – existing sessions survive password reset:** the password changes
  but all other refresh sessions remain valid. A stolen session is unaffected
  by the recovery action.
- **High – one-time token is burned too early:** token verification deletes the
  cache record before user lookup, password hashing, persistence, and new
  session creation. Any later failure makes recovery impossible.
- **High – partial commit:** password update and session creation run in
  separate transactions. Session failure can commit the new password while the
  endpoint reports failure.
- **Abuse gap:** unlike signup/login, this endpoint has no endpoint-specific
  limiter; repeated malformed JWT verification is limited only by the broad
  global limit.
- **Bug – inconsistent password policy:** shared DTO tests currently prove the
  schema disagrees with `password.vo.ts` on case requirements and maximum
  length.
- **Cookie hardening:** reset currently happens to default under the auth path,
  but cookie scope is implicit and fragile; it must use centralized explicit
  attributes.
- **Test gap:** no tests cover session revocation, rollback, token retry after a
  transient failure, concurrency, limiter behavior, or assembled HTTP cookies.

## Implementation plan

1. Implement the same token claim/finalize protocol used by email verification:
   validate without deleting, atomically claim for one request, release on
   failure, and consume only after successful commit.
2. Add `deleteAllByUserId` (or an equivalent bulk repository operation) and
   revoke every existing refresh session when a password is reset.
3. In one database transaction: lock/read the auth aggregate as needed, update
   the password hash and failed-attempt state, delete all sessions, create the
   replacement session if automatic login remains desired, and write the
   audit/event outbox record. Refactor session issuance to accept this
   transaction.
4. Decide whether recovery should automatically log in. If not, revoke all
   sessions and return a success result requiring login. If yes, ensure exactly
   one new session survives and the cookie is set only after commit.
5. Reuse a single password validator/value policy. Never trim secrets; align
   length/complexity and field-level error keys with signup.
6. Add independent per-IP and HMAC-token endpoint limits without storing raw
   tokens. Clear/replace stale cookies after success.
7. Update TSOA responses for `200`/`204`, `401`, `422`, and `429`.

Expected files include the auth service token API, reset use case, session
contract/repository/mock, session helper, cookie helper, controller, and a
database migration only if new token/session metadata is persisted.

## Tests

- Shared password-policy tests at all boundaries and for whitespace.
- Token tests for claim, concurrent claim, release after each failure point,
  successful consumption, expiry, and replay.
- Use-case tests proving all old sessions are revoked, exactly zero/one new
  session remains per the product decision, and password/auth/session/outbox
  work rolls back atomically.
- Persistence integration test with multiple sessions and simultaneous reset
  requests; exactly one request must win.
- Add `test/http/auth/reset-password.post.spec.ts` with assembled HTTP tests for
  body-only token transport, `422`, invalid/expired generic errors, `429`,
  cookie path/flags, refresh failure for old sessions, and refresh success for
  the replacement session if issued.
- Ensure 100% coverage with shared mocks and no `any`.

## Completion criteria

- A successful password reset invalidates every previously issued refresh
  session.
- Transient failure neither changes the password nor destroys the reset token.
- Password/session/audit state cannot partially commit.
- Concurrent replay has one winner, password rules agree, and all checks pass.
