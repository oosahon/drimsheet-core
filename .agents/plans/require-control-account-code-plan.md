# Require Control Account Code Plan

## Goal

Require every subaccount creation path that uses the control-account resolver to
supply its intended `controlAccountCode`, and remove the resolver's incorrect
fallback to the Cash and Cash Equivalents header.

The plan is implementation-ready. The requirement explicitly resolves the API
compatibility choice in favor of making `controlAccountCode` mandatory. During
implementation, preserve all unrelated staged and working-tree changes.

## Implementation Status

| Step | Outcome and owner                                                                                              | Basis                                                                 | Intended files and tests                                                         | Status                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | Require the supplied code in the resolver and resolver-backed domain contracts; owned by the Ledger domain     | Explicit requirement; existing required-code ledger service contracts | Resolver, Cash/Receivables/Payables contracts, resolver and Cash service tests   | Completed; 16 focused domain tests passed                                                           |
| 2    | Reject omitted codes at petty-cash and bank application boundaries; owned by Ledger application DTO validation | Explicit requirement; existing DTO plus Zod validation pattern        | Asset-account DTOs, schemas, and DTO tests                                       | Completed; 13 DTO validation tests passed                                                           |
| 3    | Align typed fixtures, HTTP validation coverage, and generated API contracts                                    | Testing rules; TSOA generation precedent                              | Bank use-case specs, HTTP specs, `generated/routes.ts`, `generated/swagger.json` | Completed; generated diff is limited to required markers and 59 focused tests passed                |
| 4    | Reconcile the plan with the final diff and run focused and broad verification                                  | Plan implementation workflow                                          | Focused Jest, test-inclusive TypeScript, lint, build                             | Completed; 69 tests passed across 9 touched suites, TypeScript, lint, build, and diff checks passed |

## Context

[`controlAccountResolverHelper`](../../src/domain/ledger/services/helpers/control-account-resolver.ts)
currently accepts `LedgerCode | undefined` and replaces an omitted value with
`ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER`. Because the helper is shared by
asset, liability, revenue, and expense services, that asset-specific fallback
can make a caller resolve the wrong account family.

Most domain service contracts already require `controlAccountCode`, but the
Cash, Receivables, and Payables contracts still mark it optional. The public
petty-cash and bank-account DTOs and their Zod schemas also allow omission, and
the generated TSOA route and OpenAPI contracts therefore advertise the field as
optional.

## Confirmed Findings

1. **The shared helper contains an asset-specific default.**
   `controlAccountResolverHelper` coalesces an undefined input to
   `ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER`, even though its callers
   include Payables, Revenue, and Expense account services.
2. **The fallback is exercised by tests and current public fixtures.**
   [`control-account-resolver.test.ts`](../../src/domain/ledger/services/helpers/__tests__/control-account-resolver.test.ts)
   and
   [`cash-account.service.test.ts`](../../src/domain/ledger/services/asset-account/__tests__/cash-account.service.test.ts)
   explicitly cover omitted-code success, while valid bank request fixtures omit
   the field.
3. **Five domain subaccount payloads remain optional.** The two Cash payloads,
   the shared Receivables subaccount payload, and the two Payables payloads allow
   `controlAccountCode` to be absent; the other resolver-backed domain service
   contracts already require it.
4. **The application boundary can enforce the public requirement.**
   `createPettyCashAccountUseCase` and `createBankAccountUseCase` already run the
   corresponding Zod schemas before invoking the Cash domain service. Making the
   DTO and schema fields required rejects an omitted code as an unprocessable
   request before domain orchestration.
5. **Generated API artifacts reflect the optional source DTOs.**
   [`generated/routes.ts`](../../generated/routes.ts) and
   [`generated/swagger.json`](../../generated/swagger.json) currently omit the
   required marker for both request models and are regenerated by
   `npm run build`.

## Implementation Basis

| Decision or structural change                                                      | Basis                                              | Evidence or rationale                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make the resolver input required and use it directly                               | Explicit requirement                               | The requested invariant is that callers must supply the code; removing nullish coalescing also removes the cross-family Cash default.                                                                                                                                                                           |
| Make every resolver-backed domain service payload require the code                 | Domain contract ownership and explicit requirement | `cash-account.service.ts`, `receivables-account.service.ts`, and `payables.service.ts` pass their payload field directly to the resolver; their contracts must express the helper's invariant. Other ledger service payloads already provide the local precedent with non-optional `controlAccountCode` fields. |
| Require the code in the petty-cash and bank request DTOs and Zod schemas           | Explicit requirement and existing boundary pattern | `create-petty-cash-account.usecase.ts` and `create-bank-account.usecase.ts` already validate their DTOs through the colocated Zod schemas before calling the domain service.                                                                                                                                    |
| Regenerate TSOA route and OpenAPI output                                           | Generated-artifact precedent                       | Both generated files identify themselves as TSOA output, and `npm run build` runs `tsoa spec-and-routes` before TypeScript compilation.                                                                                                                                                                         |
| Replace fallback-oriented tests with explicit-code and omission-rejection coverage | Repository testing rules                           | `.agents/rules/testing/domain.md` requires invariant tests through the public domain API, while the existing DTO and HTTP suites own application and transport validation coverage.                                                                                                                             |

## Scope

### Expected Changes

- `src/domain/ledger/services/helpers/control-account-resolver.ts` — require a
  non-undefined generic ledger code, use it directly for lookup and error
  context, and remove the unused asset-code import and fallback.
- `src/domain/ledger/types/cash-account.service.types.ts`,
  `receivables-account.service.types.ts`, and `payables.service.types.ts` — make
  all resolver-backed subaccount payload fields required.
