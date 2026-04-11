# Accounting

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/oosahon/PurpleLedger-core/milestone/1 (v0.1.0 — Individual MVP)

## Philosophy

Our philosophy is to follow a reporting-first approach to accounting. This means that we will first determine the reporting requirements for each accounting domain and then create a set of ledger accounts that will allow us to generate the required reports. We will also create a set of behaviors that will be built into these ledger accounts. For non-power users, these accounts and behaviors will be bootstrapped while power users will have the ability to create accounts and associate behaviors available to the account class.

## Accounting Entities

PurpleLedger supports three accounting entity types, defined in
[`accounting.types.ts`](../types/accounting.types.ts):

| Type           | Status       |
| -------------- | ------------ |
| **Individual** | ✅ MVP scope |
| Sole Trader    | 🔲 Post-MVP  |
| Company        | 🔲 Post-MVP  |

Each accounting entity is associated with:

- An `ownerId` (the user)
- A `functionalCurrency` (base currency for reporting and FX calculations)
- A `fiscalYearEnd` (defaults to Dec 31 for individuals)

## MVP Scope (v0.1.0 — Individual)

For the MVP, we are only supporting the **individual** accounting entity, focused on managing **cash and cash equivalent assets**:

- Track bank accounts and petty cash
- View unrealized FX gains and losses on multi-currency accounts
- Manage day-to-day transactions required for personal income tax computation

### Individual MVP — Ledger Accounts

The following ledger accounts are in scope for the individual MVP. Accounts are organized by the five primary account classes:

#### Assets

| Account                        | Code Block | Entity File                         | Status         |
| ------------------------------ | ---------- | ----------------------------------- | -------------- |
| Cash and Cash Equivalents      | `100xxx`   | `00-cash-and-equivalents.entity.ts` | ✅ Implemented |
| Receivables (Tax Credits)      | `102xxx`   | `02-receivables.entity.ts`          | ✅ Implemented |
| Suspense (Bank Reconciliation) | `199xxx`   | `99-suspense-account.entity.ts`     | ✅ Implemented |

#### Liabilities

| Account                        | Code Block | Entity File                     | Status         |
| ------------------------------ | ---------- | ------------------------------- | -------------- |
| Short Term Loan (Overdraft)    | `200xxx`   | `00-short-term-loan.entity.ts`  | ✅ Implemented |
| Payables (Tax Obligations)     | `201xxx`   | `03-payables.entity.ts`         | ✅ Implemented |
| Suspense (Bank Reconciliation) | `299xxx`   | `99-suspense-account.entity.ts` | ✅ Implemented |

#### Equity

| Account                | Code Block | Entity File                     | Status         |
| ---------------------- | ---------- | ------------------------------- | -------------- |
| Retained Earnings      | `301xxx`   | `01-retained-earning.entity.ts` | ✅ Implemented |
| Opening Balance Equity | `399xxx`   | `99-opening-balance.equity.ts`  | ✅ Implemented |

> [!NOTE]
> Capital (`300xxx`) is **not** bootstrapped for individuals — there is no concept of owner's equity in personal finance. The type definition exists for sole trader/company use.

#### Revenue

| Account              | Code Block | Entity File                      | Status         |
| -------------------- | ---------- | -------------------------------- | -------------- |
| Services (Freelance) | `401xxx`   | `02-services.entity.ts`          | ✅ Implemented |
| Employment Income    | `403xxx`   | `04-employment-income.entity.ts` | ✅ Implemented |
| Gain on Asset Sale   | `405xxx`   | `06-gain-on-sale.entity.ts`      | ✅ Implemented |
| Unrealized Gain      | `406xxx`   | `07-unrealized-gain.entity.ts`   | ✅ Implemented |

#### Expenses

