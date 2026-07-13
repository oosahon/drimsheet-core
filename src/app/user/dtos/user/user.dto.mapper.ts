import { IUser } from '../../../../domain/user/types/user.types';

const userMapper = {
  toInterface(user: IUser): IUser {
    return Object.freeze({ ...user });
  },
};

export default userMapper;
