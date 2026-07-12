import userRepos from '../../../infra/persistence/repos/user';
import appContext from '../../shared/context';
import makeGetUserPreferencesUseCase from './get-preferences.usecase';
import makeGetAuthUserProfileUseCase from './get-profile.usecase';

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
