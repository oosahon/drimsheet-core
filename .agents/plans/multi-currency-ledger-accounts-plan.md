# Multi-Currency Ledger Accounts Plan

## Goal

Allow a user to post any transaction currency to a revenue, expense, or
multi-currency liability account without creating a currency-specific account.
Currency-denominated asset accounts continue to require and enforce their
denomination currency. A multi-currency account keeps a functional-currency
running balance, using the same aggregation behaviour already used by
functional-currency control accounts.

The plan is implementation-ready under the stated interpretation that
top-level control accounts are the exception to the revenue/expense rule: they
retain the accounting entity's functional currency, while revenue/expense
posting accounts have `currency: null`. The account classification and code for
the new default "Funds Held for Others" liability account remains an open
product decision.

Preserve unrelated staged and working-tree changes during implementation.

## Context

Journal lines retain both their entered `amount` and converted
`functionalAmount`. Journal validation balances only functional amounts
([`src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts`](../../src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts)).
The receipt use case persists the journal transaction, then invokes the
best-effort balance-propagation service
([`src/app/journal-entry/usecases/create-receipt.usecase.ts`](../../src/app/journal-entry/usecases/create-receipt.usecase.ts)).

The balance worker already receives native and functional deltas. When a child
account's currency differs from its functional-currency control account, it
uses the functional delta and recursively queues the control-account update
([`src/app/ledger/usecases/adjust-ledger-account-balance.usecase.ts`](../../src/app/ledger/usecases/adjust-ledger-account-balance.usecase.ts)).
This is the aggregation model to apply to `currency: null` accounts; a
multi-currency-position table is not part of this change.

## Confirmed Findings

1. **Current propagation blocks the required postings.**
   `validateLines` requires every journal-line currency to equal
   `account.currency`, then the service creates a native zero amount in the
   same currency. A GBP receipt to the currently NGN-denominated Gifts account
   therefore persists the journal but reports and absorbs a propagation error
   ([`src/app/ledger/services/ledger-account-balance-propagation.service.ts`](../../src/app/ledger/services/ledger-account-balance-propagation.service.ts)).

2. **A functional aggregate can already be updated safely.**
   The adjustment use case chooses `functionalBalanceDelta` whenever its
   received native delta does not match the target account currency. Both
   `amount` and `functionalAmount` of a control-account balance consequently
   remain in the functional currency.

3. **`ILedgerAccount.currency` and its storage are currently mandatory.**
   The domain entity always dereferences the currency; the account mapper and
   repository use an inner currency join; and both the migration and Drizzle
   schema declare `ledger_accounts.currency_code` non-null. Existing balance
   rows remain non-null and can continue to use the functional currency for a
   `currency: null` account.

4. **The current liability bootstrap has no suitable default for money held on
   behalf of another person.** It bootstraps debt, payables, suspense, and a
   statutory-payables posting account. Treating the uncle's GBP as a loan or
   invoice payable would be a classification error
   ([`src/app/ledger/services/helpers/liability-accounts-bootstrap.helper.ts`](../../src/app/ledger/services/helpers/liability-accounts-bootstrap.helper.ts)).

## Scope

### Expected Changes

- `src/domain/ledger/shared/types/ledger.types.ts` and the ledger-account
  entity, helpers, errors, and tests — model a nullable denomination currency
  and enforce the account-currency policy in the domain creation path.
- `src/domain/ledger/{asset,liability,revenue-account,expense-account}/**` —
  update account factory payloads and bootstrap construction so assets always
  receive a currency, top-level headers receive functional currency, and
  revenue/expense posting accounts receive `null`.
- `src/app/ledger/services/ledger-account-balance-propagation.service.ts` and
  its specs — choose native aggregation for denominated accounts and
  functional-only aggregation for null-currency accounts, without changing the
  service's best-effort error/reporting contract.
- `src/app/ledger/usecases/adjust-ledger-account-balance.usecase.ts`, account
  persistence/read use cases, DTO helpers, and specs — initialise and expose
  null-currency account balances in functional currency and avoid dereferencing
  a nullable account currency.
- `src/infra/persistence/repos/ledger/**` — map nullable account currencies
  and use left joins so accounts with `currency_code = NULL` remain readable.
- `db/migrations/<generated>_make-ledger-account-currency-nullable.ts` — make
  `ledger_accounts.currency_code` nullable and backfill existing non-header
  revenue and expense accounts to `NULL`; use the migration generator and
  regenerate Drizzle schema with `npm run drizzle:pull`.
- liability account types, code configuration, entity, bootstrap helper, and
  tests — add and bootstrap a default null-currency "Funds Held for Others"
  posting account once its subtype/code are approved.

### Out of Scope

- A per-currency outstanding-position or counterparty settlement subledger for
  money held on behalf of others. Journal-line history retains original
  currency; this change deliberately maintains the account's running balance
  in functional currency.
