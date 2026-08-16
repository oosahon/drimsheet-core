import makeGetUserPreferencesUseCase from '@app/user/usecases/get-preferences.usecase';
import makeGetAuthUserProfileUseCase from '@app/user/usecases/get-profile.usecase';

import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import userRepos from '@infra/persistence/repos/user';
import appContext from '@infra/runtime/app-context';

export const getUserPreferencesUseCase = makeTracedUseCase(
  'user.getUserPreferencesUseCase',
  makeGetUserPreferencesUseCase({
    appContext: appContext,
    userPreferencesRepo: userRepos.userPreferences,
  })
);

export const getAuthUserProfileUseCase = makeTracedUseCase(
  'user.getAuthUserProfileUseCase',
  makeGetAuthUserProfileUseCase({
    appContext: appContext,
  })
);
