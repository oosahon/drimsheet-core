# Support Bank-Charge Transfer Destinations Plan

## Goal

Allow one transfer journal entry to record the complete bank event: one cash
asset source credit, exactly one cash asset destination debit, and zero or more
Bank Charge expense debits. Replace the unused singular `destinationLine`
request contract with `destinationLines`; do not introduce a `chargeLines`
contract or a charge-specific journal-line type.

This plan is implementation-ready. The user has approved the breaking request
contract because the endpoint is not yet in use. Implementation must preserve
the existing unrelated modifications in `generated/routes.ts` and
`generated/swagger.json`.

## Approved Follow-up Adjustment

After the initial plan was implemented, the user approved a more explicit
application request contract: `ITransferEntryReq` exposes one
`destinationLine` and zero or more `chargeLines`, with each charge reusing
`IJournalLineReq` so it can carry an optional counterparty. The use case maps
these request fields into ordinary domain `destinationLines`; the domain does
not expose or model a charge-line concept.

The transfer domain service remains the accounting owner. It permits
counterparties only on exact Bank Charge destination postings, keeps the cash
destination counterparty-free, and returns that cash destination for FX
acquisition. Multiple charge postings may use the same Bank Charge ledger;
only the source and destination cash accounts must be distinct. This approved
follow-up supersedes the earlier request-shape and all-destination duplicate
account statements below while preserving the plan's remaining invariants.

## Implementation Status

Baseline: `generated/routes.ts` and `generated/swagger.json` were already
modified before implementation began; this plan file was untracked. No staged
changes were present. Preserve those generated-file changes throughout.

| Slice                                        | Owner and basis                                                                       | Intended files and tests                                  | Status    |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------- |
| Transfer request and service contracts       | Application/domain; approved breaking change and payment `destinationLines` precedent | Transfer DTO/schema/tests and journal-entry service types | Completed |
| Destination composition and journal creation | Journal-entry domain service; explicit one-asset-plus-Bank-Charge invariant           | Transfer rule/service and domain tests                    | Completed |
| FX and persistence orchestration             | Transfer use case; existing use-case transaction ownership                            | Transfer use case/specs                                   | Completed |
| Account selection and HTTP delivery          | Application/interface; existing rule-consumer and TSOA precedents                     | Transfer-rule regression, HTTP spec, generated contracts  | Completed |
| Verification and reconciliation              | Repository workflows and saved completion criteria                                    | Focused tests, typecheck, lint, full suite, final diff    | Completed |
| Charge-line request follow-up                | Application request language; domain remains generic                                  | DTO, orchestration, domain invariants, IoC, and tests     | Completed |

## Context

- `ITransferEntryReq` and `ICreateTransferEntryPayload` currently expose one
  `sourceLine` and one `destinationLine`.
- `makeCreateTransfer` currently validates and creates exactly two journal
  lines, and `transferEntryRule.destination` permits only cash assets.
- `makeGetPermittedPostingAccountsUsecase` consumes
  `transferEntryRule.destination` as the primary transfer-destination account
  list. That permit must remain cash-only so Bank Charge accounts do not appear
  in the cash-destination picker.
- The journal-entry aggregate already accepts multiple lines, derives each
  functional amount, requires exact functional-currency balance, and requires
  unique sequence orders.
- Payment creation already provides the local contract, DTO-validation,
  account-resolution, mapping, and journal-construction precedent for
  `destinationLines`.
- The ledger domain already identifies bank charges by the complete account
  classification `Expense / BankCharge / BankCharge`.
- `create-transfer.usecase.ts` currently prepares the source disposition and
  destination acquisition before atomically persisting the journal, any FX lot
  effects, and balance-propagation outbox record.

## Domain Language And Existing Guarantees

- **Authoritative state:** The journal entry and its debit/credit lines are the
  accounting source of truth. FX lots, acquisitions, dispositions, histories,
  and balance propagation are records or effects derived from the posted
  journal.
- **Source line:** The single credit to the cash asset account from which cash
  leaves. Its amount is the actual total cash-account decrease represented by
  the bank event.
- **Destination lines:** The debit postings created by the transfer. Exactly one
  is the cash asset receiving the transferred funds; every additional line is a
  Bank Charge expense posting.
- **Destination asset line:** The sole destination whose account is an Asset /
  Cash and Cash Equivalent / Bank or Petty Cash account.
- **Bank-charge destination:** A destination whose account is exactly Expense /
  Bank Charge / Bank Charge. It is an ordinary journal debit and not a distinct
  journal-line kind.
