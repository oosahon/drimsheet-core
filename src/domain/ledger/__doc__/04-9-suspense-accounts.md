# Suspense Accounts

## Table of Contents

- [Introduction](#introduction)
- [Asset Suspense Accounts](#asset-suspense-accounts-199xxx)
- [Liability Suspense Accounts](#liability-suspense-accounts-299xxx)
- [Shared Architecture](#shared-architecture)

## Introduction

Suspense accounts are temporary balance sheet accounts that are used to hold journal activity that cannot yet be classified to a specific account. They are typically used in the following scenarios:

- Bank Reconciliation
- Trial Balance Adjustments (for power users)
- Uncategorized journal activity

> [!IMPORTANT]
> By the end of the reporting period, all suspense accounts should be cleared to a zero balance.

In PurpleLedger, we use one liability/asset suspense account per accounting entity, per operating currency. That is, if the accounting entity has multiple operating currencies, it will have multiple liability/asset suspense accounts.

## Asset Suspense Accounts (199xxx)

In the Asset ledger, a suspense account typically carries a debit balance. It represents a "pre-classification" of value that the entity currently controls or has initiated. Here are some example use cases:

- Uncategorized credit-side journal activity during bank reconciliation
- Uncleared/unidentified outgoing payments

**Entity**: [`99-suspense-account.entity.ts`](../asset/entities/suspense-account.entity.ts)

## Liability Suspense Accounts (299xxx)

In the Liability ledger, a suspense account typically carries a credit balance. It represents an obligation that the entity has incurred but has not yet classified to a specific liability account. Here are some example use cases:

- Uncategorized debit-side journal activity during bank reconciliation
- Uncleared/unidentified incoming payments

**Entity**: [`99-suspense-account.entity.ts`](../liability/entities/suspense-account.entity.ts)

## Shared Architecture

Both asset and liability suspense accounts share a common base interface defined in [`suspense-account.types.ts`](../shared/types/suspense-account.types.ts):

| Property             | Value                     |
| -------------------- | ------------------------- |
| `subType`            | `'suspense'`              |
| `behavior`           | `'default'`               |
| `isControlAccount`   | `false`                   |
| `controlAccountId`   | `null`                    |
| `contraAccountRule`  | `'contra_not_permitted'`  |
| `adjunctAccountRule` | `'adjunct_not_permitted'` |
| `meta`               | `null`                    |

Asset and liability suspense accounts are distinguished by their ledger code prefix: asset suspense starts with `1` (`199xxx`) while liability suspense starts with `2` (`299xxx`).
