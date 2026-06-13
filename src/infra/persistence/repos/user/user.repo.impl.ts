import { eq } from 'drizzle-orm';
import userHistoryMapper from '../../../../app/user/mappers/user-history.mapper';
import userMapper from '../../../../app/user/mappers/user.mapper';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import {
  userProfileHistoryInAudit,
  usersInCore as users,
} from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const userRepo: IUserRepo = {
  save: async (user, options) => {
    const query = getDbQuery(options);

    await query.transaction(async (tx) => {
      await tx
        .insert(users)
        .values(userMapper.toRepo(user))
        .onConflictDoUpdate({
          target: users.id,
          set: userMapper.toRepo(user),
        });

      await tx
        .insert(userProfileHistoryInAudit)
        .values(userHistoryMapper.toRepo(options.history));
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