- **Primary posting-account discovery:** The existing transfer source and
  destination permits describe the primary cash-account roles exposed by
  `getPermittedPostingAccounts`. Additional Bank Charge destination validity is
  a separate transfer composition rule enforced during domain creation.
- **Balance guarantee:** The journal-entry entity continues to require total
  functional-currency debits to equal total functional-currency credits. The
  implementation must not infer a fee, synthesize a balancing line, or tolerate
  a rounding residual.
- **Line guarantees:** Existing account-ownership, posting-account,
  account-opening-date, fixed-currency, duplicate-account, and unique-sequence
  checks remain authoritative and apply to every transfer line.
- **Transaction guarantee:** `makeCreateTransferUsecase` remains the initiator
  of all writes. Journal persistence, optional FX disposition/acquisition
  persistence, and the balance-propagation outbox write remain in its existing
  repository transaction; event publication and balance queueing remain
  post-commit.

## Confirmed Findings

1. **The transfer API cannot currently express the required accounting
   entry.** `src/app/journal-entry/dtos/transfer-entry/transfer-entry.dto.ts`,
   its Zod validation, and the HTTP contract expose only `destinationLine`.
2. **The transfer domain service is the current two-line constraint.**
   `makeCreateTransfer` in
   `src/domain/journal-entry/services/journal-entry.service.ts` creates
   `[sourceLinePayload, destinationLinePayload]`, while the aggregate accepts
   and validates a general line collection.
3. **The existing Bank Charge model is sufficient.**
   `src/domain/ledger/types/expense-account.types.ts` defines the Bank Charge
   subtype and behavior, and
   `src/domain/ledger/__doc__/04-5-expense-accounts.md` defines it as the ledger
   for bank and payment-processing fees.
4. **A plural destination contract has a direct precedent.** Payment DTOs,
   validation, use-case account resolution, service payloads, and journal-line
   mapping already use `destinationLines` without introducing a specialized
   line category.
5. **The FX workflow must receive the classified asset destination, not an
   array position.** The FX lot application and domain services operate on one
   explicitly supplied participating account and assume one journal line for
   that account. Bank-charge expense lines must never be passed to acquisition
   or disposition.
6. **Permitted-account discovery must remain cash-only for transfers.**
   `makeGetPermittedPostingAccountsUsecase` translates
   `transferEntryRule.destination` directly into repository filters. Adding
   Bank Charge eligibility to that permit would mix expense accounts into the
   primary destination-asset list.
7. **The generic account-rule helper cannot express heterogeneous transfer
   destinations.** `validateAccountsAgainstRule` applies one permit to every
   destination. The new invariant requires exactly one destination to satisfy
   the cash-asset permit and every remaining destination to satisfy a separate
   Bank Charge permit.
8. **Generated API files are already modified.** They must be regenerated or
   reconciled for the new plural request shape without discarding or
   misattributing the pre-existing generated diffs.

## Implementation Basis

| Decision or structural change                                                                            | Basis                                                    | Current requirement and production consumer                                                   | Evidence or rationale                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replace transfer `destinationLine` with `destinationLines`                                               | Explicit user requirement and approved breaking change   | Record one bank event through `JournalEntryController.createTransfer`                         | `IPaymentEntryReq.destinationLines` and `ICreatePaymentEntryPayload.destinationLines` are the matching local contract precedent.                                                                                                                                  |
| Treat all transfer destinations as debit postings without a `chargeLines` type                           | Explicit user requirement and accounting model           | Transfer journal creation                                                                     | `makeCreatePayment` already maps all destination lines to `EJournalSide.Debit`; the journal aggregate balances debit and credit collections.                                                                                                                      |
| Require exactly one cash asset destination and restrict every other destination to Bank Charge expense   | Explicit user requirement; domain-service ownership rule | `IJournalEntryService.createTransfer`                                                         | `transferEntryRule`, `journalEntryRuleValidator`, and `makeCreateTransfer` already own transfer account eligibility.                                                                                                                                              |
| Use full type/subtype/behavior classification for Bank Charge eligibility                                | Existing domain guarantee                                | Transfer destination composition validation                                                   | `IBankChargeAccount` in `expense-account.types.ts` fixes all three values; payment destination rules already permit the Bank Charge subtype.                                                                                                                      |
| Return the validated destination asset account with the audited journal result                           | Current requirement with local result-object precedent   | `makeCreateTransferUsecase` needs the domain-classified account for `fxLotAppService.acquire` | The service owns the classification; returning its decision prevents the use case from duplicating it or relying on destination order. `IAccountingEntityCreationResult` is the local precedent for a named domain-service result containing coordinated outputs. |
| Preserve existing FX-lot and persistence orchestration                                                   | Existing workflow guarantee                              | Posted FX transfers                                                                           | `makeCreateTransferUsecase` already initiates journal, disposition, acquisition, and outbox persistence in one transaction and publishes effects after commit.                                                                                                    |
| Keep `transferEntryRule.destination` cash-only and validate Bank Charges with a separate transfer permit | Explicit user requirement; existing production consumer  | Primary transfer-destination account discovery and `IJournalEntryService.createTransfer`      | `makeGetPermittedPostingAccountsUsecase` consumes the default destination permit directly; separating the Bank Charge permit prevents expense accounts from entering that result while retaining domain validation.                                               |
| Regenerate TSOA route and OpenAPI artifacts                                                              | Existing delivery workflow                               | Runtime request validation and published API schema                                           | `npm run build:routes` owns `generated/routes.ts` and `generated/swagger.json`.                                                                                                                                                                                   |

