import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

export const EAccountingContextAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UAccountingContextAction =
  (typeof EAccountingContextAction)[keyof typeof EAccountingContextAction];

type TAccountingContextResource =
  IAuthorizationResource<UAccountingContextAction>;

export const accountingContextResource = {
  name: 'accounting_context',
  permissions: [
    { action: EAccountingContextAction.Create },
    { action: EAccountingContextAction.Read },
    { action: EAccountingContextAction.Update },
  ],
} as const satisfies TAccountingContextResource;
