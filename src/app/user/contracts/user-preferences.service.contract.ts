import { TCreationOmits } from '@shared/types/creation-omits.types';
import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from './user-preferences.types';

export default interface IUserPreferencesService {
  create(
    payload: TCreationOmits<IUserPreferences>,
    options: IWriteRepoOptions
  ): Promise<void>;

  setLastActiveAccountingEntity(
    userId: TEntityId,
    accountingEntityId: TEntityId | null,
    options: IWriteRepoOptions
  ): Promise<void>;
}
