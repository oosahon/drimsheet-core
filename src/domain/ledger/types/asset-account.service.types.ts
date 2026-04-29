import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../currency/types/currency.types';
import {
  IAssetLedgerAccount,
  ICashAndCashEquivalentAccount,
} from './asset-account.types';
import { TCashLedgerCode } from './ledger-code.types';

interface IMakePettyCashPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
}

export default interface IAssetAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<{
    accounts: IAssetLedgerAccount[];
    events: IEvent<IAssetLedgerAccount>[];
  }>;

  makePettyCashSubAccount(
    payload: IMakePettyCashPayload,
    repoOptions: IRepoOptions
  ): Promise<
    TEntityWithEvents<
      ICashAndCashEquivalentAccount,
      ICashAndCashEquivalentAccount
    >
  >;
}
