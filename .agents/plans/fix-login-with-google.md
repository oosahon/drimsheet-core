# Fix `GET /auth/google`

## Audit findings

- **Critical – OAuth login CSRF:** initiation does not generate or persist an
  OAuth `state` value. The callback therefore cannot bind the Google response
  to the browser that initiated login.
- **Abuse gap:** the public initiation route has no endpoint-specific per-IP
  limiter.
- **Bug – disabled configuration fails at request time:** `setupOAuth` silently
  skips strategy registration when credentials are missing, but the endpoint
  remains exposed and can fail as an unknown Passport strategy.
- **Contract bug:** generated OpenAPI describes `204`, while middleware
  actually terminates the request with a Google `302`.
- **Test gap:** there are no tests for the Google OAuth middleware, state
  cookie/store, redirect, configuration failure, or live rate limiting.

## Implementation plan

1. Generate a cryptographically random, short-lived, single-use `state` nonce
   for every initiation. Bind it to the initiating browser using a signed,
   `HttpOnly`, `Secure`, `SameSite=Lax` transient cookie and/or a server-side
   state store. Scope the cookie to the callback path and do not expose the
   nonce in logs.
2. Pass the state to Google's authorization request and require exact
   constant-time comparison during callback. Consume it regardless of callback
   success to prevent replay. The callback plan owns validation tests.
3. Consider PKCE if supported cleanly by the selected Passport strategy;
   `state` is mandatory even if PKCE is added.
4. Add an action-scoped per-IP limiter for initiation. Confirm trusted proxy
   behavior and ensure abuse reporting contains no OAuth parameters.
5. Validate required OAuth configuration at startup. Either fail startup in an
   environment where Google login is enabled but incomplete, or return a
   deliberate sanitized `503`; never expose an “unknown strategy” error.
6. Annotate/document the real `302` response and Google redirect location.
   Keep return control in middleware without allowing TSOA to emit a second
   response.

## Tests

- Middleware tests with Passport mocked at the module boundary: nonce
  generation, state propagation, transient cookie attributes, redirect, and
  middleware errors.
- State-store tests for expiry, single use, replacement, replay, and
  cryptographically independent values.
- Configuration tests for enabled, disabled, and partially configured OAuth.
- Add `test/http/auth/google.get.spec.ts` with assembled HTTP tests for `302`,
  Google authorization parameters including state, no `204` body, per-IP
  `429`, and no nonce leakage in logs/body.
- Test the full initiation/callback pairing in the callback endpoint suite.

## Completion criteria

- Every OAuth flow is bound to one initiating browser with expiring,
  single-use state.
- Missing configuration fails predictably and safely.
- The route contract matches its redirect behavior and abuse controls are
  tested with 100% typed coverage.
