import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IEmployerHistory } from '@domain/counterparty/types/counterparty-audit.types';

export default interface IEmployerHistoryRepo {
  save(history: IEmployerHistory, options: IWriteRepoOptions): Promise<void>;
}
