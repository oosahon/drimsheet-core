import userPreferencesEntity from '../entities/user-preferences.entity';
import IUserPreferencesRepo from '../repos/user-preferences.repo';
import IUserPreferencesService from '../types/user-preferences.service.types';

type TUpdate = IUserPreferencesService['update'];

/**
 * Updates user preferences
 * @param userId - The ID of the user to update
 * @param payload - The preferences to update
 * @param options - Options for the update operation
 */
function makeUpdate(repo: IUserPreferencesRepo): TUpdate {
  return async (userId, payload, options) => {
    const existing = await repo.findById(userId, options);
    return userPreferencesEntity.make(userId, {
      appPreferences: {
        theme:
          payload.appPreferences?.theme ??
          existing?.appPreferences?.theme ??
          null,
        appUsageMode:
          payload.appPreferences?.appUsageMode ??
          existing?.appPreferences?.appUsageMode ??
          null,
      },
    });
  };
}

export default function makeUserPreferencesService(
  repo: IUserPreferencesRepo
): IUserPreferencesService {
  return Object.freeze({
    update: makeUpdate(repo),
  });
}
