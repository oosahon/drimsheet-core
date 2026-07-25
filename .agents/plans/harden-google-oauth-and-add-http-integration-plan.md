# Harden Google OAuth and add HTTP integration Plan

## Goal

Harden `GET /api/v1/auth/google` and
`GET /api/v1/auth/google/callback` from the TSOA controller through Passport
profile handling, account lookup/linking, session issuance, cookies, redirects,
error mapping, and generated HTTP routes. Replace the mixed OAuth handoff spec
with focused Supertest integration specs under `test/http/auth` and bring the
dependent unit coverage to 100% for the touched behavior.

The plan is implementation-ready for the verified-email, error-handling,
cookie/cache, consistency, and test fixes. The persistent provider-identity
change depends on the account-linking decision under **Open Decisions**.
Unrelated staged and working-tree changes must be preserved.

## Context

- The controller methods contain no behavior themselves; TSOA attaches
  `initiateLoginWithGoogle` and `completeLoginWithGoogle`, which perform the
  redirects and callback orchestration.
- The initiation middleware creates a 32-byte random state value, stores it in
  an HTTP-only, `SameSite=Lax`, ten-minute cookie scoped to `/api/v1/auth`, and
  passes the same value to Passport.
- The callback middleware clears that cookie, compares it with the query
  `state`, authenticates through Passport, calls
  `authUseCase.oAuth.handleGoogleCallback`, and redirects to the configured web
  app.
- Passport maps the first Google email into an app profile. The Google helper
  finds or creates the user, adds the Google strategy to an existing auth
  record, and the OAuth use case issues a persisted refresh-token session.
- `test/http/auth/oauth-handoff.post.spec.ts` currently mixes two GET endpoints
  and the refresh-token POST endpoint in a file whose HTTP verb is incorrectly
  named. Its four tests pass, but they cover only one initiation case, one
  state-mismatch case, one callback success case, and refresh cache behavior.

## Confirmed Findings

1. **P1 security — unverified provider email can be treated as verified and
   linked to an existing account.** `oauth.config.ts` discards
   `profile.emails[0].verified`, while `oauth-handler-google.helper.ts` uses the
   email as the sole lookup/linking key and creates new users with
   `emailVerified: true`. The installed Passport Google profile contract
   exposes the verification boolean. Carry it through `IOAuthProfile`, reject
   absent/unverified emails before lookup, and test that no account is linked
   or created in that case.

2. **P1 security/design — Google identities are not bound to a stable provider
   subject.** The flow discards `profile.id` and stores only
   `strategy: ['google']`; every later login resolves identity by current email.
   This cannot distinguish a previously linked Google principal from another
   Google principal presenting the same email, and an email change can create a
   second local account. If the product requires durable federated identity,
   persist a unique `(provider, providerSubject)` association and resolve it
   before any explicit, verified-email account-linking policy.

3. **P1 reliability — new-user event publication is fire-and-forget.**
   `oauth-handler-google.helper.ts` calls the promise-returning
   `eventBus.publish` without `await`. A rejection can become unhandled and the
   callback can report success before required user-created handlers finish.
   Await publication, matching the email-signup and session-issuance paths, and
   define/test the expected failure behavior.

4. **P2 bug — an existing user with no auth record is authenticated without
   repairing or rejecting the inconsistent state.** When
   `userAuthRepo.findByUserId` returns `null`, the helper skips strategy
   persistence and calls `done(null, existingUser)`. Fail closed with an
   internal consistency error, or transactionally create the missing auth
   record if that state is deliberately recoverable.

5. **P2 correctness — existing-account strategy linking is a non-transactional
   read/mutate/write.** The helper mutates `userAuth.strategy` in place and
   updates it outside `repoService.runInTransaction`. Concurrent linking or
   other auth updates can lose changes, and the mutation conflicts with the
   repository's immutability conventions. Add an atomic repository operation
   or a locked transaction that produces a new auth value and preserves
   concurrent strategies.

6. **P2 security — OAuth responses do not explicitly prevent caching.** Other
   auth endpoints set `Cache-Control: no-store`, but neither OAuth route does.
   The callback carries authorization parameters and sets a refresh cookie
   before redirecting. Set `Cache-Control: no-store` on initiation, callback
   success, and callback error responses; assert it at the assembled HTTP
   boundary.

7. **P2 observability/correctness — Passport operational errors are collapsed
   into `Unauthorized`.** The callback middleware maps both `err` and missing
   user to the same 401. Invalid or denied credentials may be 401, but token
   exchange/provider/internal failures should reach centralized error handling
   and observability rather than being reported as a client authentication
   failure. Preserve `err` for `next(err)` and reserve `Unauthorized` for a
   missing/failed user result, while ensuring provider details are not exposed
   in the public 500 response.

8. **P2 contract — callback error outcomes are under-documented.** The
   controller declares only `401`, although callback/use-case/database/provider
   failures can produce sanitized `500` responses. Add the accurate response
   metadata and regenerate `generated/routes.ts` and
   `generated/swagger.json`.

