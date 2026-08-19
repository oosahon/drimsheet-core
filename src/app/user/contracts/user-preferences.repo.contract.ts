import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  IUserPreferences,
  TUserPreferencesUpdate,
} from './user-preferences.types';

export default interface IUserPreferencesRepo {
  create(
    preferences: IUserPreferences,
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    userId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IUserPreferences | null>;

  update(
    preferences: TUserPreferencesUpdate,
    options: IWriteRepoOptions
  ): Promise<void>;
}
