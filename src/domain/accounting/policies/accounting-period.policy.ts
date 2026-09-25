import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

import {
  EPeriodStatus,
  UPeriodStatus,
} from '@domain/accounting/types/period.types';

export const EAccountingPeriodAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UAccountingPeriodAction =
  (typeof EAccountingPeriodAction)[keyof typeof EAccountingPeriodAction];

type TAccountingPeriodResource = IAuthorizationResource<
  UAccountingPeriodAction,
  UPeriodStatus
>;

export const accountingPeriodResource = {
  name: 'accounting_period',
  permissions: [
    {
      action: EAccountingPeriodAction.Create,
      state: EPeriodStatus.Open,
    },
    { action: EAccountingPeriodAction.Read },
    {
      action: EAccountingPeriodAction.Update,
      state: EPeriodStatus.Open,
    },
  ],
} as const satisfies TAccountingPeriodResource;
