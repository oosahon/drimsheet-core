import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { TUnrealizedGainLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';
import { IUnrealizedGainAccount } from './revenue-account.types';

type TReturnType = TAuditedEntity<
  IUnrealizedGainAccount,
  IUnrealizedGainAccount,
  ILedgerAccount
>;

interface IHeaderPayload {
  name: string;
  createdBy: TEntityId;
  accountingEntity: IAccountingEntity;
}

interface ISubAccountPayload {
  name: string;
  createdBy: TEntityId;
  accountingEntityId: TEntityId;
  isControlAccount: boolean;
  controlAccountCode: TUnrealizedGainLedgerCode;
}

export interface IUnrealizedGainAccountService {
  createHeader(
    payload: IHeaderPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;

  createSubAccount(
    payload: ISubAccountPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
}
