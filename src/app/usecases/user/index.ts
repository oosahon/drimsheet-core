import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeGetUserPreferencesUseCase from './get-preferences.usecase';
import makeGetAuthUserProfileUseCase from './get-profile.usecase';
import makeSaveUserActivityUseCase from './save-activity.usecase';

const userUseCase = {
  saveActivity: makeSaveUserActivityUseCase(
    appContext.request,
    repos.userActivity
  ),

  getPreferences: makeGetUserPreferencesUseCase(
    appContext.request,
    repos.userPreferences
  ),

  getAuthUserProfile: makeGetAuthUserProfileUseCase(appContext.request),
};

export default userUseCase;
