# Fix `POST /auth/login-with-email`

## Audit findings

- **High – denial of service:** five failures permanently lock the account;
  there is no lock expiry or recovery in the model. An attacker can lock a
  known account.
- **High – account/strategy enumeration:** `AccountLocked` and
  `WrongStrategy` differ from `InvalidCredentials`; user lookup also skips the
  password hash for an unknown email, creating a timing oracle.
- **High – limiter bypass:** the limiter uses the raw email and has no
  independent per-IP control. Case/whitespace variants and account rotation
  bypass it.
- **Bug – cross-account session cleanup:** session issuance deletes the
  incoming refresh token using the newly authenticated user ID. If a browser
  switches accounts, the previous user's server session remains valid.
- **Bug – password compatibility:** signup trims passwords before hashing while
  login compares the raw value. This is addressed jointly with the signup
  password-policy fix.
- **Test gap:** no HTTP coverage proves `Set-Cookie`, response redaction,
  normalized limit buckets, `401`, or `429`. Unit tests encode the permanent
  lock and strategy-disclosing responses instead of challenging them.

## Implementation plan

1. Replace the permanent counter-only lock with a bounded policy: store
   `lockedUntil`/failure timestamps, expire locks automatically, reset on
   successful authentication, and provide an audited recovery path. Make
   thresholds configurable.
2. Return one external credential error for unknown user, missing auth record,
   wrong strategy, wrong password, and locked account. Preserve precise
   internal metrics/audit events without exposing the reason to the caller.
3. Run a constant-work password verification path for unknown/non-email
   accounts using a configured dummy hash, then apply a small timing floor only
   if measurements show meaningful residual variance.
4. Apply independent per-IP and normalized/HMAC-account limiters. Namespace the
   action, validate types, and do not place raw email in the limiter store or
   abuse report.
5. Change session replacement to delete by the unique presented refresh-token
   digest (or decode/use its owner), not by the newly logged-in user ID. Perform
   old-session removal and new-session creation atomically.
6. Reuse the corrected, non-mutating password policy and compare exactly the
   bytes that were accepted at signup.
7. Document `200`, generic `401`, `422`, and `429`, and centralize explicit
   refresh-cookie attributes/lifetime.

Expected persistence changes include timed-lock fields and a session repository
operation that atomically replaces a presented token. Add a migration and keep
repository mocks complete.

## Tests

- Use-case tests for every internal credential state asserting the same public
  error while verifying correct internal counter/lock behavior.
- Fake-time tests for lock start, pre-expiry rejection, expiry, successful
  reset, and recovery.
- Timing-focused service test proving the dummy-hash branch invokes password
  comparison for unknown and wrong-strategy accounts.
- Session tests for same-user rotation, cross-account browser switching,
  invalid incoming cookie, and transactional rollback.
- Add limiter unit tests and
  `test/http/auth/login-with-email.post.spec.ts` with assembled HTTP tests for
  normalized account keys, per-IP account rotation, distributed attempts
  against one account, `429`, generic `401`, cookie flags, and response
  redaction.
- Persistence tests for concurrent failure increments and atomic session
  replacement.

## Completion criteria

- A remote attacker cannot permanently lock an account with five requests.
- Public behavior does not disclose whether an account exists, is locked, or
  uses Google.
- Switching accounts revokes the exact previous browser session.
- Rate limits resist key variation, and changed code has 100% typed coverage.
