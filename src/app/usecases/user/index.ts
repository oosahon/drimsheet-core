import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import getUserPreferencesUseCase from './get-preferences.usecase';
import saveUserActivityUseCase from './save-activity.usecase';

const userUseCase = {
  saveActivity: saveUserActivityUseCase(appContext.request, repos.userActivity),

  getPreferences: getUserPreferencesUseCase(
    appContext.request,
    repos.userPreferences
  ),
};

export default userUseCase;
