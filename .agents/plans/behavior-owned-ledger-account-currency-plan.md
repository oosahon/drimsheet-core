# Behavior-Owned Ledger Account Currency Plan

## Goal

Allow `ILedgerAccount.currency` to be nullable while keeping the meaning of
that null explicit: the account is not denominated in one transaction
currency, its balance is measured in the accounting entity's functional
currency, and original currency remains on journal lines.

Each existing account domain service remains the owner of the currency rule
for the behavior it creates. Revenue and expense headers remain in functional
currency and their subaccounts become null-currency. Asset, equity, and
suspense runtime behavior remains unchanged. Liability headers remain in
functional currency; each liability subaccount behavior applies its own rule.

The plan is implementation-ready. For implemented liability behaviors, Short
Term Loan requires an explicit nullable currency choice, Credit Card and Tax
Payable require currency, and Trade Payable is null-currency at the general
ledger layer. The inventory also records the confirmed future rules for
Payable `Default` and the Overdraft reporting account without adding creation
paths for them. During implementation, preserve all unrelated staged and
working-tree changes.

## Context

- `ILedgerAccount.currency` is currently non-null and
  `ledgerAccountEntity.make` always validates `payload.currency.code`.
- The existing equity service is the precedent for behavior ownership: its
  input does not accept currency and the service derives functional currency
  from the accounting entity.
- Every implemented revenue and expense service already derives functional
  currency for `createHeader`, but its `createSubAccount` contract accepts a
  caller-selected `ICurrency` and passes it to the entity.
- Journal lines already store original `amount` and converted
  `functionalAmount`. Ledger account balances instead store one account
  `amount` and one `functionalAmount`; both remain non-null money values.
- Ledger account persistence and repository reads still assume an account
  currency is present. In particular, account reads use a required currency
  join, so a null-currency account would not currently be returned.
- Posted journals remain the source of truth. Balance propagation remains
  asynchronous, best-effort, and retryable; this plan changes how it computes
  null-account deltas, not that lifecycle.
- The database migration and generated Drizzle definitions have already been
  changed by the user and are excluded from this plan.

## Confirmed Findings

1. **Currency eligibility belongs to the behavior service.** The shared ledger
   entity can validate a non-null currency value, but it cannot decide whether
   a Services, Trade Payable, Bank, or Retained Earnings account may be null.
2. **Null is a denomination rule, not a missing monetary unit.** A null account
   must not aggregate USD, EUR, and NGN source amounts into one native number.
   Its account balance `amount` and `functionalAmount` must both be measured in
   functional currency, while the journal lines preserve the source amounts.
3. **Header currency is already compatible with roll-up.** Implemented header
   services derive functional currency, and the current adjustment use case
   uses functional deltas when a child's denomination differs from its parent.
4. **Revenue and expense hierarchy compatibility can be enforced by
   construction.** Their `createSubAccount` methods create both posting and
   nested control accounts. If those methods always set `currency: null`, a
   null sub-control can create only null descendants through that behavior
   service, without a policy object or shared strategy.
5. **Fixed-currency behavior remains useful.** Existing asset, equity, and
   suspense creation paths retain their current non-null rules. Any behavior
   that ultimately remains fixed-currency continues to require journal line
   currency to match account currency during balance propagation.
6. **Liability rules differ by existing behavior.** Short Term Loan permits an
   explicit fixed-or-null choice; Credit Card and Tax Payable retain required
   denomination currencies; Trade Payable is null because invoice currencies
   belong to the future accounts-payable subledger. These rules belong in the
   corresponding liability domain services, not in a shared policy type.
7. **A null control account can control only null-currency subaccounts.**
   Revenue and Expense guarantee this by construction. Liability services that
   accept both null and fixed currency must enforce it in their existing local
   control-account validation path.
8. **Two declared-only liability rules are also settled.** Payable `Default`
   must require currency because it will have no subledger, while Overdraft must
   derive functional currency because it represents bank-account overdrafts for
   reporting. Neither decision adds a creation service in this change.

