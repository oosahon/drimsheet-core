import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IUserPreferences } from '../types/user-preferences.types';

export default interface IUserPreferencesRepo {
  findById(
    userId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IUserPreferences | null>;
}
