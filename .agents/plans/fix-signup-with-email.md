# Fix `signupWithEmail`

## Objective

Make email signup resistant to rate-limit bypass and account enumeration, keep
password handling consistent and lossless, guarantee recoverable delivery of
the verification email, and add sufficient unit and persistence integration
coverage for the changed behavior.

## Scope

The work covers the building blocks used by
`AuthController.signupWithEmail`:

- HTTP route and authentication rate limiter
- Signup DTO validation
- Email and password value objects
- Signup use case
- User and user-auth persistence
- Domain-event publication and the user-created handler
- Verification-token and verification-email dispatch
- Unit and persistence integration tests

The login and reset-password paths are in scope only where they reuse password
validation or must remain compatible with passwords created during signup.

End-to-end tests and tests that exercise the assembled HTTP application are
explicitly out of scope for this plan. They will be designed and implemented
separately.

## Decisions to make before implementation

1. **Password whitespace policy**
   - Recommended: preserve passwords byte-for-byte and allow whitespace.
   - Alternative: reject leading/trailing whitespace explicitly.
   - Never silently trim a password.
2. **Account-enumeration response**
   - Recommended: return the same accepted response for a new address and an
     already-registered address, and send an appropriate email in either case.
   - If product requirements intentionally retain `409`, record account
     enumeration as an accepted risk.
3. **Verification delivery**
   - Recommended: implement a transactional outbox and deliver through the
     existing messaging worker with retry and idempotency.
   - A direct awaited email call is only an interim solution; it cannot make a
     database commit and external email delivery atomic.
4. **Idempotency semantics**
   - Decide whether the existing request idempotency key guarantees replay of
     the original successful response. If it does, persist and enforce that
     behavior rather than merely copying the key onto a domain event.

## Implementation plan

### 1. Establish a single password policy

- Define the password constraints once and reuse them from signup and password
  reset validation and from `passwordValue`.
- Remove `trim()` from password creation, or replace it with an explicit
  whitespace validation error according to the selected policy.
- Align minimum length, maximum length, character requirements, and error keys.
- Prefer a length-based policy that permits password-manager output and
  passphrases over brittle composition rules. If the current composition rules
  remain a product requirement, ensure every layer implements the exact same
  rules.
- Ensure login compares the exact string that was hashed at signup.
- Ensure validation failures consistently produce `422` and the documented
  field-level error response.

Expected files:

- `src/app/auth/dtos/auth/auth.dto.validation.ts`
- `src/domain/user/values/password.vo.ts`
- `src/app/auth/usecases/signup-with-email.usecase.ts`
- `src/app/auth/usecases/reset-password.usecase.ts` if policy reuse requires it

No password data migration is expected because existing hashes remain valid.

### 2. Harden signup rate limiting

- Do not use an arbitrary, unvalidated `req.body.email` value directly as a
  limiter key.
- Add a small key helper that:
  - accepts only strings;
  - trims and lowercases valid email candidates;
  - safely falls back to the normalized client IP for malformed or absent
    input.
- Apply two independent controls:
  - a per-IP signup limit to constrain address/key rotation;
  - a per-normalized-email limit to constrain distributed requests against one
    account.
- Keep limiter keys scoped by action so signup, login, and verification do not
  consume one another's quotas unless that is deliberate.
- Confirm Express proxy configuration makes `req.ip` trustworthy in every
  deployed environment; do not trust an arbitrary `X-Forwarded-For` value.
- Avoid logging raw email addresses in abuse reports; log a one-way keyed digest
  if correlation by account is needed.

Expected files:

- `src/interface/http/controllers/auth.controller.ts`
- `src/infra/config/rate-limiter.config.ts`
- a shared rate-limit key helper and its tests, if introduced
- runtime Express proxy configuration, if currently incorrect

### 3. Remove account enumeration

- Change duplicate-email handling so the public response has the same status,
  body shape, and materially similar timing as a new signup.
