import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { IHistory } from '@shared/values/history/types/history.types';

import { IActor } from '@domain/user/types/actor.types';

export default interface IActorRepo {
  create(
    actor: IActor,
    options: IWriteRepoOptions<IHistory<IActor>>
  ): Promise<void>;
  findById(id: TEntityId, options: IReadRepoOptions): Promise<IActor | null>;
  findByUsername(
    username: string,
    options: IReadRepoOptions
  ): Promise<IActor | null>;
}
