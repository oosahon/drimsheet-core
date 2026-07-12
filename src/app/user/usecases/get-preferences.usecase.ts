import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';

interface IDependencies {
  requestContext: IRequestContext;
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeGetUserPreferencesUseCase(deps: IDependencies) {
  return async () => {
    const { correlationId, user } = deps.requestContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    const preferences = await deps.userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    return preferences;
  };
}
