import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccount } from '../../ledger/shared/types/ledger.types';
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
  counterPartyId?: TEntityId | null;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: IExchangeRate | null;
  functionalAmount: IMoney;
  description: string | null;
  meta: IJournalLineMeta | null;
}

export interface ICreateReceiptEntryPayload {
  header: IHeaderPayload;
  sourceLines: ILinePayload[];
  destinationLines: ILinePayload[];
}

export interface IJournalEntryService {
  createReceipt(
    payload: ICreateReceiptEntryPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
