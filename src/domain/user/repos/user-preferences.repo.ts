import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IUserPreferences } from '../types/user-preferences.types';

export default interface IUserPreferencesRepo {
  save(
    preferences: IUserPreferences,
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    userId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IUserPreferences | null>;
}
