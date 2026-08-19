import makeUserPreferencesService from '@app/user/services/user-preferences.service';

import userRepos from '@infra/persistence/repos/user';

export const userPreferencesService = makeUserPreferencesService({
  userPreferencesRepo: userRepos.userPreferences,
});
