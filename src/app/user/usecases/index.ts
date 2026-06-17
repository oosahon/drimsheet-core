import userRepos from '../../../infra/persistence/repos/user';
import appContext from '../../shared/context';
import makeGetUserPreferencesUseCase from './get-preferences.usecase';
import makeGetAuthUserProfileUseCase from './get-profile.usecase';

const userUseCase = {
  getPreferences: makeGetUserPreferencesUseCase(
    appContext.request,
    userRepos.userPreferences
  ),

  getAuthUserProfile: makeGetAuthUserProfileUseCase(appContext.request),
};

export default userUseCase;
