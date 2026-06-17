import userAuthRepo from './user-auth.repo.impl';
import userHistoryRepo from './user-history.repo.impl';
import userPreferencesRepo from './user-preferences.repo.impl';
import userSessionRepo from './user-session.repo.impl';
import userRepo from './user.repo.impl';

const userRepos = {
  user: userRepo,
  userAuth: userAuthRepo,
  userHistory: userHistoryRepo,
  userPreferences: userPreferencesRepo,
  userSession: userSessionRepo,
};

export default userRepos;
