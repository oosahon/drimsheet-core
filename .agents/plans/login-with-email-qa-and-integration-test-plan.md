# `loginWithEmail` QA and integration-test plan

## Objective

Harden `POST /api/v1/auth/login-with-email` from the TSOA controller through
validation, rate limiting, credential checks, session issuance, cookies, error
mapping, generated API contract, and tests. Add proper HTTP integration coverage
under `test/http/auth` that proves the assembled Express route preserves the
security contract rather than only proving the app-layer use case in isolation.

## Dependency trace reviewed

1. `src/interface/http/controllers/auth.controller.ts`
   - endpoint declaration, TSOA body binding, endpoint rate limiter, response
     metadata, and token response behavior.
2. `generated/routes.ts` and `generated/swagger.json`
   - generated route, request schema, and documented response statuses.
3. `src/interface/http/application.ts`
   - global limiter, JSON/body parsing, cookie parsing, app context, generated
     route registration, and error handler.
4. `src/infra/config/rate-limiter.config.ts`
   - login endpoint limiter, account/IP fallback keys, hashed account buckets,
     and 429 error shape.
5. `src/app/auth/dtos/auth/auth.dto.ts` and
   `src/app/auth/dtos/auth/auth.dto.validation.ts`
   - login request DTO and zod validation.
6. `src/app/auth/usecases/login-with-email.usecase.ts`
   - email normalization, user lookup, strategy/password checks, failed-attempt
     accounting, event enrichment, and session issuance.
7. `src/app/auth/errors/auth.error.ts`,
   `src/interface/http/handlers/error.handler.ts`, and
   `src/interface/http/helpers/http-error-parser.ts`
   - auth error keys, HTTP status mapping, and public error body shape.
8. `src/app/auth/usecases/helpers/issue-user-session.helper.ts`
   - access/refresh token generation, old refresh-session cleanup, new session
     persistence, refresh cookie write, and login event publication.
9. `src/interface/http/middlewares/app-context-init.middleware.ts`
   - refresh cookie attributes, cookie path, cookie lifetime, and request cookie
     reads.
10. `src/app/auth/services/password.service.ts` and
    `src/app/auth/services/token.service.ts`
    - bcrypt comparison, JWT issuance, JWT type validation, and token TTLs.
11. `src/infra/persistence/repos/user/user-auth.repo.impl.ts` and
    `src/infra/persistence/repos/user/user-session.repo.impl.ts`
    - failed-login persistence, reset persistence, refresh-session lookup,
      insertion, and deletion.
12. Existing tests:
    - `src/app/auth/usecases/__specs__/login-with-email.usecase.spec.ts`
    - `src/app/auth/dtos/auth/__tests__/auth.dto.validation.test.ts`
    - `src/app/auth/usecases/helpers/__specs__/issue-user-session.helper.spec.ts`
    - `src/interface/http/middlewares/__specs__/app-context-init.middleware.spec.ts`
    - `src/infra/config/__tests__/rate-limiter.config.test.ts`
    - existing HTTP auth specs in `test/http/auth`.

## Confirmed findings

### Security

1. **Login leaks account state through public auth error keys.**
   `login-with-email.usecase.ts` throws distinct `InvalidCredentials`,
   `WrongStrategy`, and `AccountLocked` errors. The HTTP error handler maps all
   `AuthError`s to `401`, but it returns the original `errorKey` and `name`.
   A caller can distinguish an unknown email or bad password from an OAuth-only
   account and from a locked account. Use one generic invalid-login response
   for credential, strategy, and lockout failures at the HTTP boundary, with
   any support-oriented detail kept server-side.

2. **Credential-bearing login responses are missing `Cache-Control: no-store`.**
   `verifyEmail` and `refreshAccessToken` explicitly set `no-store`, but
   `loginWithEmail` returns an access token and sets a refresh cookie without
   the same cache directive. Add `this.setHeader('Cache-Control', 'no-store')`
   before returning the token response.

3. **The login rate limiter is labeled as signup.**
   `rateLimiter.default` protects `loginWithEmail`, but its account key calls
   `makeAccountRateLimitKey('signup-with-email', ...)`. With the current
   in-memory middleware instances this is mostly a misleading key label, but it
   violates the intended action separation and becomes risky if the limiter ever
   uses shared/external stores or logs keys. Use the `login-with-email` action
   and add a regression test.