## Scope

### Expected Changes

- `src/app/journal-entry/dtos/transfer-entry/transfer-entry.dto.ts` — replace
  `destinationLine` with `destinationLines` while reusing the existing transfer
  line shape.
- `src/app/journal-entry/dtos/transfer-entry/transfer-entry.dto.validation.ts`
  — validate a non-empty destination array using the existing line schema and
  `InvalidLineItems` key precedent.
- `src/app/journal-entry/dtos/transfer-entry/__tests__/transfer-entry.dto.validation.test.ts`
  — cover the plural contract, empty-array rejection, and obsolete singular
  shape rejection.
- `src/domain/journal-entry/types/journal-entry.service.types.ts` — change the
  transfer creation payload to `destinationLines` and add a named transfer
  creation result containing the audited journal and classified destination
  asset account.
- `src/domain/journal-entry/rules/transfer-entry.rule.ts` — keep both primary
  source and destination permits cash-only and add a separately exported exact
  Bank Charge destination permit for transfer-domain validation.
- `src/domain/journal-entry/rules/__tests__/entry-rules.test.ts` — verify source
  and primary destination restrictions remain cash-only, verify the separate
  Bank Charge permit, and reject other expense and non-cash accounts.
- `src/domain/journal-entry/services/journal-entry.service.ts` — validate the
  complete line collection through a transfer-specific account-composition
  validator instead of `validateAccountsAgainstRule`, enforce destination
  role/cardinality, create every destination as a debit, and return the
  classified destination asset account with the audited journal.
- `src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts` —
  cover valid transfers with and without charges, classification independent of
  array order, invalid destination compositions, balance, events, and audits.
- `src/app/journal-entry/usecases/create-transfer.usecase.ts` — resolve and map
  all destination accounts in request order, consume the domain service's
  classified asset account for FX acquisition, and preserve existing write and
  post-commit ordering.
- `src/app/journal-entry/usecases/__specs__/create-transfer.usecase.spec.ts` —
  verify multi-destination mapping, missing-account failure, destination asset
  selection, FX calls, atomic persistence, and regressions.
- `test/http/journal-entry/create-transfer.post.spec.ts` — update the endpoint
  contract and cover plural/empty/obsolete shapes.
- `generated/routes.ts` and `generated/swagger.json` — reflect
  `destinationLines` after TSOA generation while preserving unrelated existing
  worktree changes.

### Conditional Changes

- `src/domain/journal-entry/errors/journal-entry.error.ts` — change only if the
  existing `InvalidDestinationAccount`, `InvalidLineItems`, and
  `DuplicateAccountsNotPermitted` errors cannot accurately represent the new
  invariant during implementation. No new error is presently required.

### Out of Scope

- Introducing `chargeLines`, a charge-specific journal-line entity, or line
  metadata that duplicates ledger-account classification.
- Inferring, calculating, allocating, or automatically inserting bank charges.
- Automatically correcting rounding differences or creating balancing lines;
  supplied amounts and exchange rates must balance exactly in functional
  currency.
- Supporting a second destination asset, a third cash account used to settle a
  fee, non-Bank-Charge expenses, taxes, finance costs, or interest in a
  transfer.
- Changing FIFO cost-basis calculations, official-rate lookup, FX entities, or
  FX persistence contracts.
- Changing bank-reconciliation matching behavior or database schemas.
- Adding new services, IoC dependencies, feature flags, or migrations.
- Adding Bank Charge accounts to `transferEntryRule.destination`, changing
  `makeGetPermittedPostingAccountsUsecase`, or introducing a new
  permitted-account discovery role. The existing general ledger endpoint can
  already retrieve posting Bank Charge accounts by type, subtype, behavior, and
  control-account status when a separate selector needs them.

