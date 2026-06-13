import userAuthRepo from './user-auth.repo.impl';
import userPreferencesRepo from './user-preferences.repo.impl';
import userSessionRepo from './user-session.repo.impl';
import userRepo from './user.repo.impl';

const userRepos = {
  user: userRepo,
  userAuth: userAuthRepo,
  userPreferences: userPreferencesRepo,
  userSession: userSessionRepo,
};

export default userRepos;
