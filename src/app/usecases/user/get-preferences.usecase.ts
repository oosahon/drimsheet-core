import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import IRequestContext from '../../contracts/app/request-context.contract';
import appError from '../../errors/app.error';

export default function makeGetUserPreferencesUseCase(
  requestContext: IRequestContext,
  userPreferencesRepo: IUserPreferencesRepo
) {
  return async () => {
    const { correlationId, user } = requestContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    const preferences = await userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    return preferences;
  };
}
