# Category Domain Model

## Table of Contents

- [Overview](#overview)
- [Data Model & Mapping](#data-model--mapping)
- [Materialized Path Representation](#materialized-path-representation)
- [Display Management & Restrictions](#display-management--restrictions)
- [Edge Cases & Domain Events](#edge-cases--domain-events)
- [System Constraints & UX Guidelines](#system-constraints--ux-guidelines)

---

## Overview

The Category domain provides an abstraction layer over the core Chart of Accounts (CoA), designed specifically for non-accountant users (e.g., business owners). It shields non-power users from the strict architectural complexities of a double-entry General Ledger (GL) while ensuring that all underlying accounting invariants are strictly maintained.

## Data Model & Mapping

Categories strictly represent **Classification** for non-accountants (e.g., Income, Expenses, COGS) and act as extremely lightweight proxy objects to the General Ledger.

- **Postable Sub-Accounts Only:** Categories maintain a mapping _only_ with postable sub-accounts (leaf nodes). Control Accounts (parent groupings) do not have corresponding Category records.
- **Asset Accounts Excluded:** Traditional Asset accounts (e.g., Bank, Accounts Receivable) are entirely excluded from the Category domain. Non-accountants categorize transactions into buckets like Income or Expense, while money movement across Assets is treated as a distinct "Transfer" behavior.

## System Architecture & Delegation

### Materialized Path Delegation (Ledger)

The hierarchical tree structure (e.g., nested parent-child groupings) is a fundamental property of the Chart of Accounts, not the Category abstraction.
Therefore, the **Materialized Path** representation (`materializedKey`) is owned and managed entirely by the `LedgerAccount` domain.

- Categories do not manage structural hierarchy. They maintain a simple `accountId` reference to their specific postable leaf node.
- When generating the UI tree, the system hydrates the flat list of Categories with their corresponding Ledger Account's `materializedKey` and ancestral names, allowing the frontend to dynamically render the hierarchical groupings.

## Display Management & Restrictions

### Display Name Aliasing

Categories support an optional `displayName` attribute, allowing the user-facing label to gracefully diverge from the formal GL `Account.name`.

- _Example:_ GL Account is named `Accrued Liabilities` but the Category `displayName` is `Pending Bills`.

To preserve the integrity and standardization of the Ledger, modifying the `displayName` is strictly constrained through Authorization rules to Power Users (Accountants) only.

## Edge Cases & Domain Events

### Control Account Promotion (Dynamic Nesting)

A critical accounting invariant dictates that transactions may only be posted to sub-accounts (leaf nodes), never to Control Accounts.

A domain collision occurs if a user acts on the UI to create a nested sub-category under a Category that has _already received posted transactions_. To satisfy the user's intent without breaching GL invariants, the system resolves this via an automated restructuring in the Ledger:

1. **Ledger Transformation:** A new Control Account is created taking the original name of the category to serve as the new parent in the tree. The original sub-account is renamed to include a default suffix (e.g., `CategoryName (default)`), preserving its identity (`id`). The new requested sub-account (e.g., `Repairs`) is created as a sibling to the default account.
2. **Category Behavior:** The original Category object remains untouched. It still points to the same `accountId` (now demoted and renamed). If the Category had a custom `displayName`, it is preserved, effectively aliasing the demoted sub-account. A new Category is created pointing to the new `Repairs` sub-account.
3. **UI Rendering:** The UI reads the shared `materializedKey` prefixes from the Ledger and automatically groups both Categories under the parent Control Account header.

## System Constraints & UX Guidelines

### Nesting Depth Warnings

While the materialized path approach accommodates deep nesting configurations, excessive depth degrades the experience for non-power users. The client UI monitors depth and will warn the user if a category hierarchy exceeds three levels: `key.split('.').length > 3`

### Hard Database Limits

Nesting depth is firmly constrained at the database persistence layer to prevent buffer overflows or malicious payload creation. The `key` column enforces a strict string limit of `VARCHAR(84)`.

Assuming standard 6-digit account codes separated by the `.` delimiter, this schema configuration safely accommodates a maximum depth of **12 structural levels** before throwing a domain invariant exception.