## Currency Behavior Inventory

The tables distinguish an implemented creation behavior from a declaration in
the type constants. A declared-only behavior has no service, contract,
bootstrap path, or focused service test today; this plan does not create one.

### Asset, Equity, and Suspense

| Subtype / behavior                              | Current creation and currency rule                                                                              | Planned rule           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Cash / `DefaultCash`                            | Implemented header; service derives functional currency                                                         | Unchanged              |
| Cash / `PettyCash`                              | Implemented subaccount; required caller-supplied fixed currency                                                 | Unchanged              |
| Cash / `Bank`                                   | Implemented subaccount; required caller-supplied fixed currency                                                 | Unchanged              |
| Receivables / `DefaultReceivables`              | Implemented header; service derives functional currency                                                         | Unchanged              |
| Receivables / `StatutoryReceivable`             | Implemented subaccount; required caller-supplied fixed currency                                                 | Unchanged              |
| Receivables / `TradeReceivable`                 | Implemented subaccount; required caller-supplied fixed currency                                                 | Unchanged              |
| Asset Suspense / `Default`                      | Implemented root posting account; service requires supplied currency and bootstrap supplies functional currency | Unchanged              |
| Short-term investment / `StockAndETFs`, `Bonds` | Declared only                                                                                                   | No creation path added |
| Other asset subtypes / `Default`                | Declared only, apart from asset suspense                                                                        | No creation path added |
| Opening Balance / `OpeningBalanceEquity`        | Implemented; service derives functional currency                                                                | Unchanged              |
| Retained Earnings / `RetainedEarnings`          | Implemented; service derives functional currency                                                                | Unchanged              |
| Capital / `OwnerCapital`                        | Declared only                                                                                                   | No creation path added |
| Reserve / `RevaluationReserve`                  | Declared only                                                                                                   | No creation path added |
| Liability Suspense / `Default`                  | Implemented root posting account; service requires supplied currency and bootstrap supplies functional currency | Unchanged              |

No Asset, Equity, or Suspense service, contract, or family type is changed in
this plan. Their existing services continue to produce non-null currency even
though generic `ILedgerAccount` consumers must now handle the widened base
type.

### Revenue

| Subtype / behavior                     | Current creation and currency rule                                  | Planned rule                                                                              |
| -------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Services / `Services`                  | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Employment Income / `EmploymentIncome` | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Gain on Asset Sale / `GainOnAssetSale` | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Unrealized Gains / `UnrealizedGains`   | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Grants / `Grants`                      | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Gifts / `Gifts`                        | Implemented; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Sales / `Sales`                        | Declared only                                                       | No creation path added; future service must follow functional-header/null-subaccount rule |
| Subscriptions / `Subscriptions`        | Declared only                                                       | No creation path added; future service must follow functional-header/null-subaccount rule |
| Interest Income / `InterestIncome`     | Declared only                                                       | No creation path added; future service must follow functional-header/null-subaccount rule |

### Expense

| Subtype / behavior                                                            | Current creation and currency rule                                                                        | Planned rule                                                                              |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Direct Costs / `COGS`, `CostOfServices`, `CostOfRevenue`, `DefaultDirectCost` | Implemented by one behavior-parameterized service; functional header, caller-supplied subaccount currency | Functional header; every subaccount is null                                               |
| Rent and Utilities / `RentAndUtilities`                                       | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Bank Charge / `BankCharge`                                                    | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Finance Cost / `FinanceCost`                                                  | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Interest / `Interest`                                                         | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Income Tax Expense / `TaxExpense`                                             | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Unrealized Loss / `UnrealizedLoss`                                            | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Loss on Asset Disposal / `AssetDisposalLoss`                                  | Implemented; functional header, caller-supplied subaccount currency                                       | Functional header; every subaccount is null                                               |
| Payroll / `PayrollAndPersonnel`                                               | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| Admin / `AdminAndGeneral`                                                     | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| Marketing / `MarketingAndSelling`                                             | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| R&D / `ResearchAndDevelopment`                                                | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| Depreciation / `DepreciationAndAmortization`                                  | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| Impairment / `ImpairmentLoss`                                                 | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| Other Loss / `OtherLoss`                                                      | Declared only                                                                                             | No creation path added; future service must follow functional-header/null-subaccount rule |
| General / `Default`                                                           | Declared and accepted as an alternate control behavior, but never created                                 | No creation path added; descendants created by an implemented expense service are null    |