## Proposed Approach

### 1. Change the transfer request and domain contracts

- Replace `destinationLine` with `destinationLines` in the application DTO and
  domain service payload; require at least one destination at DTO validation.
- Follow the payment request's plural-array shape but keep transfer lines free
  of counterparties.
- Introduce a narrowly named `ICreateTransferEntryResult` with:
  - the existing `TAuditedJournalEntry`; and
  - the `destinationAssetAccount` selected by the domain service.
- Do not retain a compatibility path for `destinationLine`; the approved
  breaking change must reject the obsolete shape.

### 2. Model and enforce valid transfer destination composition

- Keep `transferEntryRule.source` and `transferEntryRule.destination` unchanged
  as the primary cash-account permits consumed by account discovery.
- Define a separate Bank Charge destination permit in the transfer rule module
  with the exact Expense / Bank Charge / Bank Charge classification. Export it
  only because `makeCreateTransfer` is its current production consumer; do not
  add it to `IJournalEntryRule` or expose it through primary account discovery.
- Replace `validateAccountsAgainstRule` inside `makeCreateTransfer` with a
  transfer-specific account-composition validator. The generic helper assumes
  every destination shares one permit and must remain unchanged for receipt and
  payment.
- Have the transfer-specific validator:
  - validate the source against `transferEntryRule.source`;
  - classify each destination independently against either
    `transferEntryRule.destination` or the separate Bank Charge permit;
  - reject destinations matching neither permit; and
  - require exactly one destination matching the cash-asset permit.
- Return the classified cash-asset destination from this validation so journal
  creation and the service result use the same authoritative decision.
- Reject zero or multiple asset destinations with the existing destination
  error, including the relevant account IDs in the cause.
- Extend duplicate-account validation across the source and every destination.
  Leave unique sequence-order enforcement with the journal-entry entity.
- Run shared accounting-entity, control-account, opening-date, and fixed-currency
  validation across the complete line collection before journal creation.
- Map the source to Credit and every destination to Debit, preserving request
  sequence order. Let `journalEntryEntity.make` enforce exact functional
  balance and emit/audit every line.
- Return the audited journal and the classified destination asset account as
  the domain service result. Do not encode the classification by sorting the
  array or assuming the asset is the first destination.

### 3. Extend transfer orchestration without changing transaction ownership

- Resolve each destination account using the existing sequential payment
  precedent so a missing account produces the established `AccountNotFound`
  error for the exact request line before attachments are claimed.
- Map each destination amount and optional exchange rate to the domain payload
  in the same order as the request.
- Consume `ICreateTransferEntryResult` and continue building history from its
  audited journal.
- Call `fxLotAppService.dispose` only with the explicit source asset account.
- Call `fxLotAppService.acquire` only with the domain-returned destination asset
  account. Bank Charge destination accounts must not be passed to either FX
  operation.
- Keep FX preparation before persistence and retain the existing transaction:
  the use case directly invokes journal persistence, optional disposition and
  acquisition persistence, and balance-outbox persistence. Keep balance queueing
  and event publication after commit.

### 4. Update selection and delivery contracts

- Preserve `makeGetPermittedPostingAccountsUsecase` and its existing transfer
  expectations unchanged: source and destination queries must continue to
  resolve only Bank and Petty Cash assets. Run its existing spec as an explicit
  regression check.
- Keep separate Bank Charge account selection on the existing general ledger
  query path using `type=expense`, `subType=bank_charge`,
  `behavior=bank_charge`, and `isControlAccount=false`; no discovery endpoint
  change is required by this backend work.
- Update the HTTP integration fixture and assertions to send
  `destinationLines`, accept multiple destination debits, reject an empty
  array, and reject the obsolete singular shape before orchestration.
- Regenerate TSOA routes and OpenAPI schema only after source contracts and
  tests are updated. Inspect the pre-existing generated diff before and after
  generation; retain unrelated changes and isolate the expected transfer
  schema delta.

## Test Plan

- **Transfer DTO unit tests:** Accept one destination asset and a plural payload
  containing additional line shapes; reject an empty array, missing
  `destinationLines`, malformed child lines, and the obsolete singular shape.
- **Transfer rule unit tests:** Keep Bank and Petty Cash as the only primary
  source/destination accounts; confirm the primary destination permit rejects
  Bank Charge; confirm the separate permit accepts only exact Bank Charge
  expenses and rejects other assets, expenses, liabilities, revenue, and
  equity.