- New user-facing liability-account creation endpoints. The required user
  experience is met by bootstrapping the default account.
- Changes to FX cost-basis acquisition. It remains asset-specific and must keep
  requiring a currency-denominated asset account.
- Reclassifying existing liability posting accounts beyond the new account;
  loans and invoice/trade payables retain their current denominator behaviour.

## Proposed Approach

### 1. Define the currency policy in the ledger domain

- Change `ILedgerAccount.currency` to `ICurrency | null`.
- Add a dependency-free ledger-account currency-policy helper, invoked by
  `ledgerAccountEntity.make`, rather than burying type checks in application
  services. Pass the accounting entity's functional currency to the factory as
  creation context; it is validation-only and is not persisted on the account.
- The policy owns these invariants:
  - every asset account has a valid, non-null denomination currency;
  - a top-level control account (`isControlAccount` with no
    `controlAccountId`) has the functional currency;
  - non-header revenue and expense accounts have `currency: null`;
  - liability accounts may have either value;
  - equity retains its present functional-currency behaviour until an explicit
    equity policy is introduced.
- Add context-owned ledger-account errors for each rejected policy state only
  where no existing validation error accurately describes it. Test the policy
  through the public account factories and retain their immutable
  entity/event/audit outputs.

The domain owns this business invariant. No new service is required: it is a
state-creation invariant of the existing ledger-account entity, not a
repository-backed decision or a reusable workflow.

### 2. Make account creation and bootstrap comply with the policy

- Thread functional-currency creation context through the existing domain
  account factories. The asset account service already receives an accounting
  entity and should pass that context rather than querying dependencies.
- Keep all asset headers and asset posting accounts currency-denominated.
- Change revenue and expense bootstrap helpers so their headers are functional
  currency while their default posting accounts use `currency: null`.
- Keep existing loan, trade payable, statutory payable, suspense, and equity
  bootstrap assignments unchanged unless a named account is intentionally made
  multi-currency.
- Add a dedicated liability subtype/behaviour/entity and a default posting
  account for "Funds Held for Others" with `currency: null`; bootstrap it
  idempotently alongside the other liability defaults. Its creation uses the
  existing account-bootstrap capability and event/audit aggregation—no new
  bootstrap service or IoC seam.

### 3. Persist nullable account denomination while keeping balances functional

- Generate a node-pg-migrate migration that drops the `NOT NULL` constraint
  from `core.ledger_accounts.currency_code`. Backfill only existing
  non-top-level revenue/expense accounts to `NULL`; leave headers, assets,
  equity, and existing liabilities unchanged. The down migration must restore
  functional currency for null rows before reapplying `NOT NULL`.
- Do not hand-edit `src/infra/config/drizzle`. After running the migration,
  run `npm run drizzle:pull` and review the generated nullable column and
  foreign-key relation.
- Update the ledger-account persistence mapper to write `null` and to map a
  missing joined currency to `null`. Change account repository joins from inner
  to left joins where account currency is loaded.
- Keep `ledger_account_balances.currency_code` non-null. In
  `ledgerAccountPersistenceService`, select
  `account.currency ?? functionalCurrency` when creating the zero balance.
  Thus a null-currency account has both its stored `amount` and
  `functionalAmount` in functional currency, matching present control-account
  aggregation.
- Update zero-balance fallbacks in account read/mapping use cases to use the
  accounting entity's functional currency whenever `account.currency` is
  null. Do not expose a new HTTP field unless an existing client requirement
  needs the account denomination itself; existing balance DTOs already report
  their currency.

Infrastructure owns SQL, joins, and mapping only. The existing ledger-account
persistence service continues to own atomic creation of an account and its
balance record.

### 4. Reuse functional aggregation in journal balance propagation

- Keep journal-entry construction unchanged: journal lines retain their
  entered currency and must still balance by functional amount.
- In the existing propagation service, require native line currency equality
  only when `account.currency` is non-null. For a null-currency account,
  require a consistent functional currency but do not add entered amounts with
  different currencies.
- For a denominated account, retain the current native `balanceDelta` plus
  `functionalBalanceDelta` calculation. For a null-currency account, calculate
  only the functional delta and place that functional money in both DTO delta
  fields, so the unchanged queue contract remains valid.
- In the adjustment use case, make the currency comparison null-safe and
  explicitly select the functional delta for a null-currency account. Its
  entity then adds functional money to both balance fields. Continue to forward
  the original queue payload to a control account, preserving current foreign
  currency roll-up behaviour.
- Preserve the propagation service's documented best-effort semantics: genuine
  malformed lines still report once and do not reject an already-persisted
  journal entry.

The existing application service owns this reusable, best-effort propagation
capability; the adjustment use case remains the queue worker's request-specific
write workflow. No new queue, worker, contract, or IoC component is warranted.

### 5. Roll out and document the semantic change

- Run the existing idempotent account-bootstrap workflow for current accounting
  entities after deployment, using its normal audit/event persistence path, so
  they receive the "Funds Held for Others" default. Do not insert it directly
  in the schema migration because account creation requires domain events and
  audit history.
