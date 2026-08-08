import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../money/types/currency.types';
import { IInterestAccount } from './expense-account.types';
import { TInterestLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';

type TReturnType = TAuditedEntity<
  IInterestAccount,
  IInterestAccount,
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
  currency: ICurrency;
  isControlAccount: boolean;
  controlAccountCode: TInterestLedgerCode;
}

export interface IInterestAccountService {
  createHeader(
    payload: IHeaderPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
  createSubAccount(
    payload: ISubAccountPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;
}
