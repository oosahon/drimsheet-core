import { IUser } from '../../../domain/user/types/user.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import appError from '../../../shared/errors/app.error';
import userMapper from '../dtos/user/user.dto.mapper';

interface IDependencies {
  appContext: IAppContext;
}

export default function makeGetAuthUserProfileUseCase(deps: IDependencies) {
  return async (): Promise<IUser> => {
    const { user } = deps.appContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    return userMapper.toInterface(user);
  };
}
