# Observability Events

Operational log events are durable query contracts. Use exactly:

```text
<namespace>.<subject>.<fact>
```

Each event must match
`^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`. Dots express
ownership hierarchy; underscores join words within one segment.

## Names

- Use a product namespace such as `accounting`, `auth`, `counterparty`,
  `exchange_rate`, `journal_entry`, `ledger`, `money`, `notification`, or
  `user`, or a technical namespace such as `cache`, `database`, `event`,
  `http`, `integration`, `observability`, `queue`, `runtime`, or `security`.
- Make the subject a singular noun or named capability.
- Make the fact a past-tense fact or observed condition.
- Prefer lifecycle facts `started`, `completed`, `failed`, `cancelled`, and
  `skipped`; domain facts `created`, `updated`, `deleted`, `verified`,
  `published`, and `adjusted`; and conditions `missing`, `invalid`, `expired`,
  `exhausted`, `unavailable`, and `threshold_exceeded`.
- Use a compound fact such as `enqueue_failed`, `processing_failed`, or
  `correlation_id_missing` only when the subject does not identify the
  operation clearly enough.

Use `outcome` only as one of `success`, `failure`, `rejected`, `skipped`,
`cancelled`, or `unknown`. The event states what happened; the outcome supports
cross-event aggregation.

## Canonical Record

Canonical fields are `timestamp`, `level`, `event`, `message`, `service`,
`environment`, `version`, `correlationId`, `traceId`, `spanId`, `outcome`,
`durationMs`, and `errorKey`. The logger owns event identity, level, time,
service metadata, environment, version, and contextual correlation. Caller
fields cannot overwrite logger-owned values.

Use numeric values for durations and byte sizes. Keep identifiers and changing
values in structured fields, not in the event or message. Error fields must be
plain serializable values containing sanitized identity, message, stack, and
`errorKey` when available.

## Stability, Privacy, and Cardinality

- Never put dynamic identifiers, status codes, environment names, versions,
  raw URLs, user identifiers, or query strings in an event name.
- Do not put vendor names outside an `integration` boundary.
- Prefer normalized route templates and controlled fallbacks over raw paths.
- Do not log secrets, credentials, tokens, email addresses, or unnecessary
  personal or financial data. Include identifiers only when a concrete
  diagnostic need justifies their privacy and cardinality cost.
- Renaming an event or changing its meaning requires a deliberate operational
  query migration.
- Operational events are logs. Do not describe log records as metrics.

Examples:

```text
runtime.server.started
http.request.completed
http.request.threshold_exceeded
queue.job.processing_failed
integration.rabbitmq.disconnected
```

Counterexamples:

```text
http.GET./users/123.200
production.server.v0_1_0
auth.user_42.login
request completed
```

## Metrics

Metrics are durable operational query contracts distinct from logs. Semantic
metrics facades own stable names, instrument kinds, units, transformations, and
attribute allowlists; callers provide bounded facts and must not construct
metric names or arbitrary attributes.

- Use lowercase dot-separated names that describe the measured operation or
  state. A rename or meaning change requires an operational query migration.
- Use explicit OpenTelemetry units. Export durations in seconds (`s`), even
  when an existing application observation is supplied in milliseconds.
- Use controlled queue names, normalized route templates, status classes,
  controlled transports and outcomes, and bounded attempt values only.
- Never attach correlation IDs, user IDs, accounting-entity IDs, journal or
  ledger account IDs, job IDs, email addresses, raw URLs, query strings, error
  messages, financial amounts, or other private or unbounded values.
- Cap instrument cardinality in the metrics SDK in addition to enforcing
  semantic attribute allowlists.
- Metric recording is best-effort and non-throwing. Exporter, recorder, or
  shutdown failures must not alter application results, transactions, HTTP
  responses, queue retries, or acknowledgements.
- Provider-native inventory remains owned by its provider. Do not duplicate
  queue state as application gauges or count overlapping provider and
  application lifecycle series.
- Provider-native BullMQ and RabbitMQ inventory is intentionally uncollected in
  the direct Better Stack MVP. Do not recreate it in application code or add a
  scrape listener without a new approved operational requirement.
- Metrics are approximate operational signals. They do not replace domain
  events, reconciliation, persistence, audit history, or the authoritative
  accounting record.

The application catalogue originated in
[ADR 0014](../../docs/adrs/0014-first-class-observability-metrics.md); the active
export topology and deliberate inventory omission are recorded in
[ADR 0016](../../docs/adrs/0016-direct-better-stack-observability.md).
