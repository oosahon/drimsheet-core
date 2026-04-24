import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import userPreferencesEntity from '../entities/user-preferences.entity';
import IUserPreferencesRepo from '../repos/user-preferences.repo';
import { IUserPreferences } from '../types/user-preferences.types';

export interface IUserPreferencesService {
  update(
    userId: TEntityId,
    payload: Partial<IUserPreferences>,
    options: IRepoOptions
  ): Promise<TEntityWithEvents<IUserPreferences, IUserPreferences>>;
}

export default function makeUserPreferencesService(
  repo: IUserPreferencesRepo
): IUserPreferencesService {
  return {
    async update(userId, payload, options) {
      const existing = await repo.findById(userId, options);

      const theme =
        payload.appPreferences?.theme ??
        existing?.appPreferences?.theme ??
        null;

      const appUsageMode =
        payload.appPreferences?.appUsageMode ??
        existing?.appPreferences?.appUsageMode ??
        null;

      return userPreferencesEntity.make(userId, {
        appPreferences: {
          theme,
          appUsageMode,
        },
      });
    },
  };
}
