# Implement Vendor/Employer/Contractor Details History Plan (Domain Only)

## Goal

Define domain entities, value objects, and repository contracts under the domain layer (`src/domain/counterparty/`) to support tracking of history for counterparty details (vendor details, employer details, and contractor details).

State: Implementation-Ready (upon user approval)

## Context

We are focusing exclusively on the domain layer.
We are changing `vendor-details`, `employer-details`, and `contractor-details` from Value Objects to Entities (without separate UUID `id` fields; their `counterPartyId` serves as their identity). This aligns with the convention in the codebase that only entities have history tracked.

## Confirmed Findings

1. **Domain Focus:** No database migrations, Drizzle schema pulls, repository implementations, or infrastructure mappers are to be created at this stage.
2. **Entity Pattern:** Details entities will reside under `src/domain/counterparty/entities/` and will expose a `make` method returning a `TAuditedEntity` tuple `[Entity, Event[], AuditRecord]`. Since they do not emit domain events, the event list will be empty (`never[]`).

## Scope

### Expected Changes

- `src/domain/counterparty/types/counterparty-audit.types.ts` — Add action enums, audit, and history interfaces for vendor, employer, and contractor details.
- `src/domain/counterparty/entities/vendor-details.entity.ts` [NEW] — Entity representation for Vendor details.
- `src/domain/counterparty/entities/employer-details.entity.ts` [NEW] — Entity representation for Employer details.
- `src/domain/counterparty/entities/contractor-details.entity.ts` [NEW] — Entity representation for Contractor details.
- `src/domain/counterparty/values/vendor-details-audit.vo.ts` [NEW] — Audit value object for Vendor details.
- `src/domain/counterparty/values/employer-details-audit.vo.ts` [NEW] — Audit value object for Employer details.
- `src/domain/counterparty/values/contractor-details-audit.vo.ts` [NEW] — Audit value object for Contractor details.
- `src/domain/counterparty/repos/vendor-details-history.repo.ts` [NEW] — Domain repository contract for saving Vendor details history.
- `src/domain/counterparty/repos/employer-details-history.repo.ts` [NEW] — Domain repository contract for saving Employer details history.
- `src/domain/counterparty/repos/contractor-details-history.repo.ts` [NEW] — Domain repository contract for saving Contractor details history.
- `src/domain/counterparty/types/counterparty.service.types.ts` — Update service response interfaces to return audited detail tuple structures.
- `src/domain/counterparty/services/counterparty.service.ts` — Generate details audits using the new VO classes and return audited tuples.
- `src/domain/counterparty/values/vendor-details.vo.ts` [DELETE] — Remove VO in favor of the new entity.
- `src/domain/counterparty/values/employer-details.vo.ts` [DELETE] — Remove VO in favor of the new entity.
- `src/domain/counterparty/values/contractor-details.vo.ts` [DELETE] — Remove VO in favor of the new entity.

### Out of Scope

- Database migrations and configuration edits (`db/` folder).
- Drizzle schema pulls or relationship configuration changes.
- Infrastructure persistence code (mappers, repository implementations, IoC bindings, and app persistence service implementations).

## Proposed Approach

### Step 1: Types Definition

Update `src/domain/counterparty/types/counterparty-audit.types.ts`:

- Define history actions:
  - `EVendorDetailsHistoryAction = { Created: 'created', Updated: 'updated' }`
  - `EEmployerDetailsHistoryAction = { Created: 'created', Updated: 'updated' }`
  - `EContractorDetailsHistoryAction = { Created: 'created', Updated: 'updated' }`
- Define audit and history interfaces:
  - `IVendorDetailsAudit`, `IVendorDetailsHistory`
  - `IEmployerDetailsAudit`, `IEmployerDetailsHistory`
  - `IContractorDetailsAudit`, `IContractorDetailsHistory`

### Step 2: Details Entities Creation

1. Implement `vendor-details.entity.ts`:
   - `make` function validates payload using value helpers and returns `TAuditedEntity<IVendorDetails, never, IVendorDetails>`.
   - Computes initial `vendorDetailsAudit` using `vendorDetailsAuditValue.make({ before: null, after: vendorDetails, action: EVendorDetailsHistoryAction.Created })`.
2. Implement `employer-details.entity.ts`:
   - `make` function validates payload and returns `TAuditedEntity<IEmployerDetails, never, IEmployerDetails>`.
   - Computes `employerDetailsAudit`.
3. Implement `contractor-details.entity.ts`:
   - `make` function validates payload and returns `TAuditedEntity<IContractorDetails, never, IContractorDetails>`.
   - Computes `contractorDetailsAudit`.

### Step 3: Details Audit Value Objects

Implement audit value objects (`vendor-details-audit.vo.ts`, `employer-details-audit.vo.ts`, `contractor-details-audit.vo.ts`) to validate identity, action enums, and dates. Diffing will be handled using `generateDiff`.

### Step 4: Repository Contracts

Define repo contracts under `src/domain/counterparty/repos/`:

- `vendor-details-history.repo.ts`
- `employer-details-history.repo.ts`
- `contractor-details-history.repo.ts`

### Step 5: Service Refactoring

1. Update `src/domain/counterparty/types/counterparty.service.types.ts`:
   - Response details fields change to audited tuple format (e.g. `vendor: TAuditedEntity<IVendorDetails, never, IVendorDetails>`).
2. Update `src/domain/counterparty/services/counterparty.service.ts`:
   - Delegate detail entity instantiation to `vendorDetailsEntity.make`, `employerDetailsEntity.make`, and `contractorDetailsEntity.make`.
   - Return the details as the audited tuples.

## Test Plan

- **Unit:**
  - Create unit tests for new entities: `vendor-details.entity.test.ts`, `employer-details.entity.test.ts`, `contractor-details.entity.test.ts`.
  - Create unit tests for detail audits VOs.
  - Update `counterparty.service.test.ts` to expect audited details tuples.

## Verification

```bash
npm test src/domain/counterparty
npx tsc --noEmit
```

## Completion Criteria

- Details value object files deleted.
- Details entities and details audit value objects created.
- Repository contracts created.
- All counterparty domain tests pass and TypeScript compiles cleanly.
