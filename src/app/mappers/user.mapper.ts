import { InferSelectModel } from 'drizzle-orm';
import { IUser, IUserWithPassword } from '../../domain/user/types/user.types';
import { usersInCore } from '../../infra/persistence/drizzle/schema';
import { fromCommonRepoDates, toCommonRepoDates } from './date';
import { TEntityId } from '../../shared/types/uuid';

export interface IUserModel extends InferSelectModel<typeof usersInCore> {}

const userMapper = {
  toRepo(user: IUserWithPassword): IUserModel {
    return Object.freeze({
      ...user,
      ...toCommonRepoDates(user),
      password: user.password ?? null,
    });
  },

  toDomain({ password, ...user }: IUserModel): IUser {
    return Object.freeze({
      ...user,
      id: user.id as TEntityId,
      ...fromCommonRepoDates(user),
    });
  },
};

export default userMapper;
