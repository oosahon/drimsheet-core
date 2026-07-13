import appContext from '../../../app/shared/app-context';
import makeGetUserPreferencesUseCase from '../../../app/user/usecases/get-preferences.usecase';
import makeGetAuthUserProfileUseCase from '../../../app/user/usecases/get-profile.usecase';
import userRepos from '../../persistence/repos/user';

const userUseCase = {
  getPreferences: makeGetUserPreferencesUseCase({
    requestContext: appContext.request,
    userPreferencesRepo: userRepos.userPreferences,
  }),

  getAuthUserProfile: makeGetAuthUserProfileUseCase({
    requestContext: appContext.request,
  }),
};

export default userUseCase;
