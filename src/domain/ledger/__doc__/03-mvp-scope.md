# MVP Scope (v0.1.0 — Individual)

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/oosahon/PurpleLedger-core/milestone/1 (v0.1.0 — Individual MVP)

For the MVP, we are only supporting the **individual** accounting entity, focused on managing **cash and cash equivalent assets**:

- Track bank accounts and petty cash
- View unrealized FX gains and losses on multi-currency accounts
- Manage day-to-day transactions required for personal income tax computation

## Individual MVP — Ledger Accounts

The following ledger accounts are in scope for the individual MVP. Accounts are organized by the five primary account classes:

### Assets

| Account                        | Code Block | Entity File                         | Status         |
| ------------------------------ | ---------- | ----------------------------------- | -------------- |
| Cash and Cash Equivalents      | `100xxx`   | `00-cash-and-equivalents.entity.ts` | ✅ Implemented |
| Receivables (Tax Credits)      | `102xxx`   | `02-receivables.entity.ts`          | ✅ Implemented |
| Suspense (Bank Reconciliation) | `199xxx`   | `99-suspense-account.entity.ts`     | ✅ Implemented |

### Liabilities

| Account                        | Code Block | Entity File                     | Status         |
| ------------------------------ | ---------- | ------------------------------- | -------------- |
| Short Term Loan (Overdraft)    | `200xxx`   | `00-short-term-loan.entity.ts`  | ✅ Implemented |
| Payables (Tax Obligations)     | `201xxx`   | `03-payables.entity.ts`         | ✅ Implemented |
| Suspense (Bank Reconciliation) | `299xxx`   | `99-suspense-account.entity.ts` | ✅ Implemented |

### Equity

| Account                | Code Block | Entity File                           | Status         |
| ---------------------- | ---------- | ------------------------------------- | -------------- |
| Retained Earnings      | `301xxx`   | `01-retained-earning.entity.ts`       | ✅ Implemented |
| Opening Balance Equity | `399xxx`   | `99-opening-balance-equity.entity.ts` | ✅ Implemented |

> [!NOTE]
> Capital (`300xxx`) is **not** bootstrapped for individuals — there is no concept of owner's equity in personal finance. The type definition exists for sole trader/company use.

### Revenue

| Account              | Code Block | Entity File                      | Status         |
| -------------------- | ---------- | -------------------------------- | -------------- |
| Services (Freelance) | `401xxx`   | `02-services.entity.ts`          | ✅ Implemented |
| Employment Income    | `403xxx`   | `04-employment-income.entity.ts` | ✅ Implemented |
| Gain on Asset Sale   | `405xxx`   | `06-gain-on-sale.entity.ts`      | ✅ Implemented |
| Unrealized Gain      | `406xxx`   | `07-unrealized-gain.entity.ts`   | ✅ Implemented |
| Grants               | `407xxx`   | `grants.entity.ts`               | ✅ Implemented |
| Gifts                | `408xxx`   | `gifts.entity.ts`                | ✅ Implemented |

### Expenses

| Account             | Code Block | Entity File                        | Status         |
| ------------------- | ---------- | ---------------------------------- | -------------- |
| Direct Costs        | `500xxx`   | `00-direct-costs.entity.ts`        | ✅ Implemented |
| Rent and Utilities  | `502xxx`   | `02-rent-and-utilities.entity.ts`  | ✅ Implemented |
| Bank Charges        | `507xxx`   | `07-bank-charge.entity.ts`         | ✅ Implemented |
| Finance Costs       | `508xxx`   | `08-finance-cost.entity.ts`        | ✅ Implemented |
| Interest            | `509xxx`   | `09-interest.entity.ts`            | ✅ Implemented |
| Tax Expense         | `510xxx`   | `10-tax-expense.entity.ts`         | ✅ Implemented |
| Unrealized Loss     | `511xxx`   | `11-unrealized-loss.entity.ts`     | ✅ Implemented |
| Asset Disposal Loss | `512xxx`   | `12-asset-disposal-loss.entity.ts` | ✅ Implemented |

> [!NOTE]
> See the dedicated Ledger Class documents for detailed behavior rules for each account.
