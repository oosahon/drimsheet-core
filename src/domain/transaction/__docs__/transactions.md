# Transaction Domain Model

## Table of Contents

- [Overview](#overview)
- [Data Model & Abstraction](#data-model--abstraction)
- [Currency Rules](#currency-rules)
- [Counterparty Management](#counterparty-management)
- [Tax Handling](#tax-handling)

---

## Overview

The Transaction domain acts as the bridge between user intent (e.g., recording an expense or sale) and the strict double-entry ledger (`JournalEntry`).

It deliberately reduces polymorphism by remaining completely separate from models like **`Invoice`**`s` or `Bills`. While an Invoice deals with inventories, quantities, and unit rates, a Transaction strictly represents the pure financial movement of money in a standardized 1-to-N structure.

## Data Model & Abstraction

### The Header (`ITransaction`)

The transaction header captures the core metadata of the financial event.

- **`sourceAccountId`:** To simplify UX (mimicking standard "Spend/Receive Money" interfaces), a transaction explicitly defines a single source account at the header level.
- **Concurrency:** Transactions natively employ Optimistic Concurrency Control via a `version` integer to prevent the Lost Update Problem over disconnected HTTP editing.

### The Lines (`ITransactionItem`)

The line items natively support the "Category" abstraction.

- **Dual Binding:** Every line explicitly requires both an `accountId` and a `categoryId`. Power users may bypass categories, but the system still automatically attaches the corresponding `categoryId` under the hood. This guarantees that if a non-power user reviews the transaction later, it is perfectly categorized.

## Currency Rules

To ensure strict balancing predictability, the system enforces a **single currency per transaction** business rule.

1. The transaction header defines the global `amount` and the single `exchangeRate`.
2. The header calculates and locks in the global `functionalCurrencyAmount`.
3. Every `ITransactionItem` maps its respective chunk of the `amount` and exactly mirrors the exchange calculation via its own `functionalCurrencyAmount`.

_(Cross-currency operations are supported conceptually through the system, but the individual `Transaction` entity remains confined to one transaction currency)._

## Counterparty Management

Because the `Transaction` represents the source document originating financial impact, it conceptually "owns" the relationship to external entities (like Customers or Vendors).

- The `counterPartyId` is assigned at the `ITransaction` header level, allowing downstream Subledgers (AR/AP) to easily aggregate.
- **Transfers:** For internal movements of money (e.g., Bank to Petty Cash), the `counterPartyId` is strictly `null`.

## Tax Handling

Taxes are strictly modeled as explicit items rather than dynamically calculated implicit properties. If a transaction represents an Expense that includes VAT, the total is split into multiple `ITransactionItem` lines:

1. The base expense mapped to the relevant `accountId`/`categoryId`.
2. The discrete tax amount mapped directly to a distinct tax expense `accountId`.

This normalizes tax tracking into standard accounting flow directly at the Transaction layer.
