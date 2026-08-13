# 8. Cross-Cutting Concepts

This section outlines the foundational rules, patterns, and design decisions applied consistently across PurpleLedger Core to meet our security, reliability, and accounting constraints.

## 8.1 Domain Object & Context Management (Multi-Tenancy)

PurpleLedger natively supports multiple distinct contexts: Individuals, Sole Traders, and Organizations (Section 2.4).

- **Mechanism**: Every request to the core API establishes operational context early in the request lifecycle. Authenticated user context is derived from the request session, while accounting-entity context is loaded from the `x-accounting-entity-id` request header when present. This context is injected into application use cases and repository calls, ensuring database queries, ledger operations, and reporting computations are isolated to the currently active accounting entity.
- **Selection lifecycle**: An authenticated client can call `POST /api/v1/accounting/accounting-entity/switch` with an owned accounting entity ID to validate and establish that entity in the current request context. The endpoint returns the canonical accounting entity so the client can update its application state. App context is request-scoped, so the client must continue to send the selected ID through `x-accounting-entity-id` on subsequent requests.

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
- **Observability (Sentry, Winston)**: Structured logging securely captures operational metrics and context without exposing PII or sensitive financial data in plain text, aiding rapid debugging and auditing.
