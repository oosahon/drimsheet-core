import { IWriteRepoOptions } from '@shared/types/repo.types';
import { IHistory } from '@shared/values/history/types/history.types';

import { IActor } from '@domain/user/types/actor.types';

export default interface IActorHistoryRepo {
  save(history: IHistory<IActor>, options: IWriteRepoOptions): Promise<void>;
}
