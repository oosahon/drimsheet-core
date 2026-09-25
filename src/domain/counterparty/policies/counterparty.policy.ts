import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

import {
  ECounterpartyStatus,
  UCounterpartyStatus,
} from '@domain/counterparty/types/counterparty.types';

export const ECounterpartyAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UCounterpartyAction =
  (typeof ECounterpartyAction)[keyof typeof ECounterpartyAction];

type TCounterpartyResource = IAuthorizationResource<
  UCounterpartyAction,
  UCounterpartyStatus
>;

export const counterpartyResource = {
  name: 'counterparty',
  permissions: [
    {
      action: ECounterpartyAction.Create,
      state: ECounterpartyStatus.Active,
    },
    { action: ECounterpartyAction.Read },
    {
      action: ECounterpartyAction.Update,
      state: ECounterpartyStatus.Active,
    },
  ],
} as const satisfies TCounterpartyResource;
