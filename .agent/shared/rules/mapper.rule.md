# Mapper Rule

Follow this rule when creating mappers -- the transformation layer between different layers of the application.

## Naming convention

- The file must be created inside the `src/app/mappers` directory.
- The file must have the following convention `<domain/shared-resource>.mapper.ts` or `<domain/shared-resource>.mappers.ts`. E.g. `accounting.mapper.ts` or `error.mapper.ts`.

## Mappers anatomy

- Mappers must not never use spread operators. Every value must be explicitly mapped to avoid pollution.
- Mappers must be pure functions, having no side effects.
- Mappers must NEVER use `any`
