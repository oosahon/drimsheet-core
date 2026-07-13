import makeUserPreferencesService from '../../../domain/user/services/user-preferences.service';
import userRepos from '../../persistence/repos/user';

const userPreferences = makeUserPreferencesService({
  userPreferencesRepo: userRepos.userPreferences,
});

const userDomainServices = Object.freeze({
  userPreferences,
});

export default userDomainServices;
