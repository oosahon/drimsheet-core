# First-Class Observability Metrics Plan

## Goal

Introduce first-class, tool-agnostic metrics contracts and initial HTTP and
queue instrumentation without coupling domain behavior to observability or
introducing a generic use-case wrapper.

This plan is **implementation-ready**. The application will export metrics
periodically over OTLP/HTTP to one Grafana Alloy service on the internal Coolify
network. Alloy will forward application metrics to Grafana Cloud and scrape
provider-native BullMQ and RabbitMQ metrics over the same private network. Use
base-2 exponential histograms when Grafana Cloud preserves them, with documented
explicit boundaries as the compatibility fallback. Exact ledger-consistency
measurement is explicitly deferred until reconciliation semantics and a durable
measurement clock are defined. Preserve unrelated staged and working-tree
changes during implementation.

## Context

The project already has structured logging and error reporting through
`ILogger`, `IReporter`, and concrete implementations in
`src/infra/observability`. HTTP request middleware captures normalized route,
method, response status, outcome, duration, and response size, but emits those
values only as logs. BullMQ and RabbitMQ centralize worker execution and failure
reporting, providing coherent seams for queue metrics. There is no direct
metrics dependency, runtime exporter, metric contract, catalogue, or
instrumentation in authored source.

The agreed design uses the explicit name `IObservabilityMetrics` for the
generic technical capability and focused semantic contracts such as
`IHttpMetrics` and `IQueueMetrics`. Contract method payloads use named,
module-private interfaces; payload interfaces are not exported and inline
object parameter types are prohibited. `IUseCaseMetrics` and a generic
use-case wrapper are intentionally deferred.

The production collection model is periodic OTLP/HTTP export from application
instances to one Grafana Alloy service on the internal Coolify network. Alloy's
standard `otelcol.*` components provide the OpenTelemetry Collector boundary;
the experimental `alloy otel` engine is not required. Alloy owns Grafana Cloud
credentials, batching, and backend egress. Application lifecycle metrics cover
HTTP and queue enqueue/processing facts. Alloy also scrapes a single logical
BullMQ metrics target and every Coolify-hosted RabbitMQ node for queue-state
inventory without per-replica application polling or public broker metric
ports.

## Confirmed Findings

1. **High — HTTP telemetry is log-only.**
   `src/interface/http/middlewares/request-logger.middleware.ts` already
   calculates stable route, method, status, outcome, duration, and response
   size on the response `finish` event, but it has only an `ILogger`
   dependency and records no counter or distribution.
2. **High — Queue execution has centralized instrumentation seams but no
   measurements.** `registerBullMQWorker` in
   `src/infra/config/bullmq.config.ts` and `registerRabbitMQConsumer` in
   `src/infra/config/rabbitmq.config.ts` own processing, failure handling, and
   acknowledgment behavior. Queue producers are centralized under
   `src/infra/messaging/queues`, but none records enqueue, wait, processing, or
   outcome metrics.
3. **No first-class metrics adapter exists.** `src/infra/observability/index.ts`
   exposes only the logger and reporter. `package.json` has no direct metrics
   SDK or exporter dependency. OpenTelemetry packages appearing transitively
   in `package-lock.json` are dependencies of existing packages and are not an
   authored metrics configuration.
4. **Existing contracts establish a close cross-layer precedent.**
   `src/shared/contracts/logger.contract.ts` and
   `src/shared/contracts/reporter.contract.ts` define framework-neutral
   observability ports, their mocks live under
   `src/shared/contracts/__mocks__`, and their implementations live under
   `src/infra/observability`.
5. **Exact journal-to-ledger consistency is not currently observable from one
   completion point.** Balance propagation creates one job per affected
   account, and `adjust-ledger-account-balance.usecase.ts` may recursively
   enqueue a control-account adjustment. The current payload carries a journal
   identifier and correlation ID but no expected adjustment count or durable
   propagation-completion state. A single completed job therefore does not
   prove that the journal is fully reflected through the account hierarchy.
6. **Balance propagation is deliberately best-effort.**
   `ILedgerAccountBalancePropagationService` documents non-rejecting failure
   semantics, while its implementation and the balance-adjustment queue report
   selected failures without failing the completed journal workflow. Metrics
   must preserve this behavior and must not replace existing error reports.
7. **The production metrics backend and collector are now resolved.**
   `.tmp/docs/observability-tools.md` selects Grafana Cloud for metrics and
   Grafana Alloy as a Coolify service. The user confirmed that every RabbitMQ
   deployment also runs on Coolify, so Alloy can receive application OTLP and
   scrape broker metrics entirely over the internal network.
