import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { IExchangeRate } from '../../../domain/currency/types/exchange-rate.types';
import { TAuditedJournalEntry } from '../../../domain/journal-entry/types/journal-entry-audit.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { IMoney } from '../../../shared/types/money.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

export default interface IOpeningBalanceEntryService {
  create(
    accountingEntity: IAccountingEntity,
    account: ILedgerAccount,
    amount: IMoney,
    exchangeRate: IExchangeRate | null,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
