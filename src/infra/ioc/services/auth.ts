import bcrypt from 'bcryptjs';

import makePasswordService from '@app/auth/services/password.service';
import makeTokenService from '@app/auth/services/token.service';
import makeUserAuthService from '@app/auth/services/user-auth.service';
import makeUserSessionPersistenceService from '@app/auth/services/user-session-persistence.service';
import makeUserSessionService from '@app/auth/services/user-session.service';

import vars from '@infra/config/vars.config';
import { repoService } from '@infra/ioc/services/repo';
import cacheStorage from '@infra/persistence/cache/cache-storage.impl';
import userRepos from '@infra/persistence/repos/user';

export const passwordService = makePasswordService({ hasher: bcrypt });

export const tokenService = makeTokenService({
  cacheStorage,
  secret: vars.JWT_SECRET_KEY,
});

export const userAuthService = makeUserAuthService();

export const userSessionService = makeUserSessionService({ tokenService });

export const userSessionPersistenceService = makeUserSessionPersistenceService({
  userSessionRepo: userRepos.userSession,
  repoService,
});
