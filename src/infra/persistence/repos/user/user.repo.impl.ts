import { eq } from 'drizzle-orm';
import userMapper from '../../../../app/user/mappers/user.mapper';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import { usersInCore as users } from '../../../config/drizzle/schema';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
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
    const query = getDbQuery(options);

    const result = await query
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!result.length) return null;

    return userMapper.toDomain(result[0]);
  },

  findById: async (userId, options) => {
    const query = getDbQuery(options);

    const result = await query.select().from(users).where(eq(users.id, userId));

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
