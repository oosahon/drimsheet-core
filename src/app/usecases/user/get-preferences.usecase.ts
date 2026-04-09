import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';

export default function getUserPreferencesUseCase(
  requestContext: IRequestContext,
  userPreferencesRepo: IUserPreferencesRepo
) {
  return async () => {
    const { correlationId, user } = requestContext.get();

    if (!user) {
      throw new ErrorUnauthorized();
    }

    const preferences = await userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    return preferences;
  };
}
