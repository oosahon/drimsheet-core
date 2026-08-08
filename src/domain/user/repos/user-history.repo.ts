import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IUserHistory } from '@domain/user/types/user-audit.types';

export default interface IUserHistoryRepo {
  save(history: IUserHistory, options: IWriteRepoOptions): Promise<void>;
}