9. **P2 test gap — the existing HTTP spec does not follow repository naming or
   suite rules.** `oauth-handoff.post.spec.ts` tests GET OAuth routes and an
   unrelated POST refresh route; status suites use `'302'` instead of
   `'302 Response'`. Split it into endpoint-specific files named with lowercase
   HTTP verbs and move the refresh assertion to its own POST spec.

10. **P2 test gaps — important security and failure branches are uncovered.**
    No HTTP test proves that the authorization redirect carries the same state
    stored in the cookie, that cookie lifetime/`SameSite`/production `Secure`
    attributes are correct, that missing/malformed state is rejected, that
    state is cleared on every callback outcome, that Passport failure/error
    bypasses the use case, that callback failure is sanitized, or that success
    writes a secure refresh cookie without leaking either token into the
    redirect.

11. **P3 test gap — provider mapping and helper consistency branches are
    uncovered.** There is no focused test for Google configuration/profile
    mapping, verified versus unverified email, missing auth data, event
    publication rejection, or concurrency-safe strategy linking.

## Scope

### Expected Changes

- `src/interface/http/controllers/auth.controller.ts` — declare the complete
  response/cache contract for both OAuth endpoints.
- `src/interface/http/middlewares/google-oauth.middleware.ts` — preserve
  operational errors, consistently clear state, and enforce no-store response
  behavior.
- `src/infra/config/oauth.config.ts` — carry Google subject and email
  verification data into the application boundary.
- `src/app/auth/dtos/auth/auth.dto.ts` — represent the trusted OAuth profile
  fields explicitly.
- `src/app/auth/usecases/helpers/oauth-handler-google.helper.ts` — reject
  unverified identity data, fail closed on inconsistent auth state, avoid
  in-place mutation, make linking atomic, and await event publication.
- `src/app/auth/usecases/helpers/__specs__/oauth-handler-google.helper.spec.ts`
  — cover the security, consistency, and async failure branches.
- `src/infra/config/__tests__/oauth.config.test.ts` — verify profile mapping and
  configuration behavior without contacting Google.
- `src/interface/http/middlewares/__specs__/google-oauth.middleware.spec.ts` —
  cover environment-dependent cookie attributes and narrow middleware branches
  that are awkward to prove through a single process-level HTTP suite.
- `test/http/auth/login-with-google.get.spec.ts` — integration coverage for
  OAuth initiation.
- `test/http/auth/login-with-google-callback.get.spec.ts` — integration
  coverage for callback success and failure.
- `test/http/auth/refresh-access-token.post.spec.ts` — receive the unrelated
  refresh test currently in the OAuth file.
- `test/http/auth/oauth-handoff.post.spec.ts` — remove after its coverage is
  migrated.
- `generated/routes.ts` and `generated/swagger.json` — regenerate after
  controller contract changes.

### Conditional Changes

- `src/app/auth/contracts/*`, `src/infra/persistence/repos/user/*`,
  `src/infra/persistence/mappers/auth/*`,
  `src/infra/config/drizzle/schema.ts`, and `db/migrations/*` — add a
  provider-identity model, unique provider-subject constraint, repository
  operations, and migration if stable Google-subject binding is selected.
- `src/infra/config/rate-limiter.config.ts` — add dedicated initiation/callback
  limits only if abuse monitoring shows the global 700-per-15-minute IP limit
  is insufficient; provider callback failures must not create an
  account-enumeration signal.

### Out of Scope

- Frontend implementation of `/auth/oauth-confirmation`.
- Live calls to Google or browser end-to-end OAuth tests requiring real Google
  credentials.
- Changes to email/password authentication except where shared session or
  account-linking behavior must remain compatible.

## Proposed Approach

### 1. Make the provider identity boundary explicit

- Map `profile.id`, the selected email, and its `verified` flag into a typed
  OAuth profile.
- Reject missing or unverified email before any user lookup, creation, strategy
  update, or session issuance.
- If stable subject binding is approved, resolve existing provider identity
  first; only link by verified email under the chosen explicit policy, with a
  unique database constraint preventing one Google subject from linking twice.

### 2. Make account linking and user creation consistent

- Treat a missing auth record for an existing user as an explicit invariant
  failure unless recovery is intentionally selected.
- Replace in-place `strategy.push` and read/write persistence with an atomic or
  transactionally locked operation.
- Await user event publication and cover its rejection path so the callback
  cannot silently succeed while leaving an unhandled promise.

### 3. Harden the HTTP handoff

- Set `Cache-Control: no-store` before either OAuth response and retain the
  state cookie's HTTP-only, scoped, short-lived behavior.
- Keep state comparison ahead of Passport and clear state on success and all
  failures.
- Route real Passport errors to centralized error handling; map only a failed
  authentication result to 401.
- Keep the redirect target server-configured and assert that access tokens,
  refresh tokens, authorization codes, and state values are not reflected into
  the final client URL or public error body.