8. **The installed BullMQ version has a provider-native Prometheus export.**
   `package-lock.json` resolves BullMQ 5.78.0, whose
   `Queue.exportPrometheusMetrics()` returns queue counts by state plus
   completed and failed totals. It requires a scrape endpoint and does not
   expose oldest-job age. The endpoint must therefore be one internal logical
   Alloy target, with overlapping lifecycle totals filtered out.

## Implementation Basis

| Decision or structural change                                                                               | Basis                                                          | Evidence or rationale                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name the generic port `IObservabilityMetrics`                                                               | User-resolved requirement                                      | The user explicitly chose the observability-qualified name to avoid collision with future domain meanings of “metric.”                                                                                                                     |
| Use named, module-private payload interfaces in metrics contracts                                           | User-resolved requirement                                      | The user explicitly rejected inline payload typing and confirmed that payload interfaces should not be exported.                                                                                                                           |
| Keep generic and technical focused contracts framework-neutral under `src/shared/contracts`                 | Local precedent and durable rule                               | `ILogger` and `IReporter` occupy this seam; `folder-responsibility.md` allows pure framework-neutral contracts in shared while concrete observability remains infrastructure-owned.                                                        |
| Implement metric recording/export under `src/infra/observability`                                           | Durable rule and local precedent                               | `folder-responsibility.md` assigns observability adapters to infrastructure; logger and reporter implementations already live there.                                                                                                       |
| Add `IHttpMetrics` and `IQueueMetrics` semantic facades over `IObservabilityMetrics`                        | User-resolved requirement and local contract/factory precedent | Focused application contracts and factory implementations are common under `src/app/*/contracts` and `src/app/*/services`; these technical facades keep metric names, instrument types, and label policy out of middleware and queue code. |
| Extend the existing HTTP completion boundary instead of adding a second timer                               | Concrete local precedent                                       | `makeRequestLoggerMiddleware` already owns normalized route resolution and completion timing. Injecting `IHttpMetrics` reuses that single observation and avoids duplicated finish listeners and calculations.                             |
| Instrument queue producers and generic consumer/worker registration seams                                   | Concrete local precedent                                       | Queue `add` methods own enqueue outcomes; `registerBullMQWorker` and `registerRabbitMQConsumer` own processing and failure outcomes. Instrumentation stays with the existing technical owner.                                              |
| Keep metrics best-effort and behavior-neutral                                                               | Existing failure semantics and observability responsibility    | Recording must never change HTTP responses, queue acknowledgment/nack behavior, retries, reporter calls, or application transaction outcomes.                                                                                              |
| Do not add `IUseCaseMetrics` or a generic use-case wrapper                                                  | User-resolved requirement and precedent rule                   | No suitable wrapper precedent exists, and current requirements can be met at HTTP and worker boundaries. Reconsider only after concrete repeated application-level instrumentation justifies a new pattern.                                |
| Keep domain entities, values, rules, and services unaware of metrics                                        | Durable rule                                                   | `folder-responsibility.md` forbids technical concerns in the domain layer.                                                                                                                                                                 |
| Run Grafana Alloy on Coolify and forward application OTLP/HTTP metrics to Grafana Cloud                     | User-resolved requirement                                      | The user supplied the Grafana Cloud and Alloy recommendation and asked that it resolve the open questions. Alloy keeps Grafana Cloud credentials and routing outside application call sites.                                               |
| Prefer base-2 exponential histograms and use explicit discovery boundaries only as a compatibility fallback | User-resolved requirement                                      | The user accepted the recommendation to preserve useful latency distributions without inventing initial SLO thresholds.                                                                                                                    |
| Expose BullMQ state through one internal logical Prometheus scrape target                                   | User-resolved requirement and dependency capability            | The user accepted the recommended internal endpoint. BullMQ 5.78.0 provides `Queue.exportPrometheusMetrics()`; Alloy will keep the state gauge and filter overlapping lifecycle totals.                                                    |
| Scrape every Coolify-hosted RabbitMQ node through `rabbitmq_prometheus`                                     | User-resolved requirement and provider capability              | The user confirmed every RabbitMQ deployment runs on Coolify. RabbitMQ's production monitoring path exposes node and queue metrics on the internal port `15692`.                                                                           |
| Defer exact ledger-consistency metrics in favor of operational proxy metrics                                | User-resolved requirement                                      | The user accepted reconciliation-backed consistency as later work; job completion is not sufficient evidence of recursively propagated financial consistency.                                                                              |
| Record the cross-cutting architecture decision through the ADR workflow                                     | Durable rule and user-resolved requirement                     | `precedent-and-deviation.md` requires an approved ADR for repository-wide architectural novelty, `docs/09_architecture_decisions.md` requires use of `npm run adr:add`, and the previously open architectural decisions are now resolved.  |

