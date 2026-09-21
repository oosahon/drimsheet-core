import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import {
  IUserAppPreferences,
  IUserPreferences,
} from '@app/user/types/user-preferences.types';

import { userPreferencesInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';

interface IUserPreferencesModel extends InferSelectModel<
  typeof userPreferencesInCore
> {}

const userPreferencesMapper = {
  toRepo(
    preferences: IUserPreferences
  ): typeof userPreferencesInCore.$inferInsert {
    return Object.freeze({
      id: preferences.userId,
      lastActiveAccountingEntityId: preferences.lastActiveAccountingEntityId,
      appPreferences: {
        theme: preferences.appPreferences.theme,
        appUsageMode: preferences.appPreferences.appUsageMode,
        suppressJournalEntryRectificationNotice:
          preferences.appPreferences.suppressJournalEntryRectificationNotice,
      },
      createdAt: toRepoDate(preferences.createdAt),
      updatedAt: toRepoDate(preferences.updatedAt),
    });
  },

  toDomain(payload: IUserPreferencesModel): IUserPreferences {
    const appPreferences = (payload.appPreferences ??
      {}) as IUserAppPreferences;

    return Object.freeze({
      userId: payload.id as TEntityId,
      lastActiveAccountingEntityId:
        payload.lastActiveAccountingEntityId as TEntityId | null,
      appPreferences: Object.freeze({
        theme: appPreferences.theme,
        appUsageMode: appPreferences.appUsageMode,
        suppressJournalEntryRectificationNotice:
          appPreferences.suppressJournalEntryRectificationNotice,
      }),
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    });
  },
};

export default userPreferencesMapper;
