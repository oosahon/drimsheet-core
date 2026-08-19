import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@app/user/types/user-preferences.types';

export default interface IUserPreferencesRepo {
  update(
    preferences: IUserPreferences,
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    userId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IUserPreferences | null>;
}