4. **Persistent account lockout can be weaponized for denial of service.**
   Five bad password attempts permanently block email login until a successful
   reset flow clears `failedLoginAttempts`; the login limiter only slows this
   down. Product/security should decide whether to keep hard lockout, use
   temporary time-boxed lockout, or require step-up/recovery without letting any
   internet caller indefinitely lock a known account.

### Bugs and contract gaps

5. **Login email validation does not match signup/email-value normalization.**
   Signup validation trims and lowercases email, and `emailValue.make` also
   trims/lowercases. Login validation uses `z.email(...)` directly before the
   use case normalizes, so whitespace variants such as
   `"  ADA@EXAMPLE.COM  "` fail with `422` instead of finding the existing
   normalized account. Add `.trim().toLowerCase().pipe(z.email(...))` to the
   login DTO validation if login should accept the same canonical input as
   signup and rate limiting.

6. **The controller documents an incomplete public contract.**
   `loginWithEmail` declares `400` and `422`, but the route can return `401`
   for auth failures and `429` for the endpoint limiter. Add the missing
   `@Response<IHttpErrorDto>('401')` and `@Response<IHttpErrorDto>('429')`,
   then regenerate TSOA routes/OpenAPI output.

7. **Failed-attempt updates are outside the successful-login transaction.**
   `incrementFailedLoginAttempts` and `resetFailedLoginAttempts` execute as
   standalone writes, while session issuance uses `repoService.runInTransaction`.
   This is probably acceptable for a counter, but it should be intentional:
   reset failure currently blocks an otherwise valid login before session
   issuance, and concurrent failed/successful attempts can race.

8. **Auth-event publication happens after session persistence and cookie write.**
   `issue-user-session.helper.ts` awaits `eventBus.publish`, so an event bus
   failure can turn a fully persisted login session and refresh cookie into an
   HTTP error. If login event delivery must not decide HTTP success, move it to
   an outbox or handle publication failure explicitly.

9. **Password reset blocks Google-first users from creating an email password.**
   `request-password-reset.usecase.ts` currently throws `WrongStrategy` when
   the existing auth strategy does not include email. That makes a frustrated
   Google-authenticated user unable to use password reset as the recovery path
   for adding an email password. Change password reset request behavior to send
   a reset/setup link for an existing user with a trusted email even when their
   current strategy is Google-only, and let the reset completion flow add the
   email strategy/password rather than treating the request as a wrong-strategy
   login failure.

## Test coverage gaps

1. No HTTP integration test currently exists for
   `POST /api/v1/auth/login-with-email`.
2. Existing use-case tests cover happy path, invalid payload, missing user,
   missing auth record, wrong strategy, bad password, lockout, failed-attempt
   reset, and old-session deletion, but they do not prove generated-route
   validation, Express error mapping, cache headers, cookies, or rate limiting.
3. DTO tests only prove that login accepts a 128-character password; they do
   not cover email canonicalization or invalid shape.
4. Rate-limiter tests prove account key action separation exists at the helper
   level, but no test catches the controller using the signup action for login.
5. Existing HTTP tests prove signup, verification, OAuth handoff, and refresh
   behavior. They should be mirrored for login-specific security assertions.
6. Password-reset tests should cover the Google-only strategy path so account
   recovery can create an email password without exposing account existence.

## Integration-test plan for `test/http/auth`

Create `test/http/auth/login-with-email.post.spec.ts`.

Use the existing HTTP test pattern:

- create a fresh `Express` app with `createApplication()`;
- spy on `authUseCase.loginWithEmail`;
- restore spies after each test;
- use `supertest` against `/api/v1/auth/login-with-email`;
- keep use-case internals covered by the app-layer specs and assert the HTTP
  boundary contract here.

### Cases to add first

1. **Success contract**
   - mock `authUseCase.loginWithEmail` to resolve
     `{ accessToken: 'mock-access-token' }`;
   - expect `200`;
   - expect body `{ accessToken: 'mock-access-token' }`;
   - expect `Cache-Control` contains `no-store` after the fix;
   - expect the response body does not contain the password;
   - expect the use case is called with the submitted body.

2. **Generated-route validation**
   - omit `password`;
   - expect `422`;
   - expect use case not called;
   - assert the validation error field is `body.password`.

