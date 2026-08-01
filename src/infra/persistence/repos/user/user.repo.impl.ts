import { and, eq, isNull } from 'drizzle-orm';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { usersInCore as users } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import userMapper from './mappers/user.mapper';
import userHistoryRepo from './user-history.repo.impl';

const userRepo: IUserRepo = {
  create: async (user, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx.insert(users).values(userMapper.toRepo(user));
      await userHistoryRepo.save(
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },

  update: async (user, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .update(users)
        .set(userMapper.toRepo(user))
        .where(eq(users.id, user.id));
      await userHistoryRepo.save(
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },

  findByEmail: async (email, options) => {
    const baseQuery = getDbQuery(options)
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));

    const query = options?.lock ? baseQuery.for(options.lock) : baseQuery;
    const result = await query;

    if (!result.length) return null;

    return userMapper.toDomain(result[0]);
  },

  findById: async (userId, options) => {
    const baseQuery = getDbQuery(options)
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    const query = options?.lock ? baseQuery.for(options.lock) : baseQuery;
    const result = await query;

    if (!result.length) return null;

    return userMapper.toDomain(result[0]);
  },

  delete: async (userId, options) => {
    const query = getDbQuery(options);

    await query
      .update(users)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(users.id, userId));
  },
};

export default userRepo;
