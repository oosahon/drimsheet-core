# `getPasswordResetLink` QA and integration-test plan

## Objective

Harden `POST /api/v1/auth/get-password-reset-link` from the TSOA controller
through request validation, abuse controls, account lookup, reset-token
lifecycle, email queueing/rendering, event publication, reset completion, and
session invalidation. Add an HTTP integration suite under `test/http/auth` that
uses the assembled application and real local test adapters instead of replacing
`authUseCase.getPasswordResetLink` with a Jest spy.

The public contract must remain non-enumerating: a valid request must not reveal
whether an active account, email auth record, or deliverable reset email exists.
No response, rate-limit key, log, report, or test failure should expose the
submitted email or reset credential.

`ticket-description.md` was reviewed but describes an unrelated structural
refactor. This plan intentionally does not combine that work with the password
reset hardening.

## Dependency trace reviewed

1. `src/interface/http/controllers/auth.controller.ts:73-85`
   - inline request shape, TSOA metadata, endpoint limiter, response contract,
     and use-case call.
2. `generated/routes.ts:1757-1805` and
   `generated/swagger.json:2174-2222`
   - generated body validation, route assembly, and published OpenAPI responses.
3. `src/interface/http/application.ts:18-59`
   - parsers, global limiter, request context, request logging, generated routes,
     and error handling.
4. `src/infra/config/rate-limiter.config.ts:35-160`
   - reset limiter key, account/IP key helpers, memory-backed limiter behavior,
     429 response, and abuse reporting.
5. `src/app/auth/usecases/request-password-reset.usecase.ts:22-52`
   - normalization, active-user lookup, auth lookup, token creation, email
     dispatch, and reset-request event.
6. `src/domain/user/values/email.vo.ts:3-53` and
   `src/infra/persistence/repos/user/user.repo.impl.ts:33-45`
   - canonicalization/validation and exclusion of soft-deleted users.
7. `src/app/auth/services/token.service.ts:151-190` and
   `src/infra/persistence/cache/cache-storage.impl.ts:5-29`
   - two-hour reset JWT, raw Redis storage, token lookup, and one-time deletion.
8. `src/app/notification/services/transaction-email.service.ts:10-42`,
   `src/infra/messaging/queues/transactional-email.queue.ts:24-51`, and
   `src/app/notification/workers/transactional-email.worker.ts:12-17`
   - template rendering, BullMQ enqueue, retry configuration, reporting, and
     mail-agent execution.
9. `src/app/notification/templates/password-reset-request-email.mjml` and its
   generated `.ts` file
   - reset URL, user-controlled substitutions, and unauthorized-request link.
10. `src/infra/messaging/bus/event-bus.ts:15-29` and
    `src/domain/user/events/user.events.ts:50-55`
    - event payload and asynchronous handler execution.
11. `src/app/auth/usecases/reset-password.usecase.ts:32-95`,
    `src/app/auth/usecases/helpers/issue-user-session.helper.ts:26-97`, and
    `src/infra/persistence/repos/user/user-session.repo.impl.ts:7-56`
    - token consumption, password update, strategy update, session creation,
      cookie issuance, and existing-session behavior.
12. Existing coverage:
    - `src/app/auth/usecases/__specs__/request-password-reset.usecase.spec.ts`
    - `src/app/auth/services/__specs__/token.service.spec.ts`
    - `src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts`
    - `src/infra/config/__tests__/rate-limiter.config.test.ts`
    - existing HTTP auth specs in `test/http/auth`.

## Confirmed findings

### High-severity security

1. **The endpoint-specific limiter exposes email PII and is trivially
   bypassed.**

   `rate-limiter.config.ts:111-117` returns `req.body.email` directly as the
   store key. The key is neither normalized nor HMACed even though
   `makeAccountRateLimitKey` already provides both protections. Case and
   whitespace variants therefore receive separate buckets, malformed strings
   receive unlimited per-string buckets, and the in-memory store retains raw
   email addresses. The only independent IP protection is the global
   700-requests-per-15-minutes limiter.

   A local assembled-app probe confirmed that six normalized variants all
   returned `200`, and six distinct malformed strings also all returned `200`;
   neither sequence produced the intended sixth-request `429`.

   Use a secret-derived account key for valid canonical emails, fall back to a
   bounded IP key for invalid input, and apply a separate stricter per-IP
   limiter so rotating valid addresses cannot be used for account spraying or
   reset-email abuse.

