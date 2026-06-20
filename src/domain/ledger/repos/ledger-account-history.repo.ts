import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { ILedgerAccountHistory } from '../types/ledger-account-audit.types';

export default interface ILedgerAccountHistoryRepo {
  save(
    histories: ILedgerAccountHistory | ILedgerAccountHistory[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
