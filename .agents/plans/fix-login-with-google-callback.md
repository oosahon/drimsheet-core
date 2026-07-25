# Fix `GET /auth/google/callback`

## Audit findings

- **Critical – OAuth login CSRF:** callback authentication accepts responses
  without validating a state value created by `/auth/google`.
- **Critical – access-token leakage:** `oauth.usecase.ts` appends the access
  token to the redirect query string. It can leak through browser history,
  referrers, analytics, screenshots, support logs, and reverse proxies.
- **High – unsafe account linking assumption:** the strategy selects the first
  profile email and links it to an existing local account without explicitly
  checking Google's verified-email assertion. If an unverified provider email
  is ever accepted, this becomes account takeover.
- **Bug – unusable refresh cookie:** no explicit cookie `Path` is set. A cookie
  emitted from `/auth/google/callback` defaults under the Google path and is
  not sent to refresh/logout.
- **Bug – cross-account stale session:** shared session issuance may fail to
  remove a prior browser session belonging to a different user.
- **Contract bug:** OpenAPI says `204` although middleware returns `302`.
- **Test gap:** OAuth use-case tests assert the insecure query-token URL. There
  are no callback middleware, verified-email, state, cookie-path, or assembled
  HTTP tests.

## Implementation plan

1. Validate and atomically consume the short-lived state created by the
   initiation endpoint before accepting the provider result. Clear the state
   cookie on success and all failure paths. Reject missing, mismatched, expired,
   and replayed state with one sanitized outcome.
2. Remove the access token from the redirect URL. Recommended flow:
   - create the server session and `HttpOnly` refresh cookie;
   - redirect to a fixed allowlisted web confirmation URL with no credential;
   - let the web client call the refresh endpoint to obtain an access token.
     If that architecture is impossible, use a short-lived, one-time exchange
     code; do not use a query token or long-lived fragment token.
3. Require the expected Google issuer/audience behavior from the library and
   explicitly accept only a verified primary email. Extend the OAuth profile
   DTO to carry verification state. Never link an unverified email to an
   existing account.
4. Make account linking concurrency-safe and transactional. Do not mutate the
   in-memory strategy array before a durable update; handle missing auth rows
   and concurrent inserts deterministically.
5. Centralize explicit refresh-cookie scope/flags/lifetime and fix
   cross-account session replacement by token digest.
6. Redirect failures to a fixed allowlisted client error page containing only
   a non-sensitive reason code, or return sanitized HTTP errors. Never reflect
   arbitrary redirect input.
7. Document actual `302`, `401`, and `429` behavior.

## Tests

- Callback middleware tests for Passport error/no-user, handler error,
  successful fixed redirect, and exactly one response.
- State tests for valid, missing, mismatched, expired, and replayed state, plus
  state-cookie clearing on every branch.
- OAuth profile/helper tests for verified email, unverified email, missing
  email, multiple emails, existing account linking, missing auth record, and
  concurrent linking.
- Replace tests that expect `?access_token=` with assertions that no credential
  appears in `Location`.
- Add `test/http/auth/google-callback.get.spec.ts` with an assembled flow test
  from initiation through callback: `302`, fixed clean location, correctly
  scoped refresh cookie, subsequent refresh success, and logout success.
- Test cross-account browser switching and ensure the previous session is
  revoked.

## Completion criteria

- Callback responses require valid one-time state and verified provider email.
- No access/refresh token appears in redirect URLs, logs, or error bodies.
- The OAuth-created refresh cookie works on refresh/logout.
- Redirect contracts, account linking, and failure paths have 100% typed
  coverage.
