import userPreferencesEntity from '../entities/user-preferences.entity';
import IUserPreferencesRepo from '../repos/user-preferences.repo';
import IUserPreferencesService from '../types/user-preferences.service.types';

type TUpdate = IUserPreferencesService['update'];

interface IDependencies {
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeUserPreferencesService(
  deps: IDependencies
): IUserPreferencesService {
  /**
   * Updates user preferences
   * @param userId - The ID of the user to update
   * @param payload - The preferences to update
   * @param options - Options for the update operation
   */
  const update: TUpdate = async (userId, payload, options) => {
    const existing = await deps.userPreferencesRepo.findById(userId, options);
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

  return Object.freeze({
    update,
  });
}
