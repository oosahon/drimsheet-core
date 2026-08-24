import bcrypt from 'bcryptjs';

import makePasswordService from '@app/auth/services/password.service';
import makeTokenService from '@app/auth/services/token.service';

import vars from '@infra/config/vars.config';
import cacheStorage from '@infra/persistence/cache/cache-storage.impl';

export const passwordService = makePasswordService({ hasher: bcrypt });

export const tokenService = makeTokenService({
  cacheStorage,
  secret: vars.JWT_SECRET_KEY,
});
