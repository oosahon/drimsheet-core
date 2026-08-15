# 8. Cross-Cutting Concepts

This section outlines the foundational rules, patterns, and design decisions applied consistently across PurpleLedger Core to meet our security, reliability, and accounting constraints.

## 8.1 Domain Object & Context Management (Multi-Tenancy)

PurpleLedger natively supports multiple distinct contexts: Individuals, Sole Traders, and Organizations (Section 2.4).

- **Mechanism**: Every request to the core API establishes operational context early in the request lifecycle. Authenticated user context is derived from the access token, while accounting-entity context is resolved through the user-preferences application service. A valid owned `x-accounting-entity-id` is authoritative for that request. Without the header, the service restores the user's durable `user_preferences.last_active_accounting_entity_id` selection after checking ownership. An explicit unknown or inaccessible ID does not fall back to the stored preference. The resulting request-scoped context is injected into application use cases and repository calls, ensuring database queries, ledger operations, and reporting computations are isolated to the currently active accounting entity.
- **Selection lifecycle**: Every newly created user receives a preferences row with no active entity. Creating an accounting entity atomically makes it the user's durable last-active selection. An authenticated client can later call `POST /api/v1/accounting/accounting-entity/switch` with an owned accounting entity ID to atomically update that selection; the endpoint returns the canonical entity and also updates the current request context after commit. Later authenticated requests and logins restore a valid stored selection when no explicit header is supplied. A null or stale stored selection yields no active entity, and request initialization never guesses from the user's entity list or repairs preferences as a read side effect. `appContext` itself remains request-scoped; durability comes from user preferences.

## 8.2 Immutability & Auditability

To maintain strict adherence to accounting constraints (Section 2.2) and data integrity (Section 1.2), PurpleLedger enforces an append-only architecture for all financial records.

- **Mechanism**:
  - **No Deletion**: Records such as Journal Entries cannot be deleted or mutated via `DELETE` or `UPDATE` statements that alter business meaning.
  - **Voiding**: Corrections must be made by posting a reversing journal entry.
  - **Auditable Trails**: Database triggers or repository base classes automatically capture state changes into a secure audit log, providing a complete historical trail of all financial actions regardless of the actor.

## 8.3 Double-Entry Core Validation

PurpleLedger is fundamentally built on double-entry accounting principles.

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

PurpleLedger heavily relies on external services like Mono (bank feeds), Paystack (subscriptions), and FIRS Tax ProMax (tax remittals).

- **Mechanism**:
  - **Idempotency & Correlation**: Both incoming API requests and outgoing external mutations require unique idempotency keys to ensure network retries do not result in duplicate operations (e.g., duplicate payments, ledger entries, or tax filings). Additionally, correlation IDs are mandated across all requests to trace the complete lifecycle of an operation across distributed boundaries.
  - **Resilience**: Asynchronous queues (e.g., BullMQ on Redis, RabbitMQ consumers) or dead-letter queues (DLQ) are utilized to handle transient failures, employing exponential backoff for retries to ensure eventual consistency globally.

## 8.8 Tax Policy Versioning

Nigeria Tax Act (NTA) regulations frequently evolve, meaning older transactions must be evaluated under the rules that governed them at the time.

- **Mechanism**: Tax calculation logic is versioned and decoupled from core ledgers. When tax obligations are calculated, the engine evaluates the journal or reporting period's effective date against a repository of historical tax rules, rather than indiscriminately applying the most current law.

## 8.9 Validation, Error Handling, and Logging

To ensure only clean data enters the system and anomalous states are captured:

- **Data Validation (Zod)**: Zod is enforced at the system boundary (API endpoints and MCP tool inputs) to guarantee malformed or malicious payloads are rejected before they touch business logic.
- **Standardized Error Handling**: Errors are wrapped in a standard domain format so that clients cleanly differentiate between user errors (e.g., "Insufficient Balance") and system errors.
- **Observability logs (Sentry, Winston)**: Every non-local log line is one structured JSON record containing a stable operational event, runtime service/environment/version metadata, and request or worker correlation when context is active. Local development keeps readable colorized output. Fields are recursively sanitized, and request logs use normalized route templates rather than raw URLs or query strings. These records are logs, not metrics; event naming, controlled outcomes, privacy, and cardinality follow [the canonical observability rule](../.agents/rules/observability.md).
- **Observability metrics (OpenTelemetry, Grafana Alloy, Grafana Cloud)**: Application instances export best-effort metrics periodically over OTLP/HTTP to Grafana Alloy on the private Coolify network. Export is disabled by default and application code contains no Grafana Cloud credentials. `IObservabilityMetrics` provides the tool-agnostic recorder, while `IHttpMetrics` and `IQueueMetrics` own the semantic catalogue, seconds conversion, and bounded attribute policy. Recording and bounded shutdown-flush failures never change HTTP, transaction, queue retry, or acknowledgement behavior.

The initial application-owned metrics are:

| Metric                                | Instrument | Unit          | Allowed attributes                               |
| ------------------------------------- | ---------- | ------------- | ------------------------------------------------ |
| `http.server.requests`                | Counter    | `{request}`   | method, normalized route, status class, outcome  |
| `http.server.request.duration`        | Histogram  | `s`           | method, normalized route, status class, outcome  |
| `messaging.client.enqueue.operations` | Counter    | `{operation}` | controlled queue, transport, outcome             |
| `messaging.process.operations`        | Counter    | `{operation}` | controlled queue, transport, outcome, attempt    |
| `messaging.process.duration`          | Histogram  | `s`           | controlled queue, transport, outcome             |
| `messaging.process.wait.duration`     | Histogram  | `s`           | controlled queue and transport, when trustworthy |

Histograms prefer base-2 exponential aggregation. If the production
Alloy/Grafana Cloud smoke test does not preserve it, the compatibility
boundaries in `src/infra/observability/metric-catalogue.ts` become the explicit
fallback. Baseline distributions must be collected for two to four weeks
before final latency SLOs are proposed.

Application metrics configuration is intentionally provider-neutral:

| Environment variable          | Default | Purpose                                                   |
| ----------------------------- | ------- | --------------------------------------------------------- |
| `METRICS_ENABLED`             | `false` | Enables application OTLP/HTTP export explicitly.          |
| `METRICS_OTLP_HTTP_ENDPOINT`  | empty   | Internal Alloy URL ending in `/v1/metrics`.               |
| `METRICS_EXPORT_INTERVAL_MS`  | `60000` | Periodic export interval.                                 |
| `METRICS_SHUTDOWN_TIMEOUT_MS` | `5000`  | Bound for exporter shutdown and the export timeout.       |
| `BULLMQ_METRICS_PORT`         | `0`     | Separate internal scrape listener; `0` keeps it disabled. |

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
