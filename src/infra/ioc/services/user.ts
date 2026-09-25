import makeActorService from '@domain/user/services/actor.service';
import makeUserIdentityService from '@domain/user/services/user-identity.service';

import makeUserPreferencesService from '@app/user/services/user-preferences.service';

import userRepos from '@infra/persistence/repos/user';

export const userPreferencesService = makeUserPreferencesService({
  userPreferencesRepo: userRepos.userPreferences,
});

export const actorService = makeActorService({ actorRepo: userRepos.actor });
export const userIdentityService = makeUserIdentityService();
