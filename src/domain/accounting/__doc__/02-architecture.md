# Architecture

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/Drimsheet/drimsheet-core/milestone/1 (v0.1.0 — Individual MVP)

## Accounting Entities

Drimsheet supports three accounting entity types, defined in `accounting.types.ts`:

| Type           | Status       |
| -------------- | ------------ |
| **Individual** | ✅ MVP scope |
| Sole Trader    | 🔲 Post-MVP  |
| Company        | 🔲 Post-MVP  |

Each accounting entity is associated with:

- An `ownerId` (the user)
- A `functionalCurrency` (base currency for reporting and FX calculations)
- A `fiscalYearEnd` (defaults to Dec 31 for individuals)

## The "Reporting Headers" Architecture

Because the General Ledger must remain pure and standard-agnostic, Drimsheet uses a **Reporting Headers** approach to generate financial statements.

1. **The Raw GL**: The chart of accounts (`LedgerAccount`) exists without any knowledge of reporting standards or accounting contexts.
2. **Reporting Nodes/Headers**: The `Accounting` domain defines a hierarchical tree of `ReportingHeaders` for a specific `ReportingContext` (e.g., "IFRS 2026").
3. **The Mapping**: These context-specific reporting headers are mapped down to the raw standard-agnostic `LedgerAccounts`.
4. **Calculations on the Fly**: Rules like Depreciation methods are attached to the _Reporting Layer_, not the GL. The reporting engine reads the raw asset purchase price from the GL and calculates the standard-specific depreciation (e.g., Straight-line vs. MACRS) dynamically.

## Handling Valuation Differences (Inventory)

The most common architectural challenge with a single standard-agnostic GL is handling inventory valuation. For example, GAAP might permit LIFO, while IFRS strictly requires FIFO. This means the actual monetary value of Cost of Goods Sold (COGS) differs based on the standard.

### The Subledger Strategy

To prevent dirtying the GL with context-specific journal entries, Drimsheet pushes valuation complexity down into dedicated **Subledgers**:

1. The GL simply receives "Cost of Goods Sold" and "Inventory" values based on the primary operational standard.
2. The **Inventory Subledger** tracks the actual physical items and lots.
3. The Subledger maintains _parallel valuations_. It is smart enough to calculate the cost of a sale under both FIFO and LIFO simultaneously based on the raw operational data.
4. When generating an IFRS report, the Reporting Layer can pull the FIFO valuation directly from the Inventory Subledger.
5. When generating a GAAP report, the Reporting Layer pulls the LIFO valuation from the Subledger.

By keeping the GL pure and relying on Mapping Headers and Smart Subledgers, the system remains extremely scalable across multiple jurisdictions and reporting standards.
