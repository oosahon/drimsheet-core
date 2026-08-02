import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccount } from '../../ledger/shared/types/ledger.types';
import { IExchangeRate } from '../../money/types/exchange-rate.types';
import { IMoney } from '../../money/types/money.types';
import { TAuditedJournalEntry } from './journal-entry-audit.types';

export interface ICreateOpeningBalancePayload {
  accountingEntityId: TEntityId;
  functionalCurrencyCode: string;
  account: Pick<
    ILedgerAccount,
    'openingBalanceDate' | 'isControlAccount' | 'id' | 'normalBalance'
  >;
  amount: IMoney;
  effectiveDate: Date;
  exchangeRate: IExchangeRate | null;
  createdBy: TEntityId;
}

export interface IJournalEntryService {
  createOpeningBalance(
    payload: ICreateOpeningBalancePayload,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
