# `verifyEmail` and OAuth handoff QA and integration-test plan

## Objective

Harden `POST /api/v1/auth/signup/complete` from the TSOA controller through
token verification, user persistence, audit history, session issuance, cookies,
events, cache, logging, and rate limiting. Apply the agreed cookie-based OAuth
handoff to the shared session boundary so neither verification nor Google OAuth
puts bearer credentials in redirect URLs. Add real integration suites under
`test/http/auth` that exercise the assembled application with Postgres and
Redis rather than replacing auth use cases with Jest spies.

## Dependency trace reviewed

1. `src/interface/http/controllers/auth.controller.ts`
   - TSOA query validation and response declarations
   - endpoint-specific rate limiter
2. `generated/routes.ts` and `generated/swagger.json`
   - generated route, required query parameter, and documented statuses
3. `src/interface/http/application.ts`
   - global limiter, app context, request logging, and error handling
4. `src/app/auth/usecases/verify-email.usecase.ts`
   - token verification, user lookup/update, history, events, and session issue
5. `src/app/auth/services/token.service.ts`
   - JWT verification and Redis-backed one-time token handling
6. `src/infra/persistence/cache/cache-storage.impl.ts`
   - non-atomic Redis `get`/`del` primitives
7. `src/domain/user/entities/user.entity.ts`
   - email verification transition, event, and audit delta
8. `src/infra/persistence/repos/user/user.repo.impl.ts`
   - user lookup/update and history transaction
9. `src/app/auth/usecases/helpers/issue-user-session.helper.ts`
   - access/refresh token generation, session replacement, transaction,
     cookie write, and event publication
10. `src/infra/persistence/repos/user/user-session.repo.impl.ts`
    - pure persistence primitives: database operations for session insertion, lookup (with optional row locking), and deletion

11. `src/interface/http/middlewares/app-context-init.middleware.ts`
    - refresh-cookie attributes and lifetime
12. `src/interface/http/middlewares/request-logger.middleware.ts`,
    `src/infra/config/rate-limiter.config.ts`, and
    `src/interface/http/handlers/error.handler.ts`
    - secret exposure, abuse reporting, and HTTP error mapping
13. Existing unit tests for the use case, token service, user entity, session
    helper, error handler, app-context middleware, and rate limiter, plus the
    existing HTTP test style in `test/http/auth`.
14. `src/interface/http/middlewares/google-oauth.middleware.ts`,
    `src/app/auth/usecases/oauth.usecase.ts`, and
    `src/infra/config/oauth.config.ts`
    - Google initiation/callback, session issuance, redirect construction, and
      current absence of server-validated OAuth state
15. `src/app/auth/usecases/refresh-access-token.usecase.ts` and
    `src/infra/server/cors.ts`
    - refresh-cookie exchange, access-token response, credentialed CORS, and
      frontend bootstrap after the clean OAuth redirect

## Confirmed findings

### Critical/high security

1. **Verification secrets are written to logs and monitoring.**
   `verifyEmail` accepts the bearer token in the API query string, while the
   request logger records `req.originalUrl` in the log title and metadata and
   sends it to the reporter for slow requests. The limiter's abuse report also
   includes `req.originalUrl`. A request such as
   `...?token=<credential>` therefore persists the credential in application
   logs/observability. Query transport also exposes it to browser history and
   intermediary access logs.

2. **The verification credential also acts as a login credential.**
   Successful verification returns an access token and creates a refresh
   session. Anyone who obtains or is forwarded the email link can establish a
   full session. This also permits login-CSRF/account-confusion behavior when a
   victim opens a link for another person's account. Product/security must
   explicitly decide whether verification should only mark the address as
   verified or should also authenticate the browser.

3. **The one-time token check is not atomic.**
   `verifySignupToken` performs Redis `get`, comparison, and `del` as separate
   operations. Concurrent requests can both observe the token before either
   deletes it, so more than one request can pass a supposedly single-use gate.

4. **A valid token is burned before durable work succeeds.**
   Redis deletion occurs before user update, audit insertion, session creation,
   cookie write, and event publication. Any transient failure after token
   verification makes the link unusable even though the operation did not
   complete successfully.

