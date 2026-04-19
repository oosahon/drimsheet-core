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

Every Category acts as a proxy object that maintains a strict `1:1` mapping with an underlying GL Account:

- **Leaf Categories (Postable):** Map directly to **Sub-Accounts**.
- **Parent Categories (Non-Postable):** Map directly to **Control Accounts**.

This strict bidirectional mapping ensures that when an accountant (power user) reorganizes the CoA, the simplified Category view remains perfectly synchronized for the business owner, allowing seamless toggling between "Simple" and "Power User" modes.

## Materialized Path Representation

To efficiently represent and query the hierarchical tree structure of the CoA within a relational database, Category keys utilize the **Materialized Path** pattern.

The hierarchical path is persisted as a flattened string using a period (`.`) as the universal delimiter:

```text
<root_ledger_code>.<header_account_code>.<...n_sub_account_code>
```

_Example: `100000.100001.100022.10xxxx`_

This pattern eliminates the need for recursive CTE (Common Table Expression) queries, allowing entire sub-trees to be fetched using highly performant wildcard lookups (e.g., `LIKE '100000.100001.%'`).

## Display Management & Restrictions

### Control Account Abstraction

By foundational accounting rules, journal entries cannot be directly posted to a Control Account. Therefore, parent categories are distinctly identified via an `is_grouping: boolean` property. Categories flagged as groupings are omitted from selectable transactional dropdowns and are utilized solely for hierarchical UI aggregation and reporting.

### Display Name Aliasing

Categories support an optional `displayName` attribute, allowing the user-facing label to gracefully diverge from the formal GL `Account.name`.

- _Example:_ GL Account is named `Accrued Liabilities` but the Category `displayName` is `Pending Bills`.

To preserve the integrity and standardization of the Ledger, modifying the `displayName` is strictly constrained through Authorization rules to Power Users (Accountants) only.

## Edge Cases & Domain Events

### Control Account Promotion (Dynamic Nesting)

A critical accounting invariant dictates that transactions may only be posted to sub-accounts (leaf nodes), never to Control Accounts.

A domain collision occurs if a user acts on the UI to create a nested sub-category under a Category that has _already received posted transactions_. To satisfy the user's intent without breaching GL invariants, the system executes an automated refactoring strategy:

1. A **new** Control Account is created, taking the original name of the category to serve as the new parent in the tree.
2. The original sub-account is renamed to include a default suffix (e.g., `CategoryName (default)`), preserving its identity (`id`).
3. Because the original sub-account's ID remains unchanged, all historical journal entries inherently remain correctly linked without any database remapping or mutation.
4. The newly requested sub-category is instantiated as a sibling to the renamed default account, under the newly created Control Account.

**Example Scenario:** A user previously posted expenses to an `Automobile` category. They later decide to track granular data and add `Repairs` as a sub-category to `Automobile`.

- **Before:** `Automobile` (Sub-Account with historical transactions).
- **After Action:** The system creates a new Control Account and renames the existing sub-account to `Automobile (default)`. Historical transactions remain untouched, safely tied to the original entity ID. The new `Repairs` sub-category is then created as a sibling to `Automobile (default)`.

## System Constraints & UX Guidelines

### Nesting Depth Warnings

While the materialized path approach accommodates deep nesting configurations, excessive depth degrades the experience for non-power users. The client UI monitors depth and will warn the user if a category hierarchy exceeds three levels: `key.split('.').length > 3`

### Hard Database Limits

Nesting depth is firmly constrained at the database persistence layer to prevent buffer overflows or malicious payload creation. The `key` column enforces a strict string limit of `VARCHAR(84)`.

Assuming standard 6-digit account codes separated by the `.` delimiter, this schema configuration safely accommodates a maximum depth of **12 structural levels** before throwing a domain invariant exception.
