# Observability Operations Runbook

## Purpose and ownership

Purple Ledger Core uses Grafana Cloud for structured logs and metrics, Sentry
for traces and unexpected-error reporting, and Coolify for deployment health.
Grafana Alloy is the only component that owns Grafana Cloud write credentials.
It is deployed separately from the Git-backed `drimsheet-observability`
repository on the same private Coolify network as Core, BullMQ, and RabbitMQ.

The authoritative accounting rule is unchanged: a committed journal entry is
the source of truth. Ledger-balance propagation is an asynchronous projection.
Enqueue, worker, telemetry, or dashboard failures must alert operators but must
never convert a successful journal commit into a failed request.

## Core runtime configuration

Store deployment values in Doppler/Coolify, not Git. Configure each environment
independently:

```dotenv
APP_INSTANCE_ID=<optional-stable-instance-identifier>

SENTRY_DSN=<project-dsn>
SENTRY_TRACES_SAMPLE_RATE=1
SENTRY_TRACE_PROPAGATION_TARGETS=https://<first-party-api-origin>
SENTRY_FLUSH_TIMEOUT_MS=5000

METRICS_ENABLED=true
METRICS_OTLP_HTTP_ENDPOINT=http://<alloy-private-host>:4318/v1/metrics
METRICS_EXPORT_INTERVAL_MS=60000
METRICS_SHUTDOWN_TIMEOUT_MS=5000
BULLMQ_METRICS_PORT=9464
```

Use trace sampling `1` temporarily in development/staging validation. Start
production with a cost-safe reviewed value, such as `0.10`, and adjust it from
observed event volume. An empty DSN and a sample rate of `0` disable Sentry
safely. `APP_VERSION` is always the version in `package.json` and must not be
set in Doppler or Coolify. When `APP_INSTANCE_ID` is omitted, the Docker
`HOSTNAME` is used.

Keep Alloy OTLP port `4318`, the BullMQ scrape port, RabbitMQ `15692`, and the
Alloy component UI private. Do not place Grafana Cloud credentials in Core.

## Coolify health configuration

Configure the Core service health check as follows:

- path: `/health/ready`;
- expected status: `200`;
- timeout: less than the polling interval;
- startup grace: longer than migrations and asynchronous bootstrap; and
- failure threshold: enough consecutive failures to avoid routing flaps.

`/health/live` proves only that Node can serve HTTP. `/health/ready` remains
`503` until startup finishes and returns `503` during PostgreSQL loss. Redis,
BullMQ, RabbitMQ, Alloy, Grafana Cloud, Sentry, LaunchDarkly, and external API
outages must not change readiness.

## Sentry release and source maps

Build before upload and use a build-only `SENTRY_AUTH_TOKEN`:

```bash
npm run build
npm run sentry:sourcemaps
```

Do not expose the auth token to the running container. Upload source maps from
the same build that is deployed. Verify that the Sentry runtime release equals
the deployed `package.json` version and that a synthetic stack frame resolves
to the TypeScript source.

Configure Sentry alert ownership and notification routes for:

- new or regressed unexpected issues and startup failures;
- `ledger.balance_propagation.failed`;
- `queue.job.enqueue_failed`, final/repeated BullMQ processing failure, and
  RabbitMQ processing failure;
- integration failures; and
- HTTP, `app.usecase`, and `queue.process` performance regressions after a real
  baseline exists.

## Grafana dashboards and alerts

Maintain three dashboards per environment:

1. Core service: request rate, status-class outcomes, p50/p95/p99 latency,
   instance CPU/memory/restarts, current release, and relevant structured logs.
2. Queues and ledger projection: application enqueue/process outcomes and
   duration, BullMQ waiting/active/delayed/failed inventory, RabbitMQ ready/
   unacknowledged/consumer inventory, and projection failure logs.
3. Telemetry pipeline: Alloy receiver/exporter health, scrape health,
   remote-write retries/backlog, last log/metric timestamps, and ingestion cost.

Create immediate alerts for:

- no application metrics from a ready deployed service;
- any balance-adjustment enqueue failure;
- repeated or final-attempt balance-adjustment processing failure;
- growing BullMQ waiting/failed backlog or a missing worker;
- RabbitMQ consumer loss or sustained ready/unacknowledged growth;
- Alloy receiver/exporter or remote-write failure;
- restart loops or sustained readiness failure; and
- sustained HTTP 5xx responses using a conservative absolute threshold.

Do not label lifecycle signals as proof of journal-to-ledger consistency. Exact
consistency and lag require reconciliation-backed durable completion.

## Deployment smoke test

The repeatable staging test is `npm run smoke:observability:staging`. Copy
`scripts/observability-smoke.env.example` to an ignored environment file, fill
it with staging/backend values, source it, and validate the setup before making
requests:

```bash
set -a
source .env.observability-smoke
set +a
npm run smoke:observability:staging -- --check-config
npm run smoke:observability:staging
```

The file referenced by `OBS_SMOKE_QUEUE_PROBES_FILE` must remain uncommitted
because it can contain staging authorization. Use synthetic accounts and data.
Its schema is:

```json
{
  "queueProbes": [
    {
      "name": "transactional-email",
      "method": "POST",
      "path": "/api/v1/<synthetic-trigger>",
      "headers": { "authorization": "Bearer <staging-token>" },
      "body": { "synthetic": true },
      "expectedStatus": [200, 202],
      "expectedQueues": ["transactional-email-queue"]
    }
  ]
}
```

Add a probe for every queue path under test, including
`ledger-account-balance-adjustment-queue`. The command supplies a distinct
correlation ID to every request, locates its structured Loki log, extracts the
Sentry trace ID, and requires the expected `queue.process` transaction and
queue name in that same trace. It also requires:

- live and ready health checks;
- a successful and rejected exchange-rate request;
- all six application metric families;
- BullMQ and RabbitMQ inventory metrics; and
- Grafana receiver-test acceptance followed by operator-confirmed delivery.

Leave `OBS_SMOKE_ALERT_DELIVERY_CONFIRMED=false` for the first run. After the
test notification arrives at the configured destination, set it to `true` and
rerun to produce a passing JSON report. Store that output with the deployment
evidence; secrets and response bodies are deliberately omitted.

The automated command covers safe remote assertions. Complete these
environment-level drills in development, then staging:

1. Enqueue a legacy raw BullMQ job and confirm it still processes.
2. Consume one RabbitMQ exchange-rate message with and without trace headers.
   Confirm acknowledgement/nack behavior is unchanged.
3. Restart Alloy and verify log positions resume without rereading unbounded
   history and metrics recover without application intervention.
4. Trigger each alert rule through a synthetic signal and record the contact point,
   owner, severity, runbook link, and recovery condition.

## Privacy canary

Use synthetic values only. Exercise HTTP, auth, queue, integration, reporting,
and ledger-projection failures with canary email, user/entity/job identifiers,
tokens, cookies, request headers, URL queries, SQL values, payload fields, and
financial amounts. Inspect raw Loki records and raw Sentry error/transaction
JSON, not only rendered UI summaries.

The canaries must be absent. The following bounded operational fields should
remain queryable: event, `errorKey`, normalized route and method, outcome,
queue, transport, attempt, release, environment, correlation ID, trace ID, span
operation, and controlled use-case/queue name. Fix the earliest leaking
boundary before increasing trace sampling or production rollout.

## Rollout completion

After development and staging drills pass, deploy production at the reviewed
sampling rate. Collect two to four weeks of real latency and availability
distributions before setting SLO and burn-rate thresholds. Record the selected
thresholds, owner, review date, retention, and cost decision in this runbook or
the team operations system.
