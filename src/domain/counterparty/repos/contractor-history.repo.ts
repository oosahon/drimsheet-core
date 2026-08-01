import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IContractorHistory } from '../types/counterparty-audit.types';

export default interface IContractorHistoryRepo {
  save(history: IContractorHistory, options: IWriteRepoOptions): Promise<void>;
}
