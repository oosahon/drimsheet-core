# ADR 0012: Relational Contra & Adjunct Accounts

## Status

Accepted

## Context

The initial Chart of Accounts design allocated dedicated ledger code ranges for contra accounts:

- `401xxx` for contra-revenue accounts (Returns, Refunds, Discounts)
- `501xxx` for contra-expense accounts (Purchase Returns, Purchase Discounts)

This positional approach created several problems:

1. **Premature structural coupling** — contra-expenses were nested under "Direct Costs" in the COA, implying they could only offset direct costs. In reality, a purchase discount can apply to an office supplies purchase (OPEX), not just raw materials.
2. **Overloaded `controlAccountId`** — using the same field for both hierarchical roll-up (sub-ledger aggregation) and adjustment relationships (contra/adjunct offsetting) conflates two distinct accounting concepts.
3. **Inflexible code allocation** — a contra account was forced into a system-wide code range rather than living alongside the account it adjusts. A purchase returns contra for Admin & General expenses (`504xxx`) had to live in `501xxx` instead.

## Decision

We model contra and adjunct account relationships **relationally** rather than **positionally**.

### Contra/adjunct accounts share their parent's code prefix

A contra account is allocated within the same ledger code range as the account it adjusts, distinguished by its flipped `normalBalance`. For example:

- A purchase returns contra for Admin & General expenses uses code prefix `504` (not a dedicated `501`)
- A sales returns contra for Sales revenue uses code prefix `400` (not a dedicated `401`)

### Mandatory adjustment metadata

Every contra or adjunct account **must** carry an `IAdjustmentMetaData` specifying the target account it adjusts. Entity creation fails without this metadata. The interface:

```typescript
export interface IAdjustmentMetaData {
  targetAccountId: TEntityId;
}
```

### Dedicated database relationship table

The adjustment relationship is persisted in a separate `ledger_account_adjustments` table:

| Column                  | Type                    | Description                |
| ----------------------- | ----------------------- | -------------------------- |
| `id`                    | `UUID`                  | Primary key                |
| `type`                  | `'contra' \| 'adjunct'` | Nature of the adjustment   |
| `target_account_id`     | `UUID` (FK)             | The account being adjusted |
| `adjustment_account_id` | `UUID` (FK)             | The contra/adjunct account |
| `created_at`            | `timestamp`             | Record creation timestamp  |

### Clear separation of concerns

| Concern     | Mechanism                               | Purpose                                  |
| ----------- | --------------------------------------- | ---------------------------------------- |
| Aggregation | `controlAccountId`                      | "I roll up into this parent"             |
| Adjustment  | `IAdjustmentMetaData` + DB relationship | "I adjust this target account's balance" |
| Direction   | `normalBalance`                         | Debit (additive) or Credit (subtractive) |

### `contraAccountRule` semantics

The `contraAccountRule` field on `ILedgerAccount` governs whether an account **can be targeted by** a contra:

- `ContraPermitted` — contras can be created against this account
- `ContraNotPermitted` — no contras allowed
- `ContraOnly` — this account must itself be a contra

The same logic applies to `adjunctAccountRule`.

## Consequences

### Positive

- Contra accounts live alongside the accounts they adjust — no artificial code range segregation.
- The adjustment relationship is a first-class, independently queryable concept in the database.
- `controlAccountId` retains a single, unambiguous meaning: hierarchical aggregation.
- Aggregate reporting ("total purchase discounts this quarter") is achieved by querying all accounts with matching `behavior`, not by code range.
- The pattern is unified for both contra and adjunct accounts across all ledger types.

### Negative

- Requires a separate database table for adjustment relationships.
- Entity creation for contra/adjunct accounts requires an additional validation step (target account existence and compatibility).
- Code range alone no longer signals whether an account is a contra — the `normalBalance` and `subType` must be inspected.
