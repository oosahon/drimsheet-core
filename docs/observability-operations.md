# Observability Operations Runbook

## Purpose and ownership

Drimsheet Core sends canonical Winston logs and application-owned OpenTelemetry
metrics directly to Better Stack. Sentry remains the sole owner of tracing and
unexpected-error reporting, and Coolify owns deployment health. There is no
observability collector, Grafana write path, Prometheus scrape listener, or
dual-write compatibility path.

The authoritative accounting rule is unchanged: a committed journal entry is
the source of truth. Ledger-balance adjustments and propagation run
asynchronously. Enqueue, worker, exporter, or telemetry failures require
operator investigation but must never convert a successful journal commit into
a failed request.

## Core runtime configuration

Create one Better Stack OpenTelemetry source per deployed environment. Copy the
exact source token and regional ingestion host from that source's configuration
page into Doppler/Coolify; never store them in Git or build arguments.

```dotenv
BETTER_STACK_SOURCE_TOKEN=<environment-source-token>
BETTER_STACK_INGESTING_HOST=<regional-ingesting-host>

SENTRY_DSN=<project-dsn>
SENTRY_TRACES_SAMPLE_RATE=1
```

Both Better Stack values must be present and valid. An empty pair disables
remote logs and metrics safely. A partial pair or a host containing a scheme,
path, port, or invalid hostname produces one sanitized console warning and
disables both paths without changing startup or readiness. Core derives the
HTTPS log root and `/v1/metrics` endpoint internally.

Use Sentry trace sampling `1` temporarily in development/staging validation.
Start production with a cost-safe reviewed value, such as `0.10`, and adjust it
from observed event volume. An empty DSN and sample rate `0` disable Sentry
safely. `APP_VERSION` always comes from `package.json`; Docker `HOSTNAME`
supplies the bounded service instance identity.

Core keeps console logs, exports metrics every 60 seconds, uses gzip for OTLP
metrics, and bounds Better Stack log flush, metric shutdown, and Sentry flush at
five seconds. Sentry outbound HTTP trace propagation remains disabled until
Core has a first-party downstream service.

## Coolify health configuration

Configure the Core service health check as follows:

- path: `/health/ready`;
- expected status: `200`;
- timeout: less than the polling interval;
- startup grace: longer than migrations and asynchronous bootstrap; and
- failure threshold: enough consecutive failures to avoid routing flaps.

`/health/live` proves only that Node can serve HTTP. `/health/ready` remains
`503` until startup finishes and returns `503` during PostgreSQL loss. Redis,
BullMQ, Better Stack, Sentry, LaunchDarkly, and external API outages
must not change readiness.

## Sentry release and source maps

The build automatically injects and uploads source maps when `SENTRY_DSN` is
configured. Use a build-only `SENTRY_AUTH_TOKEN`:

```bash
npm run build
```

The build skips upload when `SENTRY_DSN` is empty. When Sentry is configured,
an injection or upload error fails the build. Do not expose the auth token to
the running container. Upload source maps from the same build that is deployed.
Verify the Sentry runtime release equals the deployed `package.json` version
and a synthetic stack frame resolves to TypeScript source.

## Provider-native inventory scope

The direct MVP deliberately does not collect BullMQ queue-depth metrics. Core
exposes no BullMQ Prometheus listener and must not poll providers to recreate
queue-state gauges. Application enqueue,
processing count, duration, and trustworthy wait-duration metrics remain. Use
Bull Board for direct BullMQ inspection.

## CBN exchange-rate cron

Coolify runs `yarn ingest:exchange-rates` from the already-built Core image
after migrations have been applied. Supply `POSTGRES_URL` and the same optional
Sentry/Better Stack values used by Core. The process owns up to three bounded
attempts for transient CBN/PostgreSQL faults, structured lifecycle events,
resource cleanup, and its terminal exit status. Coolify owns the schedule and
any platform-level rerun policy. Alert on non-zero exits and the
`integration.cbn_exchange_rate.failed` event.

## Deployment and cutover checklist

Complete these checks in development and staging with synthetic accounts and
data before changing production:

1. Create an environment-specific Better Stack OpenTelemetry source and inject
   its token and exact ingestion host into Core through Doppler/Coolify.
2. Confirm `/health/live` and `/health/ready` return `200` after startup.
3. Exercise one authenticated request successfully and one request the
   application rejects. Confirm their raw Better Stack records contain the
   normalized route, outcome, correlation ID, environment, and release.
4. Exercise an existing flow that enqueues and processes BullMQ work. After at
   least one 60-second interval, confirm the existing HTTP and queue metric
   families arrive with bounded attributes and seconds-based durations.
5. Confirm Sentry receives a sampled trace and an unexpected synthetic error,
   with source maps resolving to TypeScript. Confirm no traces or error reports
   are sent to Better Stack.
6. Stop Grafana Alloy without deleting it. Repeat the raw Better Stack log and
   metric checks to prove Core uses direct ingestion, then repeat the Sentry
   checks independently.
7. Run the privacy canary below. Restore Alloy if any retained signal is
   missing and investigate before decommissioning.

These are deployed checks requiring Better Stack, Coolify, Doppler, Sentry,
and BullMQ credentials. They are not local or pre-push automation.

## Privacy canary

Use synthetic values only. Exercise HTTP, auth, queue, integration, reporting,
and ledger-propagation failures with canary email, user/entity/job identifiers,
tokens, cookies, request headers, URL queries, SQL values, payload fields, and
financial amounts. Inspect raw Better Stack records and raw Sentry
error/transaction JSON, not only rendered UI summaries.

The canaries must be absent. The following bounded operational fields should
remain queryable: event, `errorKey`, normalized route and method, outcome,
queue, transport, attempt, release, environment, correlation ID, trace ID, span
operation, and controlled use-case/queue name. Fix the earliest leaking
boundary before increasing trace sampling or production rollout.

## Old stack retirement

Only after the Alloy-stopped staging checks and privacy canary pass:

1. deploy production with its own Better Stack source and repeat the direct
   log, metric, and Sentry verification;
2. delete the Alloy Coolify resource and persistent volume, then remove its
   Docker socket access and environment variables;
3. archive the dedicated `drimsheet-observability` repository rather than
   converting it into a Better Stack collector deployment;
4. revoke the Drimsheet Grafana write credential; and
5. after a read-only consumer check confirms the Grafana stack/subscription is
   not shared, remove it. Historical telemetry is intentionally not migrated.

Final dashboards, SLOs, alerts, on-call routes, and synthetic endpoints remain
follow-up work until production measurements establish thresholds and an
operational owner accepts them.
