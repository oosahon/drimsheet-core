import { IRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

import {
  IOpeningBalanceEquityAccount,
  IRetainedEarningsAccount,
} from './equity-account.types';
import { ILedgerAccount } from './ledger.types';

interface IMakePayload {
  name: string;
  createdBy: TEntityId;
  accountingEntity: IAccountingEntity;
}

export interface IEquityAccountService {
  createOpeningBalanceAccount(
    payload: IMakePayload,
    repoOptions: IRepoOptions
  ): Promise<
    TAuditedEntity<
      IOpeningBalanceEquityAccount,
      IOpeningBalanceEquityAccount,
      ILedgerAccount
    >
  >;

  createRetainedEarningsAccount(
    payload: IMakePayload,
    repoOptions: IRepoOptions
  ): Promise<
    TAuditedEntity<
      IRetainedEarningsAccount,
      IRetainedEarningsAccount,
      ILedgerAccount
    >
  >;
}
