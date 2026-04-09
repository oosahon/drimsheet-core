import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import getUserPreferencesUseCase from './get-preferences.usecase';
import getAuthUserProfileUseCase from './get-profile.usecase';
import saveUserActivityUseCase from './save-activity.usecase';

const userUseCase = {
  saveActivity: saveUserActivityUseCase(appContext.request, repos.userActivity),

  getPreferences: getUserPreferencesUseCase(
    appContext.request,
    repos.userPreferences
  ),

  getAuthUserProfile: getAuthUserProfileUseCase(appContext.request),
};

export default userUseCase;
