import { and, eq } from 'drizzle-orm';
import IUserSessionRepo from '../../../../app/auth/contracts/user-session.repo.contract';
import { userSessionsInCore as userSessions } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import userSessionMapper from '../../mappers/auth/user-session.mapper';

const userSessionRepo: IUserSessionRepo = {
  create: async (userSessionData, options) => {
    const query = getDbQuery(options);
    const repoData = userSessionMapper.toRepo(userSessionData);

    await query.insert(userSessions).values(repoData);
  },

  findByRefreshToken: async (userId, refreshToken, options) => {
    const baseQuery = getDbQuery(options)
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.refreshToken, refreshToken)
        )
      );

    const query = options.lock ? baseQuery.for(options.lock) : baseQuery;

    const [result] = await query;
    if (!result) return null;
    return userSessionMapper.toDomain(result);
  },

  findAllByUserId: async (userId, options) => {
    const query = getDbQuery(options);

    const result = await query
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));

    return result.map(userSessionMapper.toDomain);
  },

  delete: async (userId, refreshToken, options) => {
    const query = getDbQuery(options);

    await query
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.refreshToken, refreshToken)
        )
      );
  },
};

export default userSessionRepo;
