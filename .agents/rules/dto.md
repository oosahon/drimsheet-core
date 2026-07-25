# DTOs

DTOs define application input/output shapes.

## Rules

- Place DTOs under `src/app/<domain>/dtos`.
- Name files `<resource>.dto.ts`.
- Export TypeScript types and Zod schemas together.
- Compose schemas directly. Avoid `extends`, `Pick`, `Omit`, and shape-mutating utility types.
- Use domain/app error keys in validation messages.
- Provide `fromDto` / `toDto` helpers when conversion is needed.
- Do not use `any`.

DTO validation is for transport shape and primitive constraints. Business validity belongs in domain/app logic.
