# Type-Safe Async App Context Plan

## Goal

Make the existing application context truthful and reusable across HTTP,
BullMQ, and RabbitMQ entry points without introducing transport-aware use
cases or dummy `user` and `accountingEntity` values. Context-dependent callers
will state their required values through `appContext.get([...keys])`, while
ordinary callers continue to use `appContext.get()` for universally available
correlation data.

This plan is implementation-ready. It preserves the existing `init`, `get`,
and `set` responsibilities, does not introduce a separate worker context, and
does not add a second getter such as `require`.

Preserve unrelated working-tree and staged changes during implementation. In
particular, the existing modifications to `.gitignore` and
`src/infra/observability/logger.ts` are outside this plan.

## Context

`IAppContextData` currently makes `user`, `accountingEntity`, and
`clientSession` mandatory. The early HTTP initializer satisfies that contract
with empty object assertions before the enrichment middleware resolves the
real request values. BullMQ and RabbitMQ processors receive correlation IDs in
their payloads but invoke application workers without calling
`appContext.init`, so logs and reporter calls inside those executions cannot
reliably read the active correlation ID.

The agreed design retains one application context for every invocation. Entry
adapters initialize the store, optional enrichments are present only when they
are real, and callers that depend on an enrichment pass its key to `get` so the
runtime check and TypeScript narrowing happen at the same boundary.

## Confirmed Findings

1. **P1 — The current context type is stronger than runtime reality.**
   `src/app/context/contracts/app-context.contract.ts` requires `user`,
   `accountingEntity`, and `clientSession`, while
   `src/interface/http/middlewares/app-context-init.middleware.ts` and
   `app-context-enrichment.middleware.ts` use `{}` assertions when a user or
   accounting entity is absent. Callers can therefore dereference values that
   are statically present but invalid at runtime.
2. **P1 — Async consumers do not activate application context.**
   `registerBullMQWorker` and `registerRabbitMQConsumer` call processors
   directly. Their payloads contain `correlationId` or `correlation_id`, but
   `src/infra/observability/reporter.ts` can only discover correlation through
   an active app-context store.
3. **P1 — `get()` cannot express a caller's context preconditions.**
   Use cases that dereference `user`, `accountingEntity`, or `clientSession`
   currently receive the same unvalidated return type as callers that need only
   `correlationId`.
4. **P2 — `init` discards the callback result in its contract and
   implementation.** This is adequate for Express `next`, but an async worker
   entry must return and await the processor promise so queue retry and failure
   semantics remain intact.
5. **P2 — Worker failures are reported more than once.** The shared BullMQ and
   RabbitMQ adapters report processor failures, while the ledger, notification,
   and exchange-rate application workers also catch, report, and rethrow them.
   Context activation at the transport boundary would otherwise retain this
   duplicate reporting.
6. **P2 — A missing-context runtime error must not become a client-facing
   shared error key.** `runtimeError.ContextNotFound` already distinguishes a
   missing required context value from `StoreNotFound`, but the HTTP error
   handler currently treats named shared/domain errors as client responses
   unless explicitly mapped.
7. **The HTTP boundary already provides the correct local initialization
   precedent.** `createApplication` installs app-context initialization before
   request logging and later enriches the same store after cookie and passport
   setup.

## Implementation Basis

