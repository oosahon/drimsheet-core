import { eq, sql } from 'drizzle-orm';
import IUserAuthRepo from '../../../../app/auth/contracts/user-auth.repo.contract';
import { userAuthInCore as userAuth } from '../../../config/drizzle/schema';
import userAuthMapper from '../../mappers/auth/user-auth.mapper';
import getDbQuery from '../helpers/query';

const userAuthRepo: IUserAuthRepo = {
  create: async (userAuthData, options) => {
    const query = getDbQuery(options);
    const repoData = userAuthMapper.toRepo(userAuthData);

    await query.insert(userAuth).values(repoData);
  },

  findByUserId: async (userId, options) => {
    const query = getDbQuery(options);

    const result = await query
      .select()
      .from(userAuth)
      .where(eq(userAuth.userId, userId));

    if (!result.length) return null;

    return userAuthMapper.toDomain(result[0]);
  },

  update: async (userAuthData, options) => {
    const query = getDbQuery(options);
    const repoData = userAuthMapper.toRepo(userAuthData);

    await query
      .update(userAuth)
      .set({
        ...repoData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userAuth.userId, userAuthData.userId));
  },

  incrementFailedLoginAttempts: async (userId, options) => {
    const query = getDbQuery(options);

    await query
      .update(userAuth)
      .set({
        failedLoginAttempts: sql`${userAuth.failedLoginAttempts} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userAuth.userId, userId));
  },

  resetFailedLoginAttempts: async (userId, options) => {
    const query = getDbQuery(options);

    await query
      .update(userAuth)
      .set({
        failedLoginAttempts: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userAuth.userId, userId));
  },
};

export default userAuthRepo;