- `src/app/ledger/dtos/asset-account/asset-account.dto.ts` and
  `asset-account.dto.validation.ts` — require a six-character
  `controlAccountCode` for petty-cash and bank-account requests.
- `src/domain/ledger/services/helpers/__tests__/control-account-resolver.test.ts`
  and `src/domain/ledger/services/asset-account/__tests__/cash-account.service.test.ts`
  — remove assertions that depend on implicit Cash-header selection and verify
  that supplied codes drive lookup, error context, and account creation.
- `src/app/ledger/dtos/asset-account/__tests__/asset-account.dto.validation.test.ts`
  — add the code to valid fixtures and assert omission is rejected for both
  request schemas.
- `src/app/ledger/usecases/__specs__/create-bank-account.usecase.spec.ts` and
  any compiler-identified typed request fixtures — supply the required code and
  retain assertions that it is forwarded unchanged. The existing petty-cash
  use-case fixtures already supply it.
- `test/http/ledger/create-bank-account.post.spec.ts` and
  `test/http/ledger/create-petty-cash-account.post.spec.ts` — keep valid request
  fixtures explicit and prove omission returns 422 without invoking the use
  case.
- `generated/routes.ts` and `generated/swagger.json` — regenerate them so both
  public request models mark `controlAccountCode` as required.

### Out of Scope

- Selecting or introducing any replacement default control account.
- Changing which supplied control accounts are valid for each account family.
- Changing ledger-code allocation, latest-subtype lookup, materialized paths,
  persistence, transactions, IoC wiring, or account creation events/audits.
- Adding a new domain error for omission; typed domain contracts prevent normal
  internal omission, while existing request validation owns public malformed
  input.

## Proposed Approach

### 1. Enforce the invariant in domain contracts

- Change the resolver payload to `controlAccountCode: LedgerCode`, assign that
  value directly as the lookup code, and remove the Cash configuration import.
- Make the corresponding Cash, Receivables, and Payables subaccount service
  inputs non-optional. Leave all already-required Revenue, Expense, and
  Short-Term Loan contracts unchanged.
- Keep the existing `ControlAccountNotFound` and `InvalidControlAccount`
  behavior: their causes should report the caller-supplied code, and the
  validator and latest-subtype logic should otherwise remain identical.

### 2. Enforce the invariant at public request boundaries

- Remove `?` from both application request DTO properties.
- Remove `.optional()` from both Zod fields and apply the existing six-character
  ledger-code validation consistently to petty-cash and bank requests.
- Keep the use cases responsible only for validating and forwarding the value;
  do not introduce a use-case default, context lookup, or new service.
- Regenerate TSOA artifacts from the source DTOs so runtime route validation and
  the OpenAPI contract agree with the application schema.

### 3. Replace fallback expectations with required-code regressions

- Update helper tests so every invocation supplies an explicit code, including
  the not-found and invalid-control-account paths, and assert that exact code is
  used in repository calls and error causes.
- Update Cash service tests and typed bank-request fixtures to supply the Cash
  header deliberately; preserve existing latest-code, materialized-path, and
  successful-creation coverage.
- Add DTO tests for omitted `controlAccountCode` on both request types and HTTP
  tests confirming omission is rejected before the mocked use case runs.
- Use TypeScript compilation to catch any remaining internal caller or fixture
  that attempts to omit the now-required field.

## Test Plan

- **Domain unit:** verify the resolver uses a supplied code for successful,
  not-found, and invalid-control-account paths; keep Cash service creation tests
  passing with explicit parent codes.
- **Application validation:** verify valid petty-cash and bank requests require
  a six-character code and that omission fails both Zod schemas.
- **HTTP integration:** verify both create endpoints return 422 and do not call
  their use cases when `controlAccountCode` is omitted.
- **Regression:** verify a valid supplied code still reaches the domain service
  unchanged and that latest-subtype allocation, account validation, and account
  creation behavior remain intact.

## Verification

```bash
npx jest src/domain/ledger/services/helpers/__tests__/control-account-resolver.test.ts src/domain/ledger/services/asset-account/__tests__/cash-account.service.test.ts src/app/ledger/dtos/asset-account/__tests__/asset-account.dto.validation.test.ts src/app/ledger/usecases/__specs__/create-bank-account.usecase.spec.ts src/app/ledger/usecases/__specs__/create-petty-cash-account.usecase.spec.ts test/http/ledger/create-bank-account.post.spec.ts test/http/ledger/create-petty-cash-account.post.spec.ts --runInBand
npx tsc -p tsconfig.test.json
npm run lint
npm run build
```

The focused HTTP tests use local mocks and do not require external services or
credentials. After `npm run build`, inspect the generated diff to confirm only
the two request models gained the required marker.

## Risks

- This is an intentional breaking request-contract change: existing API clients
  that relied on omission will receive 422 until they send a control account
  code. Regenerated OpenAPI output and focused endpoint tests make that contract
  visible and enforceable.
- Test fixtures currently encode the old default in several places. Required
  TypeScript contracts plus `tsconfig.test.json` compilation mitigate the risk
  of leaving a fixture or internal caller behind.

## Completion Criteria

- No resolver or resolver-backed domain contract accepts an undefined
  `controlAccountCode`.
- No code path substitutes the Cash and Cash Equivalents header when the field
  is absent.
- Petty-cash and bank-account requests reject an omitted code with 422 before
  orchestration.
- Supplied codes continue to drive repository lookup, validation, error context,
  and subaccount creation unchanged.
- Generated route and OpenAPI artifacts mark both request fields required.
- Focused tests, test-inclusive TypeScript compilation, lint, and build pass.
- Unrelated files and behavior remain unchanged.