- For an existing unverified account, enqueue another verification message
  subject to cooldown and abuse controls.
- For an existing verified account, send a security notification or generic
  “account already exists” email rather than revealing the state through the
  API.
- Do not perform password hashing or replace credentials for an existing
  account.
- Update the OpenAPI response declarations to match the selected behavior.

Expected files:

- `src/app/auth/usecases/signup-with-email.usecase.ts`
- `src/interface/http/controllers/auth.controller.ts`
- verification-email orchestration and templates as needed

### 4. Make creation concurrency-safe and map constraint failures

- Retain the unique database constraint on normalized `users.email`.
- Treat the preliminary `findByEmail` only as a product-flow optimization, not
  as the uniqueness guarantee.
- Catch the specific `users_email_key` violation raised by a concurrent insert
  and route it through the same non-enumerating duplicate-signup behavior.
- Do not convert unrelated database errors into duplicate-email outcomes.
- Verify that `userRepo.create`, history creation, and `userAuthRepo.create`
  all use the same transaction and roll back together.
- If idempotency is supported, enforce it transactionally and ensure concurrent
  requests with the same key produce one logical result.

Expected files:

- `src/app/auth/usecases/signup-with-email.usecase.ts`
- repository/database error translation helpers
- persistence integration tests

No schema migration is required for email uniqueness; `users_email_key`
already exists. An idempotency implementation may require a new table or unique
index.

### 5. Guarantee recoverable verification delivery

- Add an outbox record to the same database transaction that creates the user
  and user-auth row.
- Publish pending outbox records through a durable worker/queue after commit.
- Give each verification request a stable deduplication key, such as user ID
  plus verification generation, so retries cannot create uncontrolled email
  bursts or invalidate a newer token unexpectedly.
- Record attempts and apply bounded exponential retry with operational
  visibility for terminal failures.
- Mark an outbox record delivered only after the messaging provider accepts the
  request.
- Ensure handler and publisher errors propagate to retry infrastructure instead
  of being swallowed after reporting.
- Add a rate-limited resend-verification endpoint so a user can recover if an
  email is lost or expires.
- Keep signup successful once the user and outbox record commit; email-provider
  latency or a transient outage should not hold the HTTP request open.

Expected files:

- `src/app/auth/usecases/signup-with-email.usecase.ts`
- `src/infra/messaging/bus/event-bus.ts` or a durable replacement
- `src/app/user/handlers/user-created-event.handler.ts`
- outbox schema, migration, repository, worker, and IoC registration
- resend-verification controller/use case

This step requires a database migration if an outbox facility does not already
exist. Create the migration with the repository's migration workflow and add
indexes for pending records and the deduplication key.

### 6. Make the successful API contract explicit

- Return a small, non-sensitive response such as
  `{ status: "verification_pending" }`.
- Explicitly set and test the intended HTTP status.
- Ensure the response never contains the password hash, verification token,
  internal user ID, or whether the address was already registered.
- Document `201`/`202`, `422`, and `429` accurately; remove `409` if enumeration
  is eliminated.

## Test plan

Follow the repository testing rules: use shared dependency mocks, domain
factories, no `any`, run TypeScript validation, and reach 100% coverage for
changed units.

This test plan intentionally excludes E2E tests, Supertest tests against the
assembled Express application, and other tests that exercise the generated
route plus its middleware stack.

### Password unit tests

- Minimum and maximum accepted lengths
- Values immediately outside each boundary
- Missing required character classes if composition rules remain
- Leading, trailing, and internal whitespace under the selected policy
- Unicode and long passphrase behavior
- The exact accepted password is passed to hashing without mutation
- Signup and reset-password schemas accept and reject the same password set

### Rate-limiter unit tests

- The key helper normalizes mixed-case and padded email strings consistently
- Malformed, missing, object, array, and numeric email values select the safe
  fallback path
- IPv4 and IPv6 key normalization
- Action namespaces do not collide
- Limiter configuration uses the intended windows, limits, and key helpers

