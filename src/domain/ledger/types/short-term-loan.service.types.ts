import {
  IReadRepoOptions,
  IRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../money/types/currency.types';
import { TShortTermDebtLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';
import {
  ICreditCardAccount,
  ICreditCardAccountMeta,
  IShortTermDebtAccount,
  IShortTermLoanAccount,
} from './liability-account.types';

type TReturnType = TAuditedEntity<
  IShortTermDebtAccount,
  IShortTermDebtAccount,
  ILedgerAccount
>;

type TShortTermLoanReturnType = TAuditedEntity<
  IShortTermLoanAccount,
  IShortTermLoanAccount,
  ILedgerAccount
>;

type TCreditCardReturnType = TAuditedEntity<
  ICreditCardAccount,
  ICreditCardAccount,
  ILedgerAccount
>;

interface IMakeHeaderPayload {
  name: string;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  createdBy: TEntityId;
}

interface ICreateCreditCardPayload {
  name: string;
  createdBy: TEntityId;
  accountingEntityId: TEntityId;
  currency: ICurrency;
  isControlAccount: boolean;
  controlAccountCode: TShortTermDebtLedgerCode;
  // TODO: update meta to include bank details
  meta: ICreditCardAccountMeta;
}

interface ICreateSubAccountPayload {
  name: string;
  createdBy: TEntityId;
  accountingEntityId: TEntityId;
  currency: ICurrency | null;
  isControlAccount: boolean;
  controlAccountCode: TShortTermDebtLedgerCode;
}

export interface IShortTermLoanAccountService {
  createHeader(
    payload: IMakeHeaderPayload,
    repoOptions: IRepoOptions
  ): Promise<TReturnType>;

  createSubAccount(
    payload: ICreateSubAccountPayload,
    repoOptions: IRepoOptions
  ): Promise<TShortTermLoanReturnType>;

  createCreditCardSubAccount(
    payload: ICreateCreditCardPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TCreditCardReturnType>;
}
