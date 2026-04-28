# Bookkeeping Domain

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/oosahon/PurpleLedger-core/milestone/1 (v0.1.0 — Individual MVP)

The Bookkeeping domain is the standard-agnostic foundation of the PurpleLedger system. It is strictly responsible for managing the Chart of Accounts, defining ledger constraints and behaviors, and recording the raw mechanical facts of financial events (debits and credits).

## Documentation Index

Please read the following documents to understand the bookkeeping architecture:

1. [Philosophy](./01-philosophy.md) - The standard-agnostic nature of the Bookkeeper.
2. [Architecture](./02-architecture.md) - The 6-digit COA structure, metadata-driven behaviors, and entity patterns.
3. [MVP Scope](./03-mvp-scope.md) - The specific accounts bootstrapped and supported for the Individual MVP.

### Ledger Class Definitions

Detailed documentation for each specific ledger class and its sub-types, behaviors, and rules:

4. [Asset Accounts](./04-1-asset-accounts.md)
5. [Liability Accounts](./04-2-liability-accounts.md)
6. [Equity Accounts](./04-3-equity-accounts.md)
7. [Revenue Accounts](./04-4-revenue-accounts.md)
8. [Expense Accounts](./04-5-expense-accounts.md)
9. [Suspense Accounts](./04-9-suspense-accounts.md)

---

**Note:** For documentation regarding reporting standards, tax policies, and standard-specific transformations, see the [Accounting Documentation](../../accounting/__doc__/accounting.md).
