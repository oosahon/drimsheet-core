import { ILedgerAccountHistory } from '../../../domain/ledger/types/ledger-account-audit.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IWriteRepoOptions } from '../../../shared/types/repo.types';

export default interface ILedgerAccountPersistenceService {
  create(
    account: ILedgerAccount,
    functionalCurrencyCode: string,
    repoOptions: IWriteRepoOptions<ILedgerAccountHistory[]>
  ): Promise<void>;
}