## Scope

### Expected Changes

- `src/shared/contracts/observability-metrics.contract.ts` — define
  `IObservabilityMetrics` with `increment`, `observe`, and `set` operations;
  every method accepts a named module-private payload interface.
- `src/shared/contracts/http-metrics.contract.ts` — define `IHttpMetrics` with a
  semantic request-completion operation and a named module-private payload.
- `src/shared/contracts/queue-metrics.contract.ts` — define `IQueueMetrics` with
  semantic enqueue, processing-completion, and processing-failure operations;
  use separate named module-private payloads for distinct facts.
- `src/shared/contracts/__mocks__/` — add typed bare-function mocks for the
  three contracts, with no default behavior or fixtures.
- `package.json` and `package-lock.json` — add direct OpenTelemetry API, metrics
  SDK, and OTLP/HTTP metrics exporter dependencies; do not rely on transitive
  packages.
- `src/shared/contracts/vars-config.contract.ts`,
  `src/infra/config/vars.config.ts`, and their specs — add metrics enablement,
  the internal Alloy OTLP/HTTP endpoint, export interval, bounded
  shutdown-flush configuration, and the internal BullMQ metrics listener port.
- `src/infra/observability/` — add the OpenTelemetry-backed generic adapter,
  centralized metric catalogue, and `IHttpMetrics`/`IQueueMetrics` facade
  implementations; extend observability setup, bounded shutdown flushing, and
  the existing composition export.
- `src/interface/http/middlewares/request-logger.middleware.ts` and its spec —
  inject `IHttpMetrics` and record one request count and one duration
  observation from the existing normalized completion data.
- `src/infra/ioc/middlewares/http.ts` — wire the constructed HTTP metrics facade
  into the request middleware without changing middleware order.
- `src/infra/messaging/queues/ledger-account-balance.queue.ts` and
  `transactional-email.queue.ts`, plus their specs — record enqueue success and
  failure while preserving their deliberately different rejection semantics.
- `src/infra/config/bullmq.config.ts` and its spec — inject `IQueueMetrics` into
  the generic worker boundary and record controlled queue name, outcome,
  attempts, waiting duration when available, and processing duration.
- `src/infra/config/rabbitmq.config.ts` and its specs — inject `IQueueMetrics`
  into the generic consumer boundary and record controlled queue name,
  processing outcome, and processing duration without changing ack/nack
  behavior.
- `src/infra/messaging/workers/index.ts`,
  `src/infra/messaging/external/exchange-rate.consumer.ts`, and relevant IoC or
  bootstrap callers — pass the queue metrics facade through existing worker and
  consumer registration seams.
- `src/infra/server/bullmq-metrics.ts`, its spec, and
  `src/infra/server/index.ts` — expose `Queue.exportPrometheusMetrics()` for all
  configured queues through a separate internal-only listener. Merge metric
  families without duplicate metadata and keep this listener off the public
  application port.
- `.agents/rules/observability.md` and `docs/08_cross_cutting_concepts.md` — add
  concise durable metric naming, unit, privacy, label-cardinality, and ownership
  guidance; keep logs explicitly distinct from metrics.
- A metrics architecture ADR created through `npm run adr:add` and the
  automatically synchronized `docs/09_architecture_decisions.md` index — record
  the resolved exporter, contract boundary, semantic facades, no-throw policy,
  and cardinality rules.

### Conditional Changes

- Base-2 exponential histogram aggregation falls back to the explicit discovery
  boundaries in the metric catalogue only if the configured Grafana Cloud
  pipeline does not preserve exponential histograms.

### Out of Scope

- A generic use-case wrapper, TypeScript `@decorator`, or `IUseCaseMetrics`.
- Direct metrics dependencies in domain entities, values, rules, or services.
- Distributed tracing and log/trace correlation.
- Database, Redis, and external HTTP client instrumentation beyond what the
  selected metrics runtime may supply automatically.
- Final SLO thresholds, dashboards, paging routes, and runbooks; these follow
  after baseline measurements establish realistic objectives.
