import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import { IUserPreferences } from '../../../domain/user/types/user-preferences.types';
import appError from '../../../shared/errors/app.error';
import IAppContext from '../../_internal/contracts/app-context.contract';

interface IDependencies {
  appContext: IAppContext;
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeGetUserPreferencesUseCase(deps: IDependencies) {
  return async (): Promise<IUserPreferences> => {
    const { correlationId, user } = deps.appContext.get();

    if (!user) {
      throw new appError.Unauthorized();
    }

    const preferences = await deps.userPreferencesRepo.findById(user.id, {
      correlationId,
    });

    if (!preferences) {
      throw new appError.ResourceNotFound();
    }

    return preferences;
  };
}
