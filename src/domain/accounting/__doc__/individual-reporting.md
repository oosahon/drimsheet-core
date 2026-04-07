# Reporting For Individuals

## Table of Contents

- [Personal Income Statement](#personal-income-statement)

## Personal Income Statement

The Personal Income Statement for an individual will carry the following information:

- **Total Income**:
  - List all accounts in the 40000-49999 range
  - Sum all the accounts
- **Total Expenses**:
  - List all accounts in the 50000-59999 range
  - Sum all the accounts
- **Net Income Before Tax**: Total Income - Total Expenses

- **Tax (Estimated)**:
  - **Tax Credit**
    - Any tax credit that the individual is eligible for
  - **Tax Payable**
    - Computed tax based on the individual's tax bracket
  - **Net Tax Payable**
    - Tax Payable - Tax Credits
- **Net Income After Tax**: Net Income Before Tax - Net Tax Payable

### Permitted Time Frame

- Monthly
- Quarterly
- Yearly

### Implementation Strategy

#### Non-Power Users

The system will rely on top-level system categories to generate the report.
So, instead of listing "accounts" -- seeing that non-power user may only rely on control accounts -- we will list categories instead.

#### Power Users

For power users, we will utilize the accounts they have created.