- Coolify deployment changes for Grafana Alloy and the RabbitMQ Prometheus
  plugin, plus Grafana Cloud provisioning. This plan documents those production
  prerequisites and smoke tests but does not modify the deployment repository
  or Grafana Cloud.
- Structured production JSON logs, Sentry PII hardening, trace/log correlation,
  health endpoints, synthetic checks, and Coolify notification changes
  recommended by `.tmp/docs/observability-tools.md`. They belong to subsequent
  observability work rather than this metrics slice.
- BullMQ or RabbitMQ oldest-job-age collection. Neither selected native export
  supplies it reliably; a later plan may introduce one bounded, single-owner
  collector but must never poll once per application replica.
- `ILedgerConsistencyMetrics`, ledger propagation-state persistence, and claims
  of a journal-to-balance consistency SLI. A later plan must define
  reconciliation-backed completion and a durable start time first.
- Using correlation IDs, user IDs, accounting-entity IDs, journal IDs, ledger
  account IDs, job IDs, email addresses, raw URLs, error messages, or financial
  amounts as metric attributes.

## Proposed Approach

### 1. Record the resolved exporter architecture

- Configure the application metrics SDK to export periodically over OTLP/HTTP
  to one Grafana Alloy service on the internal Coolify network. Do not call the
  Grafana Cloud API or embed Grafana Cloud credentials in application code.
- Configure Alloy's standard `otelcol.receiver.otlp`, resource processing,
  batching, and `otelcol.exporter.otlphttp` components to forward application
  metrics to Grafana Cloud. Do not use the experimental `alloy otel` engine.
- Keep Grafana Cloud credentials, routing, retry buffering, and
  provider-specific transformation in Alloy configuration owned by the
  platform deployment. Application configuration owns only enablement, the
  internal Alloy endpoint, export interval, bounded flush timeout, and the
  internal BullMQ scrape-listener port.
- Configure Alloy's Prometheus components separately for BullMQ and RabbitMQ
  scrape targets and forward those series to Grafana Cloud. Do not expose the
  BullMQ listener or RabbitMQ port `15692` through the public Coolify proxy.
- Default metrics exporting to disabled in local and test environments while
  allowing explicit local collector smoke testing.
- Create the ADR through `npm run adr:add "First-Class Observability Metrics"`;
  do not create or number the ADR manually. Record Grafana Alloy as the
  internal collection boundary, Grafana Cloud as the backend, OTLP/HTTP for
  application metrics, Prometheus scrape for provider-native queue inventory,
  contract boundaries, semantic facades, histogram policy, no-throw behavior,
  and cardinality rules.

### 2. Establish the initial metric catalogue

The initial application-owned catalogue is:

| Metric                                | Instrument | Export unit   | Allowed attributes                                                        |
| ------------------------------------- | ---------- | ------------- | ------------------------------------------------------------------------- |
| `http.server.requests`                | Counter    | `{request}`   | method, normalized route, status class, outcome                           |
| `http.server.request.duration`        | Histogram  | `s`           | method, normalized route, status class, outcome                           |
| `messaging.client.enqueue.operations` | Counter    | `{operation}` | controlled queue name, transport, outcome                                 |
| `messaging.process.operations`        | Counter    | `{operation}` | controlled queue name, transport, outcome, bounded attempt                |
| `messaging.process.duration`          | Histogram  | `s`           | controlled queue name, transport, outcome                                 |
| `messaging.process.wait.duration`     | Histogram  | `s`           | controlled queue name, transport; record only from trustworthy timestamps |

- Keep duration payloads in milliseconds where they reuse existing application
  measurements, but convert them to seconds in semantic facades before calling
  `IObservabilityMetrics`.
- Prefer base-2 exponential histogram aggregation. If the Grafana Cloud smoke
  test shows that the configured metrics stack does not preserve it, use these
  explicit discovery boundaries in seconds:
  - HTTP: `0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10`.
  - Queue processing: `0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60`.
  - Queue waiting: `0.1, 0.5, 1, 5, 15, 30, 60, 300, 900`.
- Treat provider-native queue inventory series as externally owned catalogue
  entries. Do not duplicate or rename them in the application recorder.
- Collect baseline distributions for two to four weeks before proposing final
  latency SLOs.

### 3. Establish the generic recording capability

- Add `IObservabilityMetrics` as the framework-neutral port. Use explicit
  object payloads rather than positional parameters.
