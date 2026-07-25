# Fix `POST /auth/logout`

## Audit findings

- **High – revocation failure is hidden:** the use case catches every token
  verification or repository error and still returns success after clearing
  the browser cookie. A database deletion failure leaves a stolen refresh token
  valid while telling the user logout succeeded.
- **Bug – cookie clearing is path-dependent:** set/clear options omit an
  explicit path. Cookies created by verification/OAuth may not reach logout,
  and clear must exactly match the original domain/path attributes.
- **Security debt:** plaintext refresh-token storage makes logout/revocation
  operate on bearer credentials directly; this is addressed with the refresh
  endpoint digest migration.
- **Contract bug:** the endpoint returns no body but declares `200`; an
  idempotent `204` is clearer. Error and `429` responses are undocumented.
- **Test gap:** current unit tests explicitly accept swallowed repository
  errors. There is no HTTP test for idempotency, cookie clearing attributes,
  server-side revocation, stale-cookie behavior, or a revocation outage.

## Implementation plan

1. Revoke by refresh-token digest rather than raw token. Make valid-token
   deletion observable: repository infrastructure failures must not be treated
   as successful revocation.
2. Separate invalid/absent credentials from infrastructure failure:
   - absent, malformed, expired, or already-revoked tokens return idempotent
     success and clear the cookie;
   - a valid token whose durable revocation fails returns a sanitized `503`
     (or queues a durable revocation) and must not claim success.
     Choose whether to retain the cookie for client retry; document the UX and
     security tradeoff. A durable revocation/deny-list is preferred if available.
3. Always perform browser cleanup in the chosen policy's explicit branch and
   use the same centralized domain/path/`HttpOnly`/`Secure`/`SameSite` options
   used when setting the cookie.
4. Return `204 No Content` for successful and already-logged-out requests.
   Add TSOA declarations for `204`, `429`, and the selected infrastructure
   failure response.
5. Add a modest per-IP/token-digest limiter and origin/CSRF validation shared
   with other cookie-authenticated mutation routes if adopted by the refresh
   plan.
6. Log/report revocation infrastructure failures with correlation/session IDs,
   never raw tokens, and add a metric/alert because this is a security control
   failure.

## Tests

- Unit-test missing, malformed, expired, already-revoked, valid, and repository
  failure branches with exact return/error and cookie behavior.
- Replace the existing “catch exception” expectation with the selected honest
  failure semantics.
- Cookie helper tests proving set and clear use identical path/domain/security
  attributes in local and production configurations.
- Persistence test proving logout deletes only the presented session digest and
  is idempotent.
- Add `test/http/auth/logout.post.spec.ts` with assembled HTTP tests for `204`
  without a body, repeated logout, subsequent refresh rejection, stale/invalid
  cookie clearing, live `429`, and simulated revocation-store failure.
- Assert logs and responses never contain the raw refresh token; maintain 100%
  coverage without `any`.

## Completion criteria

- A successful logout means the server-side session is revoked, not merely that
  the browser cookie was removed.
- Invalid/repeated logout is safely idempotent.
- Cookie removal works for sessions issued by every auth endpoint.
- Response contracts, observability, and typed tests cover all failure modes.
