# Observability Operations Runbook

## Purpose and ownership

Drimsheet Core uses Grafana Cloud for structured logs and metrics, Sentry
for traces and unexpected-error reporting, and Coolify for deployment health.
Grafana Alloy is the only component that owns Grafana Cloud write credentials.
It is deployed separately from the Git-backed `drimsheet-observability`
repository on the same private Coolify network as Core, BullMQ, and RabbitMQ.

The authoritative accounting rule is unchanged: a committed journal entry is
the source of truth. Ledger-balance propagation is an asynchronous projection.
Enqueue, worker, or telemetry failures require operator investigation but must
never convert a successful journal commit into a failed request.

## Core runtime configuration

Store deployment values in Doppler/Coolify, not Git. Configure each environment
independently:

```dotenv
SENTRY_DSN=<project-dsn>
SENTRY_TRACES_SAMPLE_RATE=1

METRICS_ENABLED=true
METRICS_OTLP_HTTP_ENDPOINT=http://<alloy-private-host>:4318/v1/metrics
BULLMQ_METRICS_PORT=9464
```

Use trace sampling `1` temporarily in development/staging validation. Start
production with a cost-safe reviewed value, such as `0.10`, and adjust it from
observed event volume. An empty DSN and a sample rate of `0` disable Sentry
safely. `APP_VERSION` is always the version in `package.json` and must not be
set in Doppler or Coolify. Docker `HOSTNAME` supplies the bounded service
instance identity. Core exports metrics every 60 seconds and bounds metrics and
Sentry shutdown at 5 seconds. Outbound Sentry HTTP trace propagation remains
disabled until Core has a first-party downstream service.

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

The build automatically injects and uploads source maps when `SENTRY_DSN` is
configured. Use a build-only `SENTRY_AUTH_TOKEN`:

```bash
npm run build
```

The build skips the upload when `SENTRY_DSN` is empty. When Sentry is
configured, an injection or upload error fails the build. Do not expose the
auth token to the running container. Upload source maps from the same build
that is deployed. Verify that the Sentry runtime release equals the deployed
`package.json` version and that a synthetic stack frame resolves to the
TypeScript source.

## Deferred dashboards and alerts

Final dashboards, SLOs, alert rules, notification routes, and alert-delivery
tests remain follow-up work until production measurements establish thresholds
and an operational owner accepts them. Do not treat lifecycle telemetry as
proof of journal-to-ledger consistency; exact consistency and lag require
reconciliation-backed durable completion.

## Manual deployment checklist

Complete these checks in development and then staging with synthetic accounts
and data:

1. Confirm `/health/live` and `/health/ready` return `200` after startup.
2. Exercise one current authenticated request successfully and one current
   request that the application rejects. Confirm their structured logs arrive
   with the expected normalized route, outcome, correlation ID, and release.
3. Exercise an existing product flow that enqueues BullMQ work and a current
   RabbitMQ exchange-rate flow. Confirm the producer and consumer spans are
   linked in Sentry and queue acknowledgement/retry behavior is unchanged. Do
   not add synthetic product endpoints solely for this checklist.
4. Confirm the current application metric families arrive through Alloy and
   that the BullMQ and RabbitMQ provider-owned inventory series are present.
5. Confirm Sentry receives a sampled trace at the reviewed environment rate and
   an unexpected synthetic error with source maps resolved to TypeScript.

These checks require deployed Coolify, Alloy, Grafana Cloud, Sentry Cloud,
BullMQ, and RabbitMQ infrastructure and credentials. They are not local or
pre-push automation. Cross-cloud API automation, synthetic queue-trigger
endpoints, dashboards, alerts, and alert-delivery tests may be designed after
their supported APIs and operational owners exist.

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
