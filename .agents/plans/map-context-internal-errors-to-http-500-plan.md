# Map Context Internal Errors to HTTP 500 Plan

## Goal

Ensure context-owned errors whose keys end in `_internal_server_error` are
classified before broad error-family fallbacks, reported as server failures,
and returned to HTTP clients as a sanitized `500 InternalServerError`.

This plan is **implementation-ready**. The user explicitly selected suffix
precedence over the general `AuthError` to `401` mapping. Preserve unrelated
staged and working-tree changes during implementation.

## Context

`login-with-google.usecase.ts` correctly fails closed with
`authError.InconsistentUserAuth` when a persisted user has no corresponding
authentication record. That error's key is
`auth_error_inconsistent_user_auth_internal_server_error`, but
`getStatusCodeFromError` in the HTTP error handler checks the broad
`AuthError` name first and returns `401`. The handler then exposes the parsed
context error instead of entering its existing reported-and-sanitized server
failure path.

The repository's error-creation rule defines `_internal_server_error` as the
status keyword for `500`, keeps domain/app faults context-owned, and assigns
HTTP status and response shaping to the interface layer. Existing runtime and
unknown-error branches in the same handler establish the local precedent for
reporting the original failure and returning a generic
`appError.InternalServerError` DTO.

## Confirmed Findings

1. **High — The broad auth fallback masks an explicit server-error key.**
   `getStatusCodeFromError` in
   `src/interface/http/handlers/error.handler.ts` returns `401` for
   `AuthError` before inspecting its `errorKey`. Its exact lookup table also
   cannot recognize context-prefixed keys solely by their suffix.
2. **The use case already throws the correct context-owned fault.**
   `src/app/auth/usecases/login-with-google.usecase.ts` throws
   `authError.InconsistentUserAuth`, and
   `src/app/auth/errors/auth.error.ts` gives that fault the required
   `_internal_server_error` suffix. Replacing it with a generic app error would
   discard useful diagnostic identity and conflict with the context-ownership
   rule.
3. **The current known-error path neither reports nor sanitizes this fault.**
   Once parsed, the inconsistent-auth error is logged locally as a rejected
   request and serialized with `httpErrorParser.fromParsedError`, including
   its context key and any cause. Runtime and unknown faults instead report
   `http.request.failed` and return a cause-free generic server error.
4. **The regression is not covered at the HTTP error boundary.**
   `login-with-google.usecase.spec.ts` verifies that the context error reaches
   Passport's callback, while `error.handler.spec.ts` verifies only the broad
   `AuthError` to `401` fallback and generic unknown/runtime `500` handling.
   No test proves that an auth error bearing the server-error suffix overrides
   the auth fallback.

## Implementation Basis

| Decision or structural change                                                                                  | Basis                                          | Evidence or rationale                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `authError.InconsistentUserAuth` at the use-case failure point                                            | Durable rule and concrete local implementation | `.agents/rules/error-creation.md` requires context-owned domain/app faults; `login-with-google.usecase.ts` and `auth.error.ts` already provide the precise auth-context error.                           |
| Recognize keys ending in `_internal_server_error` before the `AuthError` fallback                              | User requirement and durable rule              | The user explicitly selected precedence; `.agents/rules/error-creation.md` defines the suffix as the `500` status keyword.                                                                               |
| Keep suffix classification and HTTP response shaping in the HTTP handler                                       | Durable folder-ownership rule                  | `.agents/rules/folder-responsibility.md` assigns status mapping and response shaping to `src/interface`; `makeHttpErrorHandler` already owns both.                                                       |
| Report the original error and return a generic `appError.InternalServerError` DTO for classified server faults | Concrete local precedent                       | The runtime- and unknown-error branches in `makeHttpErrorHandler` use `http.request.failed`, retain the original error for reporting, and sanitize the client response through `httpErrorParser.toHttp`. |
| Preserve `401` for auth errors without the server-error suffix                                                 | Existing behavior and regression requirement   | `error.handler.spec.ts` explicitly covers the general `AuthError` fallback; the selected change is an override for server faults, not a reclassification of normal authentication failures.              |
| Cover the behavior in the handler's nearby component spec                                                      | Contribution and testing rules                 | `CONTRIBUTING.md` and `.agents/rules/testing/general.md` require dependency-bearing interface specs near their subject and full coverage of touched behavior.                                            |