- Declare each payload as a named non-exported interface in the contract file.
  Keep metric name, numeric value, and controlled attributes inside the
  payload; do not add an open-ended `unknown` attribute type.
- Implement the selected adapter in `src/infra/observability`, including safe
  disabled/test behavior. Calls remain synchronous from the caller's
  perspective and delegate buffering/export to the provider.
- Make adapter failures non-throwing. If failures need logging, emit one stable
  sanitized event through the existing logger with throttling or deduplication
  sufficient to prevent a telemetry-failure log storm.
- Add the constructed recorder to the existing observability composition
  without turning IoC files into behavioral owners.

### 4. Add semantic HTTP measurements

- Define `IHttpMetrics.recordRequestCompleted` with one named non-exported
  payload containing method, normalized route, status code, controlled outcome,
  and duration in milliseconds. Keep response size out of the initial catalogue.
- Implement the facade over `IObservabilityMetrics`; it owns the HTTP metric
  names, instrument kinds, units, and transformation of status code into a
  bounded status class.
- Extend `makeRequestLoggerMiddleware` to pass its already-computed completion
  observation to `IHttpMetrics` exactly once. Preserve current log records,
  slow-request behavior, and normalized route handling.
- Record one request counter increment and one duration histogram observation.
- Allow only method, normalized route, status class, and controlled outcome as
  initial HTTP attributes.

### 5. Add semantic queue measurements

- Define `IQueueMetrics` operations around enqueue, completed processing, and
  failed processing. Distinguish facts with separate named module-private
  payload interfaces rather than optional fields in one catch-all payload.
- Implement the facade over `IObservabilityMetrics`; it owns queue metric names,
  units, and allowed attributes such as controlled queue name, transport,
  outcome, and bounded attempt number.
- Inject it into both queue producers. Record enqueue success only after the
  provider accepts the job and record enqueue failure before preserving the
  existing swallow/rethrow behavior of each queue adapter.
- Inject it into `registerBullMQWorker`. Use monotonic time for processing
  duration and BullMQ job metadata for waiting duration and attempts where
  available. Preserve application context, reporter invocation, and rethrow
  behavior.
- Inject it into `registerRabbitMQConsumer`. Record processing duration and
  success/failure around the existing processor call. Do not infer waiting
  duration unless a trustworthy publish timestamp is present; preserve ack and
  nack behavior exactly.
- Add a separate internal BullMQ metrics listener under `src/infra/server`,
  following the existing `createBullMqServerAdapter` technical-router
  precedent. On each scrape, call `Queue.exportPrometheusMetrics()` for every
  configured queue and merge the metric families with one `HELP` and `TYPE`
  declaration per family.
- Configure Alloy with one logical BullMQ scrape target per environment. Keep
  `bullmq_job_count` and its controlled `queue` and `state` labels, and drop the
  BullMQ completed/failed totals that overlap the application-owned processing
  counters. Do not discover and scrape every application replica.
- Enable `rabbitmq_prometheus` on every Coolify-hosted RabbitMQ node and have
  Alloy scrape each node on internal port `15692`. Keep broker ports private and
  let RabbitMQ own ready, unacknowledged, consumer, connection, publish, and
  delivery series.
- Keep queue depth, active, delayed, failed, ready, and unacknowledged gauges
  outside `IQueueMetrics`. Do not add oldest-pending age in this implementation;
  a later plan must give any bounded collector a single runtime owner.

### 6. Preserve the ledger-consistency boundary

- Instrument balance-adjustment enqueue and processing as technical queue facts
  only. These metrics may indicate degraded propagation but must not be named or
  described as journal-to-ledger consistency.
- Do not add `ILedgerConsistencyMetrics`, propagation-state persistence, or
  expected/completed adjustment counting in this implementation.
- Require a later plan to define reconciliation-backed consistency across every
  directly and recursively affected account and a durable journal-commit or
  propagation-record start time before exposing a consistency SLI.
- Preserve the current best-effort propagation failure semantics.

### 7. Codify and document the metric contract

- Extend the observability rule with stable metric names, explicit units,
  controlled outcomes, bounded attributes, and a ban on identifiers and raw
  values that create privacy or cardinality risk.
- Document which metrics are approximate operational signals versus durable
  business truth. Domain events and metrics must not become the authoritative
  accounting record.
- Record the initial catalogue and ownership so later changes treat renamed or
  redefined metrics as operational query migrations rather than incidental
  refactors.

## Implementation Status

