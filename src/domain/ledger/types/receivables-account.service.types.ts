import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../money/types/currency.types';
import { IReceivablesAccount } from './asset-account.types';
import { TReceivablesLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';

type TReturnType = TAuditedEntity<
  IReceivablesAccount,
  IReceivablesAccount,
  ILedgerAccount
>;

interface ICreateHeaderPayload {
  name: string;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
}

interface ICreateReceivableSubAccountPayload {
  name: string;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  currency: ICurrency;
  isControlAccount: boolean;
  controlAccountCode: TReceivablesLedgerCode;
  controlAccount?: ILedgerAccount;
  precedingCode?: TReceivablesLedgerCode;
}

export interface IReceivablesAccountService {
  createHeader(
    payload: ICreateHeaderPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TReturnType>;

  createStatutoryReceivableSubAccount(
    payload: ICreateReceivableSubAccountPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TReturnType>;

  createTradeReceivableSubAccount(
    payload: ICreateReceivableSubAccountPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TReturnType>;
}