### Liability

| Subtype / behavior                               | Current creation and currency rule                                                                  | Planned rule                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Short-term Debt / `ShortTermLoan` header         | Implemented; service derives functional currency                                                    | Unchanged functional currency                                                                                |
| Short-term Debt / `ShortTermLoan` subaccount     | Implemented; required caller-supplied fixed currency                                                | Require an explicit `ICurrency \| null`; the creator chooses fixed-currency or null-currency                 |
| Short-term Debt / `CreditCard` subaccount        | Implemented; required caller-supplied fixed currency                                                | Require non-null statement/settlement currency                                                               |
| Payable / `DefaultPayable` header                | Implemented; contract accepts a currency that the service ignores, then derives functional currency | Keep functional currency and remove the redundant input                                                      |
| Payable / `TaxPayable` subaccount                | Implemented; required caller currency is passed through                                             | Keep required non-null currency; no tax subledger retains denomination                                       |
| Payable / `TradePayable` subaccount              | Implemented; required caller currency is passed through                                             | Always null; invoice currencies belong to the future AP subledger                                            |
| Payable / `Default`                              | Accepted by the Payable account type, but never created                                             | No creation path added; when implemented, require currency because no subledger will retain it               |
| Short-term Debt / `DefaultShortTermDebt`         | Declared and accepted as a parent behavior, but never created                                       | No creation path added                                                                                       |
| Short-term Debt / `Overdraft`                    | Declared only                                                                                       | No creation path added; when implemented as the bank-overdraft reporting account, derive functional currency |
| Accrued Expense / `Default`                      | Declared only                                                                                       | No creation path added                                                                                       |
| Deferred Revenue / `Default`                     | Declared only                                                                                       | No creation path added                                                                                       |
| Long-term Loan / `Mortgage`, `OtherLongTermLoan` | Declared only                                                                                       | No creation path added                                                                                       |
| Lease Liability / `Default`                      | Declared only                                                                                       | No creation path added                                                                                       |
| Provision / `Default`                            | Declared only                                                                                       | No creation path added                                                                                       |

## Scope

### Expected Changes

- `src/domain/ledger/types/ledger.types.ts` and
  `src/domain/ledger/entities/ledger-account.entity.ts` — represent nullable
  currency and validate currency codes only when a value exists.
- `src/domain/ledger/services/revenue-account/*`,
  `src/domain/ledger/services/expense-account/*`, and their service contracts
  — make the agreed header/subaccount rules service-owned.
- Revenue and expense bootstrap helpers and direct test call sites — stop
  supplying a currency that the subaccount service no longer accepts.
- Existing liability services and contracts — retain functional headers,
  require an explicit nullable Short Term Loan currency, preserve required
  Credit Card and Tax Payable currencies, set Trade Payable currency to null,
  and remove the ignored Payables header currency input.
- Existing liability control-account validators — enforce the confirmed rule
  that a null-currency subaccount can control only null-currency subaccounts.
- `src/infra/persistence/repos/ledger/mappers/ledger-account.mapper.ts` and
  `src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts` — round-trip
  null and return accounts whose optional currency relation is absent.
- Ledger account persistence, balance propagation, balance adjustment, account
  read fallbacks, and DTO mapping helpers — use functional currency as the
  balance measurement currency when account currency is null.
- Existing unit, service, mapper, repository, bootstrap, journal fixture, and
  balance propagation tests — cover both null and fixed paths.

### Out of Scope

- Any change under `db/migrations` or `src/infra/config/drizzle`, including
  schema, generated relations, or regeneration commands.
