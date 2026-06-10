import { IMoney } from '../../../shared/types/money.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';
import journalEntryEntity from '../entities/journal-entry.entity';
import { IjournalEntryMakePayload } from './journal-entry.types';
import { IJournalLine, IJournalLineMakePayload } from './journal-line.types';

export interface IOpeningBalanceTransaction {
  accountingEntity: IAccountingEntity;
  account: ILedgerAccount;
  exchangeRate: IExchangeRate | null;
  amount: IMoney;
}

export interface IJournalTransactionPayload {
  sourceLine: IJournalLineMakePayload;
  destinationLines: IJournalLineMakePayload[];
  header: Omit<IjournalEntryMakePayload, 'lines'>;
}

export interface ILedgerAccountBalanceEffectDelta {
  balanceDelta: IMoney;
  functionalBalanceDelta: IMoney;
  affectedLedgerCodes: string[];
}

export default interface IJournalEntryService {
  recordOpeningBalance(
    payload: IOpeningBalanceTransaction,
    repoOptions: IRepoOptions
  ): Promise<ReturnType<typeof journalEntryEntity.make>>;

  recordTransaction(
    payload: IJournalTransactionPayload,
    repoOptions: IRepoOptions
  ): Promise<ReturnType<typeof journalEntryEntity.make>>;

  getBalanceEffectDelta(
    accountId: TEntityId,
    journalLines: IJournalLine[],
    repoOptions: IRepoOptions
  ): Promise<ILedgerAccountBalanceEffectDelta>;
}