5. **Raw bearer tokens are limiter keys and the limiter is bypassable.**
   The controller passes `req.query.token` directly to the limiter. This retains
   secrets in limiter storage and gives each arbitrary string a new five-request
   bucket. An attacker can rotate malformed tokens until only the much looser
   global IP limit is reached.

6. **Soft-deleted users can be verified and issued sessions.**
   `userRepo.findById` does not filter `deletedAt`, and the domain entity's
   validation does not reject deleted users. A still-valid signup token can
   reactivate authentication behavior for a deleted account.

### Correctness and reliability

7. **Verification and session creation are not one transaction.**
   `userRepo.update` commits the user and audit history in its own transaction;
   the session helper then opens a different transaction. A session failure
   leaves the account verified while the HTTP request fails.

8. **The refresh cookie has the wrong effective scope.**
   `res.cookie` and `res.clearCookie` omit `path`. A browser applies its default
   path from `/api/v1/auth/signup/complete`, so the cookie is not reliably sent
   to sibling endpoints such as `/api/v1/auth/refresh-access-token` and
   `/api/v1/auth/logout`.

9. **Refresh-token lifetimes disagree.**
   The refresh JWT is valid for 15 days while its browser cookie lasts 7 days.
   This produces orphaned server sessions and inconsistent behavior.

10. **Event publication is not awaited.**
    `eventBus.publish` returns `Promise<void>`, but the session helper calls it
    without `await`. Handler failures can become unhandled rejections, and a
    successful HTTP response does not mean the verification event was
    delivered. Moving to an outbox is preferable if delivery must be coupled to
    the database transaction.

11. **Concurrent updates can overwrite newer user data.**
    The user is read without a row lock and `userRepo.update` writes the complete
    mapped user. A concurrent profile update can be overwritten by the stale
    user snapshot used for verification.

12. **The public contract is incomplete.**
    The controller documents `400` and `422`, but actual auth-token errors map
    to `401`, and the endpoint can return `429`. The response lacks an explicit
    no-store cache policy even though it currently contains an access token.

13. **Google OAuth currently exposes the access token in its redirect URL.**
    `oauth.usecase.ts` constructs
    `/auth/oauth-confirmation?access_token=<bearer-token>`. That token can leak
    through browser history, frontend and proxy logs, monitoring, copied URLs,
    analytics, and referrer data.

14. **Google OAuth does not currently validate `state`.**
    The Passport strategy and initiation middleware do not enable a
    server-verified state mechanism. A clean cookie-based redirect does not
    remove the need to prevent login CSRF at the OAuth initiation/callback
    boundary.

15. **The current cookie domain can make the agreed OAuth flow fail.**
    The backend derives `Domain` from `WEB_APP_URL`. If the API responds from a
    sibling hostname, it cannot set a cookie scoped specifically to the
    frontend hostname and the browser may reject it. The refresh cookie should
    normally be host-only to the API.

## Agreed OAuth contract

The implementation will use the cookie-based contract; the authorization-code
redirect is not part of this change:

1. The backend initiates Google OAuth with an unguessable, server-bound,
   expiring, single-use `state` value.
2. The Google callback validates and consumes `state` before accepting the
   identity.
3. The backend creates the persisted refresh session and sets only the refresh
   token in a secure, HTTP-only, host-only cookie.
4. The backend redirects to the exact clean client URL
   `/auth/oauth-confirmation`, with no access token, refresh token, code, user
   identifier, or sensitive error details in the URL.
5. The confirmation page calls `POST /api/v1/auth/refresh-access-token` with
   `credentials: 'include'`.
6. The refresh endpoint rotates the refresh session, returns a short-lived
   access token with `Cache-Control: no-store`, and the frontend holds that
   access token in memory only.
7. Logout revokes the persisted refresh session and clears the cookie using
   exactly the same cookie scope.

The access token will not be stored in a cookie. If the frontend and API are on
the same registrable site, use `SameSite=Lax`. A genuinely cross-site
deployment requires `SameSite=None; Secure` plus explicit CSRF protection and
credentialed, allowlisted CORS.

## Decisions required before implementation

