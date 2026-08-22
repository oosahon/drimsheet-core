# ADR 0014: First-Class Observability Metrics

## Status

Superseded by ADR 0016

## Context

Drimsheet already emits structured logs and error reports, but it has no
first-class metrics contract, application-owned metric catalogue, exporter, or
queue-inventory scrape boundary. HTTP completion data and queue lifecycle
outcomes already have centralized technical owners, so metrics can be added at
those boundaries without instrumenting domain behavior or wrapping every use
case.

The production platform runs on Coolify and uses Grafana Cloud. Application
code must not contain Grafana Cloud credentials or provider-specific query and
routing policy. Metrics are best-effort operational signals and must never
change financial behavior, HTTP responses, transactions, queue retries, or
acknowledgements.

## Decision

- Application instances periodically export application-owned metrics over
  OTLP/HTTP to one Grafana Alloy service on the private Coolify network. Alloy
  owns Grafana Cloud credentials, resource processing, batching, retry policy,
  and backend egress.
- Grafana Alloy uses its standard `otelcol.*` components. The experimental
  `alloy otel` engine is not part of this architecture.
- Framework-neutral contracts live under `src/shared/contracts`:
  `IObservabilityMetrics` is the generic recording port, while `IHttpMetrics`
  and `IQueueMetrics` are semantic facades that own names, units,
  transformations, and allowed attributes. Payload types are named and remain
  module-private. Domain code and generic use-case wrappers do not depend on
  metrics.
- The infrastructure adapter uses the OpenTelemetry metrics SDK with a
  periodic OTLP/HTTP exporter. Export is disabled by default, calls are
  synchronous and non-throwing from the caller's perspective, instrument
  cardinality is capped, and shutdown uses a bounded flush timeout.
- Application histograms prefer base-2 exponential aggregation. If the
  deployed Alloy/Grafana Cloud smoke test does not preserve it, the documented
  explicit discovery boundaries become the compatibility fallback; changing
  to that fallback requires an operational query review rather than an
  incidental refactor.
- The application-owned catalogue initially contains HTTP request count and
  duration, queue enqueue operations, queue processing operations and duration,
  and trustworthy queue wait duration. Duration units are seconds. Attributes
  are limited to normalized HTTP method/route/status class/outcome and
  controlled queue/transport/outcome/bounded-attempt values.
- BullMQ inventory remains provider-owned. One separate internal listener calls
  `Queue.exportPrometheusMetrics()` for every configured queue. Alloy scrapes
  one logical listener per environment, keeps `bullmq_job_count`, and drops the
  overlapping BullMQ completed and failed totals.
- RabbitMQ inventory remains provider-owned. Every Coolify-hosted node enables
  `rabbitmq_prometheus`; Alloy scrapes internal port `15692` on every node. The
  BullMQ listener and RabbitMQ metrics ports are not added to the public Coolify
  proxy.
- Metric names and meanings are durable operational query contracts. Metric
  attributes must never include correlation IDs, user or accounting entity
  identifiers, journal or job IDs, email addresses, raw URLs, error messages,
  financial amounts, or other unbounded/private values.
- Metrics and provider-native queue inventory are approximate operational
  signals, not an authoritative accounting record. Journal-to-ledger
  consistency metrics remain deferred until reconciliation-backed completion
  and a durable start time exist.

## Consequences

### Positive

- HTTP and queue health can be aggregated without parsing log volume.
- Application code remains independent of Grafana Cloud and domain behavior
  remains independent of observability infrastructure.
- Controlled attributes, no-throw recording, and a single inventory scrape
  owner bound cardinality, cost, and failure impact.
- Provider-native queue state avoids per-replica polling and duplicate
  application gauges.

### Negative

- Grafana Alloy and RabbitMQ Prometheus configuration become production
  prerequisites outside this repository.
- Periodic export can lose a bounded amount of buffered telemetry during abrupt
  process termination.
- Metric renames, meaning changes, and attribute changes require coordinated
  operational query migrations.
- Final latency SLOs, dashboards, alerts, and exact ledger-consistency signals
  remain follow-up work after baseline measurements.
