import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@domain/user/types/user-preferences.types';

export default interface IUserPreferencesRepo {
  findById(
    userId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IUserPreferences | null>;

  update(
    userId: TEntityId,
    payload: Partial<IUserPreferences>,
    options: IWriteRepoOptions
  ): Promise<void>;
}