- Update TSOA response metadata and regenerate route/OpenAPI artifacts.

### 4. Replace the mixed HTTP spec with endpoint-owned suites

- Use a deterministic Passport test strategy as the external-boundary mock and
  `createApplication()` plus Supertest for the assembled Express routes.
- Keep app/database internals in focused specs; spy on the OAuth callback use
  case only where the test is about HTTP orchestration.
- Restore the global Passport strategy and all spies after every suite so test
  order cannot leak authentication behavior.

## Test Plan

- **HTTP integration — initiation
  (`test/http/auth/login-with-google.get.spec.ts`):**
  assert 302, Google authorization `Location`, requested `profile` and `email`
  scopes, a high-entropy state query matching the `oauth_state` cookie,
  `HttpOnly`, `SameSite=Lax`, `/api/v1/auth` path, ten-minute lifetime,
  `Cache-Control: no-store`, and no token leakage.
- **HTTP integration — callback
  (`test/http/auth/login-with-google-callback.get.spec.ts`):**
  cover missing cookie, missing query state, array/non-string state, mismatch,
  matching state, Passport no-user result, Passport error, and callback-use-case
  rejection. Assert status/body, no-store, state-cookie clearing on every
  outcome, exact user passed on success, configured clean redirect, refresh
  cookie security attributes when exercising real session issuance, and no
  credential/query leakage.
- **Component/unit — provider and helper:** cover verified profile mapping,
  rejection of missing/unverified email, existing linked user, atomic linking,
  missing auth record, new-user transaction, awaited event success/rejection,
  repository failure, and non-`Error` normalization.
- **Regression:** retain the existing successful session creation, old-session
  deletion, refresh cookie path/lifetime, and clean OAuth confirmation redirect.
  Move the current refresh endpoint check into
  `refresh-access-token.post.spec.ts`.

## Verification

```bash
yarn test test/http/auth/login-with-google.get.spec.ts --runInBand
yarn test test/http/auth/login-with-google-callback.get.spec.ts --runInBand
yarn test src/app/auth/usecases/helpers/__specs__/oauth-handler-google.helper.spec.ts src/app/auth/usecases/__specs__/oauth.usecase.spec.ts --runInBand
yarn test src/infra/config/__tests__/oauth.config.test.ts src/interface/http/middlewares/__specs__/google-oauth.middleware.spec.ts --runInBand
npm run build:routes
npm run build
yarn test test/http/auth src/app/auth --runInBand
yarn lint
```

Supertest needs permission to open a local ephemeral listener in restricted
execution environments. No real Google credentials or network access should be
required.

## Assumptions

- Google OAuth remains a server-side authorization-code flow and the frontend
  obtains its access token through the existing refresh-token handoff rather
  than through redirect query parameters.
- `WEB_APP_URL` is deployment-controlled, not request-controlled; validation at
  startup should still require an absolute allowed `http`/`https` origin.
- A Passport test strategy is the appropriate external-boundary mock for HTTP
  integration; live Google behavior belongs in a separate opt-in end-to-end
  environment.

## Open Decisions

- **Account-linking identity:** persist and require Google's stable subject
  (recommended), or continue linking solely by verified email. Subject binding
  requires a migration and backfill/link-on-next-login policy; email-only
  linking is smaller but cannot durably prove the same provider principal.
- **Missing `user_auth` recovery:** fail closed as an internal invariant error
  (recommended), or transactionally reconstruct a Google-only auth record.
  Automatic repair improves availability but can conceal data corruption.
- **Event failure semantics:** fail the callback when user-created event
  publication fails, or adopt an outbox so persistence and event delivery are
  atomic/retriable. Simply restoring fire-and-forget behavior is not acceptable.

## Risks

- Tightening verified-email checks may reject profiles previously accepted with
  incomplete provider data; log only non-sensitive reason codes and monitor the
  rollout.
- Adding provider identity storage requires a safe uniqueness constraint and a
  backfill/link-on-next-login strategy to avoid duplicate accounts.
- Cookie assertions vary by environment because `Secure` depends on
  `NODE_ENV`; isolate module configuration or inject environment settings so
  tests do not mutate global state unpredictably.
- Passport is process-global, so integration suites must restore strategies to
  avoid order-dependent failures.

## Completion Criteria

- Unverified or incomplete Google identities cannot find, link, create, or log
  into a local account.
- Existing-account linking is atomic and missing auth records are handled by the
  selected explicit policy.
- User event publication cannot reject as an unhandled promise.
- Initiation and callback responses are non-cacheable, state-protected, and do
  not expose tokens or authorization parameters.
- Passport operational failures are observable internally and sanitized at the
  HTTP boundary.
- Endpoint-specific integration specs and dependent unit specs cover all
  listed success and failure branches and pass with generated routes/build,
  broader auth tests, and lint.
- Unrelated files and behavior remain unchanged.
