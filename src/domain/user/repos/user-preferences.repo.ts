import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IUserPreferences } from '../types/user-preferences.types';

export default interface IUserPreferencesRepo {
  save(preferences: IUserPreferences, options: IRepoOptions): Promise<void>;

  findById(
    userId: TEntityId,
    options: IRepoOptions
  ): Promise<IUserPreferences | null>;
}