## Scope

### Expected Changes

- `src/interface/http/handlers/error.handler.ts` — add suffix-aware server
  error classification ahead of the auth fallback; report and sanitize
  classified `500` faults through the existing server-failure behavior; use
  the parsed-error type rather than adding untyped classifier inputs.
- `src/interface/http/handlers/__specs__/error.handler.spec.ts` — prove that
  `authError.InconsistentUserAuth` produces a reported, generic `500` response
  while ordinary auth errors remain `401` and unreported.
- `src/app/auth/usecases/login-with-google.usecase.ts` — remove only the now
  resolved TODO comment while retaining the context-owned throw and all
  transaction behavior.

### Out of Scope

- Renaming, replacing, or changing the shape of
  `authError.InconsistentUserAuth`.
- Changing authentication decisions, Google OAuth transaction behavior,
  Passport callback contracts, or persistence repair behavior.
- Generalizing the other documented status suffixes such as `_not_found` or
  `_conflict`; this slice addresses only the agreed internal-server-error
  precedence.
- Changing HTTP error DTOs, reporter contracts, reporter implementation, or
  observability event names.
- Modifying unrelated in-progress observability or authentication work already
  present in the working tree.

## Proposed Approach

## Implementation Status

| Slice                                                       | Owner and basis                                                                                                    | Intended files and tests                                                              | Status                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1. Classify and sanitize context-owned server faults        | Interface HTTP handler; user-selected suffix precedence, error-creation rule, and existing server-failure branches | `src/interface/http/handlers/error.handler.ts`                                        | Completed                                                                                |
| 2. Cover server-fault precedence and retained auth fallback | Interface handler component spec; testing-proximity rule and existing handler spec                                 | `src/interface/http/handlers/__specs__/error.handler.spec.ts`                         | Completed — 13 focused tests passed                                                      |
| 3. Remove the resolved Google-login TODO                    | Auth use case; approved decision to retain the context-owned error                                                 | `src/app/auth/usecases/login-with-google.usecase.ts` and its existing spec            | Completed — 18 auth/use-case tests passed                                                |
| 4. Verify and reconcile plan to diff                        | Repository workflows and plan completion criteria                                                                  | Focused handler/auth tests, lint, build, broader suite, and final baseline comparison | Completed — implementation checks passed; two unrelated repository audits remain failing |

### Classify and handle context-owned server faults at the HTTP boundary

1. Add a typed, exact suffix check for `_internal_server_error` in the HTTP
   status-classification path and evaluate it before the broad `AuthError`
   name fallback. Keep the existing exact app-error mappings and default
   client-error behavior intact.
2. After parsing a known error, route a resulting `500` through the existing
   operational-failure semantics: call
   `reporter.report('http.request.failed', error)` with the original error,
   construct `appError.InternalServerError`, and serialize that generic error
   with `httpErrorParser.toHttp`. Do not expose the context-specific key or
   cause to the client and do not log it as a locally rejected client request.
3. Leave non-server `AuthError` instances on the current `401` path and leave
   validation, runtime, unknown-error, request-sanitization, and default domain
   error behavior unchanged.
4. Remove the resolved TODO in the Google-login use case without changing its
   `authError.InconsistentUserAuth` throw.

## Test Plan

- **Interface component:** In
  `src/interface/http/handlers/__specs__/error.handler.spec.ts`, pass an actual
  `authError.InconsistentUserAuth` with diagnostic cause data to the handler
  and assert that the original error is reported under
  `http.request.failed`, the status is `500`, and the response contains only
  the generic `InternalServerError` identity with no auth key or cause.
