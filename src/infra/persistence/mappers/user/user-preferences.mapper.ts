import { InferSelectModel } from 'drizzle-orm';
import { IUserPreferences } from '../../../../domain/user/types/user-preferences.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { userPreferencesInCore } from '../../../config/drizzle/schema';
import { fromRepoDate, toRepoDate } from '../shared/date';

interface IUserPreferencesModel extends InferSelectModel<
  typeof userPreferencesInCore
> {}

const userPreferencesMapper = {
  toRepo(payload: IUserPreferences): IUserPreferencesModel {
    return {
      id: payload.id,
      appPreferences: payload.appPreferences,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },

  toDomain(payload: IUserPreferencesModel): IUserPreferences {
    return {
      id: payload.id as TEntityId,
      appPreferences:
        payload.appPreferences as IUserPreferences['appPreferences'],
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },
};

export default userPreferencesMapper;
