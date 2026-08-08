import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ICounterparty } from '../../counterparty/types/counterparty.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';
import { IExchangeRate } from '../../money/types/exchange-rate.types';
import { IMoney } from '../../money/types/money.types';
import { TAuditedJournalEntry } from './journal-entry-audit.types';
import { IJournalLineMeta } from './journal-line.types';

interface IHeaderPayload {
  accountingEntityId: TEntityId;
  memo: string | null;
  effectiveDate: Date;
  postedAt: Date | null;
  functionalCurrencyCode: string;
  createdBy: TEntityId;
}

interface ILinePayload {
  account: ILedgerAccount;
  counterparty: ICounterparty | null;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: IExchangeRate | null;
  description: string | null;
  meta: IJournalLineMeta | null;
}

export interface ICreateReceiptEntryPayload {
  header: IHeaderPayload;
  sourceLine: ILinePayload;
  destinationLines: ILinePayload[];
}

export interface ICreateOpeningBalancePayload {
  accountingEntityId: TEntityId;
  functionalCurrencyCode: string;
  account: ILedgerAccount;
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

  createReceipt(
    payload: ICreateReceiptEntryPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