- **Journal-entry domain service tests:**
  - Preserve a valid two-line same-currency transfer.
  - Create a balanced transfer with one cash destination and one or more Bank
    Charge destinations, with all destinations debited and all line events and
    audits present.
  - Create a balanced FX transfer with bank charges when all supplied line
    functional amounts balance exactly.
  - Classify the asset correctly when a Bank Charge line precedes it in
    `destinationLines`.
  - Reject zero asset destinations, two asset destinations, an ordinary expense
    destination, duplicate accounts, currency mismatches, and unbalanced
    functional amounts.
- **Transfer use-case specs:** Resolve and map every destination in order;
  report the exact missing destination account; pass only the domain-classified
  asset account to acquisition; never prepare FX effects for Bank Charge
  accounts; persist all journal histories and optional FX records atomically;
  preserve draft, posted, attachment, queue, and event behavior.
- **Permitted-account regression:** Run the existing use-case spec and assert
  both transfer source and destination filters remain cash-only; Bank Charge
  eligibility must not change this response.
- **HTTP integration spec:** Verify the plural request reaches the transfer use
  case, validation rejects empty and obsolete shapes, and the existing response
  contract remains unchanged.
- **Regression:** Existing receipt, payment, journal aggregate, and standalone
  FX-lot behavior must remain unchanged.

## Verification

Run focused checks before broader repository validation:

```bash
npx jest src/app/journal-entry/dtos/transfer-entry/__tests__/transfer-entry.dto.validation.test.ts src/domain/journal-entry/rules/__tests__/entry-rules.test.ts src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts src/app/journal-entry/usecases/__specs__/create-transfer.usecase.spec.ts src/app/ledger/usecases/__specs__/get-permitted-posting-accounts.usecase.spec.ts --runInBand
npx jest test/http/journal-entry/create-transfer.post.spec.ts --runInBand
npm run build:routes
npx tsc -p tsconfig.json --noEmit
npm run lint
npm test -- --runInBand
```

The HTTP integration spec uses local mocks. No database migration, external
credentials, network access, or browser runtime is required for this change.

## Risks

- **Breaking request contract:** Existing callers using `destinationLine` will
  fail validation. This is explicitly accepted because the endpoint is not yet
  in use; generated API contracts must change in the same implementation.
- **Destination-order coupling:** Selecting the first destination for FX would
  misclassify a Bank Charge line. The domain service returns the validated asset
  destination explicitly, and tests place charge lines before and after it.
- **Account-discovery leakage:** Adding Bank Charge to the primary destination
  permit would make expense accounts appear in the transfer cash-account list.
  Keep that permit unchanged and enforce the separate Bank Charge permit only
  inside the transfer-specific domain composition validator.
- **Mixed-role validation:** Passing all destinations to
  `validateAccountsAgainstRule` would either reject valid charges or require an
  over-broad combined permit. The transfer-specific validator classifies each
  destination against one exact role and enforces the one-asset cardinality.
- **FX-lot ambiguity:** Multiple lines for a participating cash account would
  violate current official-rate and lot-selection assumptions. Existing
  duplicate-account validation remains in force across all transfer lines, and
  charges post to expense accounts rather than additional cash lines.
- **Functional-currency rounding:** Independently converted lines can differ by
  a minor unit. The existing exact-balance invariant remains authoritative;
  this change will not conceal the discrepancy with an inferred adjustment.
- **Generated-file churn:** The two generated files already have unrelated
  modifications. Implementation must inspect and preserve those changes rather
  than resetting or replacing them indiscriminately.

## Completion Criteria

- The transfer endpoint accepts `sourceLine` plus non-empty
  `destinationLines` and rejects the obsolete singular contract.
- A transfer journal contains exactly one credited cash source, exactly one
  debited cash destination, and only zero or more debited Bank Charge expenses.
- Zero or multiple destination assets and every non-Bank-Charge additional
  destination are rejected by the domain service.
- Supplied same-currency and FX amounts must balance exactly in functional
  currency; all lines are persisted, audited, and included in balance
  propagation as one journal entry.
- FX disposition uses only the source asset and FX acquisition uses only the
  domain-classified destination asset, independent of destination array order.
- Existing transaction, event, attachment, draft/posted, and no-charge transfer
  behavior remains intact.
- `getPermittedPostingAccounts` continues to expose only cash assets for both
  transfer source and primary destination queries; Bank Charge eligibility does
  not alter its result.
- Focused tests, HTTP integration, route generation, type checking, linting,
  and the full test suite pass.
- No migration, new service, charge-specific line concept, or unrelated source
  change is introduced, and pre-existing generated-file changes are preserved.
