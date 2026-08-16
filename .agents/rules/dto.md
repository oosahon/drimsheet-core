# DTOs

DTOs define application input/output shapes.

## Rules

- Place DTOs under `src/app/<domain>/dtos`.
- Name files `<resource>.dto.ts`.
- Export TypeScript types and Zod schemas together.
- Compose schemas directly. Avoid `extends`, `Pick`, `Omit`, and shape-mutating utility types.
- Use domain/app error keys in validation messages.
- Validation-message keys identify individual invalid fields. The interface
  validation envelope owns the top-level `_validation_error` key and HTTP 422.
- Provide `fromDto` / `toDto` helpers when conversion is needed.
- Do not use `any`.

DTO validation is for transport shape and primitive constraints. Business validity belongs in domain/app logic.

## HTTP Outputs

- Before introducing a controller-local response type or returning a domain
  entity, search the owning application folder for an existing output DTO and
  mapper.
- Prefer the application-owned DTO and mapper at delivery boundaries. If the
  existing DTO is unsuitable, fix or intentionally replace the owning app DTO
  instead of duplicating its contract in the controller.
- Framework metadata limitations, including TSOA type resolution, are not by
  themselves a reason to duplicate a response contract.
- Keep assembly of balances, money, metadata, and other application output state
  in the application layer. Controllers should declare and return the DTO.