Baseline before implementation: focused observability, HTTP request logging,
BullMQ, RabbitMQ, and queue-producer suites pass (9 suites, 30 tests). The
working tree contains only the pre-existing untracked `.agents/plans/`
directory; preserve all unrelated changes.

| Step | Outcome and owner                                                                                                                                                                | Basis and precedent                                                                                                                                                                 | Intended files and tests                                                                                                                             | Status                | Verification                                                                                                                                                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Record the resolved exporter architecture; documentation owns the accepted cross-cutting decision.                                                                               | User-resolved plan decisions; ADR workflow in `docs/09_architecture_decisions.md` and `scripts/add-adr.ts`.                                                                         | Generated metrics ADR and synchronized architecture-decision index.                                                                                  | Complete              | `npm run adr:add` generated ADR 0014; accepted content records Alloy/Grafana Cloud, contracts, OTLP/HTTP, provider-native scraping, no-throw behavior, aggregation, cardinality, and deferred consistency. `npm run adr:sync` synchronized the accepted index status.                                                                            |
| 2    | Establish the application metric catalogue; infrastructure observability owns instrument metadata and bounded attributes.                                                        | Plan catalogue; observability ownership rule; existing technical adapter boundary in `src/infra/observability`.                                                                     | Catalogue module and focused facade/adapter specs.                                                                                                   | Complete              | Focused facade/adapter specs assert names, units, kinds, allowed attributes, seconds conversion, status classes, and bounded attempts.                                                                                                                                                                                                           |
| 3    | Add the generic non-throwing metrics capability and runtime composition; shared owns the port, infrastructure owns the adapter/export lifecycle, and IoC only composes it.       | `ILogger`/`IReporter` contracts and mocks; `src/infra/observability/index.ts`; `src/infra/runtime/feature-flag-lifecycle.ts` bounded shutdown precedent.                            | Metrics contract/mock, vars contract/config/spec, OpenTelemetry adapter/setup/index and specs, direct dependencies, and configuration documentation. | Complete              | Focused config/observability suites pass: disabled behavior, counter/histogram/gauge mapping, deduplicated no-throw diagnostics, OTLP/HTTP periodic export, exponential histograms, cardinality limits, and bounded shutdown are asserted.                                                                                                       |
| 4    | Record one HTTP completion fact from the existing delivery boundary; the semantic facade owns metric mapping and the middleware owns the completion observation.                 | `makeRequestLoggerMiddleware` in `src/interface/http/middlewares/request-logger.middleware.ts`; HTTP middleware IoC in `src/infra/ioc/middlewares/http.ts`.                         | HTTP contract/mock/facade/spec, request-logger middleware/spec, HTTP middleware IoC.                                                                 | Complete              | Request-logger suite passes (5 tests): success, rejection, failure, unmatched, and slow paths record exactly once from normalized completion data while preserving log assertions.                                                                                                                                                               |
| 5    | Record enqueue and processing facts and expose provider-native BullMQ inventory; queue adapters/registrars own lifecycle facts and the internal server owns the scrape listener. | Queue producers under `src/infra/messaging/queues`; `registerBullMQWorker`; `registerRabbitMQConsumer`; `createBullMqServerAdapter`; BullMQ 5.78 `Queue.exportPrometheusMetrics()`. | Queue contract/mock/facade/spec, producer/config/worker/consumer/wiring specs, BullMQ metrics server/spec and server composition.                    | Complete (repository) | Focused producer, worker, consumer, wiring, and listener suites pass. Enqueue rejection/swallowing, worker rethrow, ack/nack, context, monotonic processing duration, available BullMQ wait, bounded attempts, metadata merging, `503`, and disabled listener behavior are asserted. External Alloy/RabbitMQ smoke verification remains pending. |
| 6    | Preserve the ledger-consistency boundary; queue instrumentation remains a technical proxy and application/domain behavior is unchanged.                                          | Explicit plan boundary; best-effort behavior in `makeLedgerAccountBalanceAdjustmentQueue`.                                                                                          | Ledger queue and worker-related diffs/tests only; absence searches for deferred contracts/state.                                                     | Complete              | Ledger enqueue failure still resolves after reporting and records only a technical queue failure. Source absence search confirms no use-case metrics wrapper, ledger-consistency contract, or propagation state was added.                                                                                                                       |
| 7    | Codify stable metric ownership, naming, units, privacy, cardinality, and migration rules.                                                                                        | `.agents/rules/observability.md` and `docs/08_cross_cutting_concepts.md`.                                                                                                           | Observability rule and cross-cutting documentation.                                                                                                  | Complete              | Rule, cross-cutting documentation, executable catalogue, and ADR define ownership, names, units, allowed attributes, fallback boundaries, privacy, provider-native inventory, migration expectations, and operational-signal limits.                                                                                                             |