1. **Email verification behavior [DECIDED]:** Automatic login is **required**. Email verification must both mark the address as verified and issue an authenticated session (access token + HTTP-only refresh cookie). The signup token must be treated as a sensitive credential and include protections against login CSRF.
2. Choose a one-time-token design:
   - recommended durable token record with a hashed token/JTI, status, expiry,
     and transactional consume alongside verification; or
   - a Redis claim/finalize protocol implemented atomically with Lua, with
     claim release after retryable failures.
3. Define replay behavior. Recommended public behavior is one generic `401`
   response for malformed, expired, wrong-type, absent, mismatched, consumed,
   unknown-user, and deleted-user tokens without revealing which check failed.

## Implementation plan

### 1. Secure the HTTP boundary

- Add a typed and validated request DTO such as `{ token: string }`.
- Change the API endpoint to accept the token in the POST body. The web
  confirmation page may receive the email link token in its URL, but it must
  exchange it without copying the token into the backend API URL.
- Reject missing, empty, non-string, malformed, and unreasonably large tokens
  before the use case.
- Add `Cache-Control: no-store` to credential-bearing responses.
- Document the actual `200`, `401`, `422`, and `429` responses and regenerate
  TSOA routes/OpenAPI output.
- Add centralized URL/query redaction in request logging and abuse/slow-request
  reporting as defense in depth; do not rely only on this endpoint changing to
  body transport.

### 2. Make rate limiting secret-safe and resistant to rotation

- Create a dedicated verify-email limiter rather than reusing
  `rateLimiter.default`.
- Hash/HMAC any stable credential-derived key before it reaches limiter
  storage.
- Apply an independent, stricter per-IP bucket so rotating invalid token
  strings cannot create unlimited effective buckets.
- Ensure limiter errors and abuse reports never contain the token.
- Keep tests deterministic by creating fresh application/limiter instances or
  exposing a test-only store reset through dependency injection.

### 3. Make one-time use and persistence atomic

- Split token parsing/cryptographic validation from ownership/consumption.
- Validate JWT algorithm explicitly and validate the decoded payload shape
  (`id`, `type`, expiry, and any chosen issuer/audience/JTI claims).
- Store only a token digest or opaque JTI, not the bearer token itself.
- Atomically grant one request ownership of the token.
- Open one database transaction and, within it:
  - reload the active user with an update lock;
  - reject missing or soft-deleted users;
  - apply the email-verification transition exactly once;
  - persist the user and audit history;
  - create/replace the session only if automatic login is retained;
  - write an outbox event if durable publication is required.
- Finalize token consumption only after the durable transaction commits.
  Release a temporary claim when a retryable failure occurs.
- Add a narrow repository update or optimistic version check so verification
  cannot overwrite unrelated user fields from a stale snapshot.

### 4. Implement the agreed OAuth handoff

- Change the Google OAuth use case to issue the persisted refresh session but
  return only the clean `${WEB_APP_URL}/auth/oauth-confirmation` redirect.
- Remove `access_token` and all other credential-bearing query parameters from
  every success and failure redirect.
- Implement server-verified OAuth `state` for initiation and callback. Bind it
  to the initiating browser, give it a short expiry, consume it atomically, and
  reject missing, mismatched, expired, or replayed values with no session or
  cookie.
- Keep the refresh token exclusively in the HTTP-only cookie; do not add an
  access-token cookie.
- Update the confirmation-page contract to call the existing refresh endpoint
  with `credentials: 'include'` and retain the returned access token only in
  memory.
- Add `Cache-Control: no-store` to the refresh response and sanitize OAuth
  callback/redirect logging.

### 5. Correct shared session and cookie behavior

- Refactor `issue-user-session.helper.ts` to accept an existing transaction
  instead of always starting a separate transaction.
- Await event publication, or replace direct publication with a transactional
  outbox.
- Centralize refresh-cookie options. Set and clear a host-only cookie with the
  same explicit path (recommended `/api/v1/auth`), `HttpOnly`, `Secure`, and
  deployment-appropriate `SameSite` values. Do not derive `Domain` from
  `WEB_APP_URL`.
