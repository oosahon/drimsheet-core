import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../money/types/currency.types';
import {
  IBankDetails,
  ICashAndCashEquivalentAccount,
} from './asset-account.types';
import { TCashLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';

interface IMakeHeaderPayload {
  name: string;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
}

interface IMakePettyCashPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
}

interface IMakeBankPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
  bankDetails: IBankDetails;
}

type TReturnType = TAuditedEntity<
  ICashAndCashEquivalentAccount,
  ICashAndCashEquivalentAccount,
  ILedgerAccount
>;

export default interface ICashAccountService {
  createHeader(payload: IMakeHeaderPayload): Promise<TReturnType>;

  createPettyCashSubAccount(
    payload: IMakePettyCashPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TReturnType>;

  createBankSubAccount(
    payload: IMakeBankPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TReturnType>;
}