Final repository verification:

- focused observability and instrumentation verification passes: 15 suites,
  52 tests;
- all source-layer suites pass: 286 suites, 2,324 tests;
- all 26 HTTP integration suites pass in bounded directory groups: 191 tests;
- `npm run lint`, `npx tsc --noEmit`, and `git diff --check` pass;
- the one-process full Jest invocation exits with signal 11 in this runtime,
  while the same 312 suites and 2,515 tests pass in stable partitions;
- `npm run build` completes TSOA generation, TypeScript compilation, and alias
  rewriting, then its final alias scan fails on the pre-existing
  `jest.mock('@infra/config/vars.config', ...)` string in
  `src/infra/observability/__specs__/reporter.spec.ts`; `HEAD` contains the same
  unrelated string, so it remains untouched; and
- the external Alloy/Grafana Cloud and Coolify-hosted RabbitMQ production smoke
  test remains unavailable from this repository and environment.

## Test Plan

- **Contract mocks:** add bare `jest.fn()` mocks typed by
  `IObservabilityMetrics`, `IHttpMetrics`, and `IQueueMetrics`. Confirm no
  payload interface is exported and no inline object type appears in a contract
  method signature through review and type checking.
- **Generic adapter:** verify counter, histogram/observation, and gauge mapping;
  attributes and units are preserved; disabled/test mode is safe; provider
  failures never escape to business callers; and shutdown/flush behavior is
  tested when the selected provider requires it.
- **HTTP facade:** verify stable metric names, request count and duration
  recording, bounded status-class transformation, normalized route usage, and
  absence of raw URL, correlation, user, and entity identifiers.
- **HTTP middleware:** extend the existing request-logger specs to verify one
  metrics call on successful, rejected, failed, unmatched, and slow requests
  while preserving all existing log assertions.
- **Queue facade:** verify enqueue and processing metric mappings, controlled
  transport/queue attributes, duration units, and bounded attempt values.
- **Queue producers:** verify successful enqueue recording and failure
  recording while preserving ledger queue best-effort swallowing and
  transactional email queue rejection.
- **BullMQ worker:** verify success/failure counts, processing and available
  waiting durations, attempt data, concurrent context isolation, existing
  reporter invocation, and error rethrow behavior.
- **BullMQ metrics listener:** verify every configured queue is represented,
  metric families contain one `HELP` and `TYPE` declaration, queue/state labels
  remain bounded, Redis/export failures return an unavailable scrape response,
  and the listener is disabled safely outside configured environments.
- **RabbitMQ consumer:** verify successful ack and failed nack measurements,
  duration recording, parse failures, context propagation, and unchanged
  reporter behavior.
- **Queue inventory:** verify Alloy scrapes one logical BullMQ target and keeps
  `bullmq_job_count` while dropping overlapping BullMQ lifecycle totals.
  Validate RabbitMQ ready, unacknowledged, consumer, connection, publish, and
  delivery measurements by scraping every Coolify-hosted RabbitMQ node.
- **Regression:** existing logger, reporter, HTTP, queue, worker, and
  application behavior remains unchanged when metric exporting is disabled or
  unavailable.

## Verification

Run focused observability and boundary tests first, then static analysis and the
broader suite:

```bash
npm test -- --runInBand src/infra/observability src/interface/http/middlewares/__specs__/request-logger.middleware.spec.ts src/infra/config/__specs__/bullmq.config.spec.ts src/infra/config/__specs__/rabbitmq.config.spec.ts src/infra/messaging/queues/__specs__ src/infra/server/__specs__/bullmq-metrics.spec.ts
npm run lint
npm run build
npm test -- --runInBand
```

Provider export verification requires a locally available Grafana Alloy process
or the deployed internal Alloy endpoint plus Grafana Cloud credentials. Keep it
as an explicit smoke test rather than making unit tests depend on external
infrastructure. The production smoke test must verify application OTLP/HTTP
ingestion, the single BullMQ scrape target, every Coolify-hosted RabbitMQ node on
port `15692`, label transformations, overlapping-series filters, and Grafana
Cloud query visibility.

## Assumptions

- Metric recording is best-effort and must never alter application results,
  transactions, HTTP responses, queue acknowledgments, retries, or error
  propagation.
