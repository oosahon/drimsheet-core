import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { TAuditedJournalEntry } from '../../../domain/journal-entry/types/journal-entry-audit.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { IExchangeRate } from '../../../domain/money/types/exchange-rate.types';
import { IMoney } from '../../../domain/money/types/money.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

export default interface IOpeningBalanceEntryService {
  create(
    accountingEntity: IAccountingEntity,
    account: ILedgerAccount,
    amount: IMoney,
    effectiveDate: Date,
    exchangeRate: IExchangeRate | null,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
