# Implementation Plan: `src/domain/counterparty/`

Implement the `counterparty` domain bounded context in `src/domain/counterparty/` with separation of helpers from entities and value objects, exposing `make` creation methods for all.

## Proposed Changes

### Domain Types (`src/domain/counterparty/types/`)

#### [MODIFY] [counterparty.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty.types.ts)

- Add payload creation interfaces (`IMakeCounterpartyPayload`, `IMakeEmployerDetailsPayload`, `IMakeVendorDetailsPayload`, `IMakeContractorDetailsPayload`).

#### [NEW] [counterparty-audit.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/types/counterparty-audit.types.ts)

- Define `ECounterpartyEntityActions`, `UCounterpartyEntityActions`, `ICounterpartyAudit`, `IMakeCounterpartyAuditPayload`, and `ICounterpartyHistory`.

---

### Domain Errors (`src/domain/counterparty/errors/`)

#### [NEW] [counterparty.error.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/errors/counterparty.error.ts)

- Define `CounterpartyError` extending `DomainError` with error keys `counterparty_error_*` following `.agents/rules/error-creation.md`.

---

### Domain Events (`src/domain/counterparty/events/`)

#### [NEW] [counterparty.events.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/events/counterparty.events.ts)

- Define `ECounterpartyEvents` (`domain:counterparty:created`, `domain:counterparty:updated`).
- Export event creation helper functions (`created`, `updated`).

---

### Value Objects (`src/domain/counterparty/values/`)

#### [NEW] [counterparty-value.helpers.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/helpers/counterparty-value.helpers.ts)

- Implement helper functions (`validateCounterpartyId`, `validateAddress`, `sanitizeDisplayName`).

#### [NEW] [counterparty-audit.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/counterparty-audit.vo.ts)

- Implement `make` method for generating `ICounterpartyAudit` using diff generation and validation.

#### [NEW] [employer-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/employer-details.vo.ts)

- Implement `make` method for creating `IEmployerDetails` value object.

#### [MODIFY] [contractor-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/contractor-details.vo.ts)

- Implement `make` method for creating `IContractorDetails` value object.

#### [MODIFY] [vendor-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/vendor-details.vo.ts)

- Implement `make` method for creating `IVendorDetails` value object.

#### [DELETE] [employee-details.vo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/employee-details.vo.ts)

- Remove empty file in favor of `employer-details.vo.ts` matching `IEmployerDetails` and `ECounterpartyRole.Employer`.

---

### Domain Entity (`src/domain/counterparty/entities/`)

#### [NEW] [counterparty.entity.helpers.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/entities/helpers/counterparty.entity.helpers.ts)

- Implement validation helper functions (`validateAccountingEntityId`, `validateName`, `validateType`, `validateStatus`, `validateCounterparty`).

#### [MODIFY] [counterparty.entity.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/entities/counterparty.entity.ts)

- Implement `make` method for `Counterparty` entity returning `[counterparty, [createdEvent], auditRecord]`.
- Export default frozen object containing `make` and spread helpers.

---

### Unit Tests (`src/domain/counterparty/`)

#### [NEW] [counterparty.entity.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/entities/__tests__/counterparty.entity.test.ts)

#### [NEW] [counterparty.entity.helpers.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/entities/helpers/__tests__/counterparty.entity.helpers.test.ts)

#### [NEW] [contractor-details.vo.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/__tests__/contractor-details.vo.test.ts)

#### [NEW] [employer-details.vo.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/__tests__/employer-details.vo.test.ts)

#### [NEW] [vendor-details.vo.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/__tests__/vendor-details.vo.test.ts)

#### [NEW] [counterparty-audit.vo.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/counterparty/values/__tests__/counterparty-audit.vo.test.ts)

## Verification Plan

### Automated Tests

- Run Jest tests for counterparty domain:
  `npx jest src/domain/counterparty`
- Run typecheck and linting:
  `npx tsc --noEmit`
