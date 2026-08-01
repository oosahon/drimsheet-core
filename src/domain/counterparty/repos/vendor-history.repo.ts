import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IVendorHistory } from '../types/counterparty-audit.types';

export default interface IVendorHistoryRepo {
  save(history: IVendorHistory, options: IWriteRepoOptions): Promise<void>;
}
