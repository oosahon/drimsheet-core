# Accounting Domain

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/oosahon/PurpleLedger-core/milestone/1 (v0.1.0 — Individual MVP)

The Accounting domain handles the complex, context-aware reporting layer of PurpleLedger. It is responsible for mapping raw, standard-agnostic Bookkeeping data into compliant Financial Statements based on specific regulatory standards (IFRS, GAAP, Tax Laws).

## Documentation Index

Please read the following documents in order to understand the architecture and mechanics of the Accounting domain:

1. [Philosophy](./01-philosophy.md) - The "Reporting-First" approach and the Bookkeeper vs Accountant analogy.
2. [Architecture](./02-architecture.md) - Accounting Entities, Reporting Contexts, and the Reporting Headers architecture.
3. [Adjustments & Reporting](./03-adjustments-and-reporting.md) - System reporting needs and how standard-specific adjustments are handled.
4. [Individual Reporting](./04-individual-reporting.md) - MVP specifics for Individual reporting requirements.
5. [Statutory Reporting](./05-statutory-reporting.md) - Tax types, taxation policies, and statutory compliance architecture.

---

**Note:** For documentation regarding the Chart of Accounts, Ledgers, and base transaction recording, see the [Bookkeeping Documentation](../../bookkeeping/__docs__/bookkeeping.md).
