import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import appError from '../../shared/errors/app.error';

interface IDependencies {
  appContext: IAppContext;
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeGetUserPreferencesUseCase(deps: IDependencies) {
  return async () => {
    const { correlationId, user } = deps.appContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    const preferences = await deps.userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    return preferences;
  };
}
