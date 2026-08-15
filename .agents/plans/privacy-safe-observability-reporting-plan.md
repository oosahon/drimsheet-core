# Privacy-Safe Observability Reporting Plan

## Goal

Prevent logs and Sentry events from receiving raw personal, authentication, or
financial data while preserving the bounded operational facts needed to debug
HTTP, queue, integration, and application failures.

This plan is **implementation-ready**. It follows the existing observability
ownership and privacy rules, preserves current failure and retry semantics, and
does not require a new architectural pattern or ADR. Preserve unrelated staged
and working-tree changes during implementation.

## Context

`IReporter` currently accepts arbitrary `Record<string, unknown>` context, and
the concrete reporter forwards that context to both Winston and Sentry. Queue
failures can therefore report complete BullMQ jobs or financial payloads, while
rate-limit abuse reports include raw IP addresses, raw URLs, and user agents.
The shared sanitizer recursively protects secret-shaped keys and sensitive URL
parameters, but it does not treat emails, product identifiers, financial
fields, or raw request metadata as prohibited telemetry.

The logger, reporter, and Sentry initialization are owned by
`src/infra/observability` and `src/infra/runtime/_bootstrap`. The framework-
neutral reporter port remains under `src/shared/contracts`. Domain entities,
values, rules, repositories, transactions, queue acknowledgement behavior, and
application outcomes must remain unchanged.

## Confirmed Findings

1. **High — Queue failure reporting can serialize complete personal and financial payloads.** `registerBullMQWorker` passes `{ job }` to `queue.job.processing_failed`, and the ledger balance queue passes `{ job: payload }` to `queue.job.enqueue_failed`. BullMQ jobs can contain transactional-email recipients and content or ledger identifiers and monetary deltas. The reporter sends the sanitized-but-still-structurally-complete context to both the logger and Sentry.
2. **High — Sentry automatic PII collection is explicitly enabled.** `bootstrapObservability` sets `sendDefaultPii: true` and has no `beforeSend` privacy boundary, so automatically collected user and request context is not governed by the application's source-level reporter policy.
3. **High — Abuse reports contain raw request identity and location data.** `configureRateLimiter` reports `req.ip`, `req.originalUrl`, and `user-agent`. Raw URLs can contain identifiers or query values, IP addresses are personal data, and user agents are not required to diagnose the rate-limit threshold event.
4. **High — Error objects can bypass safe context selection.** `sanitizeData` preserves all custom `Error` properties, and `errorUtils.parseError` contributes `cause` and `_raw` to Sentry extras. Domain error causes can contain user, accounting-entity, journal, ledger-account, or counterparty identifiers.
5. **Medium — Application report contexts contain unnecessary identifiers.** Password-reset failure reports include `userId`; balance-propagation reports repeat `correlationId`, accounting-entity ID, and journal ID; the already-verified email event logs `userId`. Contextual correlation is already supplied by the logger and reporter through `IAppContext`.
6. **The existing privacy rule already defines the required policy.** `.agents/rules/observability.md` prohibits secrets, tokens, email addresses, and unnecessary personal or financial data, allows identifiers only for a concrete diagnostic need, and defines canonical serialized error fields as sanitized identity, message, stack, and `errorKey`.
7. **The initial metrics work deliberately deferred this slice.** `.agents/plans/first-class-observability-metrics-plan.md` lists structured-log and Sentry PII hardening as subsequent observability work, so this plan completes that boundary without changing the accepted metrics architecture.

## Implementation Basis