- Changes to the non-null ledger account balance schema or money value object.
- New account behaviors, account services, generic currency-policy types,
  strategy objects, or IoC registrations.
- FX remeasurement, realized/unrealized gain workflows, historical-rate
  policies, or implementation of the future accounts-payable/open-item
  subledger.
- A new journal-entry workflow that automatically provisions a liability
  account while posting; the codebase has no equivalent production flow today.
- Changes to journal-as-source-of-truth semantics, propagation retry/support
  operations, or the post-commit propagation boundary.
- Existing unrelated control-account code allocation, queue job identity, and
  other staged or working-tree changes.
- Asset, Equity, and Suspense domain services, contracts, and family types.
- Adding account denomination to `ILedgerAccountDto`; the current DTO exposes
  balance and functional balance money but not the account's currency field.

## Proposed Approach

### 1. Make currency nullable in the shared account model

- Change `ILedgerAccount.currency` from `ICurrency` to `ICurrency | null`.
- In `ledgerAccountEntity.make`, call `currencyEntity.validateCode` only when
  `payload.currency` is non-null. Preserve the null value in the entity,
  created event, audit delta, and opening-balance-date update.
- Make generic consumers such as the FX acquisition helper explicitly handle
  the widened nullable base type without changing Asset, Equity, or Suspense
  service contracts or runtime currency rules.
- Do not add a policy enum or delegate behavior eligibility to the shared
  entity.

### 2. Put each creation rule in its existing behavior service

- For all six implemented revenue services and all eight implemented expense
  services, remove `currency: ICurrency` from the subaccount input contract and
  replace `currency: payload.currency` with `currency: null` in
  `createSubAccount`.
- Leave every revenue and expense `createHeader` implementation unchanged; it
  already resolves functional currency from `payload.accountingEntity`.
- Remove the now-unused functional-currency construction from the revenue and
  expense posting-account bootstrap payloads.
- Keep Asset, Equity, and Suspense service implementations and inputs
  unchanged.
- Keep the Short Term Debt header deriving functional currency. Change the
  Short Term Loan subaccount contract so `currency` is required and typed as
  `ICurrency | null`, then pass that explicit choice through. Keep Credit Card
  currency required and non-null.
- Remove `currency` from the Payables `createHeader` input and its callers;
  that service already ignores the input and derives functional currency.
- Keep Tax Payable's required `ICurrency` input. Remove currency from the Trade
  Payable input and set `currency: null` inside `payables.service.ts`; this is
  the functional-balance AP general-ledger layer, while invoice denomination
  will belong to the future AP subledger.
- Revenue and Expense need no currency branch in their parent validators:
  hardcoding null in `createSubAccount` already makes every nested child null.
  In the Short Term Loan validator, reject a fixed-currency child when its
  control is null-currency. Credit Card and Tax Payable remain non-null and
  reject a null-currency control; Trade Payable produces null descendants by
  construction. Reuse the existing invalid-control-account path, leave current
  fixed-parent behavior unchanged, and add nothing to
  `control-account-resolver.ts`.
- The inventory records `Payable / Default` as required-currency and
  `Overdraft` as functional-currency when their services are eventually
  implemented. Neither declared-only behavior gets a new creation service in
  this change.

### 3. Round-trip null accounts through persistence

- Map `account.currency?.code ?? null` when writing a ledger account.
- Accept a nullable joined currency model when mapping a repository result and
  return `currency: null` when no currency row exists.
- Change every ledger account read that currently requires the currency
  relation (`findById`, `findAllByIds`, `findByCode`, `findBySubType`,
  `findByBehavior`, and `findAll`) to retain rows with null currency.
- Add mapper and repository cases for both null and non-null currency so fixed
  accounts continue to round-trip unchanged.
- These are repository/mapping changes only; do not edit or regenerate the
  database or Drizzle definition files.

### 4. Keep balances monetary by measuring null accounts functionally

- In ledger account persistence, create the initial balance with
  `account.currency ?? functionalCurrency`. This preserves the existing
  one-account/one-balance entity and non-null money values.