| Decision or structural change                                                                                               | Basis                                                         | Evidence or rationale                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Retain one `IAppContext` and its `init`, `get`, and `set` methods                                                           | Explicit user decision and existing local precedent           | `src/app/context/contracts/app-context.contract.ts`; `src/infra/runtime/app-context.ts`                                       |
| Make request/session enrichments optional in the stored shape while keeping correlation and idempotency universally present | Explicit user decision and confirmed runtime behavior         | HTTP init/enrichment currently represent absence with empty object assertions                                                 |
| Add a generic required-key parameter to `get` and narrow only the requested keys                                            | Explicit user decision                                        | Agreed call form: `appContext.get(['user', 'accountingEntity'])`                                                              |
| Return the callback result from generic `init<T>`                                                                           | Requirement and direct extension of existing behavior         | Async queue processors must remain awaitable; `AsyncLocalStorage.run` already returns the callback result                     |
| Initialize context inside BullMQ and RabbitMQ delivery adapters                                                             | Folder Responsibility rule and HTTP boundary precedent        | Delivery/runtime concerns belong under `src/infra`; shared consumer registration functions own processor execution            |
| Let each consumer registration construct its initial store                                                                  | Explicit user decision that the entry owns context enrichment | Current payload shapes differ (`correlationId` versus `correlation_id`) and future workers may supply user/accounting context |
| Reuse `runtimeError.ContextNotFound` with missing-key cause data                                                            | Error Creation rule and existing context-owned error          | `src/shared/values/errors/runtime.error.ts` already defines both `ContextNotFound` and `StoreNotFound`                        |
| Convert runtime-context failures to reported HTTP 500 responses without exposing the runtime key                            | Error Key Policy                                              | Generic shared error keys must not reach clients                                                                              |
| Report a worker execution failure once at the transport boundary                                                            | Service Ownership rule                                        | Reusable failure semantics must have one reporting owner; transport adapters also own retry acknowledgement/rethrow behavior  |
| Add proximal infrastructure, application, and interface specs                                                               | Testing rules                                                 | Touched behavior spans concrete async storage, worker adapters, application workers, and HTTP middleware/error mapping        |

## Scope

### Expected Changes

- `src/app/context/contracts/app-context.contract.ts` — make `user`,
  `accountingEntity`, and `clientSession` optional store enrichments; add the
  generic required-key return type; make `init<T>` return `T`.
- `src/app/context/contracts/__mocks__/app-context.mock.ts` — keep the shared
  mock aligned with the generic contract using bare Jest functions.
- `src/infra/runtime/app-context.ts` — return `AsyncLocalStorage.run`, validate
  requested keys, and narrow the result only after validation.
- `src/infra/runtime/__specs__/app-context.spec.ts` — cover initialization,
  missing stores, required-key validation, enrichment, returned async results,
  and concurrent context isolation.
- `src/interface/http/middlewares/app-context-init.middleware.ts` and its spec
  — initialize only correlation, idempotency, and the real client-session
  adapter; remove dummy user/accounting-entity assertions.
- `src/interface/http/middlewares/app-context-enrichment.middleware.ts` and its
  spec — set only values actually resolved from the request.
- `src/interface/http/middlewares/is-authenticated-user.middleware.ts` and its
  spec — continue treating an absent user as a normal unauthorized request via
  plain `get()`, and validate accounting access only when an entity is present.
- `src/interface/http/middlewares/accounting-entity-access.middleware.ts` and
  its spec — declare its strict `user` and `accountingEntity` prerequisites
  through the keyed getter.
- Application use cases and the auth session helper that unconditionally
  dereference context enrichments — pass `['user']`,
  `['accountingEntity']`, `['user', 'accountingEntity']`, or
  `['clientSession']` to `get` as appropriate. This includes strict consumers
  under `src/app/accounting/usecases`, `src/app/counterparty/usecases`,
  `src/app/journal-entry/usecases`, `src/app/ledger/usecases`, and
  `src/app/auth/usecases/helpers` plus logout, refresh-token, and reset-password
  flows.
- `src/app/user/usecases/get-profile.usecase.ts` and
  `get-preferences.usecase.ts` — retain plain `get()` because absence is an
  expected authorization outcome owned by those use cases, not a missing
  entry-context invariant.
- Affected application specs — update context fixtures and, where material,
  assert the required-key calls without duplicating the runtime adapter's
  validation tests.
- `src/infra/config/bullmq.config.ts`,
  `src/infra/messaging/workers/index.ts`, and new proximal adapter specs —
  construct a per-job initial store and execute processing, reporting, and
  rethrow inside `appContext.init`.