| Account             | Code Block | Entity File                        | Status         |
| ------------------- | ---------- | ---------------------------------- | -------------- |
| Direct Costs        | `500xxx`   | `00-direct-costs.entity.ts`        | ✅ Implemented |
| Rent and Utilities  | `502xxx`   | `03-rent-and-utilities.entity.ts`  | ✅ Implemented |
| Finance Costs       | `507xxx`   | `07-finance-costs.entity.ts`       | ✅ Implemented |
| Tax Expense         | `508xxx`   | `08-tax-expense.entity.ts`         | ✅ Implemented |
| Unrealized Loss     | `509xxx`   | `09-unrealized-loss.entity.ts`     | ✅ Implemented |
| Asset Disposal Loss | `510xxx`   | `10-asset-disposal-loss.entity.ts` | ✅ Implemented |

## Reporting Needs

PurpleLedger will support the following reporting for all three accounting domains:

#### Individuals

- Personal Income Statement
- Expense & Spending Analysis
- Personal Cash Flow Statement (SoCF)
- Budget vs. Actual (BvA) Report
- Statement of Net Worth
- Consolidated Account Balances
- Debt & Liability Aging Report
- Savings & Financial Goals Tracker
- Investment Portfolio Performance
- Personal Income Tax (PIT) Summary
- Recurring Transactions & Subscription Audit
- Financial Trends & Custom Analytics

#### Sole Traders

- Statement of Profit or Loss (SoPL)
- Statement of Financial Position (SoFP)
- Statement of Cash Flows (SoCF)
- Aged Receivables Ledger
- Aged Payables Ledger
- Sales & Revenue Performance Report
- Expense & Overheads Analysis
- Statutory Returns (VAT/WHT)
- Bank Reconciliation Statement
- Inventory Valuation Report (IVR)
- Payroll & Personal Income Tax (PIT) Remittance
- Budget vs. Actual (BvA) Report
- Statement of Owner's Equity
- Fixed Asset Register (FAR)
- Break-even Analysis Report
- Working Capital & Liquidity Report

#### Organizations

- Statement of Profit or Loss (SoPL)
- Statement of Financial Position (SoFP)
- Statement of Cash Flows (SoCF)
- Statement of Changes in Equity (SoCE)
- Aged Receivables Ledger
- Aged Payables Ledger
- Trial Balance (TB)
- Fixed Asset Register (FAR)
- Inventory Valuation Report (IVR)
- Bank Reconciliation Statement
- Budget vs. Actual (BvA) Report
- Cash Flow Forecast
- Segment/Divisional Performance Report
- Statutory Tax Returns (VAT/WHT/CIT)
- General Ledger (GL) Audit Trail
- Cost of Goods Manufactured (COGM)
- Working Capital & Liquidity Report
- Payroll & Statutory Remittance Report
- Intercompany Elimination Report
- Break-even Analysis Report

### Reporting Requirements

For us to adequately generate the above reports, we need to ensure that our accounts are properly categorized. We also need to ship with meaningful transaction categories and ledger classes that will help the system with predefined behaviors.

To achieve this, we have modeled our Charts of Accounts thus:

## Charts of Accounts

Our Chart of Accounts follows a **6-digit** hierarchical coding structure: **A-BB-CCC**. Where:

- **A** (1 digit) represents the primary account class (1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense)
- **BB** (2 digits) represents the account group / sub-header (e.g. Cash and Cash Equivalents, Retained Earnings, etc.)
- **CCC** (3 digits) represents the control account or sub-ledger (sequentially allocated)

Codes are allocated through **Sequential Slotting** via the `getSubLedgerCode` function in [ledger-account.entity.ts](../../ledger/entities/shared/ledger-account.entity.ts). Each new sub-ledger under a header receives the next available code (e.g., `100000` → `100001` → `100002`), with a 999-account limit per header.

Power users can set a display code for accounts, but the internal code will always follow the above structure.

### Metadata-Driven Account Behavior

Instead of hardcoding account behavior into the ledger codes (e.g. using a specific suffix digit for contra or adjunct accounts), PurpleLedger uses a **metadata-driven** architecture.

A ledger account's behavior and system constraints are defined by its properties in the database, as modeled in [`ledger.types.ts`](../../ledger/types/ledger.types.ts):

