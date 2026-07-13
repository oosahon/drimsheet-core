import { IUser } from '../../../domain/user/types/user.types';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';
import userMapper from '../dtos/user/user.dto.mapper';

interface IDependencies {
  requestContext: IRequestContext;
}

export default function makeGetAuthUserProfileUseCase(deps: IDependencies) {
  return async (): Promise<IUser> => {
    const { user } = deps.requestContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    return userMapper.toInterface(user);
  };
}
