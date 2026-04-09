import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import userMapper from '../../mappers/user.mapper';

export default function getAuthUserProfileUseCase(
  requestContext: IRequestContext
) {
  return async () => {
    const { user } = requestContext.get();

    console.log('>>>>>>>>>>>>>>>>>>>', { user });

    if (!user) {
      throw new ErrorUnauthorized();
    }

    return userMapper.toInterface(user);
  };
}
