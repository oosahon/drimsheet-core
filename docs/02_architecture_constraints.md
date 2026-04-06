# 2. Architecture Constraints

The following sections define constraints that must be adhered to

## 2.1 Technical Constraints

- All financial operations must be ACID-compliant.
- The system must ensure business logic is fully decoupled from interfaces.
- The system must provide immutable, append-only audit logs.
- The system must securely expose core business tools to autonomous agents via the Model Context Protocol (MCP).
- The system must persist all immutable documents (e.g., transaction receipts, generated reports) in AWS S3 or compatible blob storage.
- The system must ship with reasonable separate system categories for individuals, sole traders, and organizations.
- The system must ship with default currencies and not permit the creation of new currencies by users.
- The system must constantly maintain exchange rates between its supported currencies.

## 2.2 Accounting Constraints

- The system must strictly adhere to core double-entry accounting principles. Every accounting action must be defined in the accounting rules.
- The system must not perform any accounting action unless the domain (individual, sole trader, or organization) is clearly defined.
- The system must ensure that transaction records are immutable and auditable. For example, a transaction once posted cannot be deleted; it should be voided by another transaction instead.
- The system must enforce Role-Based Access Control (RBAC) to allow accounting professionals to securely create and manage custom ledger accounts and define postings.
- The system must support all standard accounting ledger types.
- The system must support all standard accounting transaction types.

## 2.3 Taxation Constraints

- The system must strictly adhere to the tax laws of Nigeria.
- The system must not advise beyond the provisions of the current Nigeria Tax Act (NTA) and must support versioned tax policies as laws evolve.
- The system must support direct integration with the FIRS Tax ProMax portal for automated filing and remittals.
- The system must support Personal Income Tax, Withholding Tax, Capital Gains Tax, Value Added Tax (Input and Output), and Company Income Tax computation in line with the NTA.

## 2.4 Business Constraints

- The system must support individuals, sole traders, and organizations as distinct entities.
- The system must allow users to seamlessly switch between the accounting domains they own or manage on the platform.
- The system must support the calculation of consolidated Networth based on the financial records of a user across their accounting domains, handling any cross-currency conversions using system exchange rates.
- The system must manage pro-tier subscription lifecycles seamlessly through native integrations like Paystack.
- The system relies on third-party aggregators (e.g., Mono) to securely sync automated bank feeds.
- The system must remain user-friendly (without breaking the accounting constraints defined in Section 2.2) regardless of the user's accounting knowledge.
