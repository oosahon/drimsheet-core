# Use Cases

## Naming

- File: `<action>-<resource>.usecase.ts`.
- Factory: `make<Action><Resource>Usecase`.
- Return an anonymous async executor.

## Rules

- Use dependency injection unless calling another use case.
- Depend on interfaces/contracts, not implementations.
- Validate executor input with DTO schemas and `zodValidationRunner`.
- Orchestrate domain and app behavior only.
- Do not hide business rules in the use case body.
- Move non-trivial decisions to domain entities, values, domain services, app services, or app policies.
