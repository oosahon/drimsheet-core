# Fix `POST /auth/signup/complete`

## Audit findings

- **High – token disclosure:** the bearer verification token is accepted in the
  query string. It can be retained by HTTP logs, observability, browser history,
  and referrer data.
- **High – token loss on transient failure:** `verifySignupToken` deletes the
  cached one-time token before the user update and session creation succeed.
  Any later failure permanently consumes a valid link.
- **Bug – non-atomic state:** email verification is committed outside the
  transaction that creates the session. A session failure leaves the account
  verified but returns an error.
- **Bug – unusable refresh cookie:** refresh cookies have no explicit `Path`.
  A cookie set from `/auth/signup/complete` defaults to the signup subpath and
  is not sent to `/auth/refresh-access-token` or `/auth/logout`.
- **Rate-limit weakness:** the raw secret token is used as a limiter key, so
  random tokens create unlimited buckets and secrets may be exposed to the
  limiter store.
- **Behavior ambiguity:** successful email verification also logs the user in.
  This makes possession of the email link sufficient for a session and should
  be an explicit product/security decision.
- **Test gap:** no HTTP test exercises body/query transport, cookie scope,
  `429`, token redaction, or rollback. Unit tests do not cover failures after
  token validation.

## Implementation plan

1. Introduce a validated DTO such as `{ token: string }` and receive it in the
   request body. Update the web confirmation page to extract its URL token and
   POST it without copying the secret into the API URL.
2. Split token verification from consumption. Use a one-time claim/finalize
   protocol (atomic cache script or persisted token record) so:
   - only one request can own a token;
   - transient application/transaction failure releases the claim;
   - successful verification consumes it permanently.
3. Make the user update, audit history, session replacement/creation, and
   durable event/outbox write one database transaction. Refactor the session
   helper to accept an existing transaction rather than starting a second one.
4. Decide whether verification should issue a session. If not, return a simple
   verified result and require normal login. If retained, document the email
   link as a login credential and keep a short expiry, strict one-time use, and
   sanitized error response.
5. Centralize refresh-cookie options and set/clear an explicit path that covers
   refresh and logout (for example `/api/v1/auth`), with matching domain,
   `HttpOnly`, `Secure`, `SameSite`, and lifetime settings.
6. Replace the raw-token limiter key with an HMAC digest plus an independent
   per-IP limiter. Never log or store the token itself as limiter metadata.
7. Update TSOA declarations for request body, `200`, `401`/`422`, and `429`.

## Tests

- DTO tests for missing, empty, malformed, and oversized tokens.
- Auth-service tests for claim, concurrent claim rejection, release after
  failure, and final one-time consumption.
- Use-case tests for rollback at user update, session creation, and event/outbox
  writes; verify the token remains retryable after each transient failure.
- Persistence/concurrency test proving two simultaneous requests create at most
  one session and one verification transition.
- Add `test/http/auth/signup-complete.post.spec.ts` with assembled HTTP tests
  proving the token is not in the API URL, logs, or error body; correct cookie
  path/flags; refresh works after verification; and the live limiter returns
  `429`.
- Test both outcomes of the explicit “verification logs in” product decision.

## Completion criteria

- Verification secrets do not traverse the API query string or limiter store.
- A failed request cannot burn the token or partially verify the account.
- Refresh and logout receive the cookie created by this endpoint.
- Concurrent reuse has one deterministic winner, and all changed code reaches
  100% coverage without `any`.
