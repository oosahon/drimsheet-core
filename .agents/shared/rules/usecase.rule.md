# Usecase Rule

The following rules should always be followed when creating a usecase:

## Naming convention

- For the file name use kebab-case and plural form e.g. `delete-accounting-contexts.usecase.ts`. It should always be <action>-<resource>.usecase.ts
- The function is always a factory function with the name `make<Action><Resource>Usecase` e.g. `makeDeleteAccountingContextsUsecase`

## Usecase anatomy

- The usecase always uses dependency injection unless it's calling another usecase. ie it uses the interface and not the implementation.
- The usecase must return an anonymous async function that acts as the actual execution.
- If the returned executor accepts arguments, they must be defined in the dto and validated using the `zodValidationRunner`. (See [Dto Rule](./dto.rule.md))
