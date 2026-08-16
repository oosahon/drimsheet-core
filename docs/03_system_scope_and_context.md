# 3. System Scope and Context

## 3.1 Business Context

![Business scope](./assets/03.1-business-scope.mermaid.png)

_Figure 1: View the mermaid sourcecode here:&#x20;_[_03.1-business-scope.mermaid_](./assets/03.1-business-scope.mermaid)

The following table describes the key actors and internal domain boundaries that interact with Drimsheet.

| Actor / Node            | Role                    | Description                                                                                                                                                                   |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Non-Accountant User** | Actor                   | Individuals, Sole Traders, or Organization owners who use the system for basic bookkeeping and tax tracking without deep accounting expertise.                                |
| **Accountant User**     | Actor                   | Accounting professionals who manage complex ledgers, post manual journal entries, and configure mappings for clients.                                                         |
| **🤖 AI Agents**        | External System / Actor | Software agents that securely integrate with the core engine via Model Context Protocol (MCP) to utilize our ReAct agent tools.                                               |
| **Auditor / Admin**     | Actor                   | Compliance officers or admins with read-only access to inspect the immutable, append-only logs of financial transactions and system operations.                               |
| **Drimsheet Core**      | System Boundary         | The central accounting system that encapsulates business logic, double-entry accounting rules, and tax computations.                                                          |
| **Supported Domains**   | Internal Concept        | The distinct operational contexts (Individual, Sole Trader, Organization) that strictly isolate financial records while allowing users to seamlessly switch between contexts. |
| **FIRS Tax ProMax**     | External System         | Nigerian federal tax portal used to file and remit computed business taxes.                                                                                                   |
| **Mono**                | External System         | Open banking platform connecting user bank accounts for automated feeds and reconciliations.                                                                                  |
| **Paystack**            | External System         | Payment gateway for collecting pro subscriptions and processing user invoices.                                                                                                |
| **ZeptoMail**           | External System         | Transactional email service for delivering invoices, alerts, and report documents.                                                                                            |

## 3.2 Technical Context

![Technical scope](./assets/03.2-technical-scope.mermaid.png)

_Figure 2: View the mermaid sourcecode here:&#x20;_[_03.2-technical-scope.mermaid_](./assets/03.2-technical-scope.mermaid)

The following table describes the technical interfaces, protocols, and infrastructural systems that link Drimsheet Core to its environment.

| Component / Node        | Type            | Protocol     | Description                                                                                                 |
| ----------------------- | --------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Client Applications** | External UI     | HTTPS        | Web and mobile frontend applications that consume the API to render external user interfaces.               |
| **🤖 AI Agents**        | External System | MCP          | Agents utilizing the Model Context Protocol (MCP) to interact securely with the Drimsheet exposed toolsets. |
| **Drimsheet Core API**  | Core System     | -            | The central Node.js backend application containing all business logic and immutable transaction processing. |
| **PostgreSQL**          | Persistence     | TCP/IP (SQL) | Primary ACID-compliant relational DB ensuring robust transaction mapping and audit logs.                    |
| **Redis**               | Cache / Queue   | TCP/IP       | In-memory datastore for performance caching and job processing.                                             |
| **AWS S3**              | Blob Storage    | HTTPS        | Object storage for persisting immutable attachments like transaction receipts and generated report files.   |
| **FIRS Tax ProMax API** | External API    | HTTPS        | Third-party government API for direct tax remittance and filing.                                            |
| **Mono API**            | External API    | HTTPS        | Banking API for ingesting secure transaction statements and live bank feeds.                                |
| **Paystack API**        | External API    | HTTPS        | Payment processing API for handling subscriptions.                                                          |
| **ZeptoMail API**       | External API    | SMTP/HTTPS   | Email delivery infrastructure for transactional messaging.                                                  |
