import makeUserPreferencesService from '../../domain/user/services/user-preferences.service';
import repos from '../persistence/repos';

const userPreferences = makeUserPreferencesService(repos.userPreferences);

const domainServices = Object.freeze({
  userPreferences,
});

export default domainServices;
