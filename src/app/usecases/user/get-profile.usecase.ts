import { IUser } from '../../../domain/user/types/user.types';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import userMapper from '../../mappers/user.mapper';

export default function makeGetAuthUserProfileUseCase(
  requestContext: IRequestContext
) {
  return async (): Promise<IUser> => {
    const { user } = requestContext.get();

    if (!user) {
      throw new ErrorUnauthorized();
    }

    return userMapper.toInterface(user);
  };
}
