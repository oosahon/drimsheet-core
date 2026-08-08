# Resolve Control Account In Use Cases Plan

## Goal

Keep `controlAccountCode` as a required internal Ledger domain input while
removing it from public bank-account and petty-cash request DTOs. Public callers
may instead provide an optional `controlAccountId`; each creation use case must
resolve that account, or default to the Cash and Cash Equivalents header when no
ID is supplied, then pass the resolved account's code to the Cash domain
service.

The plan is implementation-ready. It supersedes the public DTO, use-case
forwarding, HTTP omission, and generated-contract portions of
[`require-control-account-code-plan.md`](./require-control-account-code-plan.md),
while retaining that implementation's required domain resolver and domain
service contracts. Preserve unrelated staged and working-tree changes during
implementation.

## Context

The current staged implementation correctly requires
`controlAccountResolverHelper` and resolver-backed domain service contracts to
receive a code, but it also exposes a required `controlAccountCode` on
`IPettyCashAccountCreationReq` and `IBankAccountCreationReq`. Both use cases
currently cast and forward that public string without resolving the referenced
account themselves.

`ILedgerAccountRepo` already supports both required application lookups:
`findById(id, accountingEntityId, options)` scopes a client-selected account to
the active accounting entity, while `findByCode(code, accountingEntityId,
options)` can retrieve the default Cash and Cash Equivalents header. The
repository is already available in Ledger IoC and in the shared application
test mocks, but it is not currently injected into either creation use case.

## Confirmed Findings

1. **Public account references use IDs, not ledger codes.** Request DTOs such as
   `IOpeningBalanceCreationReq` expose an account ID as a string and validate it
   with `z.uuid`; ledger codes remain internal domain data.
2. **The application layer has both lookup precedents.** Ledger and Journal
   Entry use cases call `ILedgerAccountRepo.findById` with the active accounting
   entity and throw `ledgerAppError.AccountNotFound` for a missing client-supplied
   account. Ledger bootstrap helpers use `findByCode` with a known family code.
3. **The Cash header code is unambiguous.** Both Bank and Petty Cash are created
   by `ICashAccountService` and use
   `ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER` as their default parent.
4. **Domain validation must remain authoritative.** `cash-account.service.ts`
   passes the supplied code to `controlAccountResolverHelper`, which re-fetches
   the account and validates its type, subtype, behavior, and control-account
   status before creating a child.
5. **No repository or mock contract expansion is required.** `findById` and
   `findByCode` are already declared by `ILedgerAccountRepo`, implemented by the
   Ledger repository, and present on `mockLedgerAccountRepo`.
6. **Generated request contracts currently expose the wrong field.** TSOA route
   and OpenAPI models mark `controlAccountCode` as required for both requests;
   regeneration is required after the DTO correction.

## Implementation Basis

| Decision or structural change                                                                                        | Basis                                              | Evidence or rationale                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Replace public `controlAccountCode` with optional `controlAccountId`                                                 | Explicit user requirement; DTO rule                | The interface identifies a known parent by entity identity. `IOpeningBalanceCreationReq.accountId` plus `z.uuid` is the local request-ID precedent.                                                                      |
| Resolve a supplied ID with `findById`, scoped to the active accounting entity                                        | Explicit user requirement; local precedent         | `create-receipt.usecase.ts`, `create-opening-balance.usecase.ts`, and Ledger read use cases use this repository signature and accounting-entity scope.                                                                   |
| Resolve the Cash header with `findByCode` when the ID is absent                                                      | Explicit user requirement                          | Both creation workflows use `ICashAccountService`; `ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER` is their named default parent.                                                                                       |
| Throw `ledgerAppError.AccountNotFound({ id })` when a supplied ID is absent                                          | Error-handling rule; concrete precedent            | `create-receipt.usecase.ts` uses the application-owned error and includes the requested account ID in its cause.                                                                                                         |
| Preserve `ledgerAccountError.ControlAccountNotFound({ controlAccountLedgerCode })` when the default header is absent | Existing failure semantics                         | `controlAccountResolverHelper` currently owns this exact missing-control-account error for a code lookup; the preliminary application lookup must not convert the same missing header into an unrelated fault.           |
| Keep parent-role validation in the Cash domain service                                                               | Folder responsibility and domain-service ownership | `makeCreateBankSubAccount` and `makeCreatePettyCashSubAccount` already provide family-specific validators to `controlAccountResolverHelper`. The use case should resolve a reference, not duplicate business validation. |
| Inject `ILedgerAccountRepo` directly into both use cases                                                             | IoC rule and local precedent                       | `src/infra/ioc/usecases/ledger.ts` already injects `ledgerRepos.ledgerAccount` into other Ledger use cases; no new service or IoC collection is needed.                                                                  |

