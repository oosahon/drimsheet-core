# DTO Rule

The following rules should always be followed when creating a DTO:

## Naming convention

- The file must be created inside the `src/app/contracts/dto` directory.
- The file must have the following convention `<domain/shared-resource>.dto.t`. Eg `accounting.dto.ts` or `error.dto.ts`.
- The dtos must be written in a way that ensures composition but must avoid the use of `extends`, `pick`, or any other typescript utility types that modifies the shape of the dto.

## Zod validation

- Every dto must have a zod validation schema which is exported along with other types.
- Zod validation schemas are meant to be composed.

## Error messages

- Zod validation must use domain error error keys. So that the client can adequately translate the error message to any language they desire. Example:

```ts
const invalidTypeKey = new ledgerAccountError.InvalidType().errorKey;

export const ELedgerAccountSortBy = {
  AccountName: 'accountName',
  CreatedAt: 'createdAt',
  Balance: 'balance',
} as const;

export type ULedgerAccountSortBy =
  (typeof ELedgerAccountSortBy)[keyof typeof ELedgerAccountSortBy];

export const ledgerAccountTypeValidation = z.enum(
  Object.values(ELedgerType) as [ULedgerType, ...ULedgerType[]],
  invalidTypeKey // keys
);
```

## Mappers

- `fromDto` , `toDto` utility function must be provided for mapping the dto to the domain model and vice versa.
- Mappers must not be hardcoded.
- See [Mapper rule](./mapper.rule.md)
- DTOs MUST NEVER USE `any`
