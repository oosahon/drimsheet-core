import IUserPreferencesRepo from '@app/user/contracts/user-preferences.repo.contract';
import IUserPreferencesService from '@app/user/contracts/user-preferences.service.contract';

interface IDependencies {
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeUserPreferencesService(
  deps: IDependencies
): IUserPreferencesService {
  const service: IUserPreferencesService = {
    async create(payload, options) {
      const timestamp = new Date();
      const preferences = {
        ...payload,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await deps.userPreferencesRepo.create(preferences, options);
    },

    async setLastActiveAccountingEntity(userId, accountingEntityId, options) {
      const preferences = {
        userId,
        lastActiveAccountingEntityId: accountingEntityId,
      };

      await deps.userPreferencesRepo.update(preferences, options);
    },
  };

  return Object.freeze(service);
}
