# Use Cases

## Naming

- File: `<action>-<resource>.usecase.ts`.
- Factory: `make<Action><Resource>Usecase`.
- Return an anonymous async executor.

## Rules

- Use dependency injection unless calling another use case.
- Depend on interfaces/contracts, not implementations.
- Validate executor input with DTO schemas and `zodValidationRunner`.
- Orchestrate the request workflow, including repository writes, transactions,
  history creation, context updates, and event publication when they are
  specific to that workflow.
- Own the transaction boundary when atomicity is request-specific.
- Do not hide business rules in the use case body.
- Move non-trivial decisions to domain entities, values, domain services, app services, or app policies.
- Do not extract a service only to shorten the use case.

## Transactions

- Keep transaction functions small and focused on persistence coordination:
  transaction-dependent reads, writes, and the committed state returned to the
  caller.
- Do not put request validation, event publication, post-commit side effects,
  unrelated external calls, or large domain/history assembly blocks inside the
  persistence function.
- Prepare domain state, history payloads, events, and response data before or
  after the transaction when correctness does not require the transaction lock.
- When allocation locks or transaction-scoped reads are required for
  correctness, keep them inside the transaction boundary but separate them from
  the write-focused persistence function with named preparation and persistence
  phases.
- A reader should be able to identify atomic reads, writes, and returned
  committed state without reading the complete workflow inline.

Follow [Service Ownership](service-ownership.md) for transaction and extraction
decisions and [Readability](readability.md) for workflow presentation.
