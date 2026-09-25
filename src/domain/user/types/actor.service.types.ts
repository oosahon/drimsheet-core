import { IReadRepoOptions } from '@shared/types/repo.types';

import { IActor } from './actor.types';
import { IUser } from './user.types';

export default interface IActorService {
  /** Rejects missing, disabled, or inconsistent identities; performs reads only. */
  resolveUser(user: IUser, options: IReadRepoOptions): Promise<IActor>;
  resolveByUsername(
    username: string,
    options: IReadRepoOptions
  ): Promise<IActor>;
}
