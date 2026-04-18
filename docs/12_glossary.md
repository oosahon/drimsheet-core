# 12. Glossary

This section defines the most important domain and technical terms used throughout the PurpleLedger architectural documentation and source code. It ensures that all stakeholders—from accountants to software engineers—share a ubiquitous language.

## 12.1 Accounting & Business Context

| Term                    | Definition                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounting Domain**   | The distinct operational context in PurpleLedger representing the entity being managed. The three supported types are **Individual**, **Sole Trader**, and **Organization**. Data is strictly isolated between domains. |
| **Control Account**     | An account that aggregates balances from a subsidiary ledger or multiple sub-accounts. It cannot hold individual journal entry transactions directly.                                                                   |
| **Counterparty**        | An external person, business, or entity that participates in a financial transaction with the primary accounting domain.                                                                                                |
| **Double-Entry**        | A foundational accounting constraint ensuring every financial transaction affects at least two accounts, with total Debits equaling total Credits to maintain a perfectly balanced equation.                            |
| **General Ledger (GL)** | The master set of accounts that summarize all transactions occurring within an accounting domain.                                                                                                                       |
| **Header Account**      | A high-level account grouping used for categorization and reporting purposes (e.g., Cash & Equivalents). It generally does not hold transactions directly.                                                              |
| **Journal Entry**       | The fundamental record of a business transaction in the accounting system. In PurpleLedger, it is immutable once posted.                                                                                                |
| **Networth**            | The consolidated financial position of a user calculated across all the accounting domains they own, handling any required exchange rate conversions.                                                                   |
| **Posting Account**     | A definitive account at the lowest level of the hierarchy against which actual financial transactions (Debits and Credits) can be directly associated.                                                                  |
| **Sub-account**         | A specific, granular account (e.g., GTB Naira Account or a specific Mortgage). It can function either as a control account or a directly postable account.                                                              |
| **Subledger**           | A detailed subset of accounts (e.g., Accounts Receivable) that require lifecycle management and roll up into a single summary account in the General Ledger.                                                            |

## 12.2 Taxation Context (Nigeria)

| Term                | Definition                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CIT**             | **Company Income Tax**. A tax upon the profits of incorporated entities (Organizations) operating in Nigeria.                                                                       |
| **FIRS Tax ProMax** | The Federal Inland Revenue Service online portal. PurpleLedger ultimately integrates with this entity for automated tax filings and remittals.                                      |
| **NTA**             | **Nigeria Tax Act**. The supreme legal framework governing taxation. PurpleLedger's tax engine supports versioned policies as the NTA evolves.                                      |
| **PIT**             | **Personal Income Tax**. A tax levied on the income of individuals.                                                                                                                 |
| **VAT**             | **Value Added Tax**. A consumption tax assessed on the value added to goods and services. Categorized into Output VAT (collected from customers) and Input VAT (paid to suppliers). |
| **WHT**             | **Withholding Tax**. An advance payment of income tax automatically deducted at the source during specific transactions.                                                            |

## 12.3 Software & Infrastructure Context

| Term                           | Definition                                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Append-Only Pattern**        | An architectural constraint applied to financial records where state changes are recorded sequentially. `UPDATE` or `DELETE` mutations are strictly prohibited to guarantee an unalterable audit trail.                                                        |
| **Coolify**                    | An open-source Platform as a Service (PaaS) used by PurpleLedger to manage and orchestrate all isolated Docker containers on a self-hosted DigitalOcean server.                                                                                                |
| **Correlation ID**             | A unique trace identifier attached to system requests to track down the complete lifecycle of a transaction across internal event buses and third-party APIs.                                                                                                  |
| **DDD (Domain-Driven Design)** | The core architectural approach used in PurpleLedger, where the system is divided into strict Layers (Interface, Application, Domain, Infrastructure) and mapped to bounded contexts (Accounting, Tax, User, etc.) to securely isolate complex business rules. |
| **Domain Events**              | Asynchronous signals emitted by the application logic when a core entity changes state (e.g., "TransactionPosted"). The autonomous Tax Engine listens to these to calculate compliance independent of the core loop.                                           |
| **Doppler**                    | The centralized secret and configuration management platform. It securely injects encrypted keys into the Node.js Docker environment upon startup, completely avoiding raw `.env` files.                                                                       |
| **Drizzle ORM**                | A strict, type-safe SQL query builder used in the Infrastructure layer to bridge TypeScript models natively to the PostgreSQL database.                                                                                                                        |
| **Idempotency Key**            | A unique identifier passed with requests to guarantee that if a network failure causes an automated retry, an operation (e.g., charging a card or recording a journal entry) executes exactly once.                                                            |
| **PurpleLedger Core**          | The central Node.js backend application encapsulating all business logic, double-entry constraints, and immutable database interactions.                                                                                                                       |
| **MCP**                        | **Model Context Protocol**. A secure communication layer enabling autonomous AI Agents to interact seamlessly with PurpleLedger data and commands via strictly bounded tools.                                                                                  |
| **Mono**                       | A third-party open banking platform securely integrated to ingest and parse live banking feeds for automated transaction reconciliations.                                                                                                                      |
| **Qdrant**                     | A vector database used within the PurpleLedger ecosystem to persist and index semantic context embeddings, critically enabling advanced AI capabilities.                                                                                                       |
