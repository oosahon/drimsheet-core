import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

export const EAccountingEntityAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UAccountingEntityAction =
  (typeof EAccountingEntityAction)[keyof typeof EAccountingEntityAction];

type TAccountingEntityResource =
  IAuthorizationResource<UAccountingEntityAction>;

export const accountingEntityResource = {
  name: 'accounting_entity',
  permissions: [
    { action: EAccountingEntityAction.Create },
    { action: EAccountingEntityAction.Read },
    { action: EAccountingEntityAction.Update },
  ],
} as const satisfies TAccountingEntityResource;