| Decision or structural change                                                      | Basis                                     | Evidence or rationale                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimize telemetry at each caller before sanitization                              | Durable rule and user requirement         | `.agents/rules/observability.md` makes privacy and diagnostic necessity caller responsibilities; the requested outcome is to prevent personal and financial data exposure.                                                                                  |
| Replace arbitrary reporter metadata with named, non-indexed context interfaces     | Concrete local precedent                  | `src/shared/contracts/http-metrics.contract.ts` and `queue-metrics.contract.ts` use private named payload interfaces to constrain technical telemetry facts. `src/shared/contracts/reporter.contract.ts` already owns the framework-neutral reporting port. |
| Keep reporter context fields technical and bounded                                 | Durable rule and concrete local precedent | The observability rule requires structured, controlled fields; HTTP and queue metrics facades already expose method, route/queue, transport, attempt, and outcome rather than payloads.                                                                     |
| Derive correlation from `IAppContext` rather than caller metadata                  | Concrete local precedent                  | `src/infra/observability/logger.ts`, `reporter.ts`, and `helpers/get-correlation-id.ts` already own contextual correlation and prevent callers from overriding it.                                                                                          |
| Extract canonical telemetry error normalization under infrastructure observability | Concrete local precedent and folder rule  | `src/infra/observability/logger.ts` already owns a private `normalizeError` function; `src/infra/observability/reporter.ts` duplicates related error preparation. `folder-responsibility.md` assigns concrete observability behavior to infrastructure.     |
| Extend the pure recursive sanitizer as defense in depth                            | Concrete local precedent                  | `src/shared/utils/sanitizer.ts` is a pure shared utility used only by logger/reporter boundaries and already owns recursive key and string redaction.                                                                                                       |
| Add a Sentry `beforeSend` scrubber and disable default PII                         | Concrete local precedent and durable rule | `src/infra/runtime/_bootstrap/observability.bootstrap.ts` owns Sentry configuration; infrastructure observability helpers own vendor-specific preparation. This enforces the same repository privacy policy on automatically collected Sentry context.      |
| Replace raw rate-limit request metadata with a controlled limiter scope            | Existing owner and durable rule           | `src/infra/config/rate-limiter.config.ts` already owns limiter configuration and action names. A configured scope preserves which protection triggered without exposing IP, raw URL, user agent, email, or token-derived keys.                              |
| Preserve queue, HTTP, retry, transaction, and best-effort semantics                | Requirement and service-ownership rule    | This is telemetry hardening only. Existing queue metrics, rethrows, swallowed best-effort failures, RabbitMQ acknowledgements, and use-case results must not change.                                                                                        |
| Document the hardened boundary without adding an ADR                               | Durable rule and prior plan               | The change implements the existing observability privacy contract and the deferred slice in the metrics plan; it does not introduce a new cross-system architecture.                                                                                        |

## Scope

### Expected Changes

- `src/shared/contracts/reporter.contract.ts` and its shared mock — replace arbitrary reporter and abuse metadata with private named safe-context interfaces that have no index signature.
- `src/shared/utils/sanitizer.ts` and `src/shared/utils/__tests__/sanitizer.test.ts` — redact email-shaped text and prohibited telemetry keys for raw request data, personal identifiers, message content, and financial values.
- `src/infra/observability/helpers/` — add canonical error preparation and Sentry event-scrubbing helpers with focused infrastructure specs.
- `src/infra/observability/logger.ts`, `reporter.ts`, and their specs — project caller context onto approved fields, serialize only canonical error identity/message/stack/`errorKey`, remove parsed raw/cause data from Sentry extras, and retain contextual correlation.
- `src/infra/runtime/_bootstrap/observability.bootstrap.ts` and its spec — set `sendDefaultPii` to false and install the Sentry `beforeSend` privacy boundary.
- `src/infra/config/bullmq.config.ts`, `rabbitmq.config.ts`, `rate-limiter.config.ts`, their specs, and rate-limiter composition callers — replace job/request-shaped metadata with queue/transport/attempt or method/limiter-scope/count facts.
- `src/infra/messaging/bus/event-bus.ts`, `src/infra/messaging/queues/`, runtime bootstrap/lifecycle reporters, and their specs — conform every reporter caller to the safe context contract without changing behavior.
- `src/app/auth/usecases/reset-password.usecase.ts`, `send-email-verification-email.usecase.ts`, ledger reporting services, and their specs — remove redundant user and financial-workflow identifiers while retaining operation and contextual correlation.
- `docs/08_cross_cutting_concepts.md` — document source allowlisting, canonical error serialization, disabled Sentry default PII, and defense-in-depth scrubbing.

### Conditional Changes

- Sentry project or organization security settings — enable server-side data scrubbing and add sensitive-field rules for application-specific identifiers and financial/message fields if the deployment owner confirms access. This is an external operational action, not a repository code change.
- Existing Sentry/log retention — audit historical events and, only with explicit operator authorization, delete affected telemetry and rotate any credential found in retained data.

### Out of Scope

- Distributed tracing, trace sampling, or log/trace correlation.
- Changes to metric names, instruments, attributes, exporters, or dashboards.
- Journal-to-ledger consistency, outbox persistence, reconciliation, retry, or queue failure semantics.
- Domain entity, value, rule, repository, transaction, or event-schema changes.
- Retaining, hashing, or otherwise pseudonymizing IP, user, accounting-entity, journal, ledger-account, job, or email identifiers for telemetry. A future diagnostic requirement for one of these identifiers requires a deliberate privacy/cardinality review.
- Automatically deleting remote Sentry or log data from repository tooling.

