# Asset Accounts

## Table of Contents

- [Introduction](#introduction)
- [Current Assets](#current-assets)
  - [Cash and Cash Equivalents](#cash-and-cash-equivalents)
  - [Short Term Investments](#short-term-investments)
  - [Receivables](#receivables)
  - [Inventories](#inventories)
  - [Accrued Income](#accrued-income)
  - [Prepayments](#prepayments)
- [Non-Current Assets](#non-current-assets)
  - [Long Term Investments](#long-term-investments)
  - [Property, Plant & Equipment (PPE)](#property-plant--equipment-ppe)
  - [Intangible Assets, Right-of-Use (ROU), & Goodwill](#intangible-assets-right-of-use-rou--goodwill)
- [Suspense Accounts:](#suspense-accounts)
- [Application Bootstrap](#application-bootstrap)
  - [Individual](#individual)

## Introduction

Assets ledgers are used to track what an individual, sole trader or company owns. Per our [accounting philosophy](../../accounting/__doc__/accounting.md#philosophy), our asset ledgers are structured with reporting in mind.

Asset ledgers come in two reporting hierarchies:

- Current Assets
- Non-Current Assets

When an asset ledger/sub-ledger is created, it MUST be associated with one of the two reporting hierarchies.

By default, asset accounts carry a **debit** normal balance. This is automatically derived from the account type during creation.

To ensure our system is extensible, we have not baked functionalities into ledger codes or predefined accounts. For non-power users, our ledger accounts bootstrap will handle the creation of accounts and association of behaviors. For power users, they can create accounts and associate behaviors available to the account class.

### Implementation Status

| Account Group             | Code Block | Entity File                                                                                           | Status         |
| ------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Cash and Cash Equivalents | `100xxx`   | [`00-cash-and-equivalents.entity.ts`](../entities/01-asset-account/00-cash-and-equivalents.entity.ts) | ✅ Implemented |
| Short Term Investments    | `101xxx`   | —                                                                                                     | 🔲 Types only  |
| Receivables               | `102xxx`   | [`02-receivables.entity.ts`](../entities/01-asset-account/02-receivables.entity.ts)                   | ✅ Implemented |
| Inventories               | `103xxx`   | —                                                                                                     | 🔲 Types only  |
| Accrued Income            | `104xxx`   | —                                                                                                     | 🔲 Types only  |
| Prepayments               | `105xxx`   | —                                                                                                     | 🔲 Types only  |
| Long Term Investments     | `106xxx`   | —                                                                                                     | 🔲 Types only  |
| PPE                       | `107xxx`   | —                                                                                                     | 🔲 Types only  |
| Intangible Assets         | `108xxx`   | —                                                                                                     | 🔲 Types only  |
| Right-of-Use Assets       | `109xxx`   | —                                                                                                     | 🔲 Types only  |
| Goodwill                  | `110xxx`   | —                                                                                                     | 🔲 Types only  |
| Suspense                  | `199xxx`   | [`99-suspense-account.entity.ts`](../entities/01-asset-account/99-suspense-account.entity.ts)         | ✅ Implemented |

> [!NOTE]
> Entity files are named by their COA prefix (e.g. `00-` = `100xxx`, `02-` = `102xxx`) to make it explicit which accounts have been implemented and which are pending.

The following table shows the behaviors of different asset account classes

## Current Assets

### Cash and Cash Equivalents

- **Ledger codes**: 100xxx
- **Description**: accounts that are used to track cash and cash equivalents.
- **Main reporting hierarchy**: Current Assets / Cash and Cash Equivalents

#### Behaviors

| Sub-Class    | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                                | Flows                                   |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Petty Cash   | /                   | <ul><li>Supports adjunct and contra accounts (strictly for Unrealized FX Revaluation on multi-currency accounts)</li><li>Requires reconciliation</li> <li>Allows manual reconciliations</li> <li>FX accounts support sale & purchase transactions</li> </ul>                                                             | [Petty Cash Flow](./petty-cash-flow.md) |
| Bank Account | /                   | <ul><li>Supports adjunct and contra accounts (strictly for Unrealized FX Revaluation on multi-currency accounts)</li><li>Requires reconciliation</li> <li>Allows reconciliation with bank statements</li> <li>Overdrafts are recorded as liabilities</li><li>FX accounts support sale & purchase transactions</li> </ul> | [Bank Flow](./bank-flow.md)             |

#### Entity Details

The `CashAndCashEquivalents` entity ([`00-cash-and-equivalents.entity.ts`](../entities/01-asset-account/00-cash-and-equivalents.entity.ts)) exposes:

- `make()` — base factory accepting a `behavior` parameter
- `makeBankAccount()` — validates `IBankAccountMeta` (bankName, accountNumber, accountName, sortCode, swiftCode, iban, routingNumber, branchCode)
- `makePettyCashAccount()` — creates with `IPettyCashAccountMeta` (lastReconciliationDate)

### Short Term Investments

- **Ledger codes**: 101xxx
- **Description**: accounts that are used to track short term investments.
- **Main reporting hierarchy**: Current Assets / Short Term Investments

> [!NOTE]
> Entity implementation pending. Types defined in [`asset-account.types.ts`](../types/asset-account.types.ts) with behaviors: `StockAndETFs`, `Bonds`.

#### Behaviors

| Sub-Class                    | Reporting Hierarchy     | Behaviors                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stocks & ETFs                | / Marketable Securities | <ul><li>Requires purchase transaction for creation</li><li>Requires sale transaction for disposal</li><li>Supports dividend distributions</li><li>Monthly valuation gains are recorded to adjunct accounts</li><li>Monthly valuation losses are recorded to contra accounts</li></ul>                                                                        |
| Bonds                        | / Marketable Securities | <ul><li>Requires purchase transaction for creation</li><li>Requires sale or maturity transaction for disposal</li><li>Supports automated interest accrual based on coupon rate</li><li>Supports adjunct accounts (for purchase premiums and valuation increases)</li><li>Supports contra accounts (for purchase discounts and valuation decreases)</li></ul> |
| Mutual Funds                 | / Marketable Securities | <ul><li>Requires purchase transaction for creation</li><li>Requires sale or redemption transaction for disposal</li><li>Supports dividend and capital gain distributions</li><li>Supports adjunct accounts (for valuation increases)</li><li>Supports contra accounts (for valuation decreases)</li></ul>                                                    |
| Fixed Deposits               | /                       | <ul><li>Requires initial deposit transaction for creation</li><li>Requires withdrawal or maturity transaction for disposal</li><li>Supports automated interest accrual based on fixed rate</li><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li></ul>                                                                                  |
| Other Short Term Investments | /                       | <ul><li>Requires purchase or deposit transaction for creation</li><li>Requires sale, redemption, or maturity transaction for disposal</li><li>Supports manual and automated earnings accrual</li><li>Supports adjunct and contra accounts (if applicable to the specific asset)</li></ul>                                                                    |

### Receivables

- **Ledger codes**: 102xxx
- **Description**: accounts that are used to track receivables.
- **Main reporting hierarchy**: Current Assets / Receivables

#### Behaviors

| Sub-Class             | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trade Receivables     | /                   | <ul><li>Requires invoice or debit note transaction for creation</li><li>Requires payment, credit note, or write-off transaction for settlement</li><li>Supports automated aging</li><li>Supports contra accounts (for doubtful accounts)</li><li>Supports adjunct accounts (for interest on overdue accounts)</li></ul> |
| Statutory Receivables | /                   | <ul><li>Tax credit note or supplier invoice transaction for creation</li><li>Requires statutory payment transaction for settlement (computed net of payables)</li><li>Does not support contra accounts</li><li>Does not support adjunct accounts</li></ul>                                                              |

#### Entity Details

The `Receivables` entity ([`02-receivables.entity.ts`](../entities/01-asset-account/02-receivables.entity.ts)) exposes:

- `make()` — base factory accepting `behavior`, `contraAccountRule`, and `adjunctAccountRule` parameters
- `makeStatutoryReceivableAccount()` — validates `IStatutoryReceivableAccountMeta` (taxAuthority, taxType per [`tax.types.ts`](../types/tax.types.ts))
- `makeTradeReceivableAccount()` — validates `ITradeReceivableAccountMeta` (customerId, invoiceId)

### Inventories

- **Ledger codes**: 103xxx

> [!NOTE]
> Out of scope for MVP (individual domain).\
> Inventories will be scoped when we move to support sole traders.

### Accrued Income

- **Ledger codes**: 104xxx
- **Description**: accounts that are used to track revenue that has been earned by providing goods or services, but has not yet been formally billed to the customer (e.g., unbilled project milestones, unbilled subscriptions).
- **Main reporting hierarchy**: Current Assets / Accrued Income

> [!NOTE]
> Entity implementation pending. Types defined in [`asset-account.types.ts`](../types/asset-account.types.ts).

#### Behaviors

| Sub-Class      | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accrued Income | /                   | <ul><li>Requires manual journal entry or automated system accrual for creation</li><li>Automatically created by the system to recognize earned, unbilled revenue at period-end (for non-power users)</li><li>Requires a sales invoice transaction for settlement (transfers balance to Trade Receivables)</li><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li></ul> |

### Prepayments

- **Ledger codes**: 105xxx
- **Description**: accounts that are used to track payments made in advance for goods or services to be received in the future (e.g., prepaid software, prepaid insurance).
- **Main reporting hierarchy**: Current Assets / Prepayments

> [!NOTE]
> Entity implementation pending. Types defined in [`asset-account.types.ts`](../types/asset-account.types.ts).

#### Behaviors

| Sub-Class   | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prepayments | /                   | <ul><li>Requires payment or supplier invoice transaction for creation</li><li>Automatically created by the system when an invoice or payment service period exceeds the current accounting period (for non-power users)</li><li>Requires automated schedule or manual journal entry for amortization</li><li>Supports automated amortization schedules</li><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li></ul> |

## Non-Current Assets

### Long Term Investments

- **Ledger codes**: 106xxx
- **Description**: accounts that are used to track investments the entity intends to hold for longer than 12 months (e.g., equity investments in other companies, long-term bonds).
- **Main reporting hierarchy**: Non-Current Assets / Long Term Investments

> [!NOTE]
> Entity implementation pending. Types defined in [`asset-account.types.ts`](../types/asset-account.types.ts).

#### Behaviors

| Sub-Class                   | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Equity Investments          | /                   | <ul><li>Requires purchase transaction for creation</li><li>Requires sale transaction for disposal</li><li>Supports dividend distributions</li><li>Supports adjunct and contra accounts (for fair value adjustments or impairment)</li></ul>                                                                  |
| Long-Term Bonds             | /                   | <ul><li>Requires purchase transaction for creation</li><li>Requires sale or maturity transaction for disposal</li><li>Supports automated interest accrual based on coupon rate</li><li>Supports adjunct accounts (for purchase premiums)</li><li>Supports contra accounts (for purchase discounts)</li></ul> |
| Other Long Term Investments | /                   | <ul><li>Requires purchase or deposit transaction for creation</li><li>Requires sale, redemption, or maturity transaction for disposal</li><li>Supports manual and automated earnings accrual</li><li>Supports adjunct and contra accounts (if applicable to the specific asset)</li></ul>                    |

### Property, Plant & Equipment (PPE)

- **Ledger codes**: 107xxx
- **Description**: accounts that track tangible, long-term assets used in business operations with a useful life of more than one year (e.g., buildings, machinery, vehicles, land).
- **Main reporting hierarchy**: Non-Current Assets / Property, Plant & Equipment

> [!NOTE]
> Entity implementation pending. Types defined in [`asset-account.types.ts`](../types/asset-account.types.ts).

> [!NOTE]
> **Sub-class automation:**
>
> - **Power Users** can explicitly create custom sub-classes under PPE to bind default depreciation methods and useful life rules.
> - **Non-Power Users** can simply add an asset (e.g., "Laptop") and select how they want it to depreciate. The system will automatically group it into or generate the appropriate sub-class on the backend based on the chosen depreciation method.

#### Behaviors

| Sub-Class                                      | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Depreciable Assets (e.g., Equipment, Vehicles) | /                   | <ul><li>Requires purchase, capital lease, or capitalization transaction for creation</li><li>Requires sale, scrappage, or trade-in transaction for disposal (recognizing gain/loss)</li><li>Requires automated schedule or manual journal entry for depreciation</li><li>Supports contra accounts (for Accumulated Depreciation and Impairment)</li><li>Supports adjunct accounts (for Revaluation Surplus)</li></ul> |
| Non-Depreciable Assets (e.g., Land)            | /                   | <ul><li>Requires purchase transaction for creation</li><li>Requires sale transaction for disposal</li><li>Depreciation calculations prohibited</li><li>Supports contra accounts (for Impairment)</li><li>Supports adjunct accounts (for Revaluation Surplus)</li></ul>                                                                                                                                                |

### Intangible Assets, Right-of-Use (ROU), & Goodwill

- **Ledger codes**: 108xxx, 109xxx, 110xxx

> [!NOTE]
> Out of scope for MVP.\
> These advanced asset classes are purposefully excluded from the initial release to maintain system simplicity for non-power users. The ledger code blocks are permanently reserved for future enterprise compliance features.

## Suspense Accounts:

- **Ledger codes**: 199xxx
- **Description**: See [Suspense Accounts](./99-suspense-accounts.md) for more information.

#### Entity Details

The `AssetSuspense` entity ([`99-suspense-account.entity.ts`](../entities/01-asset-account/99-suspense-account.entity.ts)) creates accounts with:

- `subType: 'suspense'` / `behavior: 'default'`
- `isControlAccount: false` / `controlAccountId: null`
- Contra and adjunct accounts: **not permitted**
- `meta: null`
- Distinguished from liability suspense by the ledger code prefix (`199xxx` vs `299xxx`)

#### Behaviors

| Sub-Class | Reporting Hierarchy            | Behaviors                                                                                                                                                                         |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \*        | (TBD - Depends on the balance) | <ul><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li><li>Must be reconciled and cleared to a zero balance prior to period-end financial reporting</li></ul> |

## Application Bootstrap

For non-power users, we want to bootstrap their ledger accounts with a set of default accounts based on their domain.

### Individual

For the individual MVP, the following asset accounts will be bootstrapped:

#### Current Assets

- Cash and Cash Equivalents: `100000` (control account)
- Receivables: `102000` (control account)
- Suspense Accounts: `199000`

> [!NOTE]
> Short Term Investments (`101xxx`), Accrued Income (`104xxx`), and Prepayments (`105xxx`) are **not** bootstrapped for the individual MVP. Type definitions exist for future use.

> [!NOTE]
> Non-Current Assets (Long Term Investments, PPE, Intangible Assets, ROU, Goodwill) are **not** bootstrapped for the individual MVP.

> [!NOTE]
> An opening balance equity account will also be created for each of the control accounts above.