- `src/infra/config/rabbitmq.config.ts`,
  `src/infra/messaging/external/exchange-rate.consumer.ts`,
  `src/infra/runtime/_bootstrap/rabbit-mq-consumers.bootstrap.ts`, and new
  proximal adapter specs — provide a per-message initial-store getter and run
  processing plus acknowledgement/failure handling inside `appContext.init`.
- `src/app/ledger/workers/ledger-account-balance-adjustment.worker.ts`,
  `src/app/notification/workers/transactional-email.worker.ts`,
  `src/app/money/workers/exchange-rate-ingestion.worker.ts`, their IoC modules,
  and their specs — remove duplicate reporter ownership while preserving
  validation, logging, and error propagation.
- `src/interface/http/handlers/error.handler.ts` and its spec — report runtime
  context errors and return the ordinary internal-server-error response rather
  than exposing a shared runtime error key.

### Out of Scope

- Metrics, spans, trace-header propagation, sampling, or vendor-specific
  observability configuration.
- Renaming `reqContext` variables or otherwise normalizing existing context
  terminology.
- Making `idempotencyKey` optional or changing its existing empty-string
  semantics.
- Changing event-bus delivery or replacing
  `validateEventAndSetAppContext`; the current event bus is in-process and
  inherits its caller's initialized store.
- Adding user or accounting-entity hydration to current workers; none of the
  three current worker workflows require those values. The initial-store
  getter seam will allow a future worker to supply them before invoking a
  context-dependent use case.
- The unrelated worktree modifications in `.gitignore` and
  `src/infra/observability/logger.ts`.

## Implementation Status

Baseline: the plan, `.gitignore`, and `src/infra/observability/logger.ts` were
already staged before implementation. The latter two files are unrelated and
must remain untouched.

| Slice                                                            | Owner and basis                                                                                  | Intended files and tests                                                              | Status                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Truthful, keyed context contract and runtime validation          | App contract plus infra runtime; explicit plan decision and existing `AsyncLocalStorage` adapter | Context contract/mock, runtime adapter, proximal runtime spec                         | Complete — 10 focused specs pass                                               |
| Real HTTP initialization/enrichment and strict-vs-optional reads | HTTP interface; existing early-init/enrichment middleware precedent                              | Context middlewares, access/auth middleware, proximal specs                           | Complete — 18 focused specs pass                                               |
| Keyed reads for strict application consumers                     | Application workflows; keyed-get contract decision and current use-case ownership                | Accounting, counterparty, journal-entry, ledger, and auth callers plus affected specs | Complete — typecheck and 200 affected specs pass                               |
| Per-delivery BullMQ and RabbitMQ context activation              | Infra delivery adapters; HTTP boundary precedent and explicit store-getter decision              | Queue/message configs, registrations/bootstrap, proximal adapter specs                | Complete — adapter context, failure, ack/nack, retry, and isolation specs pass |
| Single transport-owned worker failure reporting                  | Infra transport ownership; service-ownership failure semantics                                   | Three workers, IoC modules, worker specs                                              | Complete — worker propagation specs pass without reporter dependencies         |
| Internal-only HTTP handling of runtime context faults            | HTTP error interface; error-key policy and existing internal-error response                      | Error handler and proximal spec                                                       | Complete — 12 focused handler specs pass                                       |

Verification complete: focused specs, lint, build, and the full suite (301 test
suites and 2,477 tests) pass. `npm run test:names` still reports the pre-existing
unrelated path `src/infra/persistence/helpers/__tests__/get-db-query.test.ts`;
no file created or renamed by this plan is implicated.

Implemented without deviation.

## Proposed Approach

### 1. Make the app-context contract truthful and type-safe

- Keep `correlationId` and `idempotencyKey` required in `IAppContextData`.
- Mark `user`, `accountingEntity`, and `clientSession` optional because they are
  enrichments rather than universal execution values.
