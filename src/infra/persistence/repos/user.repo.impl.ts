import { eq } from 'drizzle-orm';
import userMapper from '../../../app/mappers/user.mapper';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import { usersInCore as users } from '../drizzle/schema';
import getDbQuery from './helpers/query';

const userRepo: IUserRepo = {
  save: async (user, options) => {
    const query = getDbQuery(options);

    await query.insert(users).values(userMapper.toRepo(user));
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
    // TODO: implement
    return {} as IUser;
  },

  delete: async (userId, options) => {},
};

export default userRepo;
