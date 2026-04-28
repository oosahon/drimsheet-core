# Statutory Reporting & Taxation Policies

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/oosahon/PurpleLedger-core/milestone/1 (v0.1.0 — Individual MVP)

## Statutory Types

Statutory accounts (receivables and payables) rely on a standard set of tax policies. For the MVP, our tax types are based on the **Nigerian Tax Act (NTA) 2025**:

- Value Added Tax (VAT)
- Withholding Tax (WHT)
- Pay As You Earn (PAYE)
- Corporate Income Tax (CIT)
- Personal Income Tax (PIT)
- Development Levy
- Stamp Duty
- Other Deductions and Levies

These types are defined centrally in `src/domain/ledger/types/tax.types.ts`.

> [!NOTE]
> The General Ledger is inherently standard-agnostic. When Ledger accounts are created (e.g. `Statutory Payable Account`), the Ledger simply stores the tax type as a generic string. It does not validate against this list. The Accounting domain is strictly responsible for validating and executing tax logic.

## Taxation Policies Architecture

Our taxation engine leverages a "Policy & Rules" architecture that completely insulates the General Ledger from tax complexity.

### How it Works

1. **Tax Policies**: A tax policy is defined with a set of specific rules (e.g., "5% VAT on specific service sales").
2. **Account Association**:
   - **`taxation_input_accounts`**: We associate the policy with specific input ledger accounts (like Revenue or Expense accounts).
   - **`taxation_output_accounts`**: We define the output ledger accounts where the computed liability or receivable should be posted.
3. **Execution**: During transaction posting or period-end processing, the tax logic observes the balances or events in the `taxation_input_accounts`, calculates the statutory liability based on the policy rules, and records a journal entry against the defined `taxation_output_accounts`.

### Benefits

This means that power users can look at our predefined tax policies and freely attach them to their accounts. For non-power users, these policies will be automatically attached to default accounts during the system bootstrap. The General Ledger remains entirely pure—acting only as the buckets from which the Tax Policies draw and post balances.
