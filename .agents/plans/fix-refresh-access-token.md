# Fix `POST /auth/refresh-access-token`

## Audit findings

- **Critical – replay race:** the current session lookup happens outside the
  transaction. Two concurrent requests can both validate one refresh token,
  then each delete without checking affected rows and create a different valid
  replacement session.
- **High – refresh tokens stored in plaintext:** a read-only database leak
  yields immediately usable bearer tokens.
- **Bug – upstream cookies may never reach this route:** verification and
  Google callback set cookies without `Path`, so their browser-default paths do
  not cover refresh.
- **Bug – lifetime mismatch:** JWT refresh tokens last 15 days while the cookie
  lasts 7 days. The effective session duration is accidental/unclear.
- **Abuse gap:** the route has no endpoint-specific limiter; malformed JWT and
  session lookups rely only on the broad global limit.
- **Contract bug:** missing/invalid refresh tokens produce auth errors, but the
  controller documents `400`/`422` rather than `401`; `429` is omitted.
- **Test gap:** the use-case suite mocks the session helper, so it never proves
  token consumption/rotation. There are no concurrency, hash-at-rest, cookie,
  replay, or HTTP tests.

## Implementation plan

1. Store only a keyed digest of refresh tokens. Verify JWT integrity/type, then
   HMAC the presented token for lookup. Use key versioning to permit secret
   rotation. Decide whether rollout invalidates existing sessions (simplest and
   safest) or uses a bounded dual-read migration.
2. Add one repository operation that atomically rotates a session:
   - start a transaction;
   - consume/delete the presented digest with `DELETE ... RETURNING` or lock the
     row and require exactly one affected row;
   - create the replacement digest/session in the same transaction;
   - fail as unauthorized if consumption did not occur.
     Generate the replacement token before the transaction, but set its cookie
     only after commit.
3. Treat reuse of an already-consumed token as a replay signal. At minimum
   reject and clear the cookie; optionally revoke the token family/all user
   sessions if token-family tracking is added.
4. Centralize cookie options with explicit auth path, correct domain strategy,
   `HttpOnly`, production `Secure`, deliberate `SameSite`, and one shared TTL
   matching the JWT/server-session expiry. Use identical options on clear.
5. Add a per-IP limiter and a limiter keyed by an HMAC of the presented cookie,
   without exposing the token. Consider origin/CSRF validation for all
   cookie-authenticated mutations in addition to `SameSite`.
6. Normalize every missing, malformed, expired, unknown, or replayed token to a
   sanitized `401`, and update TSOA docs for `200`, `401`, and `429`.

Expected changes span the session contract/repository/mock/mapper/schema,
auth/session service, refresh use case, app-context cookie helper, controller,
and a migration/key-rotation configuration.

## Tests

- Auth/session service tests for digest determinism, key separation/versioning,
  and no raw-token persistence/logging.
- Use-case tests without mocking away rotation: success, missing/malformed/
  expired token, user/session missing, commit failure, and cookie set only
  after commit.
- Persistence integration test launching two simultaneous refreshes with one
  token; exactly one returns a new session and only one replacement row exists.
- Replay tests for consumed tokens and token-family revocation if implemented.
- Cookie tests for every issuing endpoint and clear path, flags, domain, and
  matching TTL.
- Add `test/http/auth/refresh-access-token.post.spec.ts` with assembled HTTP
  tests for `200`, generic `401`, `429`, rotation, old-token rejection,
  concurrent requests, and response/log redaction.

## Completion criteria

- A refresh token can be consumed successfully only once, including under
  concurrency.
- Database contents cannot be used directly as refresh credentials.
- Every issued cookie reaches refresh/logout and has one intentional lifetime.
- Errors and documentation agree, with 100% typed coverage.
