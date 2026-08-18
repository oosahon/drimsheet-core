# 8. Cross-Cutting Concepts

This section outlines the foundational rules, patterns, and design decisions applied consistently across Drimsheet Core to meet our security, reliability, and accounting constraints.

## 8.1 Domain Object & Context Management (Multi-Tenancy)

Drimsheet natively supports multiple distinct contexts: Individuals, Sole Traders, and Organizations (Section 2.4).

- **Mechanism**: Every request to the core API establishes operational context early in the request lifecycle. Authenticated user context is derived from the access token, while accounting-entity context is resolved through the user-preferences application service. A valid owned `x-accounting-entity-id` is authoritative for that request. Without the header, the service restores the user's durable `user_preferences.last_active_accounting_entity_id` selection after checking ownership. An explicit unknown or inaccessible ID does not fall back to the stored preference. The resulting request-scoped context is injected into application use cases and repository calls, ensuring database queries, ledger operations, and reporting computations are isolated to the currently active accounting entity.
- **Selection lifecycle**: Every newly created user receives a preferences row with no active entity. Creating an accounting entity atomically makes it the user's durable last-active selection. An authenticated client can later call `POST /api/v1/accounting/accounting-entity/switch` with an owned accounting entity ID to atomically update that selection; the endpoint returns the canonical entity and also updates the current request context after commit. Later authenticated requests and logins restore a valid stored selection when no explicit header is supplied. A null or stale stored selection yields no active entity, and request initialization never guesses from the user's entity list or repairs preferences as a read side effect. `appContext` itself remains request-scoped; durability comes from user preferences.

## 8.2 Immutability & Auditability

To maintain strict adherence to accounting constraints (Section 2.2) and data integrity (Section 1.2), Drimsheet enforces an append-only architecture for all financial records.

- **Mechanism**:
  - **No Deletion**: Records such as Journal Entries cannot be deleted or mutated via `DELETE` or `UPDATE` statements that alter business meaning.
  - **Voiding**: Corrections must be made by posting a reversing journal entry.
  - **Auditable Trails**: Database triggers or repository base classes automatically capture state changes into a secure audit log, providing a complete historical trail of all financial actions regardless of the actor.

## 8.3 Double-Entry Core Validation

Drimsheet is fundamentally built on double-entry accounting principles.

- **Mechanism**: Every financial transaction must be perfectly balanced ($Credits = $Debits$). A centralized core validation service or interceptor inspects every proposed transaction before it reaches the database. If a transaction subledger and general ledger postings do not balance, the operation is structurally rejected, ensuring the database never enters an invalid financial state.

## 8.4 Authentication and Role-Based Access Control (RBAC)

The system serves distinct actors including Non-Accountants, Accountants, Auditors, and AI Agents. How permissions are handled depends heavily on the active accounting domain context:

- **RBAC in Organizations & Sole Traders**: True Role-Based Access Control is enforced only within Organization and Sole Trader domains. In these contexts, distinct roles (e.g., Owner, Auditor, invited Accountant) explicitly define permission boundaries. For instance, an Auditor is strictly limited to read-only views of the immutable logs.
- **Accountants vs. Non-Accountants (UX differentiation)**: For the "Individual" accounting context, the distinction between an Accountant and a Non-Accountant is primarily a user experience (UX) and setup difference, rather than an authorization wall. If a user identifies as a non-accountant, the system automatically handles the setup of their general ledger and provisions reasonable sub-ledgers. Accountants, on the other hand, are provided the tools to manually build and configure their ledgers and posting methods as they choose.

## 8.5 Multi-Currency and Exchange Rate Handling

To support consolidated Networth calculations across currencies (Section 2.4) and standard accounting practices:

- **Mechanism**:
  - **Storage**: All monetary values are processed and persisted as integers (e.g., base denominations like Kobo or Cents) to eliminate floating-point arithmetic errors.
  - **Exchange Management**: The system centrally manages exchange rates between supported currencies. Cross-currency operations consistently query this central exchange service to guarantee deterministic conversion rates across domains.

## 8.6 AI Agent Interaction & Security (MCP)

Autonomous logic via AI Agents is supported securely using the Model Context Protocol (MCP).

- **Mechanism**: Agents authenticate via dedicated API keys or service tokens with strictly defined scopes. MCP exposes specific, bounded operations (tools). Rate limiting is strictly enforced, and dangerous or highly sensitive operations remain gated requiring explicit human approval or out-of-band validation before execution.

