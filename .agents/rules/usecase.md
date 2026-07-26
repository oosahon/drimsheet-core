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
- Do not hide business rules in the use case body.
- Move non-trivial decisions to domain entities, values, domain services, app services, or app policies.
- Do not extract a service only to shorten the use case.

Follow [Service Ownership](service-ownership.md) for transaction and extraction
decisions and [Readability](readability.md) for workflow presentation.
