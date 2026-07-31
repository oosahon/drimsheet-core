# Implement Counterparty Service Plan

## Goal

Implement the counterparty domain service `src/domain/counterparty/services/counterparty.service.ts` to coordinate creation of individuals, vendors, contractors, and employers. In addition, wire it up in the Inversion of Control (IoC) module under `src/infra/ioc/services/counterparty.ts`.

## Context

The counterparty domain is defined under `src/domain/counterparty/`.

- Entities: [counterparty.entity.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/entities/counterparty.entity.ts)
- Value Objects:
  - [vendor-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/vendor-details.vo.ts)
  - [contractor-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/contractor-details.vo.ts)
  - [employer-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/employer-details.vo.ts)
  - [counterparty-audit.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/counterparty-audit.vo.ts)
- Service interface: [counterparty.service.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty.service.types.ts)
- Service implementation placeholder: [counterparty.service.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/services/counterparty.service.ts)

## Confirmed Findings

1. **Typo in ICreateEmployerResponse.** In [counterparty.service.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty.service.types.ts), `ICreateEmployerResponse` specifies `contractor: IContractorDetails` instead of `employer: IEmployerDetails`. This is a typo that will prevent correct TypeScript type safety and compile-time checks, and it is safe to correct as there are no external consumers of this type yet.
2. **Synchronous domain capability.** The functions in `ICounterpartyService` are completely synchronous and return tuples/objects of entities, events, and audits. This is typical for domain services in this codebase (like `accounting-entity.service.ts`) that perform creation logic without database calls. Use cases are responsible for database transactions, asynchronous calls, and writing to repositories.

## Scope

### Expected Changes

- [counterparty.service.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty.service.types.ts) — Correct the `ICreateEmployerResponse` interface typo.
- [counterparty.service.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/services/counterparty.service.ts) — Implement all interface methods synchronously.
- [counterparty.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/ioc/services/counterparty.ts) — New IoC module to wire up the counterparty service.

## Proposed Approach

### Step 1: Typo Fix

Correct `ICreateEmployerResponse` in [counterparty.service.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty.service.types.ts) to define `employer: IEmployerDetails` instead of `contractor: IContractorDetails`.

### Step 2: Implementation of Service

Implement [counterparty.service.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/services/counterparty.service.ts):

- **createIndividual(payload)**:
  - Calls `counterpartyEntity.make({ ...payload, type: ECounterpartyType.Individual })` and returns the resulting `TAuditedEntity`.
- **createVendor(payload, vendorDetails)**:
  - Calls `counterpartyEntity.make(payload)` -> `[counterparty, makeEvents, makeAudit]`.
  - Calls `counterpartyEntity.addRole(counterparty, ECounterpartyRole.Vendor)` -> `[updatedCounterparty, addRoleEvents, addRoleAudit]`.
  - Calls `vendorDetailsValue.make({ ...vendorDetails, counterPartyId: updatedCounterparty.id })`.
  - Merges events `[...makeEvents, ...addRoleEvents]`.
  - Creates the final audit using `counterpartyAuditValue.make({ before: null, after: updatedCounterparty, action: ECounterpartyEntityActions.Created })` to represent a clean creation of the Vendor.
  - Returns `{ counterparty: [updatedCounterparty, mergedEvents, finalAudit], vendor }`.
- **createContractor(payload, contractorDetails)**:
  - Similar to `createVendor`, calls `counterpartyEntity.make(payload)`, adds `Contractor` role, validates contractor details via `contractorDetailsValue.make`, and constructs a clean audit from `null` to `updatedCounterparty`.
  - Returns `{ counterparty: [updatedCounterparty, mergedEvents, finalAudit], contractor }`.
- **createEmployer(payload, employerDetails)**:
  - Similar to `createVendor`, calls `counterpartyEntity.make(payload)`, adds `Employer` role, validates employer details via `employerDetailsValue.make`, and constructs a clean audit from `null` to `updatedCounterparty`.
  - Returns `{ counterparty: [updatedCounterparty, mergedEvents, finalAudit], employer }`.

### Step 3: Wiring in IoC

Create [counterparty.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/ioc/services/counterparty.ts):

- Instantiates the service: `const counterparty = makeCounterpartyService()`.
- Exports `Object.freeze({ counterparty })`.

### Step 4: Unit Testing

Create [counterparty.service.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/services/__tests__/counterparty.service.test.ts):

- Test each creation function (`createIndividual`, `createVendor`, `createContractor`, `createEmployer`).
- Verify correct role assignments, details validation, event publication, and audit output.

## Test Plan

- **Unit or component:** Verify all functionalities via unit tests under `src/domain/counterparty/services/__tests__/counterparty.service.test.ts`.

## Verification

```bash
npm test src/domain/counterparty
npx tsc --noEmit
```

## Completion Criteria

- All service tests pass successfully.
- Code compiles without TypeScript errors.
- No circular dependencies or style guideline violations.