## 8.7 External Integration Resilience & Idempotency

Drimsheet heavily relies on external services like Mono (bank feeds), Paystack (subscriptions), and FIRS Tax ProMax (tax remittals).

- **Mechanism**:
  - **Idempotency & Correlation**: Both incoming API requests and outgoing external mutations require unique idempotency keys to ensure network retries do not result in duplicate operations (e.g., duplicate payments, ledger entries, or tax filings). Additionally, correlation IDs are mandated across all requests to trace the complete lifecycle of an operation across distributed boundaries. At HTTP ingress, a caller-supplied `x-correlation-id` is preserved unchanged only when it is a valid UUID. A missing or invalid value is replaced with one server-generated UUID without rejecting the request; that canonical value is stored in request context and echoed in the response header. The rejected value is not retained, logged, or reported.
  - **Resilience**: Asynchronous queues (e.g., BullMQ on Redis, RabbitMQ consumers) or dead-letter queues (DLQ) are utilized to handle transient failures, employing exponential backoff for retries to ensure eventual consistency globally.

## 8.8 Tax Policy Versioning

Nigeria Tax Act (NTA) regulations frequently evolve, meaning older transactions must be evaluated under the rules that governed them at the time.

- **Mechanism**: Tax calculation logic is versioned and decoupled from core ledgers. When tax obligations are calculated, the engine evaluates the journal or reporting period's effective date against a repository of historical tax rules, rather than indiscriminately applying the most current law.

## 8.9 Validation, Error Handling, and Logging

To ensure only clean data enters the system and anomalous states are captured:

- **Data Validation (Zod)**: Zod is enforced at the system boundary (API endpoints and MCP tool inputs) to guarantee malformed or malicious payloads are rejected before they touch business logic.
- **Standardized Error Handling**: Errors are wrapped in a standard domain format so that clients cleanly differentiate between user errors (e.g., "Insufficient Balance") and system errors.
- **Observability logs (Grafana Cloud, Grafana Alloy, Winston)**: Every non-local log line is one structured JSON record containing a stable operational event, runtime service/environment/version metadata, request or worker correlation, and validated active Sentry `traceId`/`spanId` when a span exists. Grafana Alloy collects Docker stdout and sends it to Grafana Cloud Loki; application containers contain no Grafana credentials. Local development keeps readable colorized output. Reporting callers supply only allowlisted operational facts; complete requests, jobs, payloads, user or product identifiers, email content, IP addresses, raw URLs, and financial values are prohibited. The logger and reporter serialize errors as sanitized name, message, stack, and `errorKey` only, without causes or arbitrary custom properties. Recursive sanitization remains a defense-in-depth boundary, and request logs use normalized route templates rather than raw URLs or query strings. These records are logs, not metrics; event naming, controlled outcomes, privacy, and cardinality follow [the canonical observability rule](../.agents/rules/observability.md).
- **Sentry reporting and tracing privacy boundary**: Sentry initializes before the runtime dependency graph, with default PII collection disabled and environment-controlled trace sampling. Every error/message event, transaction, and child span passes through a strict application allowlist. Request bodies, URLs, query strings, headers, cookies, user identity, arbitrary span data, SQL values, financial data, and health-check transactions are removed. Sentry retains bounded reporter facts, normalized HTTP route identity, controlled use-case/queue operations, canonical exception identity and stack, release/environment metadata, safe runtime context, and trace identity. Sentry project-side data scrubbing must also remain enabled as an independent backstop; it does not permit application code to send sensitive data.
- **Application and queue span boundaries**: The 35 entry points composed in `src/infra/ioc/usecases` run in stable `app.usecase` spans without adding Sentry dependencies to application or domain code. BullMQ producers place propagation data beside the DTO in an infrastructure-only versioned envelope; consumers accept both that envelope and legacy raw jobs. RabbitMQ consumers read only `sentry-trace` and `baggage` headers. Consumers create controlled `queue.process` roots when no valid parent exists. Tracing failures never change use-case returns, queue retries, RabbitMQ acknowledgements, or ledger propagation failure semantics.
- **Observability metrics (OpenTelemetry, Grafana Alloy, Grafana Cloud)**: Application instances export best-effort metrics periodically over OTLP/HTTP to Grafana Alloy on the private Coolify network. Export is disabled by default and application code contains no Grafana Cloud credentials. `IObservabilityMetrics` provides the tool-agnostic recorder, while `IHttpMetrics` and `IQueueMetrics` own the semantic catalogue, seconds conversion, and bounded attribute policy. OTel resource identity supplies bounded service name, deployment release, environment, and container instance fields once per process. Recording and bounded shutdown-flush failures never change HTTP, transaction, queue retry, or acknowledgement behavior.
- **Runtime health**: `/health/live` is dependency-free. `/health/ready` requires completed startup and a one-second PostgreSQL probe because PostgreSQL contains the authoritative journal. Optional balance-propagation, messaging, feature-flag, and telemetry dependencies are monitored but are deliberately non-gating.

