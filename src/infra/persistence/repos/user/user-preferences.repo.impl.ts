import { eq } from 'drizzle-orm';

import IUserPreferencesRepo from '@domain/user/repos/user-preferences.repo';

import { userPreferencesInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';

const userPreferencesRepo: IUserPreferencesRepo = {
  async findById(id, options) {
    const query = getDbQuery(options);

    const [result] = await query
      .select()
      .from(userPreferencesInCore)
      .where(eq(userPreferencesInCore.id, id))
      .limit(1);

    return result ? userPreferencesMapper.toDomain(result) : null;
  },

  async update(userId, payload, options) {
    const query = getDbQuery(options);
    const updatedAt = new Date().toISOString();
    const preferenceValues: typeof userPreferencesInCore.$inferInsert = {
      id: userId,
      updatedAt,
    };
    const preferenceUpdates: Partial<
      typeof userPreferencesInCore.$inferInsert
    > = { updatedAt };

    if (payload.appPreferences !== undefined) {
      preferenceValues.appPreferences = payload.appPreferences;
      preferenceUpdates.appPreferences = payload.appPreferences;
    }

    if (payload.lastActiveAccountingEntityId !== undefined) {
      preferenceValues.lastActiveAccountingEntityId =
        payload.lastActiveAccountingEntityId;
      preferenceUpdates.lastActiveAccountingEntityId =
        payload.lastActiveAccountingEntityId;
    }

    await query
      .insert(userPreferencesInCore)
      .values(preferenceValues)
      .onConflictDoUpdate({
        target: userPreferencesInCore.id,
        set: preferenceUpdates,
      });
  },
};

export default userPreferencesRepo;