## Proposed Approach

## Implementation Status

| Slice                                                       | Owner and basis                                                                                           | Intended files and tests                                                                    | Status                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Narrow reporting contracts and minimize callers          | Shared port plus existing app/infra callers; observability privacy rule and named metrics-input precedent | Reporter contract/mock; queue, rate-limit, event, lifecycle, auth, and ledger callers/specs | Completed; focused queue/config/application suites pass                                                                                  |
| 2. Canonicalize errors and project runtime reporter context | Infrastructure observability; existing logger normalization and contextual-correlation precedent          | Observability helpers, logger/reporter, focused specs                                       | Completed; observability component suite passes                                                                                          |
| 3. Strengthen recursive sanitization                        | Pure shared utility; existing sanitizer ownership                                                         | Sanitizer and shared unit tests                                                             | Completed; sanitizer unit suite passes                                                                                                   |
| 4. Enforce the Sentry privacy boundary                      | Runtime bootstrap and infrastructure observability; existing Sentry bootstrap ownership                   | Sentry scrubber/helper specs and observability bootstrap/spec                               | Completed; scrubber and bootstrap specs pass                                                                                             |
| 5. Document the hardened boundary                           | Cross-cutting documentation; existing observability rule and deferred metrics-plan slice                  | `docs/08_cross_cutting_concepts.md`                                                         | Completed                                                                                                                                |
| 6. Verify and reconcile plan to diff                        | Repository workflows and plan completion criteria                                                         | Focused suites, lint, build, test names, full suite, final baseline review                  | Completed; focused suites, lint, build, type checking, and 316-suite full regression pass; test-name audit has one pre-existing mismatch |

### Implementation Reconciliation

- Implemented without deviation. The shared reporter port, infrastructure
  observability adapters/helpers, runtime Sentry bootstrap, queue/config/app
  callers, composition scopes, tests, and cross-cutting documentation match
  the six planned slices.
- Existing event-bus, lifecycle, RabbitMQ-bootstrap, reporter-mock, and ledger
  enrichment code already conformed once the shared contract and canonical
  error boundary were applied, so no content-only edits were added to those
  files.
- Both focused verification commands pass. `npm run lint`, `npm run build`,
  direct type checking, and the full test suite pass; the full result is 316
  suites and 2,550 tests. Focused coverage reports 100% line coverage for the
  touched logger, reporter, sanitizer, telemetry-error, and Sentry-scrubber
  behavior.
- `npm run test:names` remains blocked by the pre-existing out-of-scope file
  `src/infra/persistence/helpers/__tests__/get-db-query.test.ts`, which the
  audit expects at
  `src/infra/persistence/helpers/__specs__/get-db-query.spec.ts`.
- The production Sentry/log-sink canary smoke test and server-side Sentry
  configuration review remain deployment-operator actions. No remote data was
  inspected or mutated.
- Concurrent unrelated changes under the HTTP error handler and the separate
  map-context plan were left untouched. Build-generated route and Swagger
  side effects were restored to their clean baseline.

### 1. Define the safe reporting contract

- Replace `Record<string, unknown>` in `IReporter.report` with a private named context containing only the currently required bounded facts: `operation`, `queue`, `transport`, `attempt`, `source`, `signal`, `subscriber`, `eventType`, and `eventTypes`.
- Replace arbitrary abuse metadata with a private named context containing `method`, controlled `scope`, `used`, and `limit` only.
- Do not add an index signature. This makes direct `{ job }`, `{ payload }`, `{ userId }`, `{ ip }`, `{ url }`, and `{ userAgent }` object literals fail type checking.
- Keep `error` as `unknown`; the infrastructure adapter, not callers, owns safe error normalization.
- Keep the existing event names and synchronous, non-throwing reporter contract.

### 2. Minimize every reporting call site

