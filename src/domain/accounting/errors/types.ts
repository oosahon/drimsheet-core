type TErrorKeyPrefix = `accounting_error_${string}`;

export const EAccountingError = {
  DuplicateAccountingEntity: `accounting_error_duplicate_accounting_entity`,
  UnauthorizedUserAccess: `accounting_error_unauthorized_user_access`,
} as const satisfies Record<string, TErrorKeyPrefix>;

export type UAccountingError =
  (typeof EAccountingError)[keyof typeof EAccountingError];