2. **A queue failure can copy the reset credential and recipient into
   observability.**

   The rendered HTML contains the full reset URL and bearer token.
   `transactional-email.queue.ts:48-50` reports the complete queue payload as
   `{ job: payload }` when enqueueing fails. That payload includes recipient
   email, first name, and the raw reset link. Anyone with reporter access could
   use a still-valid credential to take over the account.

   Report only non-sensitive metadata such as template/type, correlation ID,
   and a safe internal operation ID. Add centralized reporter sanitization as
   defense in depth and a regression test proving reset tokens and recipient
   addresses never enter reporter arguments.

3. **Reset-token verification is replayable under concurrency and consumes the
   token before durable reset work succeeds.**

   `token.service.ts:171-190` performs Redis `get`, comparison, and `del` as
   separate operations. Two concurrent requests can both pass before either
   deletes the key. The deletion also happens before user/auth lookup, password
   hashing, database update, session creation, cookie write, and event
   publication. Any later failure burns a legitimate recovery credential.

   Introduce an atomic claim/finalize/release lifecycle, similar to the improved
   signup-token flow, or a durable hashed reset-token record. Exactly one
   request may own a token; retryable failure must release the claim, and final
   consumption must happen only after the password/session transaction commits.

4. **A successful password reset leaves other authenticated sessions valid.**

   `reset-password.usecase.ts:64-94` changes the password and issues a new
   session, but `issue-user-session.helper.ts:41-88` only removes the refresh
   session represented by the requesting browser cookie. Other persisted
   refresh sessions for the same user survive a credential-reset event.

   Revoke every prior refresh session for the user inside the password-reset
   transaction, then create only the new recovery session if automatic login
   remains the product contract. Add a repository operation that performs this
   directly rather than loading and looping in the use case.

### Medium-severity security and privacy

5. **Known and unknown accounts follow observably different work paths.**

   `request-password-reset.usecase.ts:28-47` returns immediately for an unknown
   address, while a known address performs another database query, Redis/JWT
   work, HTML rendering, and queue initiation. Known-account infrastructure
   failures can also return a `5xx` while unknown accounts return `200`. This
   creates timing and failure-shape account-enumeration signals despite the
   nominally empty success response.

   Move account-dependent work behind a durable asynchronous recovery-request
   command, or otherwise design and test one uniform public acceptance path.
   Do not add a simple blocking sleep to request threads. The external response
   must be identical for unknown, soft-deleted, missing-auth, email-only, and
   Google-only account states that are intentionally hidden.

6. **Email template substitutions are inserted without HTML or attribute
   escaping.**

   The generated template replaces `firstName` and `passwordResetLink` directly
   with `String.replace`. `firstName` originates from user-controlled signup or
   OAuth profile data. This permits markup injection into a security-sensitive
   transactional email and makes future template changes especially risky.

   Escape text-node substitutions, validate/encode URL substitutions, and add
   hostile-name template tests. Keep the reset URL restricted to the configured
   allowlisted web origin.

7. **The reset bearer credential is embedded in a frontend query string.**

   `request-password-reset.usecase.ts:41` builds
   `/auth/reset-password?token=...`. Query credentials can enter browser
   history, frontend/server logs, analytics, screenshots, and referrer headers.
   If the web contract cannot switch to a fragment or one-time code handoff,
   the frontend route must set `Referrer-Policy: no-referrer`, avoid analytics
   before credential removal, replace the URL immediately after reading it,
   and send it to the API only in a POST body.

### Correctness and reliability

8. **The endpoint accepts any string as an email.**

   The inline TSOA body only proves that `email` is a string. The use case calls
   `emailValue.normalize`, not `emailValue.make`, and has no Zod request schema.
   Empty, malformed, and oversized strings reach the persistence layer and,
   today, each creates its own limiter bucket. The declared `422` response
   therefore covers missing/wrong-type values but not semantic email validity.

   Add a named request DTO and app-layer validation that trims, lowercases,
   validates format, and enforces the shared 254-character limit before
   persistence work.

