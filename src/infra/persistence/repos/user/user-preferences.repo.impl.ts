import { eq } from 'drizzle-orm';

import IUserPreferencesRepo from '@domain/user/repos/user-preferences.repo';

import { userPreferencesInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';

const userPreferencesRepo: IUserPreferencesRepo = {
  async create(preferences, options) {
    const query = getDbQuery(options);

    await query
      .insert(userPreferencesInCore)
      .values(userPreferencesMapper.toRepo(preferences));
  },

  async update(preferences, options) {
    const query = getDbQuery(options);

    await query
      .update(userPreferencesInCore)
      .set(userPreferencesMapper.toRepo(preferences))
      .where(eq(userPreferencesInCore.id, preferences.id));
  },

  async findById(id, options) {
    const query = getDbQuery(options);

    const baseQuery = query
      .select()
      .from(userPreferencesInCore)
      .where(eq(userPreferencesInCore.id, id));

    const readQuery = options.lock ? baseQuery.for(options.lock) : baseQuery;
    const [result] = await readQuery.limit(1);

    return result ? userPreferencesMapper.toDomain(result) : null;
  },
};

export default userPreferencesRepo;
