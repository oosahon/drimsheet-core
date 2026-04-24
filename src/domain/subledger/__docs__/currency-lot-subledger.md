# Currency Lot Subledger

## Overview

The Currency Lot Subledger is an advanced accounting mechanism that treats foreign currency (FCY) cash balances as structured "inventory" or "lots" rather than a flat, commingled balance. This enables high-fidelity tracking of both realized and unrealized Foreign Exchange (FX) gains and losses.

By tying specific incoming FCY deposits to the exact spot exchange rate at the time of the transaction, the `currency_lot_subledger` guarantees that the lineage of capital is preserved. This solves the complex treasury challenge of correctly attributing FX gains or losses when fungible foreign currency is spent over time.

## Mechanics

### Control Account Integration

When a user provisions a base asset account (e.g., Cash or Petty Cash) where the underlying currency differs from their entity's `functionalCurrency`:

1. The asset account is directly designated as a **Control Account** in the ledger.
2. The General Ledger safely tracks the top-level aggregated summary balance in the functional currency.
3. A `currency_lot_subledger` is instantiated to encapsulate and manage the granular lot histories.

### Opening Balances & Bootstrapping

When onboarding a pre-existing FCY account that already holds a balance, the system bootstraps the ledger via an Opening Balance Equity (OBE) injection:

- A new lot entry is generated in the `currency_lot_subledger` corresponding to the spot balance and exchange rate at onboarding.
- A double-entry transaction is recorded representing the balance transfer:
  - **Debit (DR):** Currency Lot Subledger (Cash equivalent lot)
  - **Credit (CR):** Opening Balance Equity (OBE)
- The transaction entry is explicitly tagged with `adjustment_type = null`. This identifies the transaction as a baseline capital induction, cleanly differentiating it from periodic, system-generated FX revaluations or manual transaction adjustments.

## Architecture & Data Model

The subledger normalizes the FX accounting problem into three distinct data structures, cleanly separating creation, revaluation, and consumption:

### 1. Currency Lot (`ICurrencyLot`)

Represents the baseline induction of foreign currency.
To preserve a pristine audit trail, every lot natively points to the exact General Ledger `journalEntryId` that debited the underlying Control Account. As periodic revaluations occur, an `adjustedFunctionalBalanceImpact` maintains a continuous, pre-calculated snapshot of the lot's current functional value, preventing expensive backward-aggregation queries.

### 2. Lot Adjustments (`ICurrencyLotAdjustment`)

Handles periodic Mark-to-Market revaluations (unrealized gains/losses) independently of capital consumption.
Instead of directly injecting daily volatility into the General Ledger, adjustments sit in the subledger and are explicitly tracked via a `postedAt` timestamp. This queue pattern allows the system to aggregate thousands of daily micro-fluctuations and execute a single net Unrealized Gain/Loss Journal Entry at scheduled intervals (e.g., week-end or month-end), shielding the main GL from endless noise.

### 3. Lot Sales (`ICurrencyLotSale`)

Records the drawdown or consumption of a lot.
To satisfy the system's dual-reporting requirement natively, both the `fifoRealizedImpact` and `wacRealizedImpact` metrics are permanently locked in at the millisecond the sale occurs. By snapshotting the global `wacSpotRateAtSale` directly on the record, the database avoids complex, slow historical recounts during report generation. Creating a tax compliance report (WAC) versus an internal performance chart (FIFO) becomes a simple, blazing-fast column summation.

## Gain/Loss Reporting Methods

The ledger supports two primary frameworks for determining how cost-basis value is relieved from the lots when FCY is drawn down or spent:

### 1. Weighted Average Cost (System Default)

Given that cash is perfectly fungible, the system defaults to a moving average cost methodology. Every time a new FCY deposit is recognized in the subledger, the average exchange rate across the total FCY capital pool is recalculated. Subsequent spending realizes FX gains or losses against this smoothed moving average.

### 2. First-In, First-Out (FIFO)

Power users may opt into a FIFO calculation framework tailored for internal management reporting or treasury performance tracking. Under FIFO, the engine assumes that the first FCY funds deposited into the subledger are the first ones spent, allowing for highly specific gain/loss attribution on a per-lot sequential basis.

## Compliance and Tax Reporting

> [!WARNING]  
> If an entity selects the FIFO methodology for management reporting, the system will explicitly inform them that this method is strictly for internal analytical use and is bypassed for tax computations.

For strict regulatory compliance, the system's tax engine wholly decouples from the user's internal management reporting preferences. **Tax computations will always forcefully default to the Weighted Average method for computing taxable cash FX gains or losses.**

This hard compliance guardrail prevents entities from manipulating recognized gains through preferential lot selection (cherry-picking), ensuring all statutory returns natively reflect compliant accounting standards.

## Preconditions

- The governing **Accounting Entity** must be fully onboarded.
- The `functionalCurrency` of the entity must be established and committed prior to the creation of the FCY cash account to allow for the initial divergence check.