- Apply the same fallback when an account read cannot find its stored balance
  and when `mapLedgerAccountToDto` constructs a zero balance. If that generic
  mapper receives a journal line for a null account, use the line's
  `functionalAmount` rather than its original `amount` as the displayed
  account balance.
- For a fixed-currency account, keep propagation's existing requirement that
  every source amount currency equals the account currency, and keep summing
  source `amount` into `balanceDelta`.
- For a null-currency account, validate account identity and common functional
  currency but permit different source currencies. Build both `balanceDelta`
  and `functionalBalanceDelta` from each line's `functionalAmount` and normal
  balance effect.
- In balance adjustment, treat a null account like a denomination mismatch and
  apply `functionalBalanceDelta` to both stored balance measures. Continue
  forwarding the original adjustment DTO to its control account so the
  functional-currency header uses the existing roll-up behavior.
- Keep queueing, error reporting, retries, and journal transaction boundaries
  unchanged.

### 5. Update callers and keep the public shape stable

- Remove revenue/expense subaccount currency from bootstrap helpers, their
  expectations, and direct domain-service calls in journal tests.
- Remove the redundant Payables header currency from the liability bootstrap
  and its tests. Stop supplying functional currency to the bootstrapped Trade
  Payable control account; continue supplying the required currency to Tax
  Payable.
- Update typed domain-service mocks through their existing contracts; no new
  mock family or IoC wiring is needed.
- Keep journal-line DTOs and entities unchanged: transaction currency and
  exchange-rate conversion continue to live on each journal line.
- Keep ledger account DTO response fields unchanged. For a null account, both
  returned balance money values carry functional currency.

## Test Plan

- **Shared entity:** create an account with `currency: null`; verify its entity,
  event, and audit retain null; keep the invalid non-null currency-code test.
- **Revenue services:** for Services, Employment Income, Gain on Asset Sale,
  Unrealized Gains, Grants, and Gifts, retain functional-header assertions and
  change subaccount assertions to null. Cover a nested sub-control descendant
  to prove it also receives null.
- **Expense services:** apply the same assertions to every Direct Costs
  behavior and to Rent and Utilities, Bank Charge, Finance Cost, Interest, Tax
  Expense, Unrealized Loss, and Asset Disposal Loss.
- **Unchanged-family regression:** add explicit assertions that the Cash and
  Receivables headers use functional currency; Petty Cash, Bank, Statutory
  Receivable, and Trade Receivable preserve their required supplied currency;
  both Equity accounts derive functional currency; and both Suspense services
  preserve supplied currency.
- **Liability services:** verify Short Term Loan accepts both an explicit fixed
  currency and explicit null; Credit Card and Tax Payable preserve required
  non-null currency; Trade Payable always produces null; and both liability
  headers derive functional currency without accepting a redundant Payables
  header currency. Verify a null Short Term Loan control accepts a null loan
  child and rejects a fixed loan child; Credit Card and Tax Payable reject null
  controls; and a Trade Payable sub-control can create only null Trade Payable
  descendants. Keep current fixed-parent behavior unchanged.
- **Persistence:** test null and non-null `toRepo`/`toDomain` mapping and verify
  every repository read method returns a null-currency row rather than
  filtering it out.
- **Balance creation and reads:** verify a null account receives a zero account
  balance in functional currency and missing-balance DTO fallbacks do the same.
- **Propagation:** verify mixed source currencies can update one null Revenue or
  Expense account using functional deltas; verify fixed-account currency
  mismatch reporting remains; verify roll-up reaches the functional header
  with the correct amount.
- **Adjustment:** verify a null account uses functional delta for both stored
  balances and still queues its parent adjustment.
- **Regression fixtures:** update bootstrap, journal service, receipt use case,
  mapper, persistence-service, and typed mock fixtures affected by the contract
  changes.

## Verification