## Scope

### Expected Changes

- `src/app/ledger/dtos/asset-account/asset-account.dto.ts` and
  `asset-account.dto.validation.ts` — replace required public
  `controlAccountCode` with optional `controlAccountId: string` and optional UUID
  validation using the existing invalid-control-account-ID error key.
- `src/app/ledger/usecases/create-bank-account.usecase.ts` and
  `create-petty-cash-account.usecase.ts` — inject `ILedgerAccountRepo`, resolve
  the optional ID or default header immediately before domain creation, handle
  lookup failure with existing context-owned errors, and pass the resolved
  account code to the Cash service.
- `src/infra/ioc/usecases/ledger.ts` — inject `ledgerRepos.ledgerAccount` into
  both use-case factories.
- `src/app/ledger/dtos/asset-account/__tests__/asset-account.dto.validation.test.ts`
  — prove requests are valid without a parent ID, accept a valid optional UUID,
  reject an invalid UUID, and no longer mention a public code.
- `src/app/ledger/usecases/__specs__/create-bank-account.usecase.spec.ts` and
  `create-petty-cash-account.usecase.spec.ts` — cover supplied-ID lookup,
  default-header lookup, forwarding the resolved code, and both missing-account
  failure paths.
- `test/http/ledger/create-bank-account.post.spec.ts` and
  `create-petty-cash-account.post.spec.ts` — remove the incorrect missing-code
  rejection, keep no-ID requests valid, and verify a supplied
  `controlAccountId` is forwarded to the use case.
- `generated/routes.ts` and `generated/swagger.json` — regenerate and format the
  request models so `controlAccountId` is optional and `controlAccountCode` is
  absent.

### Out of Scope

- Reintroducing any default inside `control-account-resolver.ts` or making its
  domain input optional.
- Changing Cash, Receivables, Payables, Revenue, Expense, or Short-Term Loan
  domain service contracts that require `controlAccountCode`.
- Moving type/subtype/behavior/control-status validation from the Cash domain
  service into either application use case.
- Adding a shared resolver service/helper, repository method, repository mock,
  error type, transaction, persistence change, controller branch, or IoC
  service registration.
- Changing account allocation, materialized paths, opening-balance behavior,
  event publication, or persistence ordering.

## Proposed Approach

### 1. Correct the public request contract

- Change both request interfaces to `controlAccountId?: string` and remove
  `controlAccountCode` entirely.
- Change both Zod schemas to accept an optional UUID using
  `ledgerAccountError.InvalidControlAccountId` as the primitive-validation
  message.
- Update DTO validation fixtures so omission is the normal valid case, a valid
  UUID is accepted, and a malformed ID is rejected.

### 2. Resolve the parent in each request workflow

- Add `ILedgerAccountRepo` to each use case's injected dependencies.
- After existing request, opening-balance, posting-period, and duplicate-bank
  checks—and immediately before Cash domain creation—resolve the parent using
  ordinary correlation trace options:
  - when `payload.controlAccountId` exists, call `findById` with that ID and the
    active accounting entity ID;
  - otherwise call `findByCode` with
    `ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER` and the active accounting
    entity ID.
- Throw `ledgerAppError.AccountNotFound({ id: payload.controlAccountId })` for a
  missing explicit ID. Throw the existing
  `ledgerAccountError.ControlAccountNotFound` with the Cash header code when the
  default header is missing.
