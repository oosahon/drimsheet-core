import { IUser } from '../../../domain/user/types/user.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import appError from '../../errors/app.error';
import userMapper from '../../mappers/user.mapper';

export default function makeGetAuthUserProfileUseCase(
  requestContext: IRequestContext
) {
  return async (): Promise<IUser> => {
    const { user } = requestContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    return userMapper.toInterface(user);
  };
}