3. **Invalid app-layer validation**
   - send malformed email or empty password that passes TSOA shape but fails
     zod in the use case;
   - mock is not needed if testing the real validation path, or mock rejected
     `UnprocessableEntity` if this suite intentionally replaces the use case;
   - expect `422` and no password leakage.

4. **Generic auth failure contract**
   - mock `InvalidCredentials`, `WrongStrategy`, and `AccountLocked`;
   - expect the same generic invalid-login public status/body for each;
   - assert the response does not expose `auth_error_wrong_strategy`,
     `auth_error_account_locked`, or any other account-state detail.

5. **Unexpected error sanitization**
   - mock rejection with `new Error('failed with <password>')`;
   - expect `500`;
   - expect body `{ name: 'InternalServerError',
errorKey: 'app_error_internal_server_error' }`;
   - assert password is absent from the response.

6. **Account rate limiting**
   - send six attempts for the same email;
   - expect first five to reach the use case and sixth to return `429`;
   - expect `TooManyRequests` body uses the login limiter message;
   - assert the sixth request does not invoke the use case.

7. **Normalized account rate-limit bucket**
   - send case/whitespace variants of the same email;
   - after fixing login email validation and limiter action, expect all variants
     share one account bucket.

8. **Malformed email limiter fallback**
   - send malformed email attempts;
   - expect the route falls back to the IP bucket instead of creating unlimited
     per-email buckets.

9. **Old refresh cookie behavior, if the spy is replaced with real integrated
   collaborators later**
   - seed a previous `refresh_token` cookie;
   - assert the login response overwrites it with an HTTP-only cookie scoped to
     `/api/v1/auth`;
   - assert `SameSite=Lax`, production `Secure` behavior is covered by
     middleware unit tests, and the access token is not put in a cookie.

## Implementation plan

1. Update `loginWithEmail` in `auth.controller.ts`:
   - set `Cache-Control: no-store`;
   - add documented `401` and `429` responses.
2. Update `rateLimiter.default`:
   - change the account key action from `signup-with-email` to
     `login-with-email`;
   - consider renaming `default` to `loginWithEmail` to avoid future accidental
     reuse.
3. Align login DTO validation with signup/email value normalization:
   - trim and lowercase the login email before `z.email`;
   - add DTO tests for uppercase/whitespace acceptance and malformed rejection.
4. Implement the decided public login error contract:
   - map invalid credentials, wrong strategy, and account lockout to one generic
     invalid-login response at the HTTP boundary;
   - keep the original error details available only to server-side logs,
     metrics, or support workflows that are safe from enumeration.
5. Update password-reset recovery behavior for Google-first accounts:
   - change `request-password-reset.usecase.ts` so an existing Google-only user
     can receive a password reset/setup link;
   - ensure reset completion persists a password and adds the email strategy
     when needed;
   - keep unknown-user responses indistinguishable from known-user responses.
6. Add `test/http/auth/login-with-email.post.spec.ts` with the HTTP cases above.
7. Add/update password-reset use-case and HTTP tests for Google-only users:
   - request reset for an existing Google-only account sends the email and does
     not throw `WrongStrategy`;
   - unknown users remain a no-op;
   - reset completion adds email strategy/password for accounts that did not
     previously have email auth.
8. Regenerate routes/OpenAPI after controller metadata or DTO validation changes:
   - `npm run build:routes`
9. Run focused validation:
   - `yarn test test/http/auth/login-with-email.post.spec.ts`
   - `yarn test src/app/auth/dtos/auth/__tests__/auth.dto.validation.test.ts`
   - `yarn test src/infra/config/__tests__/rate-limiter.config.test.ts`
   - `yarn test src/app/auth/usecases/__specs__/request-password-reset.usecase.spec.ts`
   - `yarn test src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts`
10. Run broader auth validation when the focused tests pass:

- `yarn test test/http/auth src/app/auth/usecases/__specs__/login-with-email.usecase.spec.ts`

## Open decisions

1. Should failed-attempt lockout be temporary/time-boxed instead of persistent
   until password reset or successful login?
2. Should the password-reset email copy differ for Google-only users, or should
   the same generic reset/setup email cover both reset and first-password setup?
3. Should integration tests continue the current spy-on-use-case style, or
   should this endpoint get a deeper database-backed integration suite once
   shared test DB fixtures are available?
