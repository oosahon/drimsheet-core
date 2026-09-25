import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

import {
  ELedgerAccountStatus,
  ULedgerAccountStatus,
} from '@domain/ledger/types/ledger.types';

export const ELedgerAccountAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type ULedgerAccountAction =
  (typeof ELedgerAccountAction)[keyof typeof ELedgerAccountAction];

type TLedgerAccountResource = IAuthorizationResource<
  ULedgerAccountAction,
  ULedgerAccountStatus
>;

export const ledgerAccountResource = {
  name: 'ledger_account',
  permissions: [
    {
      action: ELedgerAccountAction.Create,
      state: ELedgerAccountStatus.Active,
    },
    { action: ELedgerAccountAction.Read },
    {
      action: ELedgerAccountAction.Update,
      state: ELedgerAccountStatus.Active,
    },
  ],
} as const satisfies TLedgerAccountResource;
