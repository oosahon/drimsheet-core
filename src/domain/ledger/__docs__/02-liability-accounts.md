# Liability Accounts

## Table of Contents

- [Introduction](#introduction)
- [Current Liabilities](#current-liabilities)
  - [Short Term Debts](#short-term-debts)
  - [Payables](#payables)
  - [Accrued Expenses](#accrued-expenses)
  - [Deferred Revenues](#deferred-revenues)
- [Non-Current Liabilities](#non-current-liabilities)
  - [Long Term Loans](#long-term-loans)
  - [Lease Liabilities & Provisions](#lease-liabilities--provisions)
- [Suspense Accounts:](#suspense-accounts)
- [Application Bootstrap](#application-bootstrap)
  - [Individual](#individual)

## Introduction

Liability ledgers are used to track what an individual, sole trader or company owes. Per our [accounting philosophy](../../accounting/__doc__/accounting.md#philosophy), our liability ledgers are structured with reporting in mind.

Liability ledgers come in two reporting hierarchies:

- Current Liabilities
- Non-Current Liabilities

When a liability ledger/sub-ledger is created, it MUST be associated with one of the two reporting hierarchies.

By default, liability accounts carry a **credit** normal balance. This is automatically derived from the account type during creation.

To ensure our system is extensible, we have not baked functionalities into ledger codes or predefined accounts. For non-power users, our ledger accounts bootstrap will handle the creation of accounts and association of behaviors. For power users, they can create accounts and associate behaviors available to the account class.

### Implementation Status

| Account Group     | Code Block | Entity File                                                                                       | Status         |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Short Term Debts  | `200xxx`   | [`00-short-term-loan.entity.ts`](../entities/02-liability-account/00-short-term-loan.entity.ts)   | ✅ Implemented |
| Payables          | `201xxx`   | [`03-payables.entity.ts`](../entities/02-liability-account/03-payables.entity.ts)                 | ✅ Implemented |
| Accrued Expenses  | `202xxx`   | —                                                                                                 | 🔲 Types only  |
| Deferred Revenues | `203xxx`   | —                                                                                                 | 🔲 Types only  |
| Long Term Loans   | `204xxx`   | —                                                                                                 | 🔲 Types only  |
| Lease Liabilities | `205xxx`   | —                                                                                                 | 🔲 Types only  |
| Provisions        | `206xxx`   | —                                                                                                 | 🔲 Types only  |
| Suspense          | `299xxx`   | [`99-suspense-account.entity.ts`](../entities/02-liability-account/99-suspense-account.entity.ts) | ✅ Implemented |

> [!NOTE]
> Entity files are named by their COA prefix (e.g. `00-` = `200xxx`, `03-` = `201xxx`) to make it explicit which accounts have been implemented and which are pending.

The following table shows the behaviors of different liability account classes

## Current Liabilities

### Short Term Debts

- **Ledger codes**: 200xxx
- **Description**: accounts that are used to track short-term borrowings, such as overdrafts, credit card balances, or short-term personal loans.
- **Main reporting hierarchy**: Current Liabilities / Short Term Debts

#### Behaviors

| Sub-Class        | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                 |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credit Cards     | /                   | <ul><li>Requires purchase/charge transaction for creation</li><li>Requires payment transaction for settlement</li><li>Supports manual reconciliations</li><li>Supports adjunct accounts (for interest and fees)</li></ul> |
| Overdrafts       | /                   | <ul><li>Automatically created if a linked bank account goes negative</li><li>Requires deposit transaction for settlement</li></ul>                                                                                        |
| Short Term Loans | /                   | <ul><li>Requires funding transaction for creation</li><li>Requires repayment transaction for settlement</li><li>Supports automated interest accrual</li></ul>                                                             |

#### Entity Details

The `ShortTermLoan` entity ([`00-short-term-loan.entity.ts`](../entities/02-liability-account/00-short-term-loan.entity.ts)) exposes:

- `make()` — base factory accepting a `behavior` parameter
- `makeCreditCardAccount()` — validates `ICreditCardAccountMeta` (cardIssuer, lastFourDigits)
- `makeOverdraftAccount()` — validates `IOverdraftAccountMeta` (linkedBankAccountId)
- `makeShortTermLoanAccount()` — validates `IShortTermLoanAccountMeta` (lenderName, maturityDate)

All short-term debt sub-types have `contraAccountRule: 'contra_permitted'` and `adjunctAccountRule: 'adjunct_permitted'`.

### Payables

- **Ledger codes**: 201xxx
- **Description**: accounts that are used to track amounts owed to suppliers, vendors, and statutory authorities.
- **Main reporting hierarchy**: Current Liabilities / Payables

#### Behaviors

| Sub-Class          | Reporting Hierarchy | Behaviors                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trade Payables     | /                   | <ul><li>Requires invoice or credit note transaction for creation</li><li>Requires payment or debit note transaction for settlement</li><li>Supports automated aging</li><li>Supports contra accounts (for early payment discounts)</li><li>Supports adjunct accounts (for interest on overdue accounts)</li></ul> |
| Statutory Payables | /                   | <ul><li>Requires tax computation or manual entry for creation</li><li>Requires statutory payment transaction for settlement</li><li>Does not support contra accounts</li><li>Does not support adjunct accounts</li></ul>                                                                                          |

#### Entity Details

The `Payables` entity ([`03-payables.entity.ts`](../entities/02-liability-account/03-payables.entity.ts)) exposes:

- `make()` — base factory accepting `behavior`, `contraAccountRule`, and `adjunctAccountRule` parameters
- `makeStatutoryPayableAccount()` — validates `IStatutoryPayableAccountMeta` (taxAuthority, taxType per [`tax.types.ts`](../types/tax.types.ts)); forces `ContraNotPermitted` and `AdjunctNotPermitted`
- `makeTradePayableAccount()` — validates `ITradePayableAccountMeta` (vendorId, invoiceId); permits contra and adjunct

Tax types are validated against the shared `ETaxType` enum (Nigerian Tax Act 2025): VAT, WHT, PAYE, CIT, PIT, Development Levy, Stamp Duty, Other Deductions.

### Accrued Expenses

- **Ledger codes**: 202xxx

> [!NOTE]
> Out of scope for MVP (individual domain).\
> These classes will be scoped when we move to support sole traders.

### Deferred Revenues

- **Ledger codes**: 203xxx

> [!NOTE]
> Out of scope for MVP (individual domain).\
> These classes will be scoped when we move to support sole traders. Deferred revenues are primarily business functions.

## Non-Current Liabilities

### Long Term Loans

- **Ledger codes**: 204xxx
- **Description**: accounts used to track borrowings the entity intends to pay back over a period longer than 12 months (e.g., mortgages, student loans, auto loans).
- **Main reporting hierarchy**: Non-Current Liabilities / Long Term Loans

> [!NOTE]
> Entity implementation pending. Types defined in [`liability-account.types.ts`](../types/liability-account.types.ts) with behaviors: `Mortgage`, `OtherLongTermLoan`.

#### Behaviors

| Sub-Class             | Reporting Hierarchy | Behaviors                                                                                                                                                                                                  |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mortgages             | /                   | <ul><li>Requires origination transaction for creation</li><li>Requires scheduled payments for settlement (handling principal and interest breakdown)</li><li>Supports automated interest accrual</li></ul> |
| Other Long Term Loans | /                   | <ul><li>Requires funding transaction for creation</li><li>Requires scheduled repayment rules</li><li>Supports adjunct accounts (for accrued interest if not managed separately)</li></ul>                  |

### Lease Liabilities & Provisions

- **Ledger codes**: 205xxx, 206xxx

> [!NOTE]
> Out of scope for MVP.\
> These advanced liability classes are purposefully excluded from the initial release to maintain system simplicity for non-power users. The ledger code blocks are permanently reserved for future enterprise compliance features.

## Suspense Accounts:

- **Ledger codes**: 299xxx
- **Description**: See [Suspense Accounts](./99-suspense-accounts.md) for more information.

#### Entity Details

The `LiabilitySuspense` entity ([`99-suspense-account.entity.ts`](../entities/02-liability-account/99-suspense-account.entity.ts)) creates accounts with:

- `subType: 'suspense'` / `behavior: 'default'`
- `isControlAccount: false` / `controlAccountId: null`
- Contra and adjunct accounts: **not permitted**
- `meta: null`
- Distinguished from asset suspense by the ledger code prefix (`299xxx` vs `199xxx`)

#### Behaviors

| Sub-Class | Reporting Hierarchy            | Behaviors                                                                                                                                                                         |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \*        | (TBD - Depends on the balance) | <ul><li>Adjunct accounts prohibited</li><li>Contra accounts prohibited</li><li>Must be reconciled and cleared to a zero balance prior to period-end financial reporting</li></ul> |

## Application Bootstrap

For non-power users, we want to bootstrap their ledger accounts with a set of default accounts based on their domain.

### Individual

For the individual MVP, the following liability accounts will be bootstrapped:

#### Current Liabilities

- Short Term Debts: `200000` (control account)
- Payables: `201000` (control account)
- Suspense Accounts: `299000`

> [!NOTE]
> Long Term Loans (`204xxx`), Lease Liabilities (`205xxx`), and Provisions (`206xxx`) are **not** bootstrapped for the individual MVP. Type definitions exist for future use.

> [!NOTE]
> An opening balance equity account will also be created for each of the control accounts above.