- Update ledger currency/account documentation to distinguish denomination
  currency from functional balance currency and record the GBP gift and
  funds-held examples. Regenerate database documentation only if it is tracked
  as part of normal migration changes.

## Test Plan

- **Domain unit:** add ledger-account policy cases for functional headers,
  mandatory asset currency, optional liability currency, and null-currency
  revenue/expense posting accounts. Update each affected account-entity test to
  assert its intentional currency state and preserve audit/event behaviour.
- **Application service:** extend balance-propagation specs with a GBP line to
  a null-currency Gifts account and a null-currency Funds Held account. Assert
  that each queues functional-currency values and is not reported as a mismatch.
  Retain the mismatched-currency failure for a denominated asset account.
- **Application use case:** extend adjustment specs to prove a null-currency
  account updates both stored balance amounts in functional currency, while the
  existing foreign child-to-control account test continues to pass. Exercise a
  GBP receipt through the receipt use case to prove journal persistence and
  propagation coexist.
- **Bootstrap and persistence:** test idempotent creation of the new default
  liability account, null account-currency mapping/left join, functional zero
  balance creation, and functional fallback values in `getLedgerAccount` and
  `getLedgerAccounts`.
- **Migration:** run the migration against the test database; verify the
  backfill nulls only eligible revenue/expense posting accounts and that the
  down migration restores a valid non-null functional currency before adding
  the constraint.
- **Regression:** retain bank/petty-cash opening-balance and FX-cost-basis
  tests to prove assets remain denomination-currency constrained.

## Verification

Run focused checks first, then project-wide validation after the migration and
generated schema are current.

```bash
npm test -- --runInBand src/domain/ledger/shared/entities/__tests__/ledger-account.entity.test.ts src/app/ledger/services/__specs__/ledger-account-balance-propagation.service.spec.ts src/app/ledger/usecases/__specs__/adjust-ledger-account-balance.usecase.spec.ts src/app/ledger/services/helpers/__specs__/liability-accounts-bootstrap.helper.spec.ts src/infra/persistence/repos/ledger/mappers/__tests__/ledger-account.mapper.test.ts
npm run db:migrate up
npm run drizzle:pull
npm test -- --runInBand
npm run lint
npm run build
```

The migration and Drizzle pull require the configured PostgreSQL database.

## Assumptions

- A `currency: null` account is a functional-currency aggregate, not a
  per-currency position ledger. Original currencies remain visible on journal
  lines and account transactions.
- Revenue and expense **headers** are the stated functional-currency exception;
  their posting accounts are currency-null.
- Existing functional-currency revenue/expense balances can be retained without
  recalculation when their account currency becomes null, because their stored
  native and functional values are already in the functional currency.

## Open Decisions

- **Funds Held for Others chart-of-accounts placement.** Choose a new liability
  subtype/code block (for example `207xxx`) and an exact user-facing name, or
  approve another existing non-loan/non-invoice liability classification. The
  choice determines the new typed code, entity, bootstrap search, and reporting
  hierarchy; it must be resolved before implementing that default account.
- **Equity currency policy.** This plan preserves current functional-currency
  equity accounts. If equity posting accounts should instead be null-currency,
  add that rule and migration backfill before implementation rather than
  inferring it from the revenue/expense requirement.

## Risks

- **Partially deployed type/schema change:** application code that assumes a
  non-null joined currency can omit accounts or dereference null. Mitigate by
  deploying the nullable schema first, then the mapper/read/propagation code,
  and exercising null-currency records in focused integration tests.
- **Incorrect historical backfill:** nulling header currencies would break
  control-account roll-up assumptions. Limit the migration predicate to
  non-top-level revenue/expense accounts and assert it in migration tests.
- **Accounting misuse:** a functional aggregate does not prove currency-by-
  currency settlement. Document this boundary and scope a later counterparty
  position/subledger feature if repayment currency enforcement is required.
- **Best-effort propagation masking failures:** the current service absorbs
  errors after journal persistence. Add explicit successful null-currency
  propagation tests and retain malformed-account reporting tests.

## Completion Criteria

- A GBP receipt can debit a GBP bank asset and credit the default Gifts account
  without creating a GBP Gifts account; the Gifts balance is updated in the
  accounting entity's functional currency.
- A GBP amount received to hold for another person can credit the bootstrapped
  null-currency Funds Held for Others liability account without requiring a
  user-created GBP liability account; its balance is updated in functional
  currency.
- Currency-denominated assets still reject journal lines in a different native
  currency, and foreign-currency child balances continue to roll up to
  functional-currency control accounts.
- Account currency persistence is nullable, all account reads safely map null,
  and account/balance creation uses functional currency for null-currency
  accounts.
- Focused tests, migration verification, full tests, lint, and build pass; no
  unrelated working-tree changes are modified.
