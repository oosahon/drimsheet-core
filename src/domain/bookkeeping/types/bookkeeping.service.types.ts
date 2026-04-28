import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IMoney } from '../../../shared/types/money.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';
import { IJournalEntry } from '../../journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../journal-entry/types/journal-line.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';

export interface IOpeningBalanceTransaction {
  accountingEntity: IAccountingEntity;
  account: ILedgerAccount;
  exchangeRate: IExchangeRate | null;
  amount: IMoney;
}

export interface ILedgerAccountBalanceEffectDelta {
  balanceDelta: IMoney;
  functionalBalanceDelta: IMoney;
  affectedLedgerCodes: string[];
}

export default interface IBookkeepingService {
  createOpeningBalanceJournalEntry(
    payload: IOpeningBalanceTransaction,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IJournalEntry, IJournalLine | IJournalEntry>>;

  getBalanceEffectDelta(
    accountId: TEntityId,
    journalLines: IJournalLine[],
    repoOptions: IRepoOptions
  ): Promise<ILedgerAccountBalanceEffectDelta>;
}
