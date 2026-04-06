# ADR 0005: Decoupling Tax Versioning from Core Ledgers

## Status

Accepted

## Context

The Nigeria Tax Act (NTA) regulations frequently evolve and update (e.g., changes to VAT or Withholding Tax percentages across different tiers). When a transaction from 2024 is audited in 2026, the tax obligations must be computed identically to how they were natively calculated at the time, not based on 2026's prevailing rates.

## Decision

Tax calculation logic is **versioned and physically decoupled** from core ledgers.
Instead of updating static configuration files and mutating system tax categories indiscriminately, the tax engine evaluates transactions strictly based on their `Effective Date`, mapping it against a repository of historically versioned tax functions/rules.

## Consequences

### Positive

- Total historical reproducibility when producing tax audit trails. High confidence during FIRS audits.
- The Core Accounting engine (Transaction postings, Journal Entries) is completely oblivious to the complexity of the tax code, allowing rules to evolve continuously without breaking the base infrastructure layer.

### Negative

- Increases the complexity of building Tax features. New tax laws don't "override" old ones; they append new temporal blocks, requiring the developer to implement temporal logic checking whenever computing liabilities.
