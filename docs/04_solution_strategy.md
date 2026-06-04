# 4. Solution Strategy

This section summarizes the fundamental decisions and strategies that shape the architecture of PurpleLedger Core, bridging our business goals and technical constraints.

## 4.1 Technology Stack

The following technology choices form the foundation of the system, selected to meet our strict accounting and operational constraints.

| Technology            | Decision & Rationale                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend Framework** | **Node.js & Express (TypeScript)&#xA0;**&#x50;rovides a highly asynchronous, type-safe environment suitable for rapid development and exposing robust REST/Model Context Protocol (MCP) interfaces.   |
| **API Documentation** | **tsoa:** Automatically generates OpenAPI specifications directly from TypeScript controllers and models, significantly reducing the overhead of manually writing and maintaining accurate API specs. |
| **Database**          | **PostgreSQL:&#xA0;**&#x43;hosen specifically to fulfill the strict **ACID-compliance** constraint (Constraint 2.1) required for immutable, double-entry bookkeeping.                                 |
| **ORM**               | **Drizzle ORM:&#xA0;**&#x50;rovides type-safe SQL queries without the heavy abstraction overhead of traditional ORMs, ensuring predictable and performant database interactions.                      |
| **Caching & Queues**  | **Redis:&#xA0;**&#x55;sed for performance caching and job processing (e.g., queuing incoming webhooks from banking API aggregators).                                                                  |
| **Blob Storage**      | **AWS S3 (or compatible)**&#x45;nsures immutable persistence of transaction attachments, receipts, and generated tax reports.                                                                         |
| **Email Delivery**    | **ZeptoMail:&#xA0;**&#x43;hosen because it provides the cheapest and fastest way to get started with reliable transactional email delivery (e.g., invoices, alerts).                                  |

## 4.2 Software Architecture

The architecture of PurpleLedger Core is designed to separate business logic from technical implementation details.

| Architecture / Pattern         | Strategy & Rationale                                                                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain-Driven Design (DDD)** | The system is divided into clear **Bounded Contexts** (e.g., Accounting, Bookkeeping, Journal Entry, Ledger, Currency, Subledger, and Users). This ensures reporting, posting, account structure, and identity rules stay isolated from one another.                          |
| **Append-Only Immutability**   | To meet auditing constraints, the system strictly forbids `DELETE` mutations on financial records. Records are effectively append-only, and corrections must be made via explicit reversing (voiding) transactions.                                                           |
| **Pragmatic Functional OOP**   | Combines object-oriented domain models for representing complex entities (like a Journal Entry) with side-effect-free functional services to evaluate rules (like NTA tax computations) cleanly.                                                                              |
| **MCP Integration**            | Core use-cases are designed to be interface-agnostic, allowing them to be securely exposed as tools to autonomous AI Agents via the **Model Context Protocol (MCP)** alongside traditional web UIs.                                                                           |
| **Project Separation**         | Secondary capabilities, such as database migrations and agent tools, are extracted into standalone projects (e.g., `PurpleLedger-migration`). This gives us the freedom to use whatever we consider to be the best tool without tight coupling to the core accounting project |
| **Controlled Currencies**      | The system explicitly restricts currency creation and ships with predefined currencies. This allows the system to actively maintain and guarantee accurate exchange rates across all supported currencies internally.                                                         |
| **Feature-Grouped App Layer**  | Application code is organized by feature under `src/app`, so DTOs, mappers, handlers, and use cases for Accounting, Auth, Bookkeeping, Currency, Ledger, and User workflows remain close to their use-case boundaries.                                                        |

## 4.3 Quality Goals

The table below maps the system's primary quality goals (defined in Section 1.2) to their corresponding architectural solutions.

| Quality Goal        | Solution Strategy                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data Integrity**  | Enforced at the database level via PostgreSQL's ACID properties and at the application layer via an **append-only** transaction model. Strict Role-Based Access Control (RBAC) ensures only authorized roles can manipulate custom ledger accounts.                                                                                        |
| **Maintainability** | Achieved through **strict layer decoupling** (Domain vs. Infrastructure layers) and feature-grouped application modules. For example, integrations with third-party systems like FIRS Tax ProMax or Paystack are abstracted behind interfaces, allowing the external services to be swapped or updated without changing core domain logic. |
| **Operability**     | The complex accounting kernel operates completely under the hood. Business workflows and sub-ledger abstractions are handled by the system layer so that users with zero accounting knowledge can operate the platform seamlessly, remaining fully compliant with accounting standards.                                                    |
| **Reliability**     | The system strictly enforces >85% test coverage natively in the CI/CD pipeline. Tests are designed to cover every branch of critical domain policies (e.g., tax deductions) without mocking entity logic, ensuring production-grade confidence.                                                                                            |