- Align the cookie, JWT, and persisted-session lifetimes.
- Correct cross-account session replacement so logging in as another user
  revokes the refresh session represented by the incoming cookie instead of
  attempting deletion only under the newly authenticated user ID.
- Hash refresh tokens at rest as a follow-up hardening measure if it cannot be
  included safely in this change.

### 6. Keep errors non-enumerating and retry-aware

- Map all invalid verification credentials and ineligible users to the same
  sanitized public auth error.
- Do not expose token contents, decoded IDs, cache keys, database details, or
  internal failure messages in responses or logs.
- Return `5xx` for retryable infrastructure failures while ensuring the
  verification token remains usable and no partial state is committed.

## Test plan

### HTTP integration suite

Create `test/http/auth/signup-complete.post.spec.ts`. It must use
`createApplication()` with the real verification use case, token service,
Postgres repositories, Redis cache, transaction service, app context, and
cookie middleware. Do not spy on `authUseCase.verifyEmail`.

Add small reusable integration fixtures for:

- inserting an audited unverified/verified/deleted user through production
  mappers or repository APIs;
- generating a real signup token through the production token service;
- querying the user, history, and session tables for assertions;
- deleting only rows and Redis keys created by the test;
- closing Redis/Postgres resources so Jest exits cleanly.

Cover:

1. Valid unverified user:
   - returns the agreed `200` body;
   - never echoes the signup token;
   - persists `emailVerified`, one audit record, and one verification event or
     outbox record;
   - consumes the signup token only after commit.
2. If automatic login remains:
   - returns a valid access token for the same user;
   - creates exactly one refresh-session record;
   - sets `HttpOnly`, expected `Secure`/`SameSite`, explicit `Path`, and aligned
     expiry;
   - a `supertest.agent` can call refresh and logout using that cookie.
3. Request validation:
   - missing body/token, empty token, non-string token, malformed token, and an
     oversized token return `422` without database/cache mutation.
4. Invalid credentials:
   - expired, wrong type, bad signature, cache miss/mismatch, replayed, and
     unknown-user tokens return the same sanitized `401`;
   - no response or `Set-Cookie` value contains the submitted token.
5. Deleted user:
   - returns the same generic `401`;
   - remains deleted/unverified and receives no session.
6. Replay:
   - the first committed request succeeds;
   - the second request fails without additional history, events, or sessions.
7. Concurrency:
   - fire two requests with the same token simultaneously;
   - exactly one wins;
   - only one verification transition, history entry, event/outbox entry, and
     optional session exist afterward.
8. Retryable failure:
   - inject a controlled failure at user/history, session, and outbox/event
     persistence boundaries;
   - assert full rollback and no cookie;
   - retry the same token after removing the failure and assert success.
9. Already-verified user with a newly issued token:
   - assert the explicit product decision (idempotent confirmation without
     login, or tightly specified login behavior);
   - never create duplicate verification history/events.
10. Rate limiting:
    - repeated attempts against one token hit `429`;
    - rotating arbitrary token strings from one IP also hits the independent IP
      limit;
    - the secret is absent from limiter keys exposed by the test store, error
      bodies, logger calls, and reporter calls.
11. Logging:
    - successful, invalid, slow, and rate-limited requests do not place the
      token in `req.originalUrl`-derived logs or reporter payloads.
12. Unexpected failures:
    - return the standard sanitized `500` body with no credential disclosure.

### OAuth HTTP integration suite

Add assembled HTTP coverage under `test/http/auth` for the agreed Google
handoff. Use a controlled Passport/Google identity boundary, but keep the real
OAuth callback middleware, OAuth use case, session helper, Postgres session
repository, cookie middleware, and refresh use case.

Cover:

1. OAuth initiation emits a strong `state` value and stores/binds it with a
   short expiry.
2. A valid callback:
   - validates and consumes `state`;
   - creates one refresh session;
   - returns `302` to the exact clean `/auth/oauth-confirmation` URL;
   - contains no access or refresh token in `Location`, response body, logs, or
     reporter payloads;
   - sets the refresh cookie with the agreed flags and scope.
3. The redirected browser, represented by `supertest.agent`, can call the
   refresh endpoint with the cookie, receive an access token with
   `Cache-Control: no-store`, and use the rotated cookie afterward.
