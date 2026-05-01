import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import IRequestContext from '../../contracts/app/request-context.contract';
import httpError from '../../errors/http.error';

export default function makeGetUserPreferencesUseCase(
  requestContext: IRequestContext,
  userPreferencesRepo: IUserPreferencesRepo
) {
  return async () => {
    const { correlationId, user } = requestContext.get();

    if (!user) {
      throw new httpError.Unauthorized();
    }

    const preferences = await userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    return preferences;
  };
}
