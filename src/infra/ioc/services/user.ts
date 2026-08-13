import makeUserPreferencesAppService from '@app/user/services/user-preferences.service';

import { repoService } from '@infra/ioc/services/repo';
import accountingRepos from '@infra/persistence/repos/accounting';
import userRepos from '@infra/persistence/repos/user';

export const userPreferencesAppService = makeUserPreferencesAppService({
  accountingEntityRepo: accountingRepos.accountingEntity,
  userPreferencesRepo: userRepos.userPreferences,
  repoService,
});
