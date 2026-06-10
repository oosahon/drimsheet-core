import userRepos from '../../../infra/persistence/repos/user';
import appContext from '../../shared/context';
import makeGetUserPreferencesUseCase from './get-preferences.usecase';
import makeGetAuthUserProfileUseCase from './get-profile.usecase';
import makeSaveUserActivityUseCase from './save-activity.usecase';

const userUseCase = {
  saveActivity: makeSaveUserActivityUseCase(
    appContext.request,
    userRepos.userActivity
  ),

  getPreferences: makeGetUserPreferencesUseCase(
    appContext.request,
    userRepos.userPreferences
  ),

  getAuthUserProfile: makeGetAuthUserProfileUseCase(appContext.request),
};

export default userUseCase;