- BullMQ processing failures report queue name, `bullmq`, and bounded attempt; they never report `Job`, job data, or job ID.
- BullMQ enqueue failures report queue name and `bullmq`; transactional-email recipients/content, ledger adjustment payloads, correlation fields, and job IDs remain absent.
- RabbitMQ processing failures report queue name and `rabbitmq`; remove duplicate free-text context.
- Password-reset cleanup/finalization failures retain the controlled `operation` and remove user IDs.
- Ledger balance propagation and enrichment failures rely on the event, canonical error key, stack, and contextual correlation; remove accounting, journal, ledger-account, and repeated correlation identifiers.
- Event bus and lifecycle reports retain controlled event types, subscriber/source, operation, and signal where they provide bounded diagnostic value.
- Remove `userId` from `auth.email_verification.skipped`.
- Add a required controlled scope to each configured rate limiter (`global`, signup IP/account, and each auth action). Abuse reports retain method, scope, used, and limit but remove raw URL, IP, user agent, limiter key, email, and token-derived values.
- Preserve all current return, throw, catch, retry, acknowledgement, and best-effort behavior exactly.

### 3. Canonicalize errors and enforce a runtime reporter allowlist

- Extract the logger's current error-normalization responsibility into an infrastructure observability helper used by both logger and reporter.
- For `Error` inputs, retain sanitized `name`, `message`, `stack`, and `errorKey` only. Drop `cause`, arbitrary custom properties, validation payloads, and raw duplicates from telemetry.
- For non-`Error` thrown values, emit a stable `UnknownError` representation that records the value type without serializing the original object/string payload.
- Preserve Sentry issue grouping by constructing a sanitized `Error` exception with the original sanitized name/stack and optional `errorKey`; logger output uses the corresponding plain serializable record.
- Project reporter context onto the approved runtime field list even though TypeScript already constrains object literals. This protects JavaScript, casts, stale compiled callers, and variables with structurally compatible extra properties.
- Do not copy `_raw`, error `cause`, validation details, request objects, or arbitrary parsed error fields into Sentry `extra`.

### 4. Strengthen recursive sanitization

- Retain the existing secret-key and URL-query protections.
- Redact email-address patterns in strings, including error messages and stack first lines.
- Add case-normalized prohibited telemetry keys for emails/recipients, personal and product identifiers, IP/user-agent/raw request data, email subject/HTML content, amounts/balances/deltas, and complete jobs/payloads.
- Preserve safe bounded values such as event name, error key, queue name, transport, attempt, method, limiter scope, signal, source, status/outcome, duration, count, currency code, service metadata, and contextual correlation.
- Keep the utility pure, recursive, circular-safe, and non-throwing.

### 5. Enforce the Sentry boundary

- Configure `sendDefaultPii: false`.
- Add a vendor-specific `beforeSend` helper that removes `event.user`; removes request body/data, cookies, headers, URL, query string, environment data, and IP; drops breadcrumb data and raw URLs; and sanitizes retained breadcrumb messages.
- Allow only canonical error and approved reporter extras plus `correlationId`; do not resend `_raw`, causes, validation bodies, or arbitrary extras.
- Retain safe Sentry runtime/release/environment/trace mechanics so error grouping and platform diagnostics continue to work.
- Keep the scrubber deterministic and non-throwing. If scrubbing itself encounters malformed data, return a minimal event with exception identity rather than returning the unsafe original event.

### 6. Document and operationalize the policy

- Update the cross-cutting observability documentation to state that callers provide bounded facts, the reporter and logger canonicalize errors, and Sentry default PII is disabled.
- Document Sentry server-side scrubbing as an independent backstop, not permission to send sensitive data from application code.
- Record an operator checklist for inspecting Sentry event JSON after deployment and verifying that HTTP, queue, auth, ledger, and abuse failures contain correlation and bounded diagnostics without personal or financial fields.
- Treat any historical deletion or credential rotation as a separate, explicitly authorized operational action.

## Test Plan

- **Shared unit:** Extend sanitizer tests for nested email addresses, recipient fields, identifiers, raw request metadata, financial fields, arbitrary jobs/payloads, safe bounded fields, circular values, and non-mutation.
- **Observability component:** Test canonical `Error` and non-`Error` normalization, reporter runtime field projection, absence of `_raw`/`cause`, correlation retention, fallback reporting, and identical non-throwing behavior when Sentry fails.
- **Sentry bootstrap/component:** Assert `sendDefaultPii: false`, exercise `beforeSend` against user/request/header/cookie/query/breadcrumb/extra payloads, and verify the returned event retains safe exception, release, environment, and correlation fields.
- **Queue/config component:** Update BullMQ, RabbitMQ, and enqueue specs to prove complete jobs, payloads, job IDs, emails, HTML, entity IDs, and amounts are absent while queue, transport, attempt, metrics, acknowledgements, retries, throws, and best-effort behavior remain unchanged.
- **Application/service regression:** Update password reset, verification, balance-enrichment, and balance-propagation specs to assert safe reporter/logger fields and unchanged workflow results.
- **Rate-limit regression:** Assert each limiter reports only method, controlled scope, used, and limit on the first exceeded request; key generation, threshold behavior, response error, and IP/account/token bucket behavior remain unchanged.
- **Static regression:** Type checking must reject arbitrary reporter context fields and every production reporter caller must compile against the narrowed contract.

