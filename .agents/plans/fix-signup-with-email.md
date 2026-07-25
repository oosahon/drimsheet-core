# Fix `POST /auth/signup-with-email`

## Audit findings

- **High – account enumeration:** `signup-with-email.usecase.ts` returns
  `Conflict` only when an email already exists. The status and timing disclose
  registration state.
- **High – rate-limit bypass:** the controller keys the limiter with the raw
  request email. Case/whitespace variants create separate buckets, and rotating
  emails bypasses the account-only limit.
- **Bug – inconsistent password policy:** the DTO allows passwords without an
  uppercase or lowercase character and caps length at 100, while
  `password.vo.ts` requires both cases and allows 128. The focused auth run
  currently fails three DTO tests because of this mismatch.
- **Bug – passwords are silently changed:** `passwordValue.make` trims the
  password before hashing, but login compares the submitted string unchanged.
  A user who signs up with surrounding whitespace cannot later use the same
  byte sequence to log in.
- **Bug – false delivery semantics:** the use case does not await
  `eventBus.publish`, although its test and apparent contract expect it to.
  `should wait for event publication to complete` currently fails.
- **Race:** the pre-insert `findByEmail` does not handle a concurrent insert;
  the database uniqueness error can leak as a generic server failure.
- **Test gap:** there is no assembled HTTP/controller test for status, body,
  validation, middleware order, normalization, `429`, or sanitized errors.
  Existing signup tests also use `any`, contrary to repository rules.

## Implementation plan

1. Define one reusable password schema/policy for signup and reset password.
   Preserve the password exactly as submitted (or explicitly reject surrounding
   whitespace); never trim it. Align the DTO and value object on length and
   complexity, with domain error keys.
2. Replace the raw email limiter key with a typed helper that validates,
   trims, lowercases, action-namespaces, and HMACs the email. Apply independent
   per-IP and per-account limits so changing either dimension does not bypass
   abuse controls. Verify trusted-proxy configuration before relying on
   `req.ip`.
3. Return the same public status/body for new and existing emails. For an
   existing account, do not mutate credentials; enqueue a suitable
   verification/security email subject to cooldown. If product explicitly
   keeps `409`, document account enumeration as an accepted risk.
4. Keep the unique email constraint as the source of truth. Translate only the
   named email uniqueness violation into the same duplicate-signup flow;
   propagate unrelated persistence failures.
5. Make verification-email delivery recoverable. Prefer a transactional outbox
   written with the user and auth record, then deliver asynchronously with
   retry/idempotency. At minimum, await and propagate publication failure until
   an outbox exists.
6. Return an explicit non-sensitive result such as
   `{ status: "verification_pending" }`, and document the chosen `201`/`202`,
   `422`, and `429` responses in TSOA.

Expected files include:

- `src/interface/http/controllers/auth.controller.ts`
- `src/infra/config/rate-limiter.config.ts`
- `src/app/auth/dtos/auth/auth.dto.validation.ts`
- `src/domain/user/values/password.vo.ts`
- `src/app/auth/usecases/signup-with-email.usecase.ts`
- the event/outbox implementation and migration, if selected

## Tests

- Configure Jest and the test TypeScript project to include `test/**/*`, and
  provide a reusable assembled Express application factory/harness that does
  not bind a network port.
- Unit-test every password boundary/class and whitespace behavior against both
  DTO and value-object validation.
- Replace `as any` and loose `expect.any` usage in signup tests with typed
  payloads, shared mocks, and exact assertions.
- Cover new signup, existing verified/unverified accounts, concurrent unique
  violation, unrelated database failure, publish/outbox failure, and
  idempotent retry.
- Unit-test limiter keys for case, whitespace, malformed/non-string values,
  IPv4/IPv6, action separation, and PII-free keys.
- Add `test/http/auth/signup-with-email.post.spec.ts` with assembled HTTP tests
  proving the documented response, `422`, generic duplicate response,
  normalized shared buckets, per-IP protection, `429`, and absence of
  passwords/tokens/internal IDs.
- Add persistence integration tests for atomic user/auth/outbox writes and
  concurrent normalized-email uniqueness.

## Completion criteria

- Duplicate signup does not reveal registration state unless explicitly
  accepted.
- Password validation is consistent and the submitted secret is not mutated.
- Rate limits cannot be bypassed with email variants or email rotation.
- Concurrent signup and delivery failures have deterministic, recoverable
  behavior.
- Changed units have 100% coverage with no `any`; focused tests, full tests,
  lint, route generation, and TypeScript build pass.
