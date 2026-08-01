import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IEmployerHistory } from '../types/counterparty-audit.types';

export default interface IEmployerHistoryRepo {
  save(history: IEmployerHistory, options: IWriteRepoOptions): Promise<void>;
}
