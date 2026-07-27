import makeGetUserPreferencesUseCase from '../../../app/user/usecases/get-preferences.usecase';
import makeGetAuthUserProfileUseCase from '../../../app/user/usecases/get-profile.usecase';
import userRepos from '../../persistence/repos/user';
import appContext from '../../runtime/app-context';

const userUseCase = {
  getPreferences: makeGetUserPreferencesUseCase({
    appContext: appContext,
    userPreferencesRepo: userRepos.userPreferences,
  }),

  getAuthUserProfile: makeGetAuthUserProfileUseCase({
    appContext: appContext,
  }),
};

export default userUseCase;