After an observability deployment, an operator must inspect raw Sentry event
JSON and structured log records using synthetic canary values, never customer
data. Exercise HTTP, queue, auth, ledger, and abuse failures and verify that:

- canary email, identifier, amount, cookie, header, URL-query, job, and payload
  values are absent;
- event, `errorKey`, stack, queue/transport/attempt, rate-limit method/scope,
  release/environment, and correlation remain queryable; and
- Sentry project-side sensitive-field rules and retention settings match the
  deployment policy.

Historical event deletion or credential rotation is a separate operational
action requiring explicit authorization.

The initial application-owned metrics are:

| Metric                                | Instrument | Unit          | Allowed attributes                               |
| ------------------------------------- | ---------- | ------------- | ------------------------------------------------ |
| `http.server.requests`                | Counter    | `{request}`   | method, normalized route, status class, outcome  |
| `http.server.request.duration`        | Histogram  | `s`           | method, normalized route, status class, outcome  |
| `messaging.client.enqueue.operations` | Counter    | `{operation}` | controlled queue, transport, outcome             |
| `messaging.process.operations`        | Counter    | `{operation}` | controlled queue, transport, outcome, attempt    |
| `messaging.process.duration`          | Histogram  | `s`           | controlled queue, transport, outcome             |
| `messaging.process.wait.duration`     | Histogram  | `s`           | controlled queue and transport, when trustworthy |

Histograms prefer base-2 exponential aggregation. If the deployed
Alloy/Grafana Cloud pipeline does not preserve it, the compatibility
boundaries in `src/infra/observability/metric-catalogue.ts` become the explicit
fallback. Baseline distributions must be collected for two to four weeks
before final latency SLOs are proposed.

Application metrics configuration is intentionally provider-neutral:

| Environment variable         | Default | Purpose                                                   |
| ---------------------------- | ------- | --------------------------------------------------------- |
| `METRICS_ENABLED`            | `false` | Enables application OTLP/HTTP export explicitly.          |
| `METRICS_OTLP_HTTP_ENDPOINT` | empty   | Internal Alloy URL ending in `/v1/metrics`.               |
| `BULLMQ_METRICS_PORT`        | `0`     | Separate internal scrape listener; `0` keeps it disabled. |

Tracing sampling is also environment-controlled:

| Environment variable        | Default | Purpose                                 |
| --------------------------- | ------- | --------------------------------------- |
| `SENTRY_TRACES_SAMPLE_RATE` | `0`     | Trace sample rate from `0` through `1`. |

Core exports metrics every 60 seconds and bounds metrics and Sentry shutdown
at 5 seconds. Docker `HOSTNAME` supplies the bounded metrics instance identity.
Sentry outbound HTTP trace propagation remains empty until Core has a
first-party downstream service.

`APP_VERSION` is always read from `package.json`; environment values cannot
override it. The package version is shared by logs, metrics, and the Sentry
runtime release.

See [the observability operations runbook](observability-operations.md) for
deployment values, manual verification, deferred operational work, and privacy
canaries.

Queue inventory remains provider-owned. Alloy scrapes one logical internal
BullMQ listener per environment, keeps `bullmq_job_count`, and drops the
overlapping `bullmq_job_completed_total` and `bullmq_job_failed_total` series.
Every Coolify-hosted RabbitMQ node enables `rabbitmq_prometheus`, and Alloy
scrapes each node on private port `15692` for ready, unacknowledged, consumer,
connection, publish, and delivery measurements. Neither the BullMQ listener nor
RabbitMQ metrics ports belong in the public Coolify proxy. Oldest-job age and
journal-to-ledger consistency remain deferred; lifecycle metrics are
operational proxies, not accounting truth. See
[ADR 0014](adrs/0014-first-class-observability-metrics.md).