9. **The auth-record lookup is unused and a missing auth record still produces
   an unusable email.**

   `request-password-reset.usecase.ts:36-38` awaits `findByUserId` and discards
   its result. A `null` result does not stop token/email generation, while the
   completion use case later rejects the same account because no auth record
   exists. The extra query also widens the account-enumeration timing gap.

   Define the intended invariant: normally, missing auth data should take the
   same public no-op path as an unknown account and emit no credential. Remove
   the dependency entirely only if reset completion can safely create the
   missing auth record.

10. **Email dispatch reports success before durable enqueue, and configured
    retries do not protect delivery.**

    `transaction-email.service.ts:17` and `:31` do not await queue `add`.
    `transactional-email.queue.ts:48-50` catches and suppresses enqueue errors.
    `transactional-email.worker.ts:16` catches and suppresses mail-agent errors,
    so BullMQ sees the job as successful and never applies the configured three
    attempts/backoff. A reset request can therefore invalidate the prior token,
    return success, and permanently lose the new email.

    Await enqueue, let retryable worker failures reject so BullMQ retries, and
    distinguish terminal validation failures from retryable provider failures.
    Preserve the non-enumerating HTTP contract by performing this after uniform
    request acceptance rather than exposing recipient-specific failures.

11. **Concurrent reset requests can send links in an order that disagrees with
    the one active cache entry.**

    Token storage is keyed only by user ID and overwritten on every request.
    Concurrent queue delivery can arrive out of order, leaving the newest email
    in the inbox with an already-invalid credential. Use a durable request/token
    ID and explicitly define whether new requests invalidate earlier links.
    Whichever policy is chosen must be atomic and visible in the email copy.

12. **Reset-request event publication is not awaited.**

    `request-password-reset.usecase.ts:49-51` drops the promise returned by
    `eventBus.publish`. Future handler failures can become unhandled rejections,
    and a returned success does not establish publication. Await it if it is
    part of the operation, or write a durable outbox/queue record if delivery
    must survive process failure.

13. **Password update, new session creation, cookie write, and event delivery
    are not one coherent outcome.**

    `reset-password.usecase.ts:64-77` commits the password update first.
    `issue-user-session.helper.ts` then opens a separate transaction and writes
    the cookie before awaiting the event bus. Failures can return an error after
    the password changed, after a session was stored, or after a cookie was
    written. Reuse one database transaction for auth update, session revocation,
    new session, and an outbox event; set the cookie only after commit.

14. **The controller's documented contract omits `429`.**

    `auth.controller.ts:79-84` applies a limiter but documents only `400` and
    `422`. Add `@Response<IHttpErrorDto>('429')`, decide whether generic
    acceptance remains `200` or becomes `202`, and regenerate routes/OpenAPI.

15. **The unauthorized-request link in the email is misspelled.**

    The source and generated template use
    `/unauthorized-password-rest` rather than the expected
    `/unauthorized-password-reset`. Confirm the real frontend route, correct the
    MJML source, and regenerate the TypeScript template.

## Product/security decisions required

1. **Generic acceptance response:** recommended response is an empty `202
Accepted` (or retain empty `200` for compatibility) for every syntactically
   valid request. The choice must not vary with account state.
2. **Unverified accounts:** decide whether a reset link is denied, doubles as
   email verification, or permits password creation without marking
   `emailVerified`. Current reset completion issues an authenticated session
   while leaving the flag unchanged.
3. **Google-only accounts:** current behavior intentionally allows a verified
   Google-only user to create an email password. Confirm this remains desired;
   keep the external response indistinguishable either way.
4. **Token model:** recommended design is a cryptographically random opaque
   token with only its digest, user ID, status, and expiry stored server-side.
   If JWT + Redis remains, add atomic claim/finalize/release and store a digest
   or opaque JTI rather than the raw bearer value.
5. **Previous links:** recommended policy is that issuing a new reset request
   atomically invalidates older links only after the new email job is durably
   accepted.
6. **Post-reset authentication:** recommended behavior is to revoke all old
   sessions. Decide whether to create one new session automatically or require
   a fresh login.

## Test coverage gaps

1. No HTTP integration test exists for
   `POST /api/v1/auth/get-password-reset-link`.