- Pass `controlAccount.code as TCashLedgerCode` to the existing domain service
  payload. Keep the domain call's `ERepoLock.Update`; its re-read remains the
  authoritative invariant check and protects against stale preliminary lookup
  data.
- Keep the small selection branch in each use case. Do not create a service or
  generic helper solely to hide the workflow-specific lookup.

### 3. Align wiring and contract-facing tests

- Inject the already-constructed Ledger account repository from the existing
  Ledger IoC collection into both use cases and add the shared mock repository
  to their test dependency objects.
- In each use-case spec, assert the no-ID path looks up the Cash header and
  forwards its code; assert the ID path uses `findById`, does not select the
  default header in the application layer, and forwards the selected account's
  code.
- Assert neither Cash service nor persistence is invoked after either lookup
  failure.
- Update HTTP fixtures so the baseline request omits parent selection and a
  separate successful request supplies a UUID. Delete the now-invalid 422 test
  for omitted `controlAccountCode`; keep unrelated malformed-request coverage.
- Regenerate TSOA artifacts, then format them so their diff is limited to the
  two corrected request models.

## Test Plan

- **DTO unit:** both request schemas accept omission, accept a valid optional
  UUID, and reject a malformed `controlAccountId` with the existing validation
  error key.
- **Application use cases:** Bank and Petty Cash each cover default header
  resolution, explicit ID resolution, resolved-code forwarding, missing
  explicit account, and missing default header. Existing opening-balance,
  transaction, persistence, and event tests remain green.
- **HTTP integration:** both endpoints accept requests without parent selection
  and forward an optional valid ID unchanged; existing invalid-shape and
  authentication behavior remains intact.
- **Domain regression:** the control-account resolver and Cash service tests
  continue proving that internal codes are required and supplied accounts are
  validated by the domain.

## Verification

```bash
npx jest src/app/ledger/dtos/asset-account/__tests__/asset-account.dto.validation.test.ts src/app/ledger/usecases/__specs__/create-bank-account.usecase.spec.ts src/app/ledger/usecases/__specs__/create-petty-cash-account.usecase.spec.ts src/domain/ledger/services/helpers/__tests__/control-account-resolver.test.ts src/domain/ledger/services/asset-account/__tests__/cash-account.service.test.ts test/http/ledger/create-bank-account.post.spec.ts test/http/ledger/create-petty-cash-account.post.spec.ts --runInBand
npx tsc -p tsconfig.test.json
npm run lint
npm run build
```

The HTTP specs require permission to open a local ephemeral Supertest listener;
they do not require external services or credentials. After the build, format
and inspect the generated artifacts to confirm that only the two request models
changed.

## Risks

- The public request contract changes from a required ledger code to an optional
  entity ID. Regenerated OpenAPI output and endpoint tests must make that
  intentional compatibility change explicit to clients.
- Parent resolution adds one application read before the existing domain
  resolver read. Using an ordinary preliminary read and retaining the domain's
  update-locked authoritative re-read avoids moving validation or concurrency
  responsibility into the use case.
- The corrective implementation will modify files that are already staged by
  the preceding implementation. Plan-to-diff reconciliation must distinguish
  intentional corrections from unrelated staged work and preserve the latter.

## Completion Criteria

- Neither public request DTO, Zod schema, generated route model, nor OpenAPI
  schema exposes `controlAccountCode`.
- Both public request contracts expose optional `controlAccountId`, accept its
  omission, and reject malformed supplied IDs.
- Both use cases resolve supplied IDs within the active accounting entity and
  otherwise resolve the Cash and Cash Equivalents header.
- Missing supplied accounts and missing default headers use the established
  context-owned errors, and no creation or persistence follows either failure.
- The Cash domain service always receives the resolved parent code and remains
  responsible for validating whether the account may control the new child.
- Existing required-code domain contracts and resolver behavior remain intact.
- Focused tests, test-inclusive TypeScript compilation, lint, build, formatting,
  and generated-artifact diff checks pass.
- Unrelated staged files and behavior remain unchanged.
