type TErrorKeyPrefix = `bookkeeping_error_${string}`;

export const EBookkeepingError = {
  AccountingEntityNotFound: 'bookkeeping_error_accounting_entity_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

export type UBookkeepingError =
  (typeof EBookkeepingError)[keyof typeof EBookkeepingError];