- **Regression:** Retain the existing ordinary `AuthError` assertion at `401`
  with no reporter call. Keep the existing runtime and unknown-error tests
  passing to prove their generic `500` behavior is unchanged. Cover a generic
  `appError.InternalServerError` if necessary to exercise the shared known-500
  path completely.
- **Application regression:** Run the existing Google-login use-case spec to
  confirm the missing-auth-record branch still supplies
  `authError.InconsistentUserAuth` to Passport's callback and performs no auth
  update.

No new browser or HTTP integration spec is warranted: the handler component
spec directly covers the faulty classification and serialization boundary,
the use-case spec covers error propagation, and the existing Google callback
HTTP spec already proves Passport errors reach generic `500` handling.

## Verification

Run focused behavior checks first, followed by the auth boundary and global
static checks:

```bash
npm test -- --runInBand src/interface/http/handlers/__specs__/error.handler.spec.ts
npm test -- --runInBand src/app/auth/usecases/__specs__/login-with-google.usecase.spec.ts test/http/auth/login-with-google-callback.get.spec.ts
npm run lint
npm run build
```

Because the error handler is a shared HTTP boundary, run the full suite after
the focused checks when the unrelated in-progress working-tree changes are in
a testable state:

```bash
npm test -- --runInBand
```

Any failures in files already modified by unrelated work must be separated
from failures introduced by this implementation rather than repaired as part
of this scope.

## Risks

- **Broader suffix effect:** Any current or future context error deliberately
  ending in `_internal_server_error` will now be reported and sanitized as a
  `500`. This is the documented convention; use an exact `endsWith` check and
  retain the ordinary-auth regression test to prevent accidental widening.
- **Diagnostic/client tradeoff:** The client will no longer receive the
  context-specific inconsistent-auth key or cause. Reporting the original
  error before returning the generic DTO preserves diagnostic identity without
  exposing internal state.
- **Reporter overlap with in-progress work:** The working tree contains
  unrelated reporter/observability changes. Use only the existing two-argument
  `report` contract at this call site and do not modify those files.

## Implementation Results

Implemented without deviation.

- The final implementation diff contains only the HTTP handler, its nearby
  component spec, and this execution plan. Removing the resolved Google-login
  TODO returned `login-with-google.usecase.ts` to its baseline content.
- The handler component suite passed all 13 tests with 100% statement, branch,
  function, and line coverage for `error.handler.ts`.
- The Google-login use-case and callback suites passed all 18 tests; the full
  repository suite passed all 316 suites and 2,550 tests.
- Lint and an explicit TypeScript no-emit check passed.
- `npm run build` completed TSOA generation, TypeScript compilation, and alias
  rewriting, then failed its final built-alias audit on
  `dist/src/infra/observability/__specs__/reporter.spec.js`. The corresponding
  source spec was already modified by unrelated observability work and retains
  a string-literal Jest alias that the audit reports. Generated route and
  Swagger changes created by the verification command were restored to their
  clean baseline.
- `npm run test:names` reports the pre-existing
  `src/infra/persistence/helpers/__tests__/get-db-query.test.ts` naming mismatch;
  that file is outside this plan and was not changed.
- Unrelated staged and working-tree changes remain untouched.

## Completion Criteria

- `authError.InconsistentUserAuth` reaches the HTTP boundary as a reported
  `500`, even though its error name is `AuthError`.
- The corresponding client response is the generic
  `app_error_internal_server_error` DTO and contains neither the auth-context
  error key nor its cause.
- Auth errors without `_internal_server_error` continue to return `401` and are
  not reported as operational failures.
- The Google-login use case retains its context-owned error and transaction
  behavior, with the resolved TODO removed.
- Validation, runtime, unknown, generic app-error, and default domain-error
  handler behavior remains unchanged.
- Focused handler/auth tests, lint, build, and the justified broader suite pass
  with full coverage for touched behavior.
- Unrelated staged and working-tree files remain unchanged.
