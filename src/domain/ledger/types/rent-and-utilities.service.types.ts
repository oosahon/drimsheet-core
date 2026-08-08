import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IRentUtilitiesAccount } from './expense-account.types';
import { TRentUtilitiesLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';

type TReturnType = TAuditedEntity<
  IRentUtilitiesAccount,
  IRentUtilitiesAccount,
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
  controlAccountCode: TRentUtilitiesLedgerCode;
}

export interface IRentAndUtilitiesAccountService {
  createHeader(
    payload: IHeaderPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
  createSubAccount(
    payload: ISubAccountPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
}
