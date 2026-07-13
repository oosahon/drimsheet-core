import { eq } from 'drizzle-orm';
import IUserPreferencesRepo from '../../../../domain/user/repos/user-preferences.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { userPreferencesInCore } from '../../../config/drizzle/schema';
import userPreferencesMapper from '../../mappers/user/user-preferences.mapper';

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
};

export default userPreferencesRepo;