## Verification

Run focused privacy and observability checks first:

```bash
npm test -- --runInBand src/shared/utils/__tests__/sanitizer.test.ts src/infra/observability src/infra/runtime/_bootstrap/__specs__/observability.bootstrap.spec.ts
npm test -- --runInBand src/infra/config/__specs__/bullmq.config.spec.ts src/infra/config/__specs__/rabbitmq.config.spec.ts src/infra/config/__specs__/rate-limiter.config.spec.ts src/infra/messaging/queues src/app/auth/usecases/__specs__/reset-password.usecase.spec.ts src/app/auth/usecases/__specs__/send-email-verification-email.usecase.spec.ts src/app/ledger/services
npm run lint
npm run build
npm run test:names
npm test -- --runInBand
```

Production verification requires a configured Sentry project and deployed log
sink. Trigger synthetic failures containing canary email, identifier, amount,
cookie, header, URL-query, job, and payload values; confirm none appears in raw
Sentry event JSON or structured logs, while event, error key, stack, queue,
attempt, method/scope, release/environment, and correlation remain queryable.
Do not use real customer or financial data for this smoke test.

## Assumptions

- Correlation IDs remain permitted in logs and Sentry extras because the logger owns them as the canonical cross-boundary diagnostic key; they remain prohibited from metrics and caller-supplied context.
- Queue names, transports, bounded attempts, domain event types, lifecycle operations/signals, HTTP methods, rate-limiter scopes, counts, and error keys are controlled operational facts rather than personal or financial data.
- Sentry server-side configuration and historical data retention are controlled outside this repository; repository implementation can complete without those credentials, but production rollout is not complete until an operator verifies the external controls.

## Risks

- **Reduced diagnostic detail:** Removing IDs and payloads may make isolated incidents harder to inspect. Mitigate with correlation IDs, canonical error keys/stacks, controlled operation/queue fields, and authoritative audit/history lookup under normal application access controls.
- **Sentry issue regrouping:** Reconstructing sanitized exceptions could change grouping if name/message/stack are not preserved. Test those fields explicitly and keep stack identity intact.
- **False-positive redaction:** Broad key or email matching can hide a benign diagnostic value. Keep safe-field tests, prefer exact normalized keys, and treat privacy as the safer default.
- **Contract ripple:** Narrowing `IReporter` affects application, infrastructure, interface, mocks, and specs. Update all production callers in one change and rely on build/lint to find omissions.
- **Automatic Sentry shape drift:** SDK upgrades may introduce new event fields. Keep `beforeSend` allowlist-oriented, test representative raw events, and review privacy tests during Sentry upgrades.
- **Historical exposure remains:** Code hardening does not remove existing remote telemetry. Require an operator audit and separate authorization for deletion or credential rotation.

## Completion Criteria

- `sendDefaultPii` is false and every Sentry event passes through the tested privacy scrubber.
- No production reporter call supplies a complete request, job, payload, user/email, IP/user-agent/raw URL, entity/journal/account/job ID, email content, amount, balance, or financial delta.
- Reporter context interfaces and runtime projection expose only the approved bounded fields.
- Logger and Sentry errors contain sanitized identity, message, stack, and `errorKey` without raw/cause/custom payload duplication.
- Contextual correlation remains present where `IAppContext` is active and cannot be overwritten by callers.
- Queue metrics, retry/rethrow behavior, RabbitMQ acknowledgements, best-effort ledger enqueue/propagation semantics, HTTP rate limiting, and use-case outcomes are unchanged.
- Focused tests, lint, build, test-name validation, and the full test suite pass with 100% coverage for touched behavior.
- Cross-cutting documentation and the external Sentry verification checklist are current.
- A production smoke test confirms canary sensitive values are absent from raw Sentry events and structured logs.
- Unrelated staged and working-tree files remain unchanged.
