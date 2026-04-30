# Ticket Description

Work on Linear issue PUR-72:

<issue identifier="PUR-72">
<title>Update onboarding flow for individuals</title>
<team name="Purpleledger"/>
<label>CORE</label>
<project name="v0.1.0-beta: Cash Flow Ledger">Manage cashflow with PurpleLedger</project>
<parent-issue identifier="PUR-71">
<id>482770a4-000d-43bc-8588-9fbb5b625ffc</id>
<title>Update onboarding flow for individuals</title>
</parent-issue>
<sub-issues>
<sub-issue identifier="PUR-73">
<id>b17c5742-9a7e-42f3-b9fa-57eba7bf5ecf</id>
<title>Update individual accounting entity schema</title>
</sub-issue>
</sub-issues>
</issue>

# Agent Feedback

### 1. What we are doing well

- **Domain-Driven Design**: The refactoring successfully cleanly isolates the `accounting-entity` bounded context from the core `accounting` domain, streamlining responsibilities.
- **Clear Use Cases**: The introduction of dedicated use cases (e.g., `create-accounting-entity.usecase.ts`, `get-user-accounting-entities.usecase.ts`) follows established architectural patterns and ensures better maintainability.
- **Strong Test Coverage**: The changes introduce robust unit testing for the new mappers, entities, and use cases, providing excellent verification of domain logic.

### 2. What we could improve

- **Use of `any`**: There are multiple violations of strict typing using the `any` keyword that must be addressed:
  - `src/app/mappers/accounting-entity.mapper.ts`: Explicitly exports `export type IAccountingEntityRes = any;` with a `// TODO: define in dto`. The DTO must be properly implemented.
  - `src/app/mappers/accounting-entity.mapper.ts`: Bypasses type-safety with `jurisdictionCode: payload.jurisdictionCode as any`.
  - **Test Files**: Several unit tests (e.g., `accounting-context.entity.test.ts`, `accounting.service.test.ts`, `asset-account.service.test.ts`) rely heavily on `as any` to force invalid data (e.g., `const testType = 'test_type' as any;`). This pattern should be replaced with proper type mocks, `@ts-expect-error` annotations (when testing invalid inputs), or `unknown` assertions.
- **Uncovered Test Cases**: There are no integration or unit tests covering the newly added/modified endpoints in `src/interface/http/controllers/accounting.controller.ts`. Ensure controllers have adequate test coverage to verify HTTP behavior.
- **Dead Code**: A temporary script `test-enum.js` was accidentally checked into the root of the repository. This should be removed.

### 3. Bugs and their severity

- **Severity**: Medium
- **Location**: `src/app/mappers/accounting-entity.mapper.ts`
- **Description**: The mapper forces the `jurisdictionCode` variable via `as any`, deliberately bypassing TypeScript validation.
- **Impact**: It compromises type safety, meaning if an invalid or unmapped jurisdiction string is passed from the payload, it will silently pass through the mapping layer and potentially crash database insertions or corrupt domain state.

- **Severity**: Low
- **Location**: `test-enum.js`
- **Description**: A temporary scratchpad/testing script for debugging enum object behavior was accidentally included in the commit.
- **Impact**: Pollutes the repository with untracked/unnecessary files and does not provide value to the codebase.
