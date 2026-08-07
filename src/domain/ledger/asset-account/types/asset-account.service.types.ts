import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../../money/types/currency.types';
import { TCashLedgerCode } from '../../types/ledger-code.types';
import { ILedgerAccount } from '../../types/ledger.types';
import {
  IBankDetails,
  ICashAndCashEquivalentAccount,
} from './asset-account.types';

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
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
  bankDetails: IBankDetails;
}

export default interface IAssetAccountService {
  createPettyCashSubAccount(
    payload: IMakePettyCashPayload,
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      ICashAndCashEquivalentAccount,
      ICashAndCashEquivalentAccount,
      ILedgerAccount
    >
  >;

  createBankSubAccount(
    payload: IMakeBankPayload,
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      ICashAndCashEquivalentAccount,
      ICashAndCashEquivalentAccount,
      ILedgerAccount
    >
  >;
}
