import { InferSelectModel } from 'drizzle-orm';
import _ from 'lodash';
import { IUser } from '../../domain/user/types/user.types';
import { usersInCore } from '../../infra/persistence/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { fromCommonRepoDates, toCommonRepoDates } from './date';

export interface IUserModel extends InferSelectModel<typeof usersInCore> {}

const userMapper = {
  toRepo(user: IUser): IUserModel {
    return Object.freeze({
      ...user,
      ...toCommonRepoDates(user),
      password: user.password ?? null,
    });
  },

  toDomain(user: IUserModel): IUser {
    return Object.freeze({
      ...user,
      id: user.id as TEntityId,
      password: user.password ?? undefined,
      ...fromCommonRepoDates(user),
    });
  },

  toInterface(user: IUser): Omit<IUser, 'password'> {
    return Object.freeze(_.omit(user, 'password'));
  },
};

export default userMapper;