Do not attempt to prove middleware ordering, bucket sharing across real HTTP
requests, proxy trust behavior, or the final `429` response in this plan; those
require the separate E2E suite.

### Signup use-case tests

- Successful creation validates and normalizes input
- Password hash is passed to `userAuthRepo.create`
- Email strategy, timestamps, and failed-attempt count are correct
- User, history, user-auth, and outbox writes receive the same transaction
- Failure of every transactional write rolls back and publishes nothing
- Event/outbox metadata contains correlation and idempotency identifiers
- Already-registered verified and unverified accounts return the same public
  outcome as a new address without modifying credentials
- Non-permitted email behavior in non-production environments
- Concurrent duplicate insert/unique-constraint violation follows the duplicate
  path
- Unrelated persistence errors propagate as server errors
- Idempotent replay and concurrent same-key behavior, if enabled

Avoid invoking the use case twice merely to assert two properties of one error;
capture a single rejection or assert the error object once.

### Messaging and handler tests

- A committed outbox record is eventually delivered
- Provider failure retries without losing the record
- Worker restart resumes pending delivery
- Duplicate processing sends at most one logical verification request
- Terminal failure is reported and remains recoverable
- A newer verification generation supersedes an older one safely
- Resend cooldown and rate limits are enforced

### Persistence integration tests

- User and user-auth rows commit together
- Failure of the second insert rolls back the user and history
- Normalized email uniqueness is enforced under concurrent transactions
- Outbox and user creation are atomic
- Outbox deduplication constraint works as designed

### Deferred E2E coverage

The separate E2E plan should cover, but this implementation plan must not add:

- New and existing emails have indistinguishable HTTP status, response shape,
  and externally observable behavior
- Valid signup returns the documented success status and body
- Invalid fields and password-policy violations return `422`
- Mixed-case and padded versions of one email consume the same live limiter
  bucket
- Malformed and non-string email inputs cannot create fresh limiter buckets
- Rotating email addresses from one IP still reaches the live per-IP limit
- One normalized email requested from multiple IPs still reaches the live
  per-account limit
- Rate-limit exhaustion returns `429`
- Deployed proxy settings prevent forwarded-header IP spoofing
- Internal persistence failures return a sanitized `500`
- Responses never expose passwords, hashes, tokens, user existence, or internal
  IDs

## Verification commands

Run the narrow tests while iterating, then the full project checks:

```bash
npm test -- --runInBand src/app/auth
npm test -- --runInBand --coverage
npm run lint
npm run build
```

The repository rules mention `yarn tsc`, but this project defines npm scripts;
`npm run build` runs route/spec generation and TypeScript compilation.

## Rollout and observability

- Deploy the outbox migration before code that writes outbox records.
- Roll out worker consumption before or with signup production traffic.
- Add metrics for signup outcomes, rate-limit rejections, outbox age, retry
  count, terminal delivery failures, and verification completion latency.
- Alert on growing pending-outbox depth and sustained provider failures.
- Do not label metrics with raw email addresses or other high-cardinality PII.
- If response behavior changes from `409` to a generic accepted result,
  coordinate the client update and API documentation in the same release.

## Completion criteria

- Passwords are never silently modified and all password validators agree.
- Raw or malformed email input cannot create fresh rate-limit buckets.
- Signup responses do not reveal whether an account exists, unless explicitly
  accepted and documented as a product/security tradeoff.
- Concurrent signups cannot create inconsistent user/auth state or leak a raw
  database constraint error.
- Every committed unverified user has a durable, retryable verification-delivery
  record and a rate-limited recovery path.
- Changed units have 100% statement, branch, function, and line coverage.
- Persistence integration tests cover rollback, concurrency, atomicity, and
  delivery recovery.
- No E2E or assembled-HTTP-application tests are introduced by this work.
- Full tests, lint, generated routes/spec, and TypeScript build pass.