```bash
npm test -- --runInBand src/domain/ledger/entities/__tests__/ledger-account.entity.test.ts src/domain/ledger/services/revenue-account src/domain/ledger/services/expense-account src/domain/ledger/services/liability-account
npm test -- --runInBand src/domain/ledger/services/asset-account src/domain/ledger/services/equity-account src/domain/ledger/services/suspense-account
npm test -- --runInBand src/app/ledger/services/__specs__/ledger-account-persistence.service.spec.ts src/app/ledger/services/__specs__/ledger-account-balance-propagation.service.spec.ts src/app/ledger/usecases/__specs__/adjust-ledger-account-balance.usecase.spec.ts src/app/ledger/usecases/__specs__/get-ledger-account.usecase.spec.ts src/app/ledger/usecases/__specs__/get-ledger-accounts.usecase.spec.ts
npm test -- --runInBand src/infra/persistence/repos/ledger/mappers/__tests__/ledger-account.mapper.test.ts src/infra/persistence/repos/ledger/__specs__/ledger-account.repo.impl.spec.ts
npm run test:names
npm run lint
npm run build
npm test -- --runInBand
```

The repository implementation spec and full suite may require the configured
test PostgreSQL instance. No database migration or generation command belongs
in verification for this plan.

## Assumptions

- The user's existing database/Drizzle work makes
  `ledger_accounts.currency_code` nullable and is the complete schema change
  for this feature.
- Ledger account balance currency remains non-null. For a null-denominated
  account, it is intentionally the accounting entity's functional currency.
- Existing data normalization, if required for already-created Revenue,
  Expense, or Trade Payable accounts and their stored balance measurement
  currency, is handled by the user's excluded database work; this application
  plan governs newly created and newly read account state.
- Asset, Equity, and Suspense services remain the source of their current
  non-null runtime guarantees; widening the shared interface does not change
  what those services create.

## Risks

- **Invisible null accounts:** leaving any required currency join in a ledger
  account read will omit valid accounts. Cover every repository method with a
  null-row test.
- **Meaningless native totals:** summing original amounts for a null account
  would combine currencies. Centralize the mechanical functional fallback in
  existing persistence/propagation paths and test mixed-currency lines.
- **Widened generic type:** generic consumers can no longer dereference
  `account.currency` without handling null. Update those consumers while
  retaining explicit regression coverage for unchanged family services.
- **Partially converted existing data:** application behavior cannot guarantee
  historical Revenue, Expense, or Trade Payable rows—and corresponding stored
  balance measurement currencies—are normalized without data work. Treat the
  excluded database work as a deployment prerequisite.
- **AP subledger gap:** null Trade Payable accounts correctly represent the GL
  control layer, but the future subledger features are not yet available.
  Preserve original and functional amounts on journal lines and do not claim
  invoice-level aging, settlement, or currency-exposure support in this change.

## Completion Criteria

- `ILedgerAccount` and the shared entity support null currency without
  accepting an invalid non-null currency.
- Every implemented Revenue and Expense header is created in functional
  currency and every subaccount from those services is created with null
  currency.
- Asset, Equity, and Suspense runtime currency behavior remains unchanged.
- Short Term Loan requires an explicit fixed-or-null currency choice; Credit
  Card and Tax Payable require currency; Trade Payable is always null; and both
  liability headers derive functional currency without accepting a redundant
  Payables header currency input.
- The inventory records that future Payable `Default` accounts require currency
  and the future Overdraft reporting account derives functional currency,
  without adding either declared-only creation path.
- Null-currency accounts persist, can be retrieved by every repository query,
  receive functional-currency balances, accept mixed transaction currencies,
  and roll up functional deltas to their headers.
- Fixed-currency accounts retain existing denomination matching and native plus
  functional balance behavior.
- Revenue/Expense null descendants are guaranteed by their existing creation
  methods, and a liability null control can create only null descendants. Each
  rule is enforced locally without a new shared currency-policy abstraction.
- Focused tests, repository tests, lint, build, and the broader suite pass.
- No migration, Drizzle definition, generated relation, new IoC wiring, or
  unrelated working-tree file is changed.
