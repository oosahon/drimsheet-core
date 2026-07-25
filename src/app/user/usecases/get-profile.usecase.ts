import appError from '../../../shared/errors/app.error';
import IAppContext from '../../_internal/contracts/app-context.contract';
import { IUserProfileDto } from '../dtos/user/user.dto';
import userMapper from '../dtos/user/user.dto.mapper';

interface IDependencies {
  appContext: IAppContext;
}

export default function makeGetAuthUserProfileUseCase(deps: IDependencies) {
  return async (): Promise<IUserProfileDto> => {
    const { user } = deps.appContext.get();

    if (!user?.id) {
      throw new appError.Unauthorized();
    }

    return userMapper.toProfileDto(user);
  };
}
