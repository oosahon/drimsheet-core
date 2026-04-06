# Equity Accounts

## Table of Contents

- [Introduction](#introduction)
- [Capital](#capital)
- [Retained Earnings](#retained-earnings)
- [Reserves](#reserves)
- [Opening Balance Equity](#opening-balance-equity)
- [Application Bootstrap](#application-bootstrap)
  - [Individual](#individual)

## Introduction

Equity ledgers are used to track the residual interest in the assets of the entity after deducting all its liabilities (Net Worth). Per our [accounting philosophy](../../accounting/__doc__/accounting.md#philosophy), our equity ledgers are structured with reporting in mind.

By default, equity accounts carry a **credit** normal balance. This is automatically derived from the account type during creation.

To ensure our system is extensible, we have not baked functionalities into ledger codes or predefined accounts. For non-power users, our ledger accounts bootstrap will handle the creation of accounts and association of behaviors. For power users, they can create accounts and associate behaviors available to the account class.

### Implementation Status

| Account Group          | Code Block | Entity File                                                                                    | Status         |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------- | -------------- |
| Capital                | `300xxx`   | —                                                                                              | 🔲 Types only  |
| Retained Earnings      | `301xxx`   | [`01-retained-earning.entity.ts`](../entities/03-equity-account/01-retained-earning.entity.ts) | ✅ Implemented |
| Reserves               | `302xxx`   | —                                                                                              | 🔲 Types only  |
| Opening Balance Equity | `399xxx`   | [`99-opening-balance.equity.ts`](../entities/03-equity-account/99-opening-balance.equity.ts)   | ✅ Implemented |

> [!NOTE]
> Entity files are named by their COA prefix (e.g. `01-` = `301xxx`, `99-` = `399xxx`) to make it explicit which accounts have been implemented and which are pending.

The following table shows the behaviors of different equity account classes

## Capital

- **Ledger codes**: 300xxx
- **Description**: accounts used to track the initial or subsequent direct investments/contributions made by the owner(s) into the entity. For sole traders, this represents their base personal capital.
- **Main reporting hierarchy**: Equity / Capital

> [!NOTE]
> Entity implementation pending. Types defined in [`equity-account.types.ts`](../types/equity-account.types.ts).\
> Capital is **not relevant** for individual accounting entities — there is no concept of owner's equity in personal finance. The type exists for sole trader/company use.

#### Behaviors

| Sub-Class     | Reporting Hierarchy | Behaviors                                                                                                                                                                          |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner Capital | /                   | <ul><li>Requires deposit transaction for creation / contribution</li><li>Requires withdrawal/draw transaction for reduction</li><li>Supports adjunct and contra accounts</li></ul> |

## Retained Earnings

- **Ledger codes**: 301xxx
- **Description**: accounts used to track the accumulated net income/loss of the entity. At the end of each financial period, the net balance of all Revenue and Expense accounts is closed out into Retained Earnings.
- **Main reporting hierarchy**: Equity / Retained Earnings

#### Behaviors

| Sub-Class         | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                        |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retained Earnings | /                   | <ul><li>Automatically updated during period-end closing procedures</li><li>Direct manual journal entries are generally restricted (except for prior period adjustments)</li><li>Contra and Adjunct accounts prohibited</li></ul> |

#### Entity Details

The `RetainedEarnings` entity ([`01-retained-earning.entity.ts`](../entities/03-equity-account/01-retained-earning.entity.ts)) creates accounts with:

- Fixed `behavior: 'retained_earnings'` / `subType: 'retained_earnings'`
- `isControlAccount: false` / `controlAccountId: null`
- Contra and adjunct accounts: **not permitted**
- `meta: null`

## Reserves

- **Ledger codes**: 302xxx
- **Description**: accounts used to track reserves. These accounts are typically used to set aside funds for specific purposes, such as future investments, contingencies, or dividends. They are also used to track the revaluation of assets and liabilities.
- **Main reporting hierarchy**: Equity / Reserves

> [!NOTE]
> Entity implementation pending. Types defined in [`equity-account.types.ts`](../types/equity-account.types.ts) with behavior: `RevaluationReserve`.\
> Reserves are **not** bootstrapped for individuals. The type exists for power users or on-demand creation when an individual revalues PPE or long-term investments.

#### Behaviors

| Sub-Class | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                        |
| --------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reserves  | /                   | <ul><li>Automatically updated during period-end closing procedures</li><li>Direct manual journal entries are generally restricted (except for prior period adjustments)</li><li>Contra and Adjunct accounts prohibited</li></ul> |

## Opening Balance Equity

- **Ledger codes**: 399xxx
- **Description**: A temporary suspense-like account used during system onboarding to hold the offset of initial asset and liability balances until they are formally distributed to Capital or Retained Earnings.
- **Main reporting hierarchy**: Equity / Opening Balance Equity

#### Behaviors

| Sub-Class | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                 |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \*        | (TBD)               | <ul><li>Requires manual journal entry balancing during trial balance import</li><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li><li>Must be reconciled and cleared to a zero balance out to Retained Earnings or Capital after bootstrap</li></ul> |

#### Entity Details

The `OpeningBalanceEquity` entity ([`99-opening-balance.equity.ts`](../entities/03-equity-account/99-opening-balance.equity.ts)) creates accounts with:

- Fixed `behavior: 'opening_balance_equity'` / `subType: 'opening_balance'`
- `isControlAccount: false` / `controlAccountId: null`
- Contra and adjunct accounts: **not permitted**
- `meta: null`

## Application Bootstrap

For non-power users, we want to bootstrap their ledger accounts with a set of default accounts based on their domain.

### Individual

For the individual MVP, the following equity accounts will be bootstrapped:

#### Equity

- Retained Earnings: `301000`
- Opening Balance Equity: `399000`

> [!NOTE]
> Capital (`300xxx`) is **not** bootstrapped for individuals — there is no concept of owner's equity in personal finance.

> [!NOTE]
> Reserves (`302xxx`) are **not** bootstrapped for individuals. The type definition exists for power users or will be created on demand if an individual revalues PPE or long-term investments.

> [!NOTE]
> All asset and liability bootstrapped accounts will automatically post their initial balances against the Opening Balance Equity (`399000`) account.
