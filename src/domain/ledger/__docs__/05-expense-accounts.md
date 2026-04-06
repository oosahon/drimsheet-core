# Expense Accounts

## Table of Contents

- [Introduction](#introduction)
- [Direct Costs](#direct-costs)
- [Operating Expenses (OPEX)](#operating-expenses-opex)
  - [Payroll & Personnel](#payroll--personnel)
  - [Rent & Utilities](#rent--utilities)
  - [Admin & General](#admin--general)
  - [Marketing & Selling](#marketing--selling)
  - [Research & Development](#research--development)
  - [Depreciation & Amortization](#depreciation--amortization)
- [Non-Operating Expenses](#non-operating-expenses)
  - [Interest & Finance Charges](#interest--finance-charges)
- [Tax Expense](#tax-expense)
  - [Income Tax Expense](#income-tax-expense)
- [Losses & Adjustments](#losses--adjustments)
  - [Unrealized Loss](#unrealized-loss)
  - [Loss on Asset Disposal](#loss-on-asset-disposal)
  - [Impairment Losses](#impairment-losses)
  - [Other Losses](#other-losses)
- [Application Bootstrap](#application-bootstrap)
  - [Individual](#individual)

## Introduction

Expense ledgers are used to track the outflows of economic resources incurred by an individual, sole trader, or company necessary to maintain normal business operations and fulfill obligations. Per our [accounting philosophy](../../accounting/__doc__/accounting.md#philosophy), our expense ledgers are rigidly structured with reporting in mind to distinctly separate direct costs from overhead OPEX and non-operating losses.

Expense ledgers come in five reporting hierarchies:

- Direct Costs
- Operating Expenses
- Non-Operating Expenses
- Tax Expense
- Losses & Adjustments

When an expense ledger/sub-ledger is created, it MUST be associated with one of the reporting hierarchies.

By default, standard expense accounts carry a **debit** normal balance. **Contra-expense accounts** (like Purchase Returns and Purchase Discounts) carry a **credit** normal balance as they act to reduce gross expenses without erasing historical audit trails. Contra-expense accounts are created relationally within their parent's code range and are distinguished by their flipped `normalBalance` and `IAdjustmentMetaData`.

To ensure our system is extensible, we have not baked functionalities into ledger codes or predefined accounts. For non-power users, our ledger accounts bootstrap will handle the creation of accounts and association of behaviors. For power users, they can create accounts and associate behaviors available to the account class.

### Implementation Status

| Account Group               | Code Block | Entity File                                                                                           | Status         |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Direct Costs                | `500xxx`   | [`00-direct-costs.entity.ts`](../entities/05-expense-account/00-direct-costs.entity.ts)               | ✅ Implemented |
| Payroll & Personnel         | `501xxx`   | —                                                                                                     | 🔲 Types only  |
| Rent & Utilities            | `502xxx`   | [`03-rent-and-utilities.entity.ts`](../entities/05-expense-account/03-rent-and-utilities.entity.ts)   | ✅ Implemented |
| Admin & General             | `503xxx`   | —                                                                                                     | 🔲 Types only  |
| Marketing & Selling         | `504xxx`   | —                                                                                                     | 🔲 Types only  |
| Research & Development      | `505xxx`   | —                                                                                                     | 🔲 Types only  |
| Depreciation & Amortization | `506xxx`   | —                                                                                                     | 🔲 Types only  |
| Interest & Finance Charges  | `507xxx`   | [`07-finance-costs.entity.ts`](../entities/05-expense-account/07-finance-costs.entity.ts)             | ✅ Implemented |
| Income Tax Expense          | `508xxx`   | [`08-tax-expense.entity.ts`](../entities/05-expense-account/08-tax-expense.entity.ts)                 | ✅ Implemented |
| Unrealized Loss             | `509xxx`   | [`09-unrealized-loss.entity.ts`](../entities/05-expense-account/09-unrealized-loss.entity.ts)         | ✅ Implemented |
| Loss on Asset Disposal      | `510xxx`   | [`10-asset-disposal-loss.entity.ts`](../entities/05-expense-account/10-asset-disposal-loss.entity.ts) | ✅ Implemented |
| Impairment Losses           | `511xxx`   | —                                                                                                     | 🔲 Types only  |
| Other Losses                | `512xxx`   | —                                                                                                     | 🔲 Types only  |

> [!NOTE]
> Entity files are named by their COA prefix (e.g. `00-` = `500xxx`, `03-` = `502xxx`, `07-` = `507xxx`) to make it explicit which accounts have been implemented and which are pending.

The following table shows the behaviors of different expense account classes:

## Direct Costs

Direct costs are directly attributable to the production of goods or delivery of services. The specific breakdown of direct costs (e.g., COGS, Cost of Services, Cost of Revenue) is determined at the sub-header level based on the accounting entity's domain.

- **Ledger codes**: 500xxx
- **Description**: accounts used to track direct operational costs required to fulfill revenue.
- **Main reporting hierarchy**: Direct Costs

#### Behaviors

| Sub-Class          | Reporting Hierarchy | Behaviors                                                                                                                                                           |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cost of Goods Sold | /                   | <ul><li>Requires inventory depletion or direct materials acquisition</li><li>Automatically closed to Retained Earnings at period-end</li></ul>                      |
| Cost of Services   | /                   | <ul><li>Captures direct subcontractor labor, platform fees, or service-specific materials</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |
| Cost of Revenue    | /                   | <ul><li>General direct cost category for individuals</li><li>Automatically closed to Retained Earnings at period-end</li></ul>                                      |

#### Entity Details

The `DirectCosts` entity ([`00-direct-costs.entity.ts`](../entities/05-expense-account/00-direct-costs.entity.ts)) creates accounts with:

- `subType: 'direct_costs'` — accepts `behavior` via payload (COGS, Cost of Services, Cost of Revenue)
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

## Operating Expenses (OPEX)

OPEX are the day-to-day costs incurred to maintain business operations, distinct from direct costs (COGS/COS).

### Payroll & Personnel

- **Ledger codes**: 501xxx
- **Description**: costs associated with employee compensation, benefits, payroll taxes, and training.
- **Main reporting hierarchy**: Operating Expenses / Payroll & Personnel

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class           | Reporting Hierarchy | Behaviors                                                                                                                                               |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payroll & Personnel | /                   | <ul><li>Can support localized sub-ledgers (e.g., Salaries, Bonuses, Benefits)</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

### Rent & Utilities

- **Ledger codes**: 502xxx
- **Description**: costs associated with leasing operational facilities and maintaining essential utilities.
- **Main reporting hierarchy**: Operating Expenses / Rent & Utilities

#### Behaviors

| Sub-Class        | Reporting Hierarchy | Behaviors                                                                                                                                              |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rent & Utilities | /                   | <ul><li>Often acts as the counterpart for prepaid rent amortization journals</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

#### Entity Details

The `RentAndUtilities` entity ([`03-rent-and-utilities.entity.ts`](../entities/05-expense-account/03-rent-and-utilities.entity.ts)) creates accounts with:

- Fixed `behavior: 'rent_and_utilities'` / `subType: 'rent_and_utilities'`
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

### Admin & General

- **Ledger codes**: 503xxx
- **Description**: broad overhead costs required to run the enterprise, including software subscriptions, banking fees, legal fees, and basic office supplies.
- **Main reporting hierarchy**: Operating Expenses / Admin & General

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class       | Reporting Hierarchy | Behaviors                                                                                                                                                                   |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin & General | /                   | <ul><li>Highly extensible via sub-ledgers (e.g., Bank Fees, SaaS Subscriptions, Bad Debt Expense)</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

### Marketing & Selling

- **Ledger codes**: 504xxx
- **Description**: costs associated with acquiring customers, advertising, travel, and sales collateral.
- **Main reporting hierarchy**: Operating Expenses / Marketing & Selling

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class           | Reporting Hierarchy | Behaviors                                                                 |
| ------------------- | ------------------- | ------------------------------------------------------------------------- |
| Marketing & Selling | /                   | <ul><li>Automatically closed to Retained Earnings at period-end</li></ul> |

### Research & Development

- **Ledger codes**: 505xxx
- **Description**: explicit costs incurred during research phases of product creation (expensed as incurred under IFRS/GAAP).
- **Main reporting hierarchy**: Operating Expenses / Research & Development

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class      | Reporting Hierarchy | Behaviors                                                                                                                                       |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Research & Dev | /                   | <ul><li>Must be strictly separated from capitalized development costs</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

### Depreciation & Amortization

- **Ledger codes**: 506xxx
- **Description**: the systematic allocation of the cost of tangible and intangible assets over their useful lives.
- **Main reporting hierarchy**: Operating Expenses / Depreciation & Amortization

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class    | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                          |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Depreciation | /                   | <ul><li>Created strictly via automated D&A schedules or manual adjusting journal entries</li><li>Counterpart to an Accumulated Depreciation contra-asset</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

## Non-Operating Expenses

Expenses incurred outside the central operations of the entity.

### Interest & Finance Charges

- **Ledger codes**: 507xxx
- **Description**: costs associated with borrowing capital, maintaining lines of credit, or debt servicing.
- **Main reporting hierarchy**: Non-Operating Expenses / Interest & Finance Charges

#### Behaviors

| Sub-Class     | Reporting Hierarchy | Behaviors                                                                                                                                                  |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finance Costs | /                   | <ul><li>Excludes operational bank processing fees (which sit in Admin & General)</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

#### Entity Details

The `FinanceCosts` entity ([`07-finance-costs.entity.ts`](../entities/05-expense-account/07-finance-costs.entity.ts)) creates accounts with:

- Fixed `behavior: 'finance_costs'` / `subType: 'interest_and_finance_charges'`
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

## Tax Expense

### Income Tax Expense

- **Ledger codes**: 508xxx
- **Description**: statutory tax obligations levied on corporate or entity net income.
- **Main reporting hierarchy**: Tax Expense / Income Tax Expense

#### Behaviors

| Sub-Class   | Reporting Hierarchy | Behaviors                                                                                                                 |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tax Expense | /                   | <ul><li>Requires tax calculation processing run</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

#### Entity Details

The `TaxExpense` entity ([`08-tax-expense.entity.ts`](../entities/05-expense-account/08-tax-expense.entity.ts)) creates accounts with:

- Fixed `behavior: 'tax_expense'` / `subType: 'income_tax_expense'`
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

## Losses & Adjustments

Distinct charges resulting from adverse market shifts or asset devaluation, isolated from pure operational spending.

### Unrealized Loss

- **Ledger codes**: 509xxx
- **Description**: accounts used to track negative mark-to-market valuation shifts on short-term/trading assets or foreign exchange (FX) balances.
- **Main reporting hierarchy**: Losses & Adjustments / Unrealized Loss

#### Behaviors

| Sub-Class       | Reporting Hierarchy | Behaviors                                                                                                                                                                                                 |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unrealized Loss | /                   | <ul><li>Tracks negative mark-to-market shifts on trading/short-term assets</li><li>Counterpart to asset adjunct/contra accounts</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

#### Entity Details

The `UnrealizedLoss` entity ([`09-unrealized-loss.entity.ts`](../entities/05-expense-account/09-unrealized-loss.entity.ts)) creates accounts with:

- Fixed `behavior: 'unrealized_loss'` / `subType: 'unrealized_loss'`
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

### Loss on Asset Disposal

- **Ledger codes**: 510xxx
- **Description**: accounts used to track the net financial loss resulting from the disposal/sale of Property, Plant & Equipment or Long Term Investments below their carrying (book) value.
- **Main reporting hierarchy**: Losses & Adjustments / Loss on Asset Disposal

#### Behaviors

| Sub-Class           | Reporting Hierarchy | Behaviors                                                                                                                                            |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asset Disposal Loss | /                   | <ul><li>Calculates net loss when an asset is sold below its net book value</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

#### Entity Details

The `AssetDisposalLoss` entity ([`10-asset-disposal-loss.entity.ts`](../entities/05-expense-account/10-asset-disposal-loss.entity.ts)) creates accounts with:

- Fixed `behavior: 'asset_disposal_loss'` / `subType: 'loss_on_asset_disposal'`
- `contraAccountRule: 'contra_not_permitted'` / `adjunctAccountRule: 'adjunct_not_permitted'`
- Accepts `isControlAccount`, `controlAccountId`, and `meta` via payload

### Impairment Losses

- **Ledger codes**: 511xxx
- **Description**: non-cash charges recognized when an asset's carrying value structurally drops below its recoverable value.
- **Main reporting hierarchy**: Losses & Adjustments / Impairment Losses

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class         | Reporting Hierarchy | Behaviors                                                                                                                                                              |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Impairment Losses | /                   | <ul><li>Recognized when an asset's carrying value drops structurally below recoverable value</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

### Other Losses

- **Ledger codes**: 512xxx
- **Description**: accounts used to track realized market losses (such as realized FX trading losses) or other miscellaneous losses.
- **Main reporting hierarchy**: Losses & Adjustments / Other Losses

> [!NOTE]
> Entity implementation pending. Types defined in [`expense-account.types.ts`](../types/expense-account.types.ts).\
> Not in scope for individual MVP.

#### Behaviors

| Sub-Class    | Reporting Hierarchy | Behaviors                                                                                                                                         |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Other Losses | /                   | <ul><li>Catch-all for realized market losses (e.g., FX realized losses)</li><li>Automatically closed to Retained Earnings at period-end</li></ul> |

## Application Bootstrap

For non-power users, we want to bootstrap their ledger accounts with a set of default accounts based on their domain.

### Individual

For the individual MVP, the following expense accounts will be bootstrapped:

#### Direct Costs

- Direct Costs: `500000` (control account)

#### Operating Expenses

- Rent & Utilities: `502000` (control account)

#### Non-Operating Expenses

- Interest & Finance Charges: `507000` (control account)

#### Tax Expense

- Income Tax Expense: `508000` (control account)

#### Losses & Adjustments

- Unrealized Loss: `509000` (control account)
- Loss on Asset Disposal: `510000` (control account)

> [!NOTE]
> Payroll (`501xxx`), Admin & General (`503xxx`), Marketing & Selling (`504xxx`), R&D (`505xxx`), Depreciation (`506xxx`), Impairment Losses (`511xxx`), and Other Losses (`512xxx`) are **not** bootstrapped for the individual MVP. Type definitions exist for future use.

> [!NOTE]
> All expense ledgers are automatically cleared and closed out to `RetainedEarnings (301000)` at the end of the financial/accounting period.