2. Existing use-case tests do not cover malformed/oversized email, normalized
   input passed through the flow, missing auth record, soft-deleted user through
   the real repository, token failure, email enqueue failure, event failure,
   concurrent requests, or non-enumerating failure behavior.
3. Rate-limiter helper tests prove HMAC normalization, but no test asserts that
   this endpoint actually uses the helper. There is no reset-specific per-IP
   spray test.
4. Token-service tests cover one sequential success and two rejection paths.
   They do not cover concurrent consumption, claim release, downstream failure,
   expiry, malformed JWT, wrong/missing ID, raw-token absence from storage, or
   replacement ordering.
5. There are no focused tests for `transaction-email.service.ts`,
   `transactional-email.queue.ts`, or
   `transactional-email.worker.ts`. Consequently, missing `await`, secret-bearing
   reports, swallowed provider failures, and disabled BullMQ retries are
   uncovered.
6. The password-reset email template has no escaping, origin, token-leakage, or
   link-target tests.
7. Reset-password tests mock token/cache/repositories and do not prove atomic
   one-time use, all-session revocation, rollback/retry behavior, cookie
   issuance after commit, or end-to-end use of the link generated by the request
   endpoint.
8. Current HTTP auth specs spy on top-level auth use cases. They prove generated
   route behavior but not Postgres lookup, Redis token state, BullMQ delivery,
   internal mail rendering, or completion of the recovery lifecycle.

## Integration-test plan for `test/http/auth`

Create `test/http/auth/get-password-reset-link.post.spec.ts`.

### Integration boundary

Use `createApplication()` with the real composed request-password-reset use
case, Postgres user/user-auth repositories, Redis cache, reset-token service,
BullMQ queue and worker, test internal mailer, app context, rate limiters, and
HTTP error handler. Do not spy on `authUseCase.getPasswordResetLink`.

Add narrowly scoped reusable test fixtures for:

- creating active, soft-deleted, email-auth, Google-only, unverified, and
  missing-auth users through production entity/value factories and repository
  APIs;
- waiting with a short bounded poll for a BullMQ job/internal email rather than
  using arbitrary sleeps;
- reading the generated email and extracting the reset URL/token safely for
  assertions;
- inspecting only reset-token keys created by the test;
- clearing the internal mailer entry and reset limiter stores between cases;
- deleting only users, auth rows, sessions, jobs, and cache keys created by the
  suite;
- closing BullMQ workers/queues and Redis/Postgres resources so Jest exits
  cleanly.

If the current singleton limiter/queue/internal-mailer modules cannot be reset
or closed deterministically, introduce factories and lifecycle hooks through
dependency injection. Do not work around shared state with test ordering.

### HTTP and delivery cases

1. **Known active email**
   - submit an uppercase/whitespace variant of a seeded address;
   - expect the chosen generic `200`/`202` response and empty/generic body;
   - assert the response contains neither email nor reset token;
   - wait for exactly one internal reset email to the canonical address;
   - assert the URL uses the allowlisted web origin and the intended reset path.

2. **Unknown, soft-deleted, and missing-auth accounts**
   - expect exactly the same status, body, and public headers as the known-user
     request;
   - assert no reset credential or email is produced;
   - do not use brittle millisecond equality as the timing defense test; prove
     the uniform asynchronous acceptance architecture in lower-level tests.

3. **Google-only account**
   - if the decision remains enabled, assert delivery of one valid setup/reset
     link and no account-strategy detail in the response.

4. **Unverified account**
   - assert the chosen policy, including whether completion marks the address
     verified, refuses recovery, or deliberately permits a session.

5. **Generated-route and semantic validation**
   - cover missing body, missing email, non-string email, empty input, malformed
     email, and more than 254 characters;
   - expect `422`, a stable field path, no use-case side effects, no email, and
     no credential in Redis.

6. **Account limiter**
   - send case/whitespace variants of one valid email;
   - expect the first five accepted and the sixth `429`;
   - assert the sixth request creates no new token or email.

7. **IP fallback and spray limiter**
   - rotate malformed values and separately rotate valid email addresses from
     one IP;
   - assert both sequences hit their intended bounded IP policy;
   - assert no raw email appears in limiter keys or abuse reports.