| Property             | Type                  | Purpose                                                                                            |
| -------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `type`               | `ULedgerType`         | Primary classification (Asset, Liability, Equity, Revenue, Expense)                                |
| `normalBalance`      | `UNormalBalance`      | Debit or Credit — auto-derived from `type`                                                         |
| `subType`            | string                | "What it is" — account classification within its type (e.g. `cash_and_cash_equivalent`, `payable`) |
| `behavior`           | string                | "How it acts" — operational semantics (e.g. `bank`, `petty_cash`, `tax_payable`)                   |
| `isControlAccount`   | boolean               | Whether this account is a parent/header account                                                    |
| `controlAccountId`   | UUID \| null          | FK linking a sub-ledger to its parent control account                                              |
| `contraAccountRule`  | `UContraAccountRule`  | Whether contra accounts are permitted, required, or prohibited                                     |
| `adjunctAccountRule` | `UAdjunctAccountRule` | Whether adjunct accounts are permitted, required, or prohibited                                    |
| `meta`               | object \| null        | Account-specific metadata (e.g. `IBankAccountMeta`, `IStatutoryPayableAccountMeta`)                |

#### Adjustment Accounts (Contra & Adjunct)

Adjustment accounts are modeled relationally rather than via ledger code conventions. An adjustment account carries an `IAdjustmentMetaData` in its `meta` field:

```typescript
interface IAdjustmentMetaData {
  adjustmentType: UAdjustmentType; // 'contra' | 'adjunct'
  targetAccountId: TEntityId; // FK → basis account
}
```

This enables:

- A single basis account to have **multiple** contra accounts (e.g., Accumulated Depreciation AND Impairment Loss)
- Dynamic reporting adaptation without exhausting/reserving specific ledger code slots
- Clean separation between the account hierarchy and the adjustment relationship

> [!NOTE]
> For users who migrate from other systems, we will preserve their ledger codes at the DB level (`external_ledger_code`) but internally follow our strict nomenclature. Users can choose which code to display on the UI.

> [!NOTE]
> A more contrived view will be displayed for non-accountant users in the individual accounting domain.
> Nonetheless, under the hood, this will be the complete structure.

### Entity Architecture

Each ledger account type follows a consistent factory pattern:

1. **Type definitions** in `src/domain/ledger/types/` — progressive interface narrowing from `ILedgerAccount` → `I{Type}LedgerAccount` → `I{SubType}Account`
2. **Entity factories** in `src/domain/ledger/entities/{NN}-{type}-account/` — `make()` and `getCode()` functions
3. **Domain events** in `src/domain/ledger/events/` — emitted on every entity creation
4. **Shared factory** in `src/domain/ledger/entities/shared/ledger-account.entity.ts` — validates all base properties and constructs the frozen entity

Entity files are named by their COA prefix to make it explicit which accounts have been implemented and which are still pending:

```
01-asset-account/
├── 00-cash-and-equivalents.entity.ts   ← 100xxx ✅
├── 02-receivables.entity.ts            ← 102xxx ✅
└── 99-suspense-account.entity.ts       ← 199xxx ✅
                                           101xxx (Short Term Investments) — not yet implemented
```

### Tax Types

Statutory accounts (receivables and payables) use a shared tax type model defined in [`tax.types.ts`](../../ledger/types/tax.types.ts), based on the Nigerian Tax Act (NTA) 2025:

- Value Added Tax (VAT)
- Withholding Tax (WHT)
- Pay As You Earn (PAYE)
- Corporate Income Tax (CIT)
- Personal Income Tax (PIT)
- Development Levy
- Stamp Duty
- Other Deductions and Levies

### Assets

<figure>
<img src="./assets/coa-assets.svg" alt="Assets Chart of Accounts"  style="max-width: 100%; width: auto; max-height: 600px;">
<figcaption>

_Figure 1: View the mermaid sourcecode here:&#x20;_[_coa-assets.mermaid_](./assets/coa-assets.mermaid)

</figcaption>
</figure>

> [!NOTE]
> **MVP Individual scope**: Only Cash and Cash Equivalents (`100xxx`), Receivables (`102xxx`), and Suspense (`199xxx`) have entity implementations. The remaining code blocks are reserved for future use.

