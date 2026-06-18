import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { ILedgerAccountHistory } from './ledger-account-audit.types';
import { ILedgerAccount } from './ledger.types';

export default interface ILedgerAccountPersistenceService {
  create(
    account: ILedgerAccount,
    functionalCurrencyCode: string,
    repoOptions: IWriteRepoOptions<ILedgerAccountHistory[]>
  ): Promise<void>;
}