- Define a reusable return type equivalent to `IAppContextData &
Required<Pick<IAppContextData, K>>`.
- Give `get` a default generic key of `never` and an optional readonly array of
  keys. A no-argument call returns the truthful optional shape; a keyed call
  returns those keys as required.
- Change `init` to `init<T>(store, callback): T`. Do not introduce `run`,
  `require`, transport discriminators, or a second context contract.

### 2. Enforce keyed access in the runtime adapter

- Continue throwing `runtimeError.StoreNotFound` when no async-local store is
  active.
- Treat only `undefined` and `null` as missing required values; do not use a
  truthiness check.
- Collect every missing requested key and throw one
  `runtimeError.ContextNotFound` with `requiredKeys`, `missingKeys`, and the
  active `correlationId` in its cause.
- Keep the single internal type assertion inside this adapter, after the
  runtime validation has established the promised narrowed type.
- Keep `set` as the supported way to change legitimate in-flight context, such
  as switching or creating the active accounting entity.

### 3. Remove dummy HTTP context values and classify consumers

- Initialize HTTP context early with the generated/supplied correlation ID,
  existing idempotency value, and concrete cookie-backed client session only.
- During enrichment, set `user` and `accountingEntity` only when each lookup
  succeeds; do not write empty objects for absence.
- Keep optional reads where absence is normal behavior: authentication
  middleware and the profile/preferences authorization checks.
- Convert callers that immediately dereference an enrichment to keyed reads.
  Use the smallest key set each caller actually needs so its precondition is
  explicit and transport-neutral.
- Let the TypeScript build identify any unclassified dereference left behind;
  do not silence optionality with non-null assertions or casts.

### 4. Activate context at queue and message entry boundaries

- Inject the existing `IAppContext` into shared BullMQ and RabbitMQ consumer
  registration rather than importing a second context or initializing inside
  application use cases.
- Accept a per-registration synchronous `getInitialStore`. Current BullMQ
  registrations map `payload.correlationId` and an empty idempotency key;
  exchange-rate ingestion maps `payload.correlation_id` and the same existing
  idempotency default. Generate a correlation ID defensively if an unvalidated external
  payload omits it.
- Get the initial store, then call `appContext.init(initialStore, async () =>
...)` around processor execution and the transport's failure handling.
- For BullMQ, report inside the initialized callback and rethrow so BullMQ
  retries remain unchanged.
- For RabbitMQ, acknowledge success or report and negatively acknowledge
  failure from inside the initialized callback, preserving the existing
  no-requeue behavior.
- Keep parsing failures that occur before a usable message payload under the
  existing uncorrelated transport error path; do not fabricate business
  context from unparseable data.

### 5. Consolidate worker error reporting

- Remove reporter dependencies and catch/report/rethrow blocks from the three
  application workers once the shared delivery adapters report within active
  context.
- Preserve worker validation and the exchange-rate lifecycle information logs.
- Update IoC modules and specs so application workers reject failures unchanged
  and transport adapters are the single reporting owner.

### 6. Keep runtime faults internal at the HTTP interface

- Detect `runtimeError.Base` before ordinary domain/app error serialization.
- Report the underlying runtime error, return HTTP 500, and serialize only
  `appError.InternalServerError`.
- Add a regression spec proving the runtime key and its missing-key cause do
  not reach the client response.

## Test Plan

- **Infrastructure runtime:** Add a stateful app-context adapter spec covering
  no-store access, plain access, successful keyed narrowing, one and multiple
  missing keys, `set` enrichment, returned sync/async values, rejection
  propagation, nested execution, and concurrent-store isolation.
- **Infrastructure messaging:** Mock BullMQ and controlled RabbitMQ channels to
  prove each payload receives a fresh context; processor logs/reporting can
  read its correlation ID; success and failure behavior is unchanged; and two
  concurrent jobs do not leak context.
