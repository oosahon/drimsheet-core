import makeGetUserPreferencesUseCase from '../../../app/user/usecases/get-preferences.usecase';
import makeGetAuthUserProfileUseCase from '../../../app/user/usecases/get-profile.usecase';
import userRepos from '../../persistence/repos/user';
import appContext from '../../runtime/app-context';

export const getUserPreferencesUseCase = makeGetUserPreferencesUseCase({
  appContext: appContext,
  userPreferencesRepo: userRepos.userPreferences,
});

export const getAuthUserProfileUseCase = makeGetAuthUserProfileUseCase({
  appContext: appContext,
});