4. Missing, mismatched, expired, and replayed `state` values produce no
   redirect credential, cookie, or persisted session.
5. Replaying the Google callback cannot create a second session.
6. A browser already holding another user's refresh cookie has that exact old
   session revoked when the Google login establishes the new account session.
7. Logout revokes the new persisted session and clears a cookie whose path and
   attributes match those used when it was set.
8. Cookie behavior is tested for the deployed frontend/API topology:
   same-site subdomains use `SameSite=Lax`; any supported cross-site topology
   uses `SameSite=None; Secure`, credentialed allowlisted CORS, and the chosen
   CSRF defense.

If fault injection cannot be achieved with the current singleton composition
root, make the auth/application composition accept explicit dependencies for
tests. Use the same production implementations by default and substitute only
the single failing boundary in failure-path tests.

### Unit and component coverage to add

- **Controller/DTO:** body contract, actual statuses, no-store response, and
  limiter selection.
- **Token service/cache adapter:** claim winner/loser, atomic comparison,
  claim expiry/release, final consumption, malformed payloads, explicit JWT
  algorithm, and Redis errors.
- **Verify-email use case:** missing/deleted/already-verified users, every
  failure boundary, rollback, retry, concurrency result, and no duplicate
  history/event.
- **User repository:** active-user filtering, row-lock forwarding, narrow or
  optimistic update, affected-row checks, and transaction reuse.
- **Session helper:** existing transaction reuse, cookie timing, and awaited
  event/outbox failure behavior.
- **App-context middleware:** identical set/clear cookie options, explicit path,
  host-only scope, environment-specific `Secure`, `SameSite`, and aligned
  lifetime.
- **Google OAuth middleware/use case:** state creation/validation/consumption,
  clean success and error redirects, no access-token generation for the
  redirect response, and no credential leakage.
- **Refresh endpoint/CORS:** credentialed allowlisted request, refresh rotation,
  memory-only access-token response contract, `Cache-Control: no-store`, and
  rejection when the cookie is absent or invalid.
- **Request logger/reporter:** redaction of `token`, authorization, cookies, and
  other configured secret query keys in normal, error, slow, and abuse logs.
- **Rate limiter:** HMAC key determinism without plaintext, action namespace,
  malformed input fallback, IP rotation defense, IPv4/IPv6 normalization, and
  store reset/isolation.
- **Error handler/OpenAPI:** generic `401`, `422`, `429`, sanitized `500`, and
  generated contract parity.

## Verification commands

Run with the test Postgres and Redis services available:

```sh
npm test -- --runInBand test/http/auth/signup-complete.post.spec.ts
npm test -- --runInBand test/http/auth --testNamePattern="Google|OAuth|refresh"
npm test -- --runInBand src/app/auth
npm test -- --runInBand src/interface/http
npm test -- --coverage --runInBand
npm run build
npx tsc --noEmit
```

Also run the concurrency and retry tests repeatedly (for example 20 iterations)
to detect timing-dependent failures.

## Completion criteria

- No verification token appears in backend API URLs, logs, reports, limiter
  storage, error bodies, or persisted plaintext token records.
- One token has exactly one successful consumer under concurrent requests.
- A failed request neither consumes the token permanently nor leaves partial
  user, audit, event/outbox, or session state.
- Deleted users cannot be verified or authenticated.
- The verification/login decision is explicit and tested.
- Google OAuth redirects only to the clean `/auth/oauth-confirmation` URL and
  validates a bound, expiring, single-use state value.
- OAuth and any verification flow that issues a session set only the refresh
  token as a host-only HTTP-only cookie; refresh and logout receive that cookie,
  and all refresh lifetimes agree.
- The refresh endpoint returns the short-lived access token with
  `Cache-Control: no-store`; the access token is never placed in a URL or
  cookie.
- HTTP/OpenAPI status and payload contracts match runtime behavior.
- The new HTTP suite exercises real Postgres and Redis dependencies; isolated
  route tests may use spies but are not counted as the integration suite.
- All changed code has 100% statement, branch, function, and line coverage,
  contains no `any`, passes TypeScript/build checks, and leaves no test data or
  open handles.
