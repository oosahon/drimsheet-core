# Fix `POST /auth/get-password-reset-link`

## Audit findings

- **High – account/strategy enumeration:** a missing user returns success while
  an OAuth-only/missing auth record returns `WrongStrategy` (`401`). Status,
  body, timing, and email side effects reveal account state.
- **High – limiter bypass:** the per-account limiter uses the raw email, so
  casing/whitespace variants create new buckets. Rotating accounts also evades
  the control because there is no independent per-IP limit.
- **Bug – insufficient validation:** the controller uses an inline
  `{ email: string }` type with no Zod schema, and the use case only normalizes
  the string. Malformed emails can reach persistence, contrary to the DTO rule.
- **Reliability bug:** email/event publication is not durable; a provider or
  event-bus failure can leave ambiguous behavior and no controlled retry.
- **Sensitive-link handling:** the reset token is placed in the web URL. That is
  expected for email delivery, but the receiving web page must prevent
  referrer/history/analytics leakage and immediately exchange it through a
  body-based API request.
- **Test gap:** existing tests cover only missing user, success, and wrong
  strategy. They omit invalid input, uniform public behavior, timing/delivery
  failure, limiter normalization, HTTP response shape, and `429`.

## Implementation plan

1. Add a named request DTO and exported Zod schema using the shared email
   validation/error key. Validate before context or repository work.
2. Always return the same generic accepted response (prefer `202`) for missing,
   email-auth, Google-only, locked, deleted, and unverified accounts. Never
   expose whether an email was sent.
3. For ineligible accounts, perform only safe bounded work and use queued
   delivery so response timing is materially similar. Do not generate a reset
   token or mutate credentials for an ineligible account.
4. Introduce dual per-IP and normalized/HMAC-account limits with action-scoped
   keys. Confirm trusted-proxy handling and exclude raw PII from abuse reports.
5. Write a password-reset notification/outbox job durably before returning.
   Give it a stable deduplication/cooldown key, bounded retries, and metrics.
   New requests should deliberately supersede old reset tokens.
6. URL-encode the token when constructing the web link. Configure the reset
   page with a strict referrer policy, no third-party analytics before token
   removal, and immediate URL cleanup/body exchange.
7. Update TSOA docs to include the named request type, generic `202`, `422`, and
   `429`.

## Tests

- DTO tests for valid normalized emails and missing, malformed, oversized, and
  non-string input.
- Use-case table tests for every account state asserting an identical public
  result and no token generation for ineligible accounts.
- Delivery tests for enqueue success, retry, deduplication/cooldown, provider
  failure, and deliberate replacement of an older token.
- Limiter tests for case/whitespace normalization, malformed fallback, per-IP
  rotation, distributed requests for one account, and PII-free keys.
- Add `test/http/auth/get-password-reset-link.post.spec.ts` with assembled HTTP
  tests for generic responses, `422`, `429`, response redaction, and the
  absence of reset tokens in API output/logs.
- Remove any loose casts and reach 100% coverage with shared mocks.

## Completion criteria

- The endpoint does not reveal existence, auth strategy, or email-delivery
  state.
- Only validated email values reach the repository.
- Abuse controls cannot be bypassed by trivial key variation.
- Reset delivery is retryable and deduplicated, with fully typed test coverage.
