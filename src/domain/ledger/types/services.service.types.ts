import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { TServicesLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';
import { IServicesAccount } from './revenue-account.types';

type TReturnType = TAuditedEntity<
  IServicesAccount,
  IServicesAccount,
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
  controlAccountCode: TServicesLedgerCode;
}

export interface IServicesAccountService {
  createHeader(
    payload: IHeaderPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;

  createSubAccount(
    payload: ISubAccountPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
}