- Existing application observations and log fields use milliseconds; semantic
  metrics facades convert duration values to seconds before recording the
  exported histogram.
- Normalized HTTP route templates and configured queue names are controlled,
  bounded attributes suitable for aggregation.
- Metric exporter setup can be disabled safely in local and test environments
  without requiring external infrastructure.
- The Coolify deployment can provide one internally reachable Grafana Alloy
  endpoint and one logical application scrape target; application behavior
  remains safe when Alloy is disabled or temporarily unavailable.
- Every RabbitMQ deployment is Coolify-hosted, and its deployment configuration
  can enable `rabbitmq_prometheus` and make port `15692` reachable to Alloy on
  the private network without publishing it externally.
- Grafana Cloud either preserves base-2 exponential histograms through the
  configured Alloy OTLP pipeline or accepts the documented explicit-boundary
  fallback.

## Risks

- **Cardinality and cost:** uncontrolled names or attributes can make the
  backend expensive or unusable. Mitigate with semantic facades, a centralized
  catalogue, and allowlisted attributes.
- **Behavioral regression:** instrumentation around queue errors could
  accidentally swallow or rethrow differently. Preserve each existing
  adapter's failure contract and test both paths explicitly.
- **Duplicate measurements:** retries, recursive balance propagation, and
  multiple completion hooks can overcount. Define whether metrics count
  attempts, successful jobs, or unique business outcomes and name them
  accordingly.
- **Misleading consistency signal:** treating one balance job as journal
  completion would produce a false SLI. Defer that metric until an aggregate or
  reconciliation-backed definition exists.
- **Telemetry feedback failure:** exporter errors must not cascade into
  application failures or unbounded fallback logs. Keep recording non-throwing
  and bound any diagnostic logging.
- **Startup and shutdown loss:** a push/export model may lose buffered values on
  abrupt exit. Add lifecycle flush behavior appropriate to the selected
  provider without delaying shutdown indefinitely.
- **Duplicate broker measurements:** the provider-native BullMQ export includes
  lifecycle series that overlap the application catalogue. Configure ownership
  explicitly and drop overlapping series in Alloy rather than counting both.
- **Metrics endpoint exposure:** accidentally publishing the BullMQ listener or
  RabbitMQ port `15692` would reveal operational topology and queue state.
  Bind them only to the Coolify private network and verify they are absent from
  the public proxy configuration.

## Completion Criteria

- The ADR records Grafana Alloy on Coolify as the internal collection boundary,
  Grafana Cloud as the backend, application OTLP/HTTP export, provider-native
  Prometheus queue scraping, the initial metric catalogue, semantic facade
  ownership, histogram policy, no-throw behavior, and cardinality rules.
- `IObservabilityMetrics`, `IHttpMetrics`, and `IQueueMetrics` exist with named,
  non-exported payload interfaces and no inline object parameter types.
- A direct OpenTelemetry metrics adapter and OTLP/HTTP periodic exporter are
  composed under `src/infra/observability`; authored code does not rely on
  transitive packages, bounded shutdown flushing is configured, and application
  instances send only to internal Grafana Alloy.
- HTTP requests produce one count and one duration observation with only
  allowlisted bounded attributes, while existing request logs remain unchanged.
- BullMQ and RabbitMQ processing and existing queue producers emit the approved
  enqueue/outcome/duration measurements without changing failure, retry,
  acknowledgment, or context behavior.
- A separate internal listener exposes BullMQ queue-state metrics to one logical
  Alloy scrape target without per-replica polling; Alloy keeps the state gauge
  and drops overlapping lifecycle totals.
- Every Coolify-hosted RabbitMQ node enables `rabbitmq_prometheus`, Alloy scrapes
  each node internally on port `15692`, and neither broker metrics nor the
  BullMQ listener is publicly exposed.
- Oldest-job age remains explicitly deferred unless a later plan introduces a
  single-owner bounded collector.
- Metric recording and exporter failures never alter business behavior and are
  covered by focused tests.
- Observability rules and cross-cutting documentation define metric ownership,
  naming, units, privacy, cardinality, and migration expectations.
- `IUseCaseMetrics`, use-case wrappers, TypeScript decorators, and domain-layer
  metric dependencies are absent from this implementation.
- `ILedgerConsistencyMetrics`, ledger propagation-state persistence, and
  journal-to-balance consistency claims are absent.
- Focused tests, lint, build, and the broader justified test suite pass, and
  unrelated files and behavior remain unchanged.
