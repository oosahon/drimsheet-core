import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IUserPreferences,
  IUserPreferencesUpdate,
} from '@app/user/types/user-preferences.types';

export default interface IUserPreferencesService {
  update(
    payload: IUserPreferencesUpdate,
    options: IWriteRepoOptions
  ): Promise<IUserPreferences>;
}
