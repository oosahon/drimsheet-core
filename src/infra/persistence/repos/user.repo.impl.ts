import { eq } from 'drizzle-orm';
import userMapper from '../../../app/mappers/user.mapper';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { usersInCore as users } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const userRepo: IUserRepo = {
  save: async (user, options) => {
    const query = getDbQuery(options);

    await query
      .insert(users)
      .values(userMapper.toRepo(user))
      .onConflictDoUpdate({
        target: users.id,
        set: userMapper.toRepo(user),
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
