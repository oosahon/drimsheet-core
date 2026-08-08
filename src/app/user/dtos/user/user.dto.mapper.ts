import { IUser } from '@domain/user/types/user.types';

import { IUserProfileDto } from './user.dto';

const userMapper = {
  toProfileDto(user: IUser): IUserProfileDto {
    return Object.freeze({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  },
};

export default userMapper;