- **Application:** Update affected use-case/helper specs for optional store
  fixtures and keyed access. Update worker specs to assert that processing
  errors propagate without application-layer duplicate reports.
- **Interface:** Update initialization/enrichment specs to assert that anonymous
  requests contain no dummy entities. Preserve unauthorized behavior in the
  authentication/profile/preferences paths, verify strict access middleware
  requests both required keys, and verify runtime context faults become
  reported internal-server errors.
- **Regression:** Run the complete suite because the shared context contract is
  used across every application domain.

## Verification

Run focused checks first:

```bash
npm test -- --runInBand src/infra/runtime/__specs__/app-context.spec.ts
npm test -- --runInBand src/interface/http/middlewares/__specs__/app-context-init.middleware.spec.ts src/interface/http/middlewares/__specs__/app-context-enrichment.middleware.spec.ts src/interface/http/middlewares/__specs__/is-authenticated-user.middleware.spec.ts src/interface/http/middlewares/__specs__/accounting-entity-access.middleware.spec.ts src/interface/http/handlers/__specs__/error.handler.spec.ts
npm test -- --runInBand src/infra/config/__specs__/bullmq.config.spec.ts src/infra/config/__specs__/rabbitmq.config.spec.ts
npm test -- --runInBand src/app/ledger/workers src/app/notification/workers src/app/money/workers
npm run lint
npm run build
npm test -- --runInBand
```

BullMQ and RabbitMQ adapter specs must use mocks or controlled channels; they
must not require live Redis or RabbitMQ instances.

## Assumptions

- A required context key is missing only when its value is `undefined` or
  `null`; valid objects are not deep-validated by the context adapter.
- `runtimeError.ContextNotFound` is the existing context-owned error intended
  for a present store that lacks required values; `StoreNotFound` remains for
  the absence of the store itself.
- Current worker payloads carry sufficient data for their workflows, so their
  initial stores need only correlation and the existing idempotency default.
- Direct array literals such as `get(['user', 'accountingEntity'])` provide the
  intended key-union inference; build verification will guard this contract.

## Risks

- **Shared type blast radius:** Making enrichments optional exposes every
  implicit dereference at compile time. Mitigate by migrating all call sites in
  one change and rejecting non-null assertions or dummy casts.
- **Behavioral classification:** Treating an expected anonymous user as a
  missing invariant would incorrectly produce HTTP 500. Mitigate by retaining
  plain `get()` and explicit unauthorized handling in the few callers where
  absence is normal.
- **Async context placement:** Reporting outside the `init` callback would lose
  the worker correlation after a rejected processor promise. Keep the
  transport catch inside the initialized callback and cover it with adapter
  specs.
- **Duplicate incidents:** Leaving worker-level reporter catches would emit the
  same error twice. Remove them only after the transport boundary tests prove
  reporting and rethrow/nack behavior.
- **Error disclosure:** A runtime error falling through the current HTTP error
  parser would expose a shared key and likely use the wrong status. Add the
  explicit internal-error branch and regression test in the same change.

## Completion Criteria

- `IAppContext` still exposes only `init`, `get`, and `set`; `get([...keys])`
  performs runtime validation and compile-time narrowing.
- HTTP anonymous requests and current background workers initialize context
  without dummy `user` or `accountingEntity` values.
- Every current use case/helper that unconditionally dereferences an optional
  context enrichment uses the keyed getter, while expected anonymous flows
  retain their existing authorization behavior.
- BullMQ and RabbitMQ processing, reporting, retries, acknowledgements, and
  negative acknowledgements execute inside the correct per-message context.
- Each worker failure is reported once with its active correlation ID.
- Missing required context values are reported as internal faults and never
  expose a runtime error key to HTTP clients.
- Focused specs, lint, build, and the full test suite pass.
- No live queue infrastructure is required for tests, and unrelated working
  tree changes remain untouched.
