# ADR 0010: System-Bound Category Taxonomy

## Status

Accepted

## Context

A major goal of PurpleLedger is abstracting the heavy lifting of tax computation from non-accountant users. When users categorize their income or expenses, the system needs to inherently know what Nigerian Tax Act (NTA) rules to apply (e.g., is this category subject to Withholding Tax or Value Added Tax?). If users create completely detached, arbitrary categories (e.g., "Misc Biz Things"), the Tax Engine has no semantic understanding of how to tax those transactions.

## Decision

PurpleLedger ships with **immutable base system categories** inherently bound to specific `tax_keys`.
Users are explicitly permitted to create their own custom categories (e.g., "Lagos Branch Transport"), but the system structurally mandates that _every_ custom category must be spawned as a child (descendant) of an existing system category (e.g., "Transportation Expense").

## Consequences

### Positive

- Total automation of tax calculations. Whenever a user tags a transaction with their custom category, the Tax Engine traces it up the database tree to the base system category and applies the exact required `tax_key` securely.
- Ensures non-accountant users remain perfectly tax compliant without needing to understand underlying tax structures.

### Negative

- Users are slightly restricted in UX. They cannot create entirely abstract root-level categories; everything they track must fundamentally map back to a recognized accounting/tax bucket.