8. **Unexpected-error sanitization**
   - inject a deterministic failing adapter at the relevant integration seam;
   - expect the chosen uniform acceptance behavior for recipient-dependent
     failures, or a sanitized `500` only for failures that occur before the
     uniform command is accepted;
   - assert response and reporter payloads contain neither email nor token.

### End-to-end recovery cases

Use the email emitted by the request test rather than manufacturing a mock
token.

1. Submit the emailed credential to `POST /api/v1/auth/reset-password`, assert
   the password changes, failed-login attempts reset, and the selected
   post-reset authentication contract is honored.
2. Assert the credential cannot be replayed sequentially.
3. Submit two completion requests concurrently and assert exactly one owns the
   credential and commits.
4. Force a retryable failure after token claim but before commit; assert no
   partial password/session change and that the token can be retried.
5. Seed multiple old refresh sessions; assert all are revoked on successful
   reset and, if automatic login remains, exactly one new session survives.
6. Assert expired, malformed, wrong-type, unknown-user, and deleted-user
   credentials share one sanitized public auth response.

## Focused unit/component tests to add

1. Extend `request-password-reset.usecase` specs for canonical validation,
   missing auth, unknown/deleted policy, awaited event behavior, and uniform
   command submission.
2. Extend rate-limiter tests for the reset action, HMAC/PII contract, invalid
   fallback, account normalization, and independent IP spray limiting.
3. Add transactional email service/queue/worker specs proving:
   - enqueue is awaited;
   - reporter metadata is redacted;
   - retryable queue/provider errors reject;
   - BullMQ retry/backoff remains effective;
   - terminal validation errors do not retry forever.
4. Add token-service concurrency and failure-state tests for atomic claim,
   finalize, release, expiry, replacement, and digest-only storage.
5. Extend reset-password specs for one transaction, rollback, all-session
   revocation, cookie-after-commit, and the unverified-account decision.
6. Add template tests for HTML escaping, URL-origin/path validation, absence of
   accidental token copies, and the corrected unauthorized-request URL.

## Implementation sequence

1. Agree the six product/security decisions above before changing the public
   contract or token/session semantics.
2. Add a named request-reset DTO and app-layer validation; use the validated
   canonical email consistently in the limiter and recovery workflow.
3. Replace the reset limiter with independent HMACed account and IP controls,
   make limiter instances injectable/resettable, and document `429`.
4. Refactor request acceptance so account-dependent work happens behind one
   uniform durable path; remove or correctly enforce the unused auth lookup.
5. Implement atomic reset-token claim/finalize/release or the durable
   digest-record design. Ensure durable email acceptance and token activation
   cannot leave a newly issued but undeliverable credential.
6. Fix notification reliability and privacy: await enqueue, preserve BullMQ
   retries, redact reports, escape template values, correct the link typo, and
   rebuild the generated email template with `npm run mjml:build`.
7. Make reset completion transactional, revoke all old sessions, finalize the
   token after commit, set the refresh cookie after commit, and publish through
   an outbox or another explicitly reliable boundary.
8. Add the real HTTP integration suite and focused component tests above.
9. Regenerate the TSOA route/OpenAPI artifacts with `npm run build:routes`.
10. Run focused validation:
    - `yarn test test/http/auth/get-password-reset-link.post.spec.ts --runInBand`
    - `yarn test src/app/auth/usecases/__specs__/request-password-reset.usecase.spec.ts --runInBand`
    - `yarn test src/app/auth/services/__specs__/token.service.spec.ts --runInBand`
    - `yarn test src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts --runInBand`
    - `yarn test src/infra/config/__tests__/rate-limiter.config.test.ts --runInBand`
    - focused notification service/queue/worker/template specs.
11. Run broader validation after focused tests pass:
    - `yarn test test/http/auth src/app/auth --runInBand`
    - `yarn lint`
    - `npm run build`

## Baseline validation performed during QA

- The existing request-password-reset use-case, token-service, and
  rate-limiter suites pass: **3 suites, 30 tests**.
- An assembled-app probe confirms TSOA returns `422` for numeric, object, array,
  and null email values before the use case.
- An assembled-app probe confirms the current reset limiter does **not** combine
  case/whitespace variants and does **not** fall back to the IP bucket for
  malformed strings; all twelve probe requests returned `200`.
