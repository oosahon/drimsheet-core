import { eq } from 'drizzle-orm';
import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import { userPreferencesInCore } from '../drizzle/schema';
import getDbQuery from './helpers/query';
import userPreferencesMapper from '../../../app/mappers/user-preferences.mapper';

const userPreferencesRepo: IUserPreferencesRepo = {
  async save(payload, options) {
    const query = getDbQuery(options);

    const insertPayload = userPreferencesMapper.toRepo(payload);

    await query
      .insert(userPreferencesInCore)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: userPreferencesInCore.id,
        set: insertPayload,
      });
  },

  async findById(id, options) {
    const query = getDbQuery(options);

    const [result] = await query
      .select()
      .from(userPreferencesInCore)
      .where(eq(userPreferencesInCore.id, id))
      .limit(1);

    return result ? userPreferencesMapper.toDomain(result) : null;
  },
};

export default userPreferencesRepo;