See [Asset Accounts](../../ledger/__docs__/01-asset-accounts.md) for detailed behaviors and bootstrap configuration.

## Liabilities

<figure>
<img src="./assets/coa-liabilities.svg" alt="Liabilities Chart of Accounts"  style="max-width: 100%; width: auto; max-height: 600px;">
<figcaption>

_Figure 2: View the mermaid sourcecode here:&#x20;_[_coa-liabilities.mermaid_](./assets/coa-liabilities.mermaid)

</figcaption>
</figure>

> [!NOTE]
> **MVP Individual scope**: Only Short Term Loans (`200xxx`), Payables (`201xxx`), and Suspense (`299xxx`) have entity implementations.

See [Liability Accounts](../../ledger/__docs__/02-liability-accounts.md) for detailed behaviors.

### Equities

<figure>
<img src="./assets/coa-equities.svg" alt="Equities Chart of Accounts"  style="max-width: 100%; width: auto; max-height: 600px;">
<figcaption>

_Figure 3: View the mermaid sourcecode here:&#x20;_[_coa-equities.mermaid_](./assets/coa-equities.mermaid)

</figcaption>
</figure>

> [!NOTE]
> **MVP Individual scope**: Only Retained Earnings (`301xxx`) and Opening Balance Equity (`399xxx`) are implemented. Capital (`300xxx`) and Reserves (`302xxx`) are defined in types but not bootstrapped for individuals.

See [Equity Accounts](../../ledger/__docs__/03-equity-accounts.md) for detailed behaviors.

### Revenues

<figure>
<img src="./assets/coa-revenues.svg" alt="Revenues Chart of Accounts"  style="max-width: 100%; width: auto; max-height: 600px;">
<figcaption>

_Figure 4: View the mermaid sourcecode here:&#x20;_[_coa-revenues.mermaid_](./assets/coa-revenues.mermaid)

</figcaption>
</figure>

> [!NOTE]
> **MVP Individual scope**: Services (`401xxx`), Employment Income (`403xxx`), Gain on Sale (`405xxx`), and Unrealized Gains (`406xxx`) are implemented. Sales (`400xxx`), Subscriptions (`402xxx`), and Interest Income (`404xxx`) are defined in types but not yet implemented.

See [Revenue Accounts](../../ledger/__docs__/04-revenue-accounts.md) for detailed behaviors.

### Expenses

<figure>
<img src="./assets/coa-expenses.svg" alt="Expenses Chart of Accounts"  style="max-width: 100%; width: auto; max-height: 600px;">
<figcaption>

_Figure 5: View the mermaid sourcecode here:&#x20;_[_coa-expenses.mermaid_](./assets/coa-expenses.mermaid)

</figcaption>
</figure>

> [!NOTE]
> **MVP Individual scope**: Direct Costs (`500xxx`), Rent & Utilities (`502xxx`), Finance Costs (`507xxx`), Tax Expense (`508xxx`), Unrealized Loss (`509xxx`), and Asset Disposal Loss (`510xxx`) are implemented. Payroll (`501xxx`), Admin & General (`503xxx`), Marketing (`504xxx`), R&D (`505xxx`), Depreciation (`506xxx`), Impairment (`511xxx`), and Other Losses (`512xxx`) are defined in types but not yet implemented.

See [Expense Accounts](../../ledger/__docs__/05-expense-accounts.md) for detailed behaviors.

## Suspense Accounts

Suspense accounts exist under both Assets (`199xxx`) and Liabilities (`299xxx`). They share a common base interface (`ISuspenseLedgerAccount`) defined in [`suspense-account.types.ts`](../../ledger/types/suspense-account.types.ts).

Key constraints:

- `isControlAccount`: always `false`
- `controlAccountId`: always `null`
- Contra and adjunct accounts: **not permitted**
- `meta`: `null` (may evolve as bank reconciliation features are built)
- Distinguished by their ledger code prefix: Asset suspense starts with `1` (`199xxx`), Liability suspense starts with `2` (`299xxx`)

See [Suspense Accounts](../../ledger/__docs__/99-suspense-accounts.md) for documentation.
