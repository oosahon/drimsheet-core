# ADR 0016: Direct Better Stack Observability

## Status

Accepted

## Context

Drimsheet needs hosted structured logs and application metrics without operating
a dedicated observability collector. The previous topology sent application
metrics to Grafana Alloy, exposed BullMQ metrics for Alloy to scrape, let Alloy
scrape RabbitMQ, and relied on Alloy's Docker discovery to forward stdout logs
to Grafana Cloud.

The application already owns stable Winston log records and an OpenTelemetry
application metric catalogue. Those signals are approximate and best-effort;
committed accounting data remains authoritative. Sentry independently owns
tracing and unexpected-error reporting and does not depend on the Grafana
topology.

## Decision

- Drimsheet Core sends canonical Winston logs and its existing application
  metrics directly to one Better Stack OpenTelemetry source per environment.
- `BETTER_STACK_SOURCE_TOKEN` and `BETTER_STACK_INGESTING_HOST` are the only
  Better Stack runtime settings. Both must be present and valid to enable
  remote export. Doppler and Coolify own their environment-specific values;
  neither has a non-empty repository default or a legacy alias.
- The official Better Stack Winston client and transport send non-local logs to
  the source's HTTPS ingestion root. Console logging remains enabled, and the
  client joins the existing bounded, idempotent observability shutdown.
- The existing OpenTelemetry metrics SDK sends metrics to the source's
  `/v1/metrics` OTLP/HTTP endpoint with Bearer authorization and gzip. The
  application metric catalogue, resource identity, cardinality limits,
  60-second interval, five-second shutdown bound, and non-throwing recorder
  semantics remain unchanged. Histograms use the SDK's standard aggregation.
- Sentry remains the sole backend for tracing and unexpected-error reporting,
  including its existing privacy, sampling, source-map, and shutdown behavior.
- No observability collector, scrape listener, dual-write path, Grafana
  compatibility alias, or replacement provider abstraction is introduced.
- BullMQ and RabbitMQ provider-native inventory is intentionally uncollected in
  this MVP. Queue lifecycle metrics remain available, and Bull Board remains
  the direct operational inspection surface for BullMQ.

## Consequences

### Positive

- Core has one direct, application-owned path for retained logs and metrics.
- The Alloy deployment, its Docker socket access, scrape endpoints, and Grafana
  write credentials can be retired after staging verification.
- Application callers remain independent of the hosted telemetry provider and
  observability failures remain outside readiness and business behavior.

### Negative

- Direct exporters have no durable collector buffer, so abrupt termination or
  provider outages can lose buffered telemetry.
- The Better Stack source token is present in the Core runtime and must remain
  a per-environment, write-only secret.
- BullMQ queue depth and RabbitMQ broker/node inventory are unavailable in the
  MVP unless inspected through their provider-native operational tools.
